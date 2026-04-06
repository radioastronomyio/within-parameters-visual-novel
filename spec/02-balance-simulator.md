<!--
---
title: "Spec 02: Balance Simulator"
description: "SpecSmith retrospective: outcome-driven specification for the Monte Carlo balance simulator"
author: "VintageDon + Claude"
date: "2026-04-05"
version: "1.0-retrospective"
status: "Complete"
tags:
  - type: specification
  - domain: balance
related_documents:
  - "[Original Simulator Spec (as-written)](archive/wp-simulator-spec.md)"
  - "[Trait System v2](m3-trait-system-v2.md)"
  - "[Mechanical Context](archive/wp-mechanical-design-context.md)"
---
-->

# Spec 02: Balance Simulator

A Python Monte Carlo simulator that runs 10,000 iterations per trait combination across the 64-cell trait matrix, using a heuristic agent to model competent play, and outputs heatmaps and CSV data identifying balance anomalies.

**SpecSmith note:** This is a retrospective rewrite. The original spec (`archive/wp-simulator-spec.md`) prescribed two-file architecture, complete data structures, heuristic agent priority rules, and output formats. The agent (GLM-5.1 via OpenCode) built and ran it in a single session. This retrospective captures the outcome-driven version.

---

## 1. Outcome

A balance validation tool that:

- Simulates 640,000 game runs (10,000 per trait combination, 64 combinations) using the game's stat model, event pool, and trait system as defined in the trait system v2 document
- Models a competent-but-not-optimal player via a priority-weighted heuristic agent (survive first, stay solvent second, chase the win condition third, accumulate knowledge by default)
- Produces three 8x8 heatmaps: correction ending rate, average raw score, and clock failure rate per trait combination
- Produces a CSV with per-combination statistics for manual analysis
- Reports against six validation criteria and flags which pass or fail
- Separates tunable game values from simulation logic so the developer can tweak values and rerun without touching the simulator code
- Completes a full run in under 5 minutes on a modern workstation

---

## 2. Test Gates

| Gate | Verification |
|------|-------------|
| Runs to completion | `python simulator.py` exits cleanly, prints results to stdout |
| Correct run count | stdout reports 640,000 total runs (64 combos × 10,000 iterations) |
| Heatmaps generated | `simulation/output/` contains `correction_rate_heatmap.png`, `avg_score_heatmap.png`, `clock_failure_rate_heatmap.png` |
| CSV generated | `simulation/output/combo_results.csv` contains 64 rows with all analysis fields |
| Reproducible results | Running with the same seed produces identical output |
| V1: No 0% correction combos | Minimum correction rate across all 64 combos > 0% |
| V2: No combo above 90% | Maximum correction rate across all 64 combos ≤ 90% |
| V3: Mean correction 30-55% | Mean correction rate across all combos is between 30% and 55% |
| V4: N7 clock failure < 60% | Maximum clock failure rate among N7 (Exhausted) pairings < 60% |
| V5: Std dev 10-25% | Standard deviation of correction rates is between 10% and 25% |
| V6: S-tier 10-20% | 10-20% of correction-ending runs achieve a raw score ≥ 90 |
| Validation report | stdout prints pass/fail for each criterion with actual values |

---

## 3. Constraints

- Python 3.12+, standard library plus matplotlib and numpy only
- The heuristic agent must not use lookahead, optimal sequence calculation, or future event knowledge. It models a competent player, not an oracle.
- All trait effects from the trait system v2 document must be implemented, including per-event flags (Rough Touch per-module surcharge, Stubborn forced choice, Practiced first-spend discount, Light Foot transit safety, Tunnel Nerves approach penalty, Distracted document block, Narrow Focus clock reduction nerf)
- Clock reduction capped at 2 segments per reward regardless of rapport
- Scoring uses diminishing returns: full value for first surplus point, reduced for second, zero for third onward
- Raw score hard-capped at 103 before reroll multiplier

---

## 4. Scope

**Pre-existing (do not create or modify):**

- `spec/m3-trait-system-v2.md` (authoritative trait definitions)
- `spec/wp-mechanical-design-context.md` (stat model reference)
- `game-design/m3-content-design-draft.md` (event pool stat tables)

**Create:**

- Simulation code (game data definitions + simulator engine)
- Output directory with `.gitkeep`
- `simulation/README.md`

**Out of scope:**

- Rebalancing (if validation criteria fail, report and stop; rebalancing is orchestrator work)
- Narrative content, dialogue, or found document text
- The dossier reroll mechanic (just the penalty math, not the UI)
- Multiple difficulty settings

---

## 5. Dependencies

| Dependency | Relationship |
|------------|-------------|
| [Trait System v2](m3-trait-system-v2.md) | Defines all 16 traits, their effects, and the interaction matrix |
| [Mechanical Context](archive/wp-mechanical-design-context.md) | Consolidated stat model: event cycle, reward values, scoring formula |

---

## 6. References

| Resource | Description |
|----------|-------------|
| [Original simulator spec](archive/wp-simulator-spec.md) | The implementation-prescriptive spec that was actually executed |
| [Holdfast balance simulator](https://github.com/radioastronomyio/holdfast-roguelite-deckbuilder) | Pattern source for the Monte Carlo approach |

---

<!--
RETROSPECTIVE NOTES:

What the original spec got right:
- Explicit heuristic agent priority rules prevented the agent from building an omniscient optimizer
- Clear validation criteria gave the agent concrete pass/fail targets to report against
- Separating game_data.py from simulator.py enabled the rapid iteration cycle that followed (sweep v1 and v2)
- The "flag and stop, don't rebalance" instruction kept the agent in its lane

What SpecSmith would have changed:
- The original spec prescribed the two-file architecture. An outcome spec would describe the separation concern (tunable values vs. simulation logic) and let the agent decide file structure.
- The original spec included complete Python dataclass definitions. An outcome spec would reference the trait system v2 document and let the agent derive the data model.
- The original spec prescribed the heuristic agent's priority order as code. An outcome spec would describe the agent's behavioral profile ("competent but not optimal, prioritizes survival over scoring") and let the agent implement it.

First run results (validation failures):
- V2 FAIL: max combo at 100% (game trivially winnable)
- V3 FAIL: mean at 99.7% (no difficulty variance)
- V5 FAIL: std dev at 0.9% (traits don't differentiate)
- V6 FAIL: S-tier at 0.0% (scoring too compressed)

Root cause: knowledge accumulates too fast (15-18 per run against threshold of 8), clock pressure is cosmetic (expected 7.5 total against max 10). The simulator did exactly what it was supposed to do: it proved the game balance was broken before any content was implemented. This is the Monte Carlo pattern working as designed.

The failure triggered the sweep specs (03, 04) which systematically searched the parameter space and found a viable configuration after structural fixes to three traits and the scoring formula.
-->
