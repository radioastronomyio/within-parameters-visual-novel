import type {
  GameState,
  GameConfig,
  PlayerStats,
  IntrusionClock,
  StatChanges,
  CommunityRunState,
  CommunityState,
} from '../types/index';

export function initNewGame(config: GameConfig, runNumber: number = 1): GameState {
  const clock: IntrusionClock = {
    current: 0,
    max: config.clockMax,
    baseTick: config.clockBaseTick,
    jitterMax: config.clockJitterMax,
  };

  const stats: PlayerStats = {
    knowledge: config.startingKnowledge,
    consumables: config.startingConsumables,
    rapport: 0,
  };

  return {
    currentScene: 'scene-lore-01',
    currentBeat: 'lore',
    stats,
    clock,
    currentStop: 0,
    usedEventIds: [],
    communities: [],
    flags: {},
    sceneHistory: [],
    eventPhase: null,
    activeEventId: null,
    timestamp: Date.now(),
    runNumber,
  };
}

export function applyStatChanges(
  state: GameState,
  changes: Partial<StatChanges>
): GameState {
  const stats = { ...state.stats };

  if (changes.knowledge !== undefined) {
    stats.knowledge = Math.max(0, stats.knowledge + changes.knowledge);
  }
  if (changes.consumables !== undefined) {
    stats.consumables = Math.max(0, stats.consumables + changes.consumables);
  }
  if (changes.rapport !== undefined) {
    stats.rapport = stats.rapport + changes.rapport;
  }

  let clock = state.clock;
  if (changes.clock !== undefined) {
    clock = {
      ...state.clock,
      current: Math.max(0, Math.min(state.clock.max, state.clock.current + changes.clock)),
    };
  }

  return { ...state, stats, clock, timestamp: Date.now() };
}

export function tickClock(state: GameState, config: GameConfig): GameState {
  const jitter = Math.floor(Math.random() * (config.clockJitterMax + 1));
  const tick = config.clockBaseTick + jitter;
  const newCurrent = Math.min(state.clock.max, state.clock.current + tick);

  return {
    ...state,
    clock: { ...state.clock, current: newCurrent },
    timestamp: Date.now(),
  };
}

export function isClockFull(state: GameState): boolean {
  return state.clock.current >= state.clock.max;
}

export function setCommunityState(
  state: GameState,
  stopIndex: number,
  communityState: CommunityState
): GameState {
  const communities = state.communities.map((c) =>
    c.stop === stopIndex ? { ...c, state: communityState } : c
  );

  const updatedState = { ...state, communities };
  const rapport = deriveRapport(updatedState);

  return {
    ...updatedState,
    stats: { ...updatedState.stats, rapport },
    timestamp: Date.now(),
  };
}

export function deriveRapport(state: GameState): number {
  return state.communities.reduce((acc, c) => {
    if (c.state === 'helped') return acc + 1;
    if (c.state === 'harmed') return acc - 1;
    return acc;
  }, 0);
}

export function calculateClockReduction(state: GameState, config: GameConfig): number {
  const rapport = deriveRapport(state);
  const bonus = Math.floor(rapport * config.rapportClockScale);
  return Math.max(1, config.clockReductionBase + bonus);
}

export function checkKnowledgeGate(state: GameState, threshold: number): boolean {
  return state.stats.knowledge >= threshold;
}

export function determineEnding(
  state: GameState,
  config: GameConfig
): 'clock-failure' | 'destruction' | 'correction' {
  if (isClockFull(state)) {
    return 'clock-failure';
  }

  const hasEnoughKnowledge = state.stats.knowledge >= config.knowledgeGoodEndingThreshold;
  const hasEnoughConsumables = state.stats.consumables >= config.consumableFixCost;

  if (hasEnoughKnowledge && hasEnoughConsumables) {
    return 'correction';
  }

  return 'destruction';
}

export function addToHistory(state: GameState, sceneId: string): GameState {
  return {
    ...state,
    sceneHistory: [...state.sceneHistory, sceneId],
  };
}

export function setFlag(state: GameState, flag: string, value: boolean = true): GameState {
  return {
    ...state,
    flags: { ...state.flags, [flag]: value },
    timestamp: Date.now(),
  };
}

export function addCommunity(state: GameState, community: CommunityRunState): GameState {
  return {
    ...state,
    communities: [...state.communities, community],
    timestamp: Date.now(),
  };
}

export function advanceStop(state: GameState, eventId: string): GameState {
  return {
    ...state,
    currentStop: state.currentStop + 1,
    usedEventIds: [...state.usedEventIds, eventId],
    activeEventId: null,
    eventPhase: null,
    timestamp: Date.now(),
  };
}
