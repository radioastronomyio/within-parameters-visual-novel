# Within Parameters — Balance Sweep Spec

**Target:** ML01 (`/repos/within-parameters-visual-novel/simulation/`)
**Agent runtime:** Claude Code or OpenCode
**Branch:** `agent/wp-sweep` (see AGENTS.md Git Workflow)
**Language:** Python 3.12+, reuses existing `game_data.py` and `simulator.py`
**Estimated scope:** ~200 LOC, single file (`sweep.py`)
**Purpose:** Brute-force parameter search across three balance axes to identify config variants that pass all six validation criteria

---

## 1. Objective

The initial simulator run (April 2026) showed the game is trivially winnable: 99.7% mean correction rate, 0.9% std dev, 0% S-tier achievement. Root cause: knowledge accumulates too fast relative to threshold, and clock pressure is insufficient to force trade-offs.

This sweep tests 33 config variants across three independent axes and outputs a single comparison CSV ranked by validation fitness. The orchestrator selects promising configs from the CSV, then runs full heatmap analysis on those candidates using the existing `simulator.py`.

---

## 2. Architecture

```
simulation/
├── simulator.py        # Existing — do not modify
├── game_data.py        # Existing — do not modify
├── sweep.py            # NEW — parameter sweep runner
├── README.md           # Update with sweep instructions
└── output/
    ├── sweep_results.csv           # NEW — one row per config variant
    ├── correction_rate_heatmap.png # Existing
    ├── avg_score_heatmap.png       # Existing
    ├── clock_failure_rate_heatmap.png # Existing
    └── combo_results.csv           # Existing
```

One new file. `sweep.py` imports `run_game` from `simulator.py` and `Config`, trait lists, and event pools from `game_data.py`. It does not duplicate any simulation logic.

---

## 3. Sweep Grid

Three axes, enumerated as a Cartesian product:

| Axis | Values | Count |
|------|--------|-------|
| `knowledge_threshold` | 8, 10, 12, 13, 14, 16 | 6 |
| Knowledge reward total (base + bonus) | 0, 1, 2 | 3 |
| `clock_base_tick` | 1, 2 | 2 |

Total combinations: 6 × 3 × 2 = 36.

**Exclude three configs:**

1. `kt=8, kr=2, ct=1` — Current broken config, already measured.
2. `kt=16, kr=0, ct=1` — Almost certainly unwinnable.
3. `kt=16, kr=0, ct=2` — Almost certainly unwinnable.

Remaining: **33 configs.**

### Config Construction

The knowledge reward total represents the final per-reward knowledge gain. The existing `game_data.py` uses `knowledge_reward_bonus` as an offset from the base value of 2 in the reward application logic. To achieve a total reward of N:

- Total 0: set `knowledge_reward_bonus = -2`
- Total 1: set `knowledge_reward_bonus = -1`
- Total 2: set `knowledge_reward_bonus = 0` (default)

Use `dataclasses.replace()` on `DEFAULT_CONFIG` to construct each variant. Do not modify `DEFAULT_CONFIG` itself.

---

## 4. Per-Variant Execution

For each config variant, run all 64 trait combinations at 10,000 iterations each (640,000 runs per variant). Use the same seed strategy as `simulator.py` for reproducibility.

Import and call `run_game()` directly. Do not shell out to `simulator.py` as a subprocess.

---

## 5. Metrics Per Variant

### Standard Validation Criteria (from simulator spec section 9)

| # | Criterion | Target |
|---|-----------|--------|
| V1 | No 0% correction combos | min correction rate > 0% |
| V2 | No combo above 90% correction | max correction rate ≤ 90% |
| V3 | Mean correction rate | 30–55% |
| V4 | N7 max clock failure rate | < 60% |
| V5 | Correction rate std dev | 10–25% |
| V6 | S-tier in correction runs | 10–20% of correction-ending runs score ≥ 90 |

Record each as PASS/FAIL plus the actual value. Count total criteria passed (0–6).

### Derived Metrics

| Metric | Definition | Design Target |
|--------|-----------|---------------|
| `correction_pct` | % of all 640k runs reaching correction ending | 40–50% |
| `destruction_pct` | % reaching destruction ending | 30–40% |
| `clock_failure_pct` | % lost to clock | 10–20% |
| `module_crunch_pct` | % of runs where `modules_remaining == 0` at end | > 0% (resources should matter) |
| `avg_score` | Mean raw score across all runs | — |
| `avg_corr_score` | Mean raw score among correction-ending runs only | — |
| `s_tier_pct` | % of correction runs scoring ≥ 90 | 10–20% |
| `max_n7_cf` | Highest clock failure rate among N7 pairings | < 60% |

---

## 6. Output

### CSV (`output/sweep_results.csv`)

One row per config variant. Columns in order:

```
label, knowledge_threshold, knowledge_reward_total, clock_base_tick,
criteria_passed, correction_pct, destruction_pct, clock_failure_pct,
mean_combo_corr, std_combo_corr, min_combo_corr, max_combo_corr,
avg_score, avg_corr_score, module_crunch_pct, s_tier_pct, max_n7_cf,
v1_no_zero_corr, v2_no_above_90, v3_mean_30_55, v4_n7_below_60,
v5_std_10_25, v6_s_tier_10_20
```

Sort rows by `criteria_passed` descending, then by distance from 0.425 (midpoint of the 30–55% target) ascending.

Label format: `kt{threshold}_kr{reward}_ct{tick}` (e.g., `kt13_kr1_ct2`).

### Console Output

Progress line per variant:

```
[1/33] kt10_kr2_ct1 ... 142.3s | corr=78.2% destr=18.1% clock=3.7% | pass=2/6
```

Append `<<<` marker to any variant passing 5 or 6 criteria.

After all variants complete, print:

1. Total elapsed time.
2. Top 10 configs sorted by the same ranking as the CSV.
3. For the top 3, print the full validation criteria table (matching the format in `simulation/README.md` section 4).

---

## 7. Execution

### Run

```bash
cd /repos/within-parameters-visual-novel/simulation
python sweep.py
```

### Expected Runtime

33 variants × ~2–3 minutes each = 65–100 minutes. Single-threaded is acceptable. If the agent wants to add `multiprocessing.Pool` for parallelism, that's permitted but not required.

---

## 8. Scope Boundaries

**The sweep script DOES:**
- Import from existing `simulator.py` and `game_data.py`
- Construct Config variants via `dataclasses.replace()`
- Run `run_game()` for each variant/combo/iteration
- Compute validation criteria and derived metrics
- Output CSV and console summary

**The sweep script DOES NOT:**
- Modify `simulator.py` or `game_data.py`
- Generate heatmaps (those come later for selected candidates)
- Attempt automatic rebalancing
- Change event pool data, trait definitions, or scoring formulas

---

## 9. Agent Execution Notes

Follow the git workflow in AGENTS.md. Branch: `agent/wp-sweep`.

Deliverables:

1. `simulation/sweep.py` — The sweep runner
2. Update `simulation/README.md` — Add section for sweep usage
3. Run `sweep.py` to completion
4. Report the top 10 configs from the console summary
5. Commit all deliverables and `output/sweep_results.csv` to the feature branch. Do not push.

If the sweep completes but zero configs pass all 6 criteria, note the highest-passing configs and their failure modes. Do not attempt to expand the sweep grid or adjust parameters. That decision belongs to the orchestrator.
