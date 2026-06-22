<!--
---
title: "A1 Engine Reconciliation — Parity Notes"
description: "Parity level, tolerance, and PRNG caveats for the TypeScript replay harness vs the Python balance simulator"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "complete"
tags:
  - type: documentation
  - domain: [engine, balance]
  - tech: [typescript, python]
related_documents:
  - "[Spec A1](../spec/spec-a1-engine-reconciliation.md)"
  - "[Balance Simulator README](README.md)"
  - "[Replay Harness](../src/engine/replay-harness.ts)"
---
-->

# Parity Notes — TS Replay Harness vs Python Simulator

## Summary

The TypeScript replay harness (`src/engine/replay-harness.ts`, run via `npm run replay`) reproduces the Python balance simulator's (`simulation/simulator.py`) outcomes within tight aggregate tolerance. **Statistical parity** is achieved, not byte-exact seed parity. All six validation criteria pass at ≥5,000 iterations per combo.

## Parity Level Reached

**Aggregate statistical parity.** Per-combo correction rates match within an absolute tolerance of 5 percentage points for all 64/64 trait combinations. This exceeds the spec's bar of 60/64.

| Metric | Python (2000 iter) | TypeScript (2000 iter) | TypeScript (5000 iter) |
|--------|--------------------|------------------------|------------------------|
| Mean correction | 30.6% | 30.4% | 30.5% |
| Min correction | ~1% | 0.9% | 1.1% |
| Max correction | ~87% | 86.7% | 87.0% |
| Std dev | ~21.7% | 21.4% | 21.5% |
| S-tier (per-run) | 19.5% | 20.2% | 19.7% |
| Combos within 5pp | — | 64/64 | 64/64 |

**Validation verdict at 5,000 iterations: 6/6 PASS.**

Exact per-seed equality is **not** achieved and was not the target. Python's `Random` (Mersenne Twister) and the TS harness's `mulberry32` produce different bit streams from the same seed, so individual runs differ. The aggregate rates converge because both PRNGs are uniformly distributed and the run mechanics are identical.

## PRNG Caveats

### 1. Different PRNG algorithms

- **Python:** `random.Random` — Mersenne Twister (MT19937)
- **TypeScript:** `mulberry32` (in `src/engine/rng.ts`)

Mulberry32 was chosen for portability (pure JS, no BigInt, 32-bit state), sufficient statistical quality for Monte Carlo balance work, and `[0, 1)` float semantics matching `Random.random()`. It is ~10× cheaper per draw than MT19937, which helps harness throughput.

### 2. Python's `hash()` is not portable

The simulator seeds per combo via `base_seed = 42 + hash(combo_key) % (2**31)`. Python's `hash()` for strings and tuples is randomized per process via `PYTHONHASHSEED`, so the committed `combo_results.csv` was generated with one particular run's hash values that cannot be reproduced deterministically.

The TS harness uses a **deterministic string hash** (`hashCombo` in `replay-harness.ts`) that produces stable, distinct seeds per combo across runs. The absolute seed values differ from Python's, but each combo still gets a unique, reproducible seed.

### 3. `Random.sample` draw order differs

Both PRNGs sample without replacement, but the internal selection order differs. The specific events drawn per run differ, but the distribution over many iterations converges. This is the largest source of per-run divergence and the smallest source of aggregate divergence.

## Config Discrepancy: `knowledge_reward_bonus`

The spec text says `knowledge_reward_bonus=0 (reward total 2)`. The actual validated winning config (per `simulation/sweep_v2.py` commit `8621205`: "knowledge_reward_bonus=-2 (total 0)") has `knowledge_reward_bonus=-2`, meaning knowledge rewards grant **0 knowledge** (2 base + (-2) bonus). The "kr=0" shorthand in the README/sweep label refers to the reward **total** being 0, not the bonus value.

Per the spec's own rule — *"the simulator wins because the balance was validated against the simulator's behavior"* — `data/config.json` ships with `knowledgeRewardBonus: -2`. This was confirmed by reproducing the CSV's correction rates (30.5% mean) with `knowledge_reward_bonus=-2` in the Python simulator, whereas `knowledge_reward_bonus=0` produces ~100% correction (trivially winnable).

## How to Regenerate

```bash
# TypeScript harness (5,000 iterations per combo, ~320k total runs)
npm run replay

# Fast smoke (2,000 iterations)
npm run replay:fast

# Full fidelity (10,000 iterations, matching the committed CSV)
npm run replay:full
```

The harness prints per-combo and aggregate rates, the six-criterion validation verdict, and a CSV comparison against `simulation/output/combo_results.csv`.

## What This Proves

The engine functions exercised by the harness — `buildEffectiveConfig`, `initNewGame`, `tickClock`, `calculateClockReduction`, `calcEffectiveConsumableCost`, `applyChoiceEffects`, `applyFoundDocument`, `applyReward`, `scoreRun`, `deriveRapport` — are the same functions the live engine uses. The harness ports only the agent (choice/reward selection) and event-pool draw; all mechanical resolution goes through the real engine code. When the harness and the simulator agree, the engine and the simulator are the same game.
