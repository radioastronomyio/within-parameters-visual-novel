/**
 * Headless replay harness — the parity proof for spec A1.
 *
 * Runs complete simulated playthroughs through the REAL engine functions
 * (game-state, resolution, scoring, traits, event-system) using a seeded RNG,
 * with the simulator's heuristic agent ported faithfully. Compares TypeScript
 * correction/destruction/clock-failure rates and average raw score per combo
 * against the committed simulation/output/combo_results.csv.
 *
 * Run via: `npm run replay`
 *
 * @module engine/replay-harness
 */

import { createRng, type Rng } from './rng';
import {
  buildEffectiveConfig,
  allCombinations,
  POSITIVE_TRAITS,
  NEGATIVE_TRAITS,
} from './traits';
import {
  initNewGame,
  tickClock,
  isClockFull,
  markClockFailure,
  deriveRapport,
  addCommunity,
} from './game-state';
import {
  calcEffectiveConsumableCost,
  applyChoiceEffects,
  applyFoundDocument,
  type ChoiceEffects,
} from './resolution';
import { applyReward } from './event-system';
import { scoreRun } from './scoring';
import type {
  GameConfig,
  GameState,
  PositiveTraitId,
  NegativeTraitId,
  Community,
  RewardOption,
  RewardType,
  EventCategory,
  RunOutcome,
  EndingType,
} from '../types/index';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Ported event pools (from simulation/game_data.py) ────────────────────────
//
// Faithful 1:1 port of the Python event data. Field mapping:
//   knowledge_change → knowledge, module_change → consumables,
//   clock_change → clock, community_effect → communityEffect,
//   knowledge_gate → knowledgeGate, rapport_gate → rapportGate.
// Default values match EventChoice defaults (0 / "none" / 0).

interface SimChoice {
  label: string;
  knowledge: number;
  consumables: number;
  clock: number;
  communityEffect: 'helped' | 'harmed' | 'ignored' | 'none';
  knowledgeGate: number;
  rapportGate: number;
}

interface SimEvent {
  id: string;
  category: EventCategory;
  choices: SimChoice[];
  hasFoundDocument: boolean;
}

function c(
  label: string,
  opts: {
    knowledge?: number;
    consumables?: number;
    clock?: number;
    communityEffect?: SimChoice['communityEffect'];
    knowledgeGate?: number;
    rapportGate?: number;
  } = {}
): SimChoice {
  return {
    label,
    knowledge: opts.knowledge ?? 0,
    consumables: opts.consumables ?? 0,
    clock: opts.clock ?? 0,
    communityEffect: opts.communityEffect ?? 'none',
    knowledgeGate: opts.knowledgeGate ?? 0,
    rapportGate: opts.rapportGate ?? 0,
  };
}

const COMMUNITY_POOL: SimEvent[] = [
  {
    id: 'CE-01',
    category: 'community',
    hasFoundDocument: true,
    choices: [
      c('A', { knowledge: 1, consumables: -2, communityEffect: 'helped' }),
      c('B', { knowledge: 1, consumables: -1, communityEffect: 'helped' }),
      c('C', { knowledge: 2, communityEffect: 'ignored' }),
    ],
  },
  {
    id: 'CE-02',
    category: 'community',
    hasFoundDocument: false,
    choices: [
      c('A', { consumables: -1, communityEffect: 'helped', knowledgeGate: 3 }),
      c('B', { consumables: -2, communityEffect: 'helped' }),
      c('C', { knowledge: 1, communityEffect: 'ignored' }),
    ],
  },
  {
    id: 'CE-03',
    category: 'community',
    hasFoundDocument: false,
    choices: [
      c('A', { knowledge: 2, consumables: -1, communityEffect: 'helped' }),
      c('B', { knowledge: 2, communityEffect: 'ignored' }),
      c('C', { communityEffect: 'ignored' }),
    ],
  },
  {
    id: 'CE-04',
    category: 'community',
    hasFoundDocument: true,
    choices: [
      c('A', { knowledge: 3, consumables: -1, communityEffect: 'helped' }),
      c('B', { knowledge: 2, communityEffect: 'ignored' }),
      c('C', { communityEffect: 'ignored' }),
    ],
  },
  {
    id: 'CE-05',
    category: 'community',
    hasFoundDocument: false,
    choices: [
      c('A', { consumables: -1, communityEffect: 'helped' }),
      c('B', { knowledge: 1, communityEffect: 'harmed' }),
      c('C', { consumables: -1, clock: -1, communityEffect: 'helped', knowledgeGate: 4 }),
    ],
  },
];

const TRANSIT_POOL: SimEvent[] = [
  {
    id: 'TE-01',
    category: 'transit',
    hasFoundDocument: false,
    choices: [
      c('A', { consumables: 1, communityEffect: 'harmed' }),
      c('B', { consumables: -1 }),
      c('C', { clock: 1 }),
    ],
  },
  {
    id: 'TE-02',
    category: 'transit',
    hasFoundDocument: true,
    choices: [
      c('A', { knowledge: 1, consumables: 1 }),
      c('B', { consumables: -1 }),
      c('C', { knowledge: 1, clock: 1 }),
    ],
  },
  {
    id: 'TE-03',
    category: 'transit',
    hasFoundDocument: false,
    choices: [
      c('A', { consumables: 2, communityEffect: 'harmed' }),
      c('B', { knowledge: 1, consumables: 1, knowledgeGate: 3 }),
      c('C', { knowledge: 2 }),
    ],
  },
  {
    id: 'TE-04',
    category: 'transit',
    hasFoundDocument: true,
    choices: [
      c('A', { knowledge: 3, consumables: -1 }),
      c('B', { knowledge: 2, clock: 1 }),
      c('C', { knowledge: 1 }),
    ],
  },
];

const APPROACH_POOL: SimEvent[] = [
  {
    id: 'AE-01',
    category: 'approach',
    hasFoundDocument: false,
    choices: [
      c('A', { knowledge: 2, consumables: 1, rapportGate: 2 }),
      c('B', { knowledge: 2 }),
      c('C', { clock: 1 }),
    ],
  },
  {
    id: 'AE-02',
    category: 'approach',
    hasFoundDocument: false,
    choices: [
      c('A', { knowledge: 1, knowledgeGate: 5 }),
      c('B', { consumables: -2 }),
      c('C', { clock: 2 }),
    ],
  },
  {
    id: 'AE-03',
    category: 'approach',
    hasFoundDocument: true,
    choices: [
      c('A', { knowledge: 3, knowledgeGate: 4 }),
      c('B', { consumables: -1, clock: -1 }),
      c('C', { knowledge: 1 }),
    ],
  },
];

// ─── Heuristic agent (ported from simulator.py) ───────────────────────────────

/**
 * Port of simulator.py agent_select_choice. Priority:
 * 1. Filter by knowledge/rapport gates and consumable affordability.
 * 2. Stubborn override (community): highest |module_change| affordable choice.
 * 3. Knowledge-gated choices first.
 * 4. Community-help choices when clock < 7.
 * 5. Lowest effective consumable cost.
 *
 * Includes the simulator's practiced_left reset quirk: every choice is
 * evaluated with practicedAvailable from stop start (the in-loop reset is
 * effectively dead code but preserved for parity).
 */
function agentSelectChoice(
  state: GameState,
  event: SimEvent,
  config: GameConfig,
  practicedAvailable: boolean
): { choice: SimChoice; entryPracticed: boolean } {
  const available: Array<{ choice: SimChoice; entryPracticed: boolean }> = [];
  let practicedLeft = practicedAvailable;

  for (const choice of event.choices) {
    if (choice.knowledgeGate > 0 && state.stats.knowledge < choice.knowledgeGate) continue;
    if (choice.rapportGate > 0 && deriveRapport(state) < choice.rapportGate) continue;

    const { cost } = calcEffectiveConsumableCost(
      choice.consumables,
      config,
      event.category,
      practicedLeft
    );
    if (cost > state.stats.consumables) continue;

    const entryPracticed = practicedLeft;
    if (config.practiced && practicedLeft && choice.consumables < 0) {
      practicedLeft = false;
    }
    available.push({ choice, entryPracticed });
    practicedLeft = practicedAvailable; // simulator quirk: reset after each eval
  }

  if (available.length === 0) {
    return { choice: event.choices[0]!, entryPracticed: practicedAvailable };
  }

  // Stubborn override: forces the highest-cost affordable community choice.
  // AI NOTE: In the simulator this overrides the agent. In the player-facing
  // engine (spec A2), this is exposed as a choice-availability restriction.
  if (config.stubborn && event.category === 'community') {
    const affordable = available.filter((a) => a.choice.consumables <= 0);
    if (affordable.length > 0) {
      let best = affordable[0]!;
      for (const a of affordable) {
        if (Math.abs(a.choice.consumables) > Math.abs(best.choice.consumables)) best = a;
      }
      return best;
    }
    let best = available[0]!;
    for (const a of available) {
      if (Math.abs(a.choice.consumables) < Math.abs(best.choice.consumables)) best = a;
    }
    return best;
  }

  const gated = available.filter((a) => a.choice.knowledgeGate > 0);
  if (gated.length > 0) return gated[0]!;

  if (state.clock.current < 7) {
    const helped = available.filter((a) => a.choice.communityEffect === 'helped');
    if (helped.length > 0) return helped[0]!;
  }

  let best = available[0]!;
  let bestCost = calcEffectiveConsumableCost(
    best.choice.consumables,
    config,
    event.category,
    best.entryPracticed
  ).cost;
  for (let i = 1; i < available.length; i++) {
    const a = available[i]!;
    const cost = calcEffectiveConsumableCost(
      a.choice.consumables,
      config,
      event.category,
      a.entryPracticed
    ).cost;
    if (cost < bestCost) {
      best = a;
      bestCost = cost;
    }
  }
  return best;
}

/**
 * Port of simulator.py agent_select_reward. Priority:
 * 1. Clock reduction if projected tick nears max.
 * 2. Consumables if below fix-cost threshold.
 * 3. Knowledge if late journey and below threshold.
 * 4. Clock reduction if stop 4+ and clock high.
 * 5. Knowledge (default — optimal for correction).
 */
function agentSelectReward(state: GameState, config: GameConfig): RewardType {
  const expectedTick =
    config.clockBaseTick + config.clockJitterChance * config.clockJitterAmount;
  if (state.clock.current + expectedTick >= config.clockMax - 1) return 'clock-reduction';
  if (state.stats.consumables < config.consumableFixCost) return 'consumable';
  if (state.currentStop >= 3 && state.stats.knowledge < config.knowledgeThreshold) return 'knowledge';
  if (state.currentStop >= 4 && state.clock.current >= 6) return 'clock-reduction';
  return 'knowledge';
}

function buildRewardOption(type: RewardType): RewardOption {
  const baseEffect =
    type === 'consumable'
      ? { consumables: 2 }
      : type === 'knowledge'
        ? { knowledge: 2 }
        : {};
  return { type, label: type, description: type, baseEffect };
}

function simChoiceToEffects(choice: SimChoice): ChoiceEffects {
  return {
    knowledge: choice.knowledge,
    consumables: choice.consumables,
    clock: choice.clock,
    communityEffect: choice.communityEffect,
  };
}

// ─── Run one complete playthrough ─────────────────────────────────────────────

/**
 * Port of simulator.py run_game. Uses the real engine functions for every
 * mechanical step (config build, state init, choice resolution, found docs,
 * reward, clock tick, scoring). Only the agent and event-pool draw are
 * harness-local.
 */
function runGame(
  config: GameConfig,
  pos: PositiveTraitId,
  neg: NegativeTraitId,
  rng: Rng
): RunOutcome {
  const effectiveConfig = buildEffectiveConfig(config, pos, neg);

  let state = initNewGame(effectiveConfig);
  state = {
    ...state,
    protagonist: { ...state.protagonist, positiveTrait: pos, negativeTrait: neg },
  };

  const communityEvents = rng.sample(COMMUNITY_POOL, 2);
  const transitEvents = rng.sample(TRANSIT_POOL, 2);
  const approachEvents = rng.sample(APPROACH_POOL, 1);
  const drawn = [...communityEvents, ...transitEvents, ...approachEvents];

  for (let stopIndex = 0; stopIndex < drawn.length; stopIndex++) {
    const event = drawn[stopIndex]!;
    const stop = stopIndex + 1;
    state = { ...state, currentStop: stop };

    // Add a synthetic community per stop so deriveRapport and scoring read the
    // real communities array (same data path as the live engine).
    const community: Community = {
      id: `harness-stop-${stop}`,
      name: `Stop ${stop}`,
      description: '',
    };
    state = addCommunity(state, { community, state: 'ignored', stop });

    // Agent picks a choice; engine resolves it under trait flags.
    let practicedAvailable = true;
    const { choice } = agentSelectChoice(state, event, effectiveConfig, practicedAvailable);
    const resolution = applyChoiceEffects(
      state,
      simChoiceToEffects(choice),
      effectiveConfig,
      event.category,
      practicedAvailable
    );
    state = resolution.state;
    practicedAvailable = resolution.practicedRemaining;

    if (event.hasFoundDocument) {
      state = applyFoundDocument(state, effectiveConfig);
    }

    const rewardType = agentSelectReward(state, effectiveConfig);
    state = applyReward(buildRewardOption(rewardType), state, effectiveConfig);

    state = tickClock(state, effectiveConfig, rng);

    if (isClockFull(state, effectiveConfig)) {
      state = markClockFailure(state);
      break;
    }
  }

  return scoreRun(state, effectiveConfig);
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Deterministic 32-bit hash of the combo key. Python's hash() is randomized
 * (PYTHONHASHSEED) and not portable; this hash is stable across runs and
 * produces distinct seeds per combo. See simulation/parity-notes.md.
 */
function hashCombo(pos: string, neg: string): number {
  const s = `${pos}|${neg}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % (2 ** 31);
}

function comboBaseSeed(pos: PositiveTraitId, neg: NegativeTraitId): number {
  return 42 + hashCombo(pos, neg);
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────

interface ComboStats {
  positive: PositiveTraitId;
  negative: NegativeTraitId;
  correctionRate: number;
  destructionRate: number;
  clockFailureRate: number;
  avgRawScore: number;
  avgFinalScore: number;
  medianRawScore: number;
  /** Individual correction runs with rawScore >= 90 (per-run S-tier, matching sweep_v2). */
  sTierRuns: number;
  /** Total individual correction runs. */
  correctionRuns: number;
}

interface RawRunRecord {
  ending: EndingType;
  rawScore: number; // clamped, pre-reroll (matches simulator's raw_score)
  finalScore: number;
}

function runCombo(
  config: GameConfig,
  pos: PositiveTraitId,
  neg: NegativeTraitId,
  iterations: number
): ComboStats {
  const baseSeed = comboBaseSeed(pos, neg);
  const records: RawRunRecord[] = [];

  for (let i = 0; i < iterations; i++) {
    const rng = createRng(baseSeed + i);
    const outcome = runGame(config, pos, neg, rng);
    records.push({
      ending: outcome.ending,
      rawScore: outcome.rawScoreClamped,
      finalScore: outcome.finalScore,
    });
  }

  const total = records.length;
  const correction = records.filter((r) => r.ending === 'correction').length;
  const destruction = records.filter((r) => r.ending === 'destruction').length;
  const clockFail = records.filter((r) => r.ending === 'clock-failure').length;
  const rawScores = records.map((r) => r.rawScore).sort((a, b) => a - b);
  const finalScores = records.map((r) => r.finalScore);

  const avgRawScore = rawScores.reduce((a, b) => a + b, 0) / total;
  const avgFinalScore = finalScores.reduce((a, b) => a + b, 0) / total;
  const medianRawScore =
    total % 2 === 0
      ? (rawScores[total / 2 - 1]! + rawScores[total / 2]!) / 2
      : rawScores[Math.floor(total / 2)]!;

  // Per-run S-tier: individual correction runs scoring >= 90 (matches sweep_v2).
  const sTierRuns = records.filter((r) => r.ending === 'correction' && r.rawScore >= 90).length;

  return {
    positive: pos,
    negative: neg,
    correctionRate: correction / total,
    destructionRate: destruction / total,
    clockFailureRate: clockFail / total,
    avgRawScore,
    avgFinalScore,
    medianRawScore,
    sTierRuns,
    correctionRuns: correction,
  };
}

function runAllCombos(config: GameConfig, iterations: number): ComboStats[] {
  const combos = allCombinations();
  const stats: ComboStats[] = [];
  let done = 0;
  for (const { positive, negative } of combos) {
    stats.push(runCombo(config, positive, negative, iterations));
    done++;
    process.stdout.write(`\r  [${done}/${combos.length}] ${positive}+${negative} complete   `);
  }
  process.stdout.write('\n');
  return stats;
}

// ─── Validation (mirrors simulator.py output_report) ──────────────────────────

interface ValidationResult {
  noZeroCorrection: boolean;
  maxUnder90: boolean;
  meanInBand: boolean;
  n7ClockFailureUnder60: boolean;
  stdInBand: boolean;
  sTierRate: boolean;
  allPass: boolean;
}

function validate(stats: ComboStats[]): ValidationResult {
  const rates = stats.map((s) => s.correctionRate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  const std = Math.sqrt(variance);

  const n7 = stats.filter((s) => s.negative === 'N7');
  const maxN7ClockFail = Math.max(...n7.map((s) => s.clockFailureRate));

  // Per-run S-tier rate: total S-tier correction runs / total correction runs.
  // Matches sweep_v2.py's s_tier_count / corr_count_for_stier.
  const totalSTierRuns = stats.reduce((a, s) => a + s.sTierRuns, 0);
  const totalCorrectionRuns = stats.reduce((a, s) => a + s.correctionRuns, 0);
  const sTierRate = totalCorrectionRuns > 0 ? totalSTierRuns / totalCorrectionRuns : 0;

  const noZeroCorrection = min > 0;
  const maxUnder90 = max <= 0.9;
  const meanInBand = mean >= 0.3 && mean <= 0.55;
  const n7ClockFailureUnder60 = maxN7ClockFail < 0.6;
  const stdInBand = std >= 0.1 && std <= 0.25;
  const sTierInBand = sTierRate >= 0.1 && sTierRate <= 0.2;

  const allPass =
    noZeroCorrection && maxUnder90 && meanInBand && n7ClockFailureUnder60 && stdInBand && sTierInBand;

  return {
    noZeroCorrection,
    maxUnder90,
    meanInBand,
    n7ClockFailureUnder60,
    stdInBand,
    sTierRate: sTierInBand,
    allPass,
  };
}

// ─── CSV comparison ───────────────────────────────────────────────────────────

interface CsvRow {
  positive: string;
  negative: string;
  correctionRate: number;
  avgRawScore: number;
}

function loadCsv(path: string): CsvRow[] | null {
  try {
    const raw = readFileSync(path, 'utf-8');
    const lines = raw.trim().split('\n');
    lines.shift(); // header
    return lines.map((line) => {
      const [p, n, corr, , , , score] = line.split(',');
      return {
        positive: p!,
        negative: n!,
        correctionRate: parseFloat(corr!),
        avgRawScore: parseFloat(score!),
      };
    });
  } catch {
    return null;
  }
}

function compareCsv(stats: ComboStats[], csvPath: string): void {
  const csv = loadCsv(csvPath);
  if (!csv) {
    console.log(`  (skipped — no CSV at ${csvPath})`);
    return;
  }

  const csvMap = new Map(csv.map((r) => [`${r.positive}+${r.negative}`, r]));
  let within5pp = 0;
  let within10pp = 0;
  let maxDelta = 0;
  let avgDelta = 0;
  let count = 0;

  for (const s of stats) {
    const key = `${s.positive}+${s.negative}`;
    const csvRow = csvMap.get(key);
    if (!csvRow) continue;
    const delta = Math.abs(s.correctionRate - csvRow.correctionRate);
    if (delta <= 0.05) within5pp++;
    if (delta <= 0.10) within10pp++;
    maxDelta = Math.max(maxDelta, delta);
    avgDelta += delta;
    count++;
  }
  avgDelta /= count;

  console.log('  CSV parity (correction rate vs committed combo_results.csv):');
  console.log(`    Combos within 5pp:  ${within5pp}/${count}`);
  console.log(`    Combos within 10pp: ${within10pp}/${count}`);
  console.log(`    Max |delta|:        ${(maxDelta * 100).toFixed(2)}pp`);
  console.log(`    Mean |delta|:       ${(avgDelta * 100).toFixed(2)}pp`);

  // Score parity
  let scoreWithin5 = 0;
  let scoreCount = 0;
  let scoreAvgDelta = 0;
  for (const s of stats) {
    const csvRow = csvMap.get(`${s.positive}+${s.negative}`);
    if (!csvRow) continue;
    const delta = Math.abs(s.avgRawScore - csvRow.avgRawScore);
    if (delta <= 5) scoreWithin5++;
    scoreAvgDelta += delta;
    scoreCount++;
  }
  scoreAvgDelta /= scoreCount;
  console.log('  CSV parity (avg raw score vs committed combo_results.csv):');
  console.log(`    Combos within 5 pts: ${scoreWithin5}/${scoreCount}`);
  console.log(`    Mean |delta|:        ${scoreAvgDelta.toFixed(2)} pts`);
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function report(stats: ComboStats[], config: GameConfig, csvPath: string): void {
  const rates = stats.map((s) => s.correctionRate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const meanRate = mean(rates);
  const stdRate = Math.sqrt(mean(rates.map((r) => (r - meanRate) ** 2)));

  console.log('\n=== TOP 5 EASIEST COMBINATIONS (highest correction rate) ===');
  const sorted = [...stats].sort((a, b) => b.correctionRate - a.correctionRate);
  for (const s of sorted.slice(0, 5)) {
    console.log(
      `  ${s.positive}+${s.negative} (${getPName(s.positive)} + ${getNName(s.negative)}): ` +
        `${(s.correctionRate * 100).toFixed(1)}% correction, avg score ${s.avgRawScore.toFixed(1)}`
    );
  }

  console.log('\n=== TOP 5 HARDEST COMBINATIONS (lowest correction rate) ===');
  for (const s of sorted.slice(-5).reverse()) {
    console.log(
      `  ${s.positive}+${s.negative} (${getPName(s.positive)} + ${getNName(s.negative)}): ` +
        `${(s.correctionRate * 100).toFixed(1)}% correction, avg score ${s.avgRawScore.toFixed(1)}`
    );
  }

  console.log('\n=== OVERALL STATISTICS ===');
  console.log(`  Mean correction rate: ${(meanRate * 100).toFixed(1)}%`);
  console.log(`  Std dev:              ${(stdRate * 100).toFixed(1)}%`);
  console.log(`  Min:                  ${(minRate * 100).toFixed(1)}%`);
  console.log(`  Max:                  ${(maxRate * 100).toFixed(1)}%`);

  console.log('\n=== VALIDATION SUMMARY ===');
  const v = validate(stats);
  const check = (label: string, pass: boolean, detail: string): void => {
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}: ${detail}`);
  };
  check('No 0% correction combos', v.noZeroCorrection, `min ${(minRate * 100).toFixed(1)}%`);
  check('No combo above 90% correction', v.maxUnder90, `max ${(maxRate * 100).toFixed(1)}%`);
  check('Mean correction 30-55%', v.meanInBand, `${(meanRate * 100).toFixed(1)}%`);
  const n7 = stats.filter((s) => s.negative === 'N7');
  const maxN7Cf = Math.max(...n7.map((s) => s.clockFailureRate));
  check('N7 clock failure < 60%', v.n7ClockFailureUnder60, `max ${(maxN7Cf * 100).toFixed(1)}%`);
  check('Std dev 10-25%', v.stdInBand, `${(stdRate * 100).toFixed(1)}%`);
  const totalSTierRuns = stats.reduce((a, s) => a + s.sTierRuns, 0);
  const totalCorrectionRuns = stats.reduce((a, s) => a + s.correctionRuns, 0);
  const sTierRate = totalCorrectionRuns > 0 ? totalSTierRuns / totalCorrectionRuns : 0;
  console.log(`  S-tier (per-run): ${totalSTierRuns}/${totalCorrectionRuns} correction runs`);
  check('S-tier in 10-20% of correction runs', v.sTierRate, `${(sTierRate * 100).toFixed(1)}%`);

  console.log(`\n  ${v.allPass ? 'ALL VALIDATION CRITERIA PASSED' : 'ONE OR MORE CRITERIA FAILED'}`);
  console.log('='.padEnd(60, '='));

  console.log('\n=== PARITY vs PYTHON SIMULATOR ===');
  compareCsv(stats, csvPath);
}

function getPName(id: PositiveTraitId): string {
  return POSITIVE_TRAITS.find((t) => t.id === id)?.name ?? id;
}
function getNName(id: NegativeTraitId): string {
  return NEGATIVE_TRAITS.find((t) => t.id === id)?.name ?? id;
}

// ─── Config loading ───────────────────────────────────────────────────────────

function loadConfig(path: string): GameConfig {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as GameConfig;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const iterations = parseInt(process.argv[2] ?? '5000', 10);
  const configPath = resolve(process.cwd(), 'data/config.json');
  const csvPath = resolve(process.cwd(), 'simulation/output/combo_results.csv');

  console.log('Within Parameters — TypeScript Replay Harness (spec A1 parity proof)');
  console.log('='.repeat(60));
  console.log(
    `Running ${iterations} iterations per trait combination (64 combos, ${iterations * 64} total runs)`
  );
  console.log(`Config: ${configPath}`);
  console.log();

  const config = loadConfig(configPath);
  console.log(
    `Locked params: kt=${config.knowledgeThreshold}, kr=${config.knowledgeRewardBonus}, ` +
      `ct=${config.clockBaseTick}, modules=${config.startingConsumables}, ` +
      `jitter=${config.clockJitterChance}`
  );
  console.log();

  const stats = runAllCombos(config, iterations);
  report(stats, config, csvPath);
}

// Exported for unit-level inspection / future CI.
export {
  runGame,
  runCombo,
  runAllCombos,
  validate,
  hashCombo,
  COMMUNITY_POOL,
  TRANSIT_POOL,
  APPROACH_POOL,
  agentSelectChoice,
  agentSelectReward,
};

main();
