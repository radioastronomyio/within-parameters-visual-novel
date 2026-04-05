import type {
  Scene,
  GameState,
  GameConfig,
  EventDef,
  Community,
  RewardOption,
} from '../types/index';
import {
  applyStatChanges,
  setCommunityState,
  addToHistory,
  addCommunity,
  advanceStop,
  determineEnding,
  tickClock,
  isClockFull,
} from './game-state';
import {
  initEventPool,
  drawEvent,
  getRewardsForStop,
  applyReward,
  buildCommunityRunState,
  shouldTriggerComms,
  type EventPoolState,
} from './event-system';
import { autosave } from './save-manager';

// ─── Callbacks the UI provides ───────────────────────────────────────────────

export interface SceneRunnerCallbacks {
  /** Start rendering a scene (set background, BGM, begin dialogue) */
  onSceneStart(scene: Scene, state: GameState): void;
  /** Update displayed game state (HUD, stats) */
  onStateUpdate(state: GameState): void;
  /** Present reward choices after an event */
  onRewardChoice(rewards: RewardOption[], onSelect: (index: number) => void): void;
  /** Show the ending screen */
  onEnding(
    endingType: 'clock-failure' | 'destruction' | 'correction',
    state: GameState
  ): void;
  /** Show a comms interrupt beat between stops */
  onCommsInterrupt(state: GameState, onContinue: () => void): void;
}

// ─── Scene Registry ───────────────────────────────────────────────────────────

export interface SceneRegistry {
  scenes: Map<string, Scene>;
  events: Map<string, EventDef>;
}

export function buildSceneRegistry(
  scenes: Scene[],
  events: EventDef[]
): SceneRegistry {
  return {
    scenes: new Map(scenes.map((s) => [s.id, s])),
    events: new Map(events.map((e) => [e.id, e])),
  };
}

// ─── Scene Runner ─────────────────────────────────────────────────────────────

export class SceneRunner {
  private state: GameState;
  private config: GameConfig;
  private registry: SceneRegistry;
  private callbacks: SceneRunnerCallbacks;
  private communities: Community[];

  // Journey phase state
  private eventPool: EventPoolState | null = null;
  private pendingResolve: (() => void) | null = null;

  constructor(
    initialState: GameState,
    config: GameConfig,
    registry: SceneRegistry,
    communities: Community[],
    callbacks: SceneRunnerCallbacks
  ) {
    this.state = initialState;
    this.config = config;
    this.registry = registry;
    this.communities = communities;
    this.callbacks = callbacks;
  }

  getState(): GameState {
    return this.state;
  }

  // ─── Entry point ─────────────────────────────────────────────────────────

  start(): void {
    this.loadScene(this.state.currentScene);
  }

  // ─── Scene Loading ────────────────────────────────────────────────────────

  loadScene(sceneId: string): void {
    const scene = this.registry.scenes.get(sceneId);
    if (!scene) {
      console.error(`[scene-runner] Scene not found: ${sceneId}`);
      return;
    }

    this.state = addToHistory(this.state, sceneId);
    this.state = { ...this.state, currentScene: sceneId, currentBeat: scene.beat };

    // Autosave if flagged
    if (scene.flags?.autosave) {
      autosave(this.state, scene.id, scene.beat);
    }

    // Check if this scene enters the event phase
    if (scene.flags?.enterEventPhase) {
      this.callbacks.onSceneStart(scene, this.state);
      // The UI calls sceneComplete() after dialogue finishes
      return;
    }

    // Check if this is an ending scene
    if (scene.flags?.isEnding && scene.flags.endingType) {
      this.callbacks.onSceneStart(scene, this.state);
      return;
    }

    this.callbacks.onSceneStart(scene, this.state);
    this.callbacks.onStateUpdate(this.state);
  }

  // ─── Called by UI after a scene's dialogue completes ─────────────────────

  sceneComplete(scene: Scene): void {
    // If this scene enters the event phase, initialize and run it
    if (scene.flags?.enterEventPhase) {
      this.enterEventPhase();
      return;
    }

    // If it's an ending scene, trigger the ending handler
    if (scene.flags?.isEnding && scene.flags.endingType) {
      this.callbacks.onEnding(scene.flags.endingType, this.state);
      return;
    }

    // Auto-advance
    if (scene.next) {
      this.loadScene(scene.next);
    }
  }

  // ─── Choice Selection (called by UI) ─────────────────────────────────────

  selectChoice(scene: Scene, choiceIndex: number): void {
    const choice = scene.choices?.[choiceIndex];
    if (!choice) {
      console.warn(`[scene-runner] Invalid choice index: ${choiceIndex}`);
      return;
    }

    // Apply stat changes
    if (choice.statChanges) {
      this.state = applyStatChanges(this.state, choice.statChanges);
    }

    // Apply community effect
    if (choice.communityEffect && this.state.currentStop > 0) {
      this.state = setCommunityState(
        this.state,
        this.state.currentStop,
        choice.communityEffect
      );
    }

    this.callbacks.onStateUpdate(this.state);
    this.loadScene(choice.nextScene);
  }

  // ─── Journey Phase ────────────────────────────────────────────────────────

  private enterEventPhase(): void {
    const allEvents = Array.from(this.registry.events.values());
    this.eventPool = initEventPool(allEvents, this.config, this.communities);
    this.state = { ...this.state, currentStop: 1 };
    this.runNextStop();
  }

  private runNextStop(): void {
    if (!this.eventPool) return;

    const stop = this.state.currentStop;

    if (stop > this.config.journeyStops) {
      // Journey complete — move to Beat 5 (facility)
      this.loadScene('scene-facility-01');
      return;
    }

    // Check comms interrupt
    if (shouldTriggerComms(stop, this.state.clock)) {
      this.callbacks.onCommsInterrupt(this.state, () => {
        this.runStop(stop);
      });
      return;
    }

    this.runStop(stop);
  }

  private runStop(stop: number): void {
    if (!this.eventPool) return;

    const { event, community, pool } = drawEvent(
      this.eventPool,
      stop,
      this.config
    );
    this.eventPool = pool;

    // Register the community for this stop (starts as 'ignored')
    const communityRunState = buildCommunityRunState(community, stop);
    this.state = addCommunity(this.state, communityRunState);
    this.state = { ...this.state, activeEventId: event.id, eventPhase: 'arriving' };

    this.callbacks.onStateUpdate(this.state);

    // Load the event's entry scene
    // Override registry with event scenes for this stop
    for (const scene of event.scenes) {
      this.registry.scenes.set(scene.id, scene);
    }

    // Intercept: after event's last scene resolves, run reward cycle
    this.loadScene(event.entryScene);

    // The event scenes will chain via scene.next / choices until the
    // rewardScene is reached. We detect this via the rewardScene ID.
    this._pendingEventForStop = { event, stop };
  }

  // Track which event is active for reward delivery
  private _pendingEventForStop: { event: EventDef; stop: number } | null = null;

  /** Called by UI when dialogue completes on a scene that has no next/choices */
  eventSceneComplete(sceneId: string): void {
    if (!this._pendingEventForStop) return;

    const { event, stop } = this._pendingEventForStop;

    // If we just completed the reward scene scene trigger, show rewards
    if (sceneId === event.rewardScene) {
      this.showRewards(event, stop);
    }
  }

  private showRewards(event: EventDef, stop: number): void {
    const rewards = getRewardsForStop(event, this.state, this.config);

    this.callbacks.onRewardChoice(rewards, (rewardIndex: number) => {
      const reward = rewards[rewardIndex];
      if (!reward) return;

      this.state = applyReward(reward, this.state, this.config);

      // Tick the clock
      this.state = tickClock(this.state, this.config);
      this.callbacks.onStateUpdate(this.state);

      // Check loss condition
      if (isClockFull(this.state)) {
        this.callbacks.onEnding('clock-failure', this.state);
        return;
      }

      // Advance to next stop
      this.state = advanceStop(this.state, event.id);
      this.state = { ...this.state, currentStop: stop + 1 };
      this._pendingEventForStop = null;

      this.runNextStop();
    });
  }

  // ─── Facility / Confrontation ─────────────────────────────────────────────

  /** Called from facility scene when the confrontation gate is reached */
  triggerEnding(): void {
    const endingType = determineEnding(this.state, this.config);
    const endingSceneId = `scene-ending-${endingType}`;
    this.loadScene(endingSceneId);
  }
}
