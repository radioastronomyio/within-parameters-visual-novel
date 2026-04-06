<!--
---
title: "Spec 03: Balance Sweep v1"
description: "SpecSmith retrospective: parameter search across three balance axes"
author: "VintageDon + Claude"
date: "2026-04-06"
version: "1.0-retrospective"
status: "Complete"
tags:
  - type: specification
  - domain: balance
related_documents:
  - "[Original Sweep Spec (as-written)](archive/wp-sweep-spec.md)"
  - "[Spec 02: Balance Simulator](02-balance-simulator.md)"
  - "[Trait System v2](m3-trait-system-v2.md)"
---
-->

# Spec 03: Balance Sweep v1

A parameter sweep script that tests 33 config variants across knowledge threshold, knowledge reward value, and clock base tick, reusing the existing simulator engine. Outputs a ranked CSV identifying which configurations pass the six validation criteria.

**SpecSmith note:** This is a retrospective rewrite. The original spec (`archive/wp-sweep-spec.md`) was written after the simulator's first run proved the game trivially winnable (99.7% correction rate). The sweep was the systematic response: brute-force the parameter space instead of guessing. GLM-5.1 via OpenCode built and ran it in 21 minutes.

---

## 1. Outcome

A sweep runner that:

- Tests 33 configurations across three independent axes (knowledge threshold at 6 values, knowledge reward total at 3 values, clock base tick at 2 values, minus 3 excluded degenerate configs)
- Runs the full 640,000-iteration Monte Carlo for each configuration by importing and calling the existing simulator's `run_game()` function
- Computes all six validation criteria plus derived metrics (ending distribution, module crunch rate, S-tier percentage) per configuration
- Outputs a single CSV ranked by criteria passed, then by distance from the 30-55% correction rate target midpoint
- Prints a top-10 summary to stdout with enough information for the orchestrator to select candidates for full heatmap analysis
- Does not modify the existing simulator code or game data

---

## 2. Test Gates

| Gate | Verification |
|------|-------------|
| Runs to completion | `python sweep.py` exits cleanly, prints progress and summary |
| Correct config count | stdout reports 33 configurations tested |
| CSV generated | `simulation/output/sweep_results.csv` contains 33 rows |
| CSV is ranked | Rows sorted by `criteria_passed` descending, then target distance ascending |
| Each row has all metrics | CSV columns include all 6 validation criteria (pass/fail + actual) plus derived metrics |
| Top-10 printed | stdout summary shows top 10 configs with ending distribution and pass count |
| Existing code untouched | `simulator.py` and `game_data.py` have no modifications |
| Reproducible | Same seed produces identical CSV |

---

## 3. Constraints

- Import from existing `simulator.py` and `game_data.py`. Do not duplicate simulation logic.
- Construct config variants via `dataclasses.replace()` on `DEFAULT_CONFIG`. Do not modify `DEFAULT_CONFIG` itself.
- Do not generate heatmaps (those come later for selected candidates).
- Do not attempt automatic rebalancing. If zero configs pass all criteria, report and stop.
- Single-threaded is acceptable. Parallelism permitted but not required.

---

## 4. Scope

**Pre-existing (do not modify):**

- `simulation/simulator.py`
- `simulation/game_data.py`

**Create:**

- `simulation/sweep.py`
- Update `simulation/README.md` with sweep instructions

**Out of scope:**

- Heatmap generation for individual configs
- Structural fixes to trait definitions or scoring
- Expanding the sweep grid beyond the specified axes

---

## 5. Dependencies

| Dependency | Relationship |
|------------|-------------|
| [Spec 02: Balance Simulator](02-balance-simulator.md) | Provides `run_game()`, `Config`, trait lists, event pools |

---

## 6. References

| Resource | Description |
|----------|-------------|
| [Original sweep spec](archive/wp-sweep-spec.md) | The spec that was actually executed |
| [Sweep v1 results](../simulation/output/sweep_results.csv) | Output data (on agent branch) |

---

<!--
RETROSPECTIVE NOTES:

Results: Zero configs passed all 6 criteria. Best was 4/6 (six configs tied).

Three structural failures identified:
1. V6 universal fail: S-tier peaked at 2.1%. Scoring diminishing returns compress scores into 78-82 band. No parametric fix possible.
2. V2 fail on ct=1 configs: P6 Clear-Headed (-2 threshold) creates trivial combos. Trait is too strong.
3. V4 fail on ct=2 configs: N7 Exhausted (jitter=1.0) + base tick 2 = guaranteed clock-out. Trait doesn't scale with clock speed.

These findings directly informed the structural fixes in spec 04 (sweep v2). The sweep proved that the three swept axes alone couldn't solve the problem; the issue was in the trait definitions and scoring formula, not the tunable parameters.

The sweep pattern itself (import existing simulator, iterate over configs, output comparison CSV) proved reusable. Sweep v2 used the same architecture with structural fixes baked into the game data.
-->
