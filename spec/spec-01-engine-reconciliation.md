<!--
---
title: "WP Engine Mechanics Reconciliation and Config Alignment"
description: "Align the TypeScript engine's runtime mechanics and config schema to the validated Python balance simulator, with a headless replay harness proving numerical parity"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [engine, balance, roguelike]
  - tech: [typescript, vite]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[Balance Simulator README](../simulation/README.md)"
  - "[game_data.py](../simulation/game_data.py)"
  - "[simulator.py](../simulation/simulator.py)"
---
-->

## Task: WP Engine Mechanics Reconciliation and Config Alignment

Mode: Code

---

### Objective

The TypeScript engine reproduces the Python balance simulator's run mechanics exactly: trait modifiers and behavior flags, the clock jitter-chance model, the capped rapport-scaled clock reduction, the ending determination, and the full scoring cascade. `data/config.json` carries the locked winning configuration and a schema that matches the simulator's parameter vocabulary. A headless replay harness runs fixed-seed playthroughs in TypeScript and matches the simulator's outcomes for the same seeds and trait pairs within defined tolerance. No new player-facing UI is built in this spec. When complete, the engine is mechanically correct and balance-faithful, ready for the chargen and dossier layer (spec A2) to be built on top.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Toolchain | Node + Vite + TypeScript (existing); Python 3 available for cross-check |
| Branch | `agent/wp-spec-01-engine-reconciliation` (agent creates; does not push) |

---

### Scope

**Pre-existing (do not create):**

- The TS engine under `src/` (event-system, game-state, scene-runner, save-manager, audio, ui)
- The validated simulator under `simulation/` (`game_data.py`, `simulator.py`, `sweep_v2.py`)
- `data/config.json`, `data/events.json`, `data/scenes.json`
- The git repository (clean working tree on `main`)

**Modify:**

- `data/config.json` — schema and values (see Deliverable 1)
- `src/types/state.ts` — `GameConfig`, `GameState`, `PlayerStats`, scoring/trait types
- `src/types/index.ts` — re-exports as needed
- `src/engine/game-state.ts` — clock tick, clock reduction, ending, new scoring and trait application
- `src/engine/event-system.ts` — choice resolution under trait flags (read first; modify only the resolution math)
- New files under `src/engine/` for trait and scoring logic if cleaner than inlining (agent's call)
- New headless replay harness under `src/engine/` or `simulation/` (see Deliverable 5)
- `package.json` — a test/replay script entry if needed

**Reference:**

- `simulation/game_data.py` — the parameter and trait contract (authoritative for values and modifier math)
- `simulation/simulator.py` — the mechanical contract (authoritative for resolution order, clock model, scoring cascade, ending determination)
- `simulation/README.md` — the locked winning config and validation criteria
- `AGENTS.md` — repository constraints and conventions

**Do not touch:**

- `data/events.json`, `data/scenes.json` (content is spec B; this spec uses existing content only for the harness)
- `src/ui/` (no UI work in this spec)
- Any other repository under `/opt/agents/repos/`
- The `simulation/` Python sources except to read them (the harness may live there but must not alter the existing `.py` files)
- Git remote operations: branch and commit locally only, never push or merge

---

### Deliverables & Validation

#### Deliverable 1: Config schema alignment and locked values

Rewrite `data/config.json` and the `GameConfig` interface in `src/types/state.ts` so the schema matches the simulator's `Config` dataclass vocabulary and carries the locked winning values. The locked configuration (6/6 validation criteria, v2 sweep) is: `knowledge_threshold=11`, `knowledge_reward_bonus=0` (reward total 2), `clock_base_tick=1`, `starting_modules=6`, `clock_jitter_chance=0.35`. All other values take the `DEFAULT_CONFIG` baseline from `game_data.py`.

The current TS config uses an incompatible jitter model (`clockJitterMax` integer, uniform draw) and is missing the scoring constants and several parameters. The reconciled schema must include: starting modules/knowledge/rapport, clock max/base-tick/jitter-chance/jitter-amount, clock-reduction base and max, rapport-clock scale, knowledge threshold, fix cost, journey stops, max raw score, reroll multiplier, the knowledge/consumable reward bonuses, and the complete scoring constant set (ending bases for correction/destruction/clock-failure, per-community-helped, per-rapport-point, the three module-remaining tiers, the three knowledge-over-threshold tiers, per-clock-segment-remaining). Map the simulator's `modules` concept to the engine's existing `consumables` naming consistently, or rename in the engine for parity; pick one and apply it everywhere. Set `journeyStops=5` and a 2/2/1 zone map (2 community, 2 transit, 1 approach) to match the simulator's draw and the validated balance.

Validation:

- [ ] `data/config.json` parses and contains every parameter in `game_data.py`'s `Config` dataclass, with the locked values for the five swept parameters and `DEFAULT_CONFIG` values for the rest
- [ ] `journeyStops` is 5 and the zone map assigns 2 community, 2 transit, 1 approach
- [ ] `GameConfig` in TypeScript types every config field; `tsc --noEmit` passes
- [ ] No reference to the old `clockJitterMax` uniform model remains anywhere in `src/`
- [ ] The module/consumable naming choice is applied consistently across types, engine, and config (no mixed usage)

#### Deliverable 2: Clock model and clock-reduction reconciliation

Replace the engine's clock tick with the simulator's jitter-chance model: each stop, `tick = base_tick`, then with probability `clock_jitter_chance` add `clock_jitter_amount`. Replace `calculateClockReduction` to match `calc_clock_reduction`: `base + floor(rapport * rapport_clock_scale)`, capped at `clock_reduction_max`, then reduced by 1 (floor 0) if the Narrow Focus flag is active. The current TS `tickClock` uses a uniform `0..jitterMax` draw and the current reduction has no cap; both are wrong against the validated balance.

Validation:

- [ ] `tickClock` adds exactly `base_tick`, plus `jitter_amount` only when a random draw is below `clock_jitter_chance`
- [ ] Clock reduction is capped at `clock_reduction_max` and never falls below 0
- [ ] The clock model accepts an injectable RNG (seed-controllable) rather than calling `Math.random()` directly, to support the replay harness in Deliverable 5
- [ ] `tsc --noEmit` passes

#### Deliverable 3: Trait system and behavior-flag application

Implement the 8 positive and 8 negative traits from `game_data.py` as data plus application logic. Two kinds of trait effect, both must be reproduced: config modifiers (e.g. Well-Supplied `+2 starting_modules`, Quick Study `+1 knowledge_reward_bonus`, Clear-Headed `-1 knowledge_threshold`, Steady Hand `jitter_chance * 0.5`, Exhausted `jitter_chance + 0.25` capped at 1.0, Lone Wolf `rapport_clock_scale * 0.5`, Fragile Kit `+1 fix_cost`) applied at run start in the order positive-then-negative (`neg(pos(config))`); and behavior flags that alter event resolution at play time. The behavior flags and their exact effects, from `simulator.py`:

- Rough Touch: community-event module costs +1
- Practiced: first module-spending choice each stop costs 1 less (floor 0), resets each stop
- Light Foot: transit-event positive clock changes suppressed to 0
- Tunnel Nerves: approach-event clock changes +1
- Stubborn: on community events, forces the highest-affordable-cost community choice (matches the simulator agent's override)
- Narrow Focus: clock reduction -1 (handled in Deliverable 2)
- Distracted: found-document passive knowledge gain suppressed

Stubborn affects the simulator's *agent* choice selection; in the player-facing engine it is a choice-availability restriction. Implement it as the simulator models it for harness parity, and expose it such that the future UI layer (spec A2) can present the restriction to a human player. Document this seam in a comment.

Validation:

- [ ] All 16 traits exist as data with id, display name, and effect, sourced from `game_data.py`
- [ ] Config-modifier traits apply at run start in positive-then-negative order and produce the same effective config as `neg_trait[3](pos_trait[3](config))`
- [ ] Each behavior flag alters resolution at the correct point: Rough Touch and Practiced on module cost, Light Foot and Tunnel Nerves on clock change, Distracted on found-document gain, Stubborn on community choice selection
- [ ] Exhausted jitter increment is capped at 1.0 and Steady Hand halves jitter chance
- [ ] `tsc --noEmit` passes

#### Deliverable 4: Scoring cascade and ending determination

Implement the scoring function to match `calculate_score` exactly, and ending determination to match `determine_ending`. Ending: clock-failure if the clock filled (run aborted), else correction if `knowledge >= knowledge_threshold AND modules >= fix_cost`, else destruction. Score: start from the ending base; add `per_community_helped` per helped community; add `per_rapport_point` per point of positive rapport (floor 0); add the three-tier module-remaining bonus where modules-remaining is `max(0, modules - fix_cost)` for correction and `max(0, modules)` otherwise; add the three-tier knowledge-over-threshold bonus; add the per-clock-segment-remaining bonus (3 each for the first three remaining segments, +1 for the fourth, nothing beyond); clamp to `max_raw_score`. Then apply the reroll multiplier: final score is `floor(raw_score * (reroll_multiplier ^ reroll_count))`. Store reroll count on `GameState` (default 0 this spec; A2 wires the dossier). Map the raw score to a letter grade using these thresholds from the simulator's report: S >= 90, A >= 75, B >= 60, else C/D/F. Define the lower tiers (C/D/F) at sensible intervals and record them in a comment; they are display-only and do not affect balance.

Add the necessary fields to `GameState`: protagonist identity placeholder (name/gender/backstory/traits, populated by A2 but typed now), `rerollCount`, and a computed final-score/grade available at ending time. Typing these now prevents A2 from reshaping state.

Validation:

- [ ] The scoring function reproduces `calculate_score` term for term, including the tiered module and knowledge surplus bonuses and the clock-segment schedule
- [ ] Ending determination matches `determine_ending` (clock-failure, correction gate, destruction fallback)
- [ ] Reroll multiplier compounds (`0.92 ^ n`) and is applied to the clamped raw score
- [ ] Grade thresholds are S>=90, A>=75, B>=60 with lower tiers documented
- [ ] `GameState` carries protagonist identity fields (typed, nullable/placeholder), `rerollCount`, and the score is derivable at ending; `tsc --noEmit` passes

#### Deliverable 5: Headless replay harness and parity proof

Build a headless TypeScript replay that runs complete simulated playthroughs using the reconciled engine logic, with a seeded RNG and the simulator's heuristic agent ported faithfully (priority order from `agent_select_choice` and `agent_select_reward`). Run it across the 64 trait combinations using the same per-combo seeding scheme as the simulator (`base_seed = 42 + hash(combo_key)`, then `+i` per iteration) for a reduced iteration count (e.g. 2,000 per combo, enough for stable rates). Compare the TypeScript correction/destruction/clock-failure rates and average raw score per combo against a fresh run of `simulator.py` (or its committed `combo_results.csv` if regeneration is impractical). The harness is the parity proof: it demonstrates the engine and the simulator are the same game.

Because Python's `hash()` is not portable and `Random` is not byte-identical to a JS PRNG, exact per-seed equality is not the bar. The bar is aggregate statistical parity: per-combo correction rates within an absolute tolerance and the same overall validation verdict (the locked config still passes the six criteria). If exact-seed parity is achievable by porting a matching PRNG, that is a bonus, not a requirement; document whichever level was reached.

Validation:

- [ ] A headless replay runs from `npm run <script>` (or documented equivalent) and prints per-combo and aggregate rates
- [ ] Per-combo correction rates match the simulator within an absolute tolerance of 5 percentage points for at least 60 of 64 combos
- [ ] Aggregate mean correction rate falls in 30-55%, max combo <= 90%, min combo > 0% (the locked config's passing band)
- [ ] The harness uses the injectable seeded RNG from Deliverable 2, not `Math.random()`
- [ ] A short `simulation/parity-notes.md` (or harness README) records the parity level reached, the tolerance observed, and any PRNG caveats

#### Deliverable 6: Worklog and registry

Write a worklog following the template at `/opt/agents/work-logs/WORKLOG-TEMPLATE-AGENT.md`. Filename: `2026-06-22-wp-worklog-01-engine-reconciliation.md`. Append a summary row to `/opt/agents/work-logs/work-registry.csv`. This repository keeps specs in-repo under `spec/`; do not move this spec to the central archive, and do not initialize or push git. Leave the work on the `agent/wp-spec-01-engine-reconciliation` branch with local commits for orchestrator review.

Validation:

- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-01-engine-reconciliation.md` with all frontmatter fields populated
- [ ] Work registry CSV has a new row matching this execution
- [ ] All work is committed locally on the named branch; nothing pushed; `main` untouched

---

### Constraints

- Local git only: create the branch, commit locally, never push or merge. The orchestrator handles all remote operations after review.
- Do not modify the Python simulator sources. They are the contract; altering them invalidates the comparison.
- Do not touch `data/events.json` or `data/scenes.json`. Content production is a separate spec; the harness runs on the simulator's own event pools (port them, or read from the existing test content, but do not edit content files).
- No UI work. If a change tempts you toward `src/ui/`, it belongs in spec A2.
- Trait values are balance-locked. Reproduce them exactly from `game_data.py`; do not retune.
- All work stays within the working directory except the worklog and registry paths.

---

### Execution Order

1. Deliverable 1: Config schema alignment and locked values
2. Deliverable 2: Clock model and clock-reduction reconciliation
3. Deliverable 3: Trait system and behavior-flag application
4. Deliverable 4: Scoring cascade and ending determination
5. Deliverable 5: Headless replay harness and parity proof
6. Deliverable 6: Worklog and registry

---

### Notes

The simulator is the single source of mechanical truth. Where the design docs and the simulator disagree on a number, the simulator wins, because the balance was validated against the simulator's behavior, not the docs. One known doc/sim discrepancy carried into spec 03, not this one: the character-generation doc shows a stepped reroll ceiling (100/92/85/78/72%) while `game_data.py` uses a single compounding `reroll_multiplier=0.92`; this spec implements the config value (compounding) as authoritative.

The simulator mutates state in place for speed; the TS engine is immutable-by-convention (mutations return new objects). Preserve the immutable style in the engine; the harness may use a faster mutable internal representation if that eases the port, as long as the engine functions it exercises are the real ones.

The `modules` vs `consumables` naming split is a long-standing wart: the simulator says modules, the engine says consumables, the fiction calls them bypass modules / omni-components. Pick one name and unify in this spec; this is the cheapest moment to do it, before content (spec 04) and UI (spec 03) harden the vocabulary further.

Spec 03 (chargen, dossier screen, trait selection and reroll, score display) builds directly on the typed state fields and scoring function delivered here, composed from the gameui framework adopted in spec 02. Spec 04 (production content) depends on the reconciled config schema and the trait/flag seams. Getting the contract right here unblocks both.
