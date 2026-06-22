/**
 * Trait system — the 8 positive × 8 negative balance-locked traits.
 *
 * Two effect kinds, both reproduced from simulation/game_data.py:
 *
 *   1. Config modifiers — pure functions that produce an effective GameConfig
 *      at run start. Application order is positive-then-negative, matching the
 *      simulator's `neg_trait[3](pos_trait[3](config))`.
 *
 *   2. Behavior flags — booleans on GameConfig (roughTouch, stubborn, etc.)
 *      that the engine checks at the relevant resolution points. The flag is
 *      flipped on by the modifier; event-system.ts and game-state.ts consume it.
 *
 * Values are authoritative from game_data.py. Do not retune.
 *
 * @module engine/traits
 */

import type { GameConfig, PositiveTraitId, NegativeTraitId, TraitDef } from '../types/index';

// ─── Trait catalogue ──────────────────────────────────────────────────────────

export const POSITIVE_TRAITS: TraitDef<PositiveTraitId>[] = [
  { id: 'P1', name: 'Well-Supplied', summary: '+2 starting consumables', polarity: 'positive' },
  { id: 'P2', name: 'Quick Study', summary: '+1 knowledge reward bonus', polarity: 'positive' },
  { id: 'P3', name: 'Networked', summary: '+1 starting rapport', polarity: 'positive' },
  { id: 'P4', name: 'Steady Hand', summary: 'jitter chance × 0.5', polarity: 'positive' },
  { id: 'P5', name: 'Field Expedient', summary: '+1 consumable reward bonus', polarity: 'positive' },
  { id: 'P6', name: 'Clear-Headed', summary: '-1 knowledge threshold', polarity: 'positive' },
  { id: 'P7', name: 'Light Foot', summary: 'transit clock gains suppressed', polarity: 'positive' },
  { id: 'P8', name: 'Practiced', summary: 'first module spend each stop -1', polarity: 'positive' },
];

export const NEGATIVE_TRAITS: TraitDef<NegativeTraitId>[] = [
  { id: 'N1', name: 'Tunnel Nerves', summary: 'approach clock changes +1', polarity: 'negative' },
  { id: 'N2', name: 'Rough Touch', summary: 'community consumable costs +1', polarity: 'negative' },
  { id: 'N3', name: 'Narrow Focus', summary: 'clock reduction -1 (floor 0)', polarity: 'negative' },
  { id: 'N4', name: 'Distracted', summary: 'found-document knowledge suppressed', polarity: 'negative' },
  { id: 'N5', name: 'Lone Wolf', summary: 'rapport clock scale × 0.5', polarity: 'negative' },
  { id: 'N6', name: 'Fragile Kit', summary: '+1 facility fix cost', polarity: 'negative' },
  { id: 'N7', name: 'Exhausted', summary: 'jitter chance +0.25 (cap 1.0)', polarity: 'negative' },
  { id: 'N8', name: 'Stubborn', summary: 'forced highest-affordable community choice', polarity: 'negative' },
];

const POSITIVE_BY_ID = new Map<PositiveTraitId, TraitDef<PositiveTraitId>>(
  POSITIVE_TRAITS.map((t) => [t.id, t])
);
const NEGATIVE_BY_ID = new Map<NegativeTraitId, TraitDef<NegativeTraitId>>(
  NEGATIVE_TRAITS.map((t) => [t.id, t])
);

export function getPositiveTrait(id: PositiveTraitId): TraitDef<PositiveTraitId> {
  const t = POSITIVE_BY_ID.get(id);
  if (!t) throw new Error(`[traits] unknown positive trait: ${id}`);
  return t;
}

export function getNegativeTrait(id: NegativeTraitId): TraitDef<NegativeTraitId> {
  const t = NEGATIVE_BY_ID.get(id);
  if (!t) throw new Error(`[traits] unknown negative trait: ${id}`);
  return t;
}

// ─── Config modifier pipeline ─────────────────────────────────────────────────

/**
 * Apply a positive trait's config modifier. Each branch mirrors the matching
 * lambda in game_data.py POSITIVE_TRAITS.
 */
function applyPositiveModifier(id: PositiveTraitId, config: GameConfig): GameConfig {
  switch (id) {
    case 'P1': // Well-Supplied: starting_modules + 2
      return { ...config, startingConsumables: config.startingConsumables + 2 };
    case 'P2': // Quick Study: knowledge_reward_bonus + 1
      return { ...config, knowledgeRewardBonus: config.knowledgeRewardBonus + 1 };
    case 'P3': // Networked: starting_rapport + 1
      return { ...config, startingRapport: config.startingRapport + 1 };
    case 'P4': // Steady Hand: clock_jitter_chance * 0.5
      return { ...config, clockJitterChance: config.clockJitterChance * 0.5 };
    case 'P5': // Field Expedient: consumable_reward_bonus + 1
      return { ...config, consumableRewardBonus: config.consumableRewardBonus + 1 };
    case 'P6': // Clear-Headed: knowledge_threshold - 1
      return { ...config, knowledgeThreshold: config.knowledgeThreshold - 1 };
    case 'P7': // Light Foot: light_foot = True
      return { ...config, lightFoot: true };
    case 'P8': // Practiced: practiced = True
      return { ...config, practiced: true };
  }
}

/**
 * Apply a negative trait's config modifier. Each branch mirrors the matching
 * lambda in game_data.py NEGATIVE_TRAITS.
 */
function applyNegativeModifier(id: NegativeTraitId, config: GameConfig): GameConfig {
  switch (id) {
    case 'N1': // Tunnel Nerves: tunnel_nerves = True
      return { ...config, tunnelNerves: true };
    case 'N2': // Rough Touch: rough_touch = True
      return { ...config, roughTouch: true };
    case 'N3': // Narrow Focus: narrow_focus = True
      return { ...config, narrowFocus: true };
    case 'N4': // Distracted: distracted = True
      return { ...config, distracted: true };
    case 'N5': // Lone Wolf: rapport_clock_scale * 0.5
      return { ...config, rapportClockScale: config.rapportClockScale * 0.5 };
    case 'N6': // Fragile Kit: fix_cost + 1
      return { ...config, consumableFixCost: config.consumableFixCost + 1 };
    case 'N7': // Exhausted: clock_jitter_chance = min(1.0, chance + 0.25)
      return { ...config, clockJitterChance: Math.min(1.0, config.clockJitterChance + 0.25) };
    case 'N8': // Stubborn: stubborn = True
      return { ...config, stubborn: true };
  }
}

/**
 * Build the effective config for a run by applying the positive trait first,
 * then the negative trait. Matches simulator.py run_game():
 *   effective_config = neg_trait[3](pos_trait[3](config))
 */
export function buildEffectiveConfig(
  config: GameConfig,
  positive: PositiveTraitId,
  negative: NegativeTraitId
): GameConfig {
  return applyNegativeModifier(negative, applyPositiveModifier(positive, config));
}

/** All 64 (positive, negative) combinations in simulator iteration order. */
export function allCombinations(): Array<{ positive: PositiveTraitId; negative: NegativeTraitId }> {
  const out: Array<{ positive: PositiveTraitId; negative: NegativeTraitId }> = [];
  for (const p of POSITIVE_TRAITS) {
    for (const n of NEGATIVE_TRAITS) {
      out.push({ positive: p.id, negative: n.id });
    }
  }
  return out;
}
