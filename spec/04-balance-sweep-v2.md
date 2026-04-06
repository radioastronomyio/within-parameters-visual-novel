<!--
---
title: "Spec 04: Balance Sweep v2"
description: "SpecSmith retrospective: structural fixes plus parameter search with agent-directed exploration"
author: "VintageDon + Claude"
date: "2026-04-06"
version: "1.0-retrospective"
status: "Complete"
tags:
  - type: specification
  - domain: balance
related_documents:
  - "[Original Sweep v2 Spec (as-written)](archive/wp-sweep-v2-spec.md)"
  - "[Spec 03: Balance Sweep v1](03-balance-sweep-v1.md)"
  - "[Trait System v2](m3-trait-system-v2.md)"
---
-->

# Spec 04: Balance Sweep v2

Apply three structural fixes to the trait system and scoring formula, re-sweep the same parameter grid, then allow the agent up to 10 exploratory configs to close remaining gaps. Target: a configuration passing all six validation criteria.

**SpecSmith note:** This is a retrospective rewrite. The original spec (`archive/wp-sweep-v2-spec.md`) prescribed three structural fixes identified by the v1 sweep analysis, then gave the agent bounded freedom to explore beyond the grid. GLM-5.1 via OpenCode found a 6/6 config in 25 minutes using 5 of its 10 permitted exploratory runs.

---

## 1. Outcome

A balance configuration that passes all six validation criteria, produced by:

- Applying three structural fixes to `game_data.py` and `simulator.py`:
  1. Third-tier surplus scoring (softened diminishing returns)
  2. P6 Clear-Headed reduced from threshold -2 to -1
  3. N7 Exhausted changed from jitter=1.0 to jitter_chance += 0.25 (scales with base tick)
- Running the same 33-config grid as sweep v1 with fixes applied
- If needed, running up to 10 agent-directed exploratory configs to close remaining criterion gaps
- Generating full heatmaps for the winning config

---

## 2. Test Gates

| Gate | Verification |
|------|-------------|
| Structural fixes applied | `game_data.py` contains third-tier surplus fields, P6 at -1, N7 as additive +0.25 |
| `calculate_score` updated | `simulator.py` uses third-tier surplus values |
| Sweep completes | `python sweep_v2.py` runs 33 structured configs to completion |
| V1: No 0% correction combos | Minimum correction rate > 0% |
| V2: No combo above 90% | Maximum correction rate ≤ 90% |
| V3: Mean correction 30-55% | Mean correction rate between 30% and 55% |
| V4: N7 clock failure < 60% | Maximum clock failure rate among N7 pairings < 60% |
| V5: Std dev 10-25% | Standard deviation of correction rates between 10% and 25% |
| V6: S-tier 10-20% | 10-20% of correction-ending runs score ≥ 90 |
| CSV generated | `simulation/output/sweep_v2_results.csv` with structured + exploratory rows |
| Heatmaps generated | If 6/6 found: correction rate, avg score, and clock failure heatmaps updated |
| Existing sweep preserved | `sweep.py` (v1) not modified |

---

## 3. Constraints

- Structural fixes are prescriptive (section 1, items 1-3). The agent applies them as specified.
- The agent may adjust N7 jitter increment within 0.10-0.50 and surplus scoring values within ±2 of defaults during exploration.
- The agent may not modify event pool data, add/remove traits, or change the heuristic agent's decision logic.
- Exploratory configs use `dataclasses.replace()`, not source file edits.
- Maximum 10 exploratory configs. Stop at 4/6 or worse without further exploration.
- Do not push to origin.

---

## 4. Scope

**Modify:**

- `simulation/game_data.py` (three structural fixes)
- `simulation/simulator.py` (`calculate_score` function only, third-tier surplus)

**Create:**

- `simulation/sweep_v2.py`
- Update `simulation/README.md`

**Do not modify:**

- `simulation/sweep.py` (v1 preserved for comparison)
- Event pool data
- Trait count or definitions beyond the three specified fixes
- Heuristic agent logic

**Out of scope:**

- Content implementation
- UI changes
- Production deployment

---

## 5. Dependencies

| Dependency | Relationship |
|------------|-------------|
| [Spec 03: Balance Sweep v1](03-balance-sweep-v1.md) | Identified the three structural failures this spec fixes |
| [Spec 02: Balance Simulator](02-balance-simulator.md) | Provides the simulation engine |
| [Trait System v2](m3-trait-system-v2.md) | Defines P6 and N7 traits being modified |

---

## 6. References

| Resource | Description |
|----------|-------------|
| [Original sweep v2 spec](archive/wp-sweep-v2-spec.md) | The spec that was actually executed |
| [Sweep v2 results](../simulation/output/sweep_v2_results.csv) | Output data (on agent branch) |

---

<!--
RETROSPECTIVE NOTES:

Winning configuration: exp_kt11_kr0_ct1_mod6_j035
- knowledge_threshold: 11
- knowledge_reward_total: 0 (all knowledge from events/documents)
- clock_base_tick: 1
- starting_modules: 6
- clock_jitter_chance: 0.35

Validation results (all PASS):
- V1: min correction 0.7%
- V2: max correction 87.1%
- V3: mean correction 30.5%
- V4: max N7 clock failure 4.9%
- V5: std dev 21.6%
- V6: S-tier 19.1%

Key design insight from the winning config:
- Knowledge reward = 0 forces every reward pick into consumable vs. clock reduction.
  Knowledge becomes purely an event-choice resource, not a reward resource.
  This creates genuine tension: chasing knowledge-rich events often costs modules or has gates.
- P2 (Quick Study, +1 knowledge reward) becomes the dominant positive trait (80-87% correction vs. 23-34% for others). This is acceptable for a roguelike: rolling P2 is the lucky roll.
- N4 (Distracted, no document knowledge) becomes the hardest negative (1-4% correction without P2). Rolling N4 without P2 is the challenge run.

The agent found this config in 5 exploratory runs after the structured sweep landed at 5/6. It adjusted starting_modules from 5 to 6 and jitter_chance from 0.50 to 0.35 on the best structured config (kt11_kr0_ct1), which was failing V3 (mean correction at 28.2%, just below the 30% floor). The module bump and jitter softening gave enough breathing room to cross the threshold.

Structural fixes confirmed:
- Fix 1 (third-tier surplus scoring): solved V6. S-tier went from 0% to 19.1%.
- Fix 2 (P6 -2 → -1): solved V2. Max combo dropped from 95%+ to 87.1%.
- Fix 3 (N7 additive +0.25): solved V4. N7 clock failure dropped from 84% to 4.9%.

All three fixes addressed independent failure modes without interacting with each other, which is exactly the property that made them safe to apply simultaneously.
-->
