<!--
---
title: "Balance Simulator"
description: "Monte Carlo balance validation for the 64-cell trait matrix"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-04-05"
version: "1.0"
status: "draft"
tags:
  - type: directory-readme
  - domain: balance
  - tech: python
---
-->

# Balance Simulator

Monte Carlo balance validation for Within Parameters. Runs 10,000 randomized iterations per trait combination (640,000 total runs) using a priority-weighted heuristic agent. Outputs heatmaps and CSV data identifying balance anomalies.

**Status:** Spec complete, implementation pending.

---

## 1. Contents

```
simulation/
├── simulator.py        # Core: state, events, traits, agent, runner, output (pending)
├── game_data.py        # Event pool, trait definitions, config values (pending)
├── output/             # Generated heatmaps and reports (gitignored)
│   └── .gitkeep
└── README.md           # This file
```

---

## 2. Specification

Full spec at [`spec/wp-simulator-spec.md`](../spec/wp-simulator-spec.md). Covers architecture, data structures, heuristic agent rules, output format, and validation criteria.

Mechanical reference at [`spec/wp-mechanical-design-context.md`](../spec/wp-mechanical-design-context.md).

---

## 3. Running

```bash
# Dependencies
pip install matplotlib numpy --break-system-packages

# Run
cd simulation
python simulator.py
```

Output appears in `simulation/output/` and stdout.

---

## 4. What It Answers

1. Are there trait combinations where the good ending is impossible regardless of play?
2. Are there trait combinations where the good ending is trivially guaranteed?
3. Does the scoring cascade produce the intended grade distribution?

---

## 5. Related

| Document | Relationship |
|----------|--------------|
| [Trait System v2](../spec/m3-trait-system-v2.md) | Authoritative trait definitions and scoring |
| [Simulator Spec](../spec/wp-simulator-spec.md) | Agent execution target |
| [Mechanical Context](../spec/wp-mechanical-design-context.md) | Consolidated stat model reference |
| [GDR Results](../work-logs/03-content-design/gdr-trait-balance-results.md) | Balance analysis that informed v2 revisions |
