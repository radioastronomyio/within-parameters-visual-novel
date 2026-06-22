/**
 * Choice resolution under trait behavior flags.
 *
 * This is the term-for-term port of simulator.py `calc_effective_module_cost`
 * and `apply_choice`, operating on the engine's immutable GameState. The
 * replay harness calls these directly; the player-facing engine (spec A2)
 * will route scene choices through the same math so trait flags take effect
 * identically in headless and interactive play.
 *
 * Trait flags consumed here:
 *   - Rough Touch (N2): consumable costs on community events +1
 *   - Practiced (P8): first consumable spend each stop costs 1 less (floor 0)
 *   - Light Foot (P7): transit-event positive clock changes suppressed to 0
 *   - Tunnel Nerves (N1): approach-event clock changes +1
 *   - Distracted (N4): found-document passive knowledge gain suppressed
 *
 * @module engine/resolution
 */

import type {
  GameState,
  GameConfig,
  EventCategory,
  CommunityState,
} from '../types/index';
import { applyStatChanges, setCommunityState } from './game-state';

/** Category-neutral description of a choice's mechanical effects. */
export interface ChoiceEffects {
  /** Knowledge delta (typically non-negative). */
  knowledge: number;
  /** Consumable delta — negative is a cost, positive is a gain. */
  consumables: number;
  /** Raw clock delta before trait flags. */
  clock: number;
  /** Community outcome for this choice. "none" means no community interaction. */
  communityEffect: 'helped' | 'harmed' | 'ignored' | 'none';
}

/** Result of resolving one choice. */
export interface ChoiceResolution {
  state: GameState;
  /** Whether the Practiced discount is still available for this stop. */
  practicedRemaining: boolean;
}

/**
 * Computes the effective consumable cost of a choice after trait modifiers.
 * Port of simulator.py calc_effective_module_cost.
 *
 * Gains (consumableChange >= 0) cost nothing. Costs pick up Rough Touch (+1
 * on community events) and Practiced (-1, floor 0, consumes the per-stop
 * discount).
 */
export function calcEffectiveConsumableCost(
  consumableChange: number,
  config: GameConfig,
  category: EventCategory,
  practicedAvailable: boolean
): { cost: number; practicedRemaining: boolean } {
  if (consumableChange >= 0) {
    return { cost: 0, practicedRemaining: practicedAvailable };
  }

  let cost = Math.abs(consumableChange);
  if (config.roughTouch && category === 'community') {
    cost += 1;
  }

  let practicedRemaining = practicedAvailable;
  if (config.practiced && practicedAvailable && cost > 0) {
    cost = Math.max(0, cost - 1);
    practicedRemaining = false;
  }

  return { cost, practicedRemaining };
}

/**
 * Applies a choice's effects to the immutable GameState under trait flags.
 * Port of simulator.py apply_choice. Returns the new state and the updated
 * Practiced availability for the stop.
 *
 * The engine's deriveRapport (called separately wherever rapport matters)
 * reads the communities array, so we update community state via
 * setCommunityState rather than tracking helped/harmed counters.
 */
export function applyChoiceEffects(
  state: GameState,
  effects: ChoiceEffects,
  config: GameConfig,
  category: EventCategory,
  practicedAvailable: boolean
): ChoiceResolution {
  let practicedRemaining = practicedAvailable;

  // Consumable change: gains add directly, costs go through the trait math.
  let consumableChange = effects.consumables;
  if (consumableChange < 0) {
    const { cost, practicedRemaining: pr } = calcEffectiveConsumableCost(
      consumableChange,
      config,
      category,
      practicedAvailable
    );
    consumableChange = -cost;
    practicedRemaining = pr;
  }

  // Clock change: Light Foot suppresses transit gains, Tunnel Nerves adds to approach.
  let clockChange = effects.clock;
  if (config.lightFoot && category === 'transit' && clockChange > 0) {
    clockChange = 0;
  }
  if (config.tunnelNerves && category === 'approach') {
    clockChange += 1;
  }

  let newState = applyStatChanges(state, {
    knowledge: effects.knowledge,
    consumables: consumableChange,
    clock: clockChange,
  });

  if (effects.communityEffect === 'helped' || effects.communityEffect === 'harmed') {
    const communityState: CommunityState = effects.communityEffect;
    newState = setCommunityState(newState, newState.currentStop, communityState);
  }

  return { state: newState, practicedRemaining };
}

/**
 * Applies the found-document passive knowledge gain.
 * Port of simulator.py apply_found_document. +1 knowledge unless Distracted.
 */
export function applyFoundDocument(state: GameState, config: GameConfig): GameState {
  if (config.distracted) return state;
  return applyStatChanges(state, { knowledge: 1 });
}
