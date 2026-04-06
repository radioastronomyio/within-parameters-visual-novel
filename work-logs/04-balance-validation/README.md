<!--
---
title: "Phase 04: Balance Validation"
description: "Monte Carlo simulator build, parameter sweeps, structural fixes, and winning config identification"
author: "VintageDon + Claude"
date: "2026-04-06"
version: "1.0"
status: "Complete"
tags:
  - type: worklog
  - domain: [balance, methodology]
---
-->

# Phase / Milestone 04: Balance Validation

## Summary

| Attribute | Value |
|-----------|-------|
| Status | Complete |
| Sessions | 1 (orchestrator) + 3 agent sessions |
| Date | 2026-04-06 |
| Total simulated runs | ~45 million |
| Winning config | `exp_kt11_kr0_ct1_mod6_j035` (6/6 criteria) |
| Agent runtime | GLM-5.1 via OpenCode (simulator: ~20m, sweep v1: 21m, sweep v2: 25m) |

Objective: Validate the 64-cell trait matrix balance using Monte Carlo simulation, identify a game configuration where all six validation criteria pass, and finalize balance parameters for content implementation.

Outcome: Initial simulation proved the game trivially winnable (99.7% correction rate). Parameter sweep v1 (33 configs) found no solution; identified three structural failures. Structural fixes applied, sweep v2 (33 + 5 exploratory configs) found a 6/6 configuration. Balance locked.

---

## 1. Contents

```
04-balance-validation/
└── README.md               # This file
```

---

## 2. Timeline

| Step | Actor | Input | Output |
|------|-------|-------|--------|
| Simulator spec written | Orchestrator (Claude.ai) | Trait system v2, mechanical context | `spec/wp-simulator-spec.md` |
| Simulator built and run | Agent (GLM-5.1) | Simulator spec | `simulation/simulator.py`, `game_data.py`, first-run results |
| First-run analysis | Orchestrator | Heatmaps, CSV, validation table | Root cause: knowledge overflow, clock pressure cosmetic |
| Sweep v1 spec written | Orchestrator | First-run analysis | `spec/wp-sweep-spec.md` |
| Sweep v1 executed | Agent (GLM-5.1) | Sweep spec | `sweep_results.csv`, 0/6 pass (best 4/6) |
| Sweep v1 analysis | Orchestrator | Sweep CSV, failure modes | Three structural issues identified |
| Sweep v2 spec written | Orchestrator | V1 analysis, structural fixes | `spec/wp-sweep-v2-spec.md` |
| Sweep v2 executed | Agent (GLM-5.1) | Sweep v2 spec | `sweep_v2_results.csv`, 6/6 config found |
| Results reviewed | Orchestrator | Heatmaps, winning config CSV | P2 outlier and N4 hard-mode accepted as roguelike design |

---

## 3. First Run Results

The simulator's first run confirmed what the GDR analysis predicted: the game was trivially winnable.

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| No 0% correction combos | > 0% | 96.1% min | PASS |
| No combo above 90% | ≤ 90% | 100.0% max | FAIL |
| Mean correction 30-55% | 30-55% | 99.7% | FAIL |
| N7 clock failure < 60% | < 60% | 0.0% | PASS |
| Std dev 10-25% | 10-25% | 0.9% | FAIL |
| S-tier 10-20% | 10-20% | 0.0% | FAIL |

Root cause: knowledge accumulates to 15-18 per run against a threshold of 8. Clock expected accumulation of 7.5 over 5 stops against max of 10. The heuristic agent never needs to make a hard choice.

---

## 4. Sweep v1 Results

33 configs tested across knowledge threshold (6 values), knowledge reward total (3 values), and clock base tick (2 values). Zero configs passed all 6 criteria. Best was 4/6.

Three structural failures identified:

| Failure | Cause | Parametric fix? |
|---------|-------|-----------------|
| V6: S-tier unreachable (best 2.1%) | Scoring diminishing returns compress scores to 78-82 band | No |
| V2: P6 combos above 90% | Clear-Headed -2 threshold too strong at ct=1 | No |
| V4: N7 clock failure 72-84% | Exhausted jitter=1.0 doesn't scale with base tick 2 | No |

---

## 5. Structural Fixes

Three independent fixes applied in sweep v2:

| Fix | Before | After | Rationale |
|-----|--------|-------|-----------|
| Surplus scoring | 2-tier (full, half, zero) | 3-tier (full, reduced, diminished) | Opens scoring ceiling for S-tier |
| P6 Clear-Headed | threshold -2 | threshold -1 | Halves advantage without removing trait |
| N7 Exhausted | jitter = 1.0 (absolute) | jitter += 0.25 (additive) | Scales naturally with base tick |

---

## 6. Sweep v2 Results and Winning Config

Structured sweep (33 configs): best was 5/6. Agent used 5 of 10 permitted exploratory configs to find 6/6.

**Winning config:** `exp_kt11_kr0_ct1_mod6_j035`

| Parameter | Value | Design implication |
|-----------|-------|-------------------|
| knowledge_threshold | 11 | Higher bar; knowledge must come from event choices |
| knowledge_reward_total | 0 | No knowledge from rewards; every reward is consumable vs. clock |
| clock_base_tick | 1 | Standard clock speed |
| starting_modules | 6 | One extra module cushion |
| clock_jitter_chance | 0.35 | Slightly softer than default 0.50 |

**Validation results (all PASS):**

| Criterion | Target | Actual |
|-----------|--------|--------|
| V1: No 0% correction combos | > 0% | 0.7% min |
| V2: No combo above 90% | ≤ 90% | 87.1% max |
| V3: Mean correction 30-55% | 30-55% | 30.5% |
| V4: N7 clock failure < 60% | < 60% | 4.9% |
| V5: Std dev 10-25% | 10-25% | 21.6% |
| V6: S-tier 10-20% | 10-20% | 19.1% |

---

## 7. Trait Outliers (Accepted)

The winning config produces two deliberate outliers:

**P2 (Quick Study)** dominates at 80-87% correction rate vs. 23-34% for other positives. With kr=0, P2 is the only trait that gets knowledge from rewards. Accepted: rolling P2 is the lucky roll. This is roguelike design.

**N4 (Distracted)** is the hardest negative at 1-4% correction (without P2). Without document knowledge and without reward knowledge, the only source is event choices. P2+N4 is 65.7% (P2 compensates). Accepted: rolling N4 without P2 is the challenge run.

The scoring cascade and reroll system already handle this asymmetry: accepting a hard roll and winning yields a higher grade than rerolling into an easy configuration.

---

## 8. Key Decisions

| Decision | Rationale |
|----------|-----------|
| Monte Carlo over brute-force | State space is small enough for enumeration, but Monte Carlo with a heuristic agent better models actual player behavior |
| Bounded agent exploration | Agent gets 10 exploratory configs within parameter constraints; prevents runaway iteration while allowing targeted search |
| Accept P2/N4 outliers | Roguelike design: some rolls are harder. Scoring cascade rewards skilled play on hard rolls. |
| Validate before content | Simulator uses placeholder data; balance fixes are config changes, not content rewrites |
| Git workflow enforced | Agent branched (`agent/wp-sweep-v2`), committed locally, did not push. Orchestrator reviews and merges. |

---

## 9. Artifacts Produced

| Artifact | Type | Location |
|----------|------|----------|
| Balance Simulator | code | `simulation/simulator.py`, `simulation/game_data.py` |
| Sweep v1 | code | `simulation/sweep.py` (on agent branch) |
| Sweep v2 | code | `simulation/sweep_v2.py` (on agent branch) |
| Simulator Spec | spec | `spec/wp-simulator-spec.md` (original), `spec/02-balance-simulator.md` (retrospective) |
| Sweep v1 Spec | spec | `spec/wp-sweep-spec.md` (original), `spec/03-balance-sweep-v1.md` (retrospective) |
| Sweep v2 Spec | spec | `spec/wp-sweep-v2-spec.md` (original), `spec/04-balance-sweep-v2.md` (retrospective) |
| Results CSV | data | `simulation/output/sweep_v2_results.csv` (on agent branch) |
| Heatmaps | data | `simulation/output/*.png` (on agent branch) |

---

## 10. Next Phase

Balance is locked. The winning config parameters need to be applied to `data/config.json` and the trait definitions in `data/characters.json` when content implementation begins (M4). The structural fixes (P6 -1, N7 additive, 3-tier scoring) are currently only in the agent branch's `game_data.py`; they need to be reflected in the engine's TypeScript data contracts during content build.
