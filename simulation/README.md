<!--
---
title: "Balance Simulator"
description: "Monte Carlo balance validation for the 64-cell trait matrix"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-04-05"
version: "1.1"
status: "implemented"
tags:
  - type: directory-readme
  - domain: balance
  - tech: python
---
-->

# Balance Simulator

Monte Carlo balance validation for Within Parameters. Runs 10,000 randomized iterations per trait combination (640,000 total runs) using a priority-weighted heuristic agent. Outputs heatmaps and CSV data identifying balance anomalies.

**Status:** Implemented. First run complete. Validation criteria failed — awaiting orchestrator rebalance decisions.

---

## 1. Contents

```
simulation/
├── simulator.py        # Core: state, events, traits, agent, runner, output
├── game_data.py        # Event pool, trait definitions, config values
├── output/             # Generated heatmaps and reports (gitignored)
│   ├── correction_rate_heatmap.png
│   ├── avg_score_heatmap.png
│   ├── clock_failure_rate_heatmap.png
│   └── combo_results.csv
└── README.md           # This file
```

---

## 2. Specification

Full spec at [`spec/wp-simulator-spec.md`](../spec/wp-simulator-spec.md). Covers architecture, data structures, heuristic agent rules, output format, and validation criteria.

Trait definitions at [`spec/m3-trait-system-v2.md`](../spec/m3-trait-system-v2.md).

---

## 3. Running

```bash
# Dependencies
pip install matplotlib numpy --break-system-packages

# Run
cd simulation
python simulator.py
```

Output appears in `simulation/output/` and stdout. Runtime: ~2-3 minutes for 640,000 runs.

---

## 4. First Run Results (April 2026)

### Validation Criteria Status

| # | Criterion | Target | Actual | Status |
|---|-----------|--------|--------|--------|
| 1 | No 0% correction combos | Min > 0% | 96.1% | PASS |
| 2 | No combo above 90% correction | Max ≤ 90% | 100.0% | **FAIL** |
| 3 | Mean correction 30-55% | 30-55% | 99.7% | **FAIL** |
| 4 | N7 clock failure below 60% | < 60% | 0.0% | PASS |
| 5 | Std dev 10-25% | 10-25% | 0.9% | **FAIL** |
| 6 | S-tier in 10-20% of correction runs | 10-20% | 0.0% | **FAIL** |

### Root Cause Analysis

The heuristic agent defaults to knowledge rewards, accumulating 10 knowledge from rewards alone (5 stops × +2). Combined with event knowledge gains and found documents (~5-7 additional), total knowledge reaches 15-18 per run — far exceeding the threshold of 8. Clock pressure is insufficient to force clock reduction choices: expected tick is 1.5/stop (7.5 total over 5 stops), well below the max of 10.

The game is trivially winnable for any competent player regardless of trait combination.

### Recommended Rebalance Axes (for orchestrator)

- Raise knowledge threshold (8 → 12-14)
- Reduce knowledge reward value (2 → 1)
- Increase clock base tick or jitter
- Reduce starting modules

---

## 5. What It Answers

1. Are there trait combinations where the good ending is impossible regardless of play?
2. Are there trait combinations where the good ending is trivially guaranteed?
3. Does the scoring cascade produce the intended grade distribution?

---

## 6. Architecture

| File | LOC | Purpose |
|------|-----|---------|
| `game_data.py` | ~150 | Config, traits, events, pools — all tunable values |
| `simulator.py` | ~350 | Engine, heuristic agent, Monte Carlo runner, heatmaps, CSV, report |

Separation lets the developer tweak `game_data.py` values and rerun without touching simulation logic.

---

## 7. Related

| Document | Relationship |
|----------|--------------|
| [Trait System v2](../spec/m3-trait-system-v2.md) | Authoritative trait definitions and scoring |
| [Simulator Spec](../spec/wp-simulator-spec.md) | Agent execution target |
| [Mechanical Context](../spec/wp-mechanical-design-context.md) | Consolidated stat model reference |
