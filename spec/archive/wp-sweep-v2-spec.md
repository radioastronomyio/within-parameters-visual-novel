# Within Parameters — Balance Sweep v2 Spec

**Target:** ML01 (`/repos/within-parameters-visual-novel/simulation/`)
**Agent runtime:** Claude Code or OpenCode
**Branch:** `agent/wp-sweep-v2` (see AGENTS.md Git Workflow)
**Language:** Python 3.12+, modifies `game_data.py`, reuses `simulator.py`
**Estimated scope:** ~250 LOC new (`sweep_v2.py`), ~30 LOC edits to `game_data.py`
**Purpose:** Apply three structural fixes identified by the v1 sweep, then search for a config that passes all six validation criteria

---

## 1. Context

The v1 sweep (`sweep.py`) tested 33 configs across knowledge threshold, reward value, and clock base tick. Zero configs passed all six validation criteria. Best was 4/6 (six configs tied). Three structural issues blocked progress:

| Failure | Root Cause | Every Config? |
|---------|-----------|---------------|
| V6: S-tier rate below 10% (best: 2.1%) | Scoring diminishing returns compress scores into the 78-82 band | Yes |
| V2: Some combos above 90% correction | P6 Clear-Headed reduces threshold by 2, trivializing ct=1 configs | ct=1 only |
| V4: N7 clock failure above 60% | N7 jitter=1.0 + base tick 2 = guaranteed clock-out | ct=2 only |

These are structural problems that no combination of the three swept axes can solve. This spec applies targeted fixes, then re-sweeps.

---

## 2. Structural Fixes to `game_data.py`

Apply these three changes to `game_data.py` before running the sweep. These modify the default trait definitions and scoring values.

### Fix 1: Soften Scoring Diminishing Returns

The current scoring awards full value for the first surplus point in each category, half for the second, and zero for the third onward. This compresses correction-ending scores into a narrow band (~78-82) and makes S-tier (>=90) nearly unreachable.

**Change:** Add a third tier at reduced value instead of a hard cutoff at 2.

Current `Config` scoring fields:
```python
per_module_remaining: int = 4          # first surplus
per_module_remaining_surplus: int = 2  # second surplus, then zero

per_knowledge_over_threshold: int = 3          # first surplus
per_knowledge_over_threshold_surplus: int = 1  # second surplus, then zero
```

New fields (add to `Config`):
```python
per_module_remaining: int = 4
per_module_remaining_surplus: int = 3       # was 2
per_module_remaining_surplus_2: int = 1     # NEW: third+ surplus

per_knowledge_over_threshold: int = 3
per_knowledge_over_threshold_surplus: int = 2   # was 1
per_knowledge_over_threshold_surplus_2: int = 1 # NEW: third+ surplus
```

Update `simulator.py`'s `calculate_score` function to use the new third-tier fields. The loop should award full value for the first surplus point, `_surplus` for the second, and `_surplus_2` for each additional point beyond that.

### Fix 2: Reduce P6 Clear-Headed from -2 to -1

Current:
```python
("P6", "Clear-Headed", "competence gates",
 lambda c: replace(c, knowledge_threshold=c.knowledge_threshold - 2)),
```

Change to:
```python
("P6", "Clear-Headed", "competence gates",
 lambda c: replace(c, knowledge_threshold=c.knowledge_threshold - 1)),
```

This halves the advantage. P6 still matters (threshold 7 instead of 8 at default, or 13 instead of 14 at higher thresholds) without creating trivial combos.

### Fix 3: Scale N7 Exhausted with Base Tick

Current:
```python
("N7", "Exhausted", "clock variance",
 lambda c: replace(c, clock_jitter_chance=1.0)),
```

Change to a conditional that scales with base tick:
```python
("N7", "Exhausted", "clock variance",
 lambda c: replace(c, clock_jitter_chance=min(1.0, c.clock_jitter_chance + 0.25))),
```

At `clock_base_tick=1`: jitter chance goes from 0.50 to 0.75 (expected tick 1.75/stop, total 8.75 over 5 stops -- tight but survivable).
At `clock_base_tick=2`: jitter chance goes from 0.50 to 0.75 (expected tick 2.75/stop, total 13.75 -- very hard but clock reduction can compensate at 2-3 segments per reward with rapport).

This replaces the binary "always jitter" with a meaningful increase that scales naturally. The fixed +0.25 is a starting value; the agent may adjust this during exploration (see section 5).

---

## 3. Sweep Grid (Phase 1: Structured Search)

Same three axes as v1, with the structural fixes applied:

| Axis | Values | Count |
|------|--------|-------|
| `knowledge_threshold` | 8, 10, 12, 13, 14, 16 | 6 |
| Knowledge reward total | 0, 1, 2 | 3 |
| `clock_base_tick` | 1, 2 | 2 |

Total: 36. Exclude `kt=8, kr=2, ct=1` (expected trivial with fixes). Exclude `kt=16, kr=0, ct=*` (expected unwinnable). **33 configs.**

Config construction follows the same `dataclasses.replace()` pattern as v1. The structural fixes are baked into the updated `game_data.py` defaults, so no additional per-variant modification is needed for them.

---

## 4. Metrics and Output

Identical to v1 sweep spec sections 5 and 6. Same CSV schema (`output/sweep_v2_results.csv`), same console output format, same validation criteria.

One addition: for the top 3 configs, also report the **P6 combo spread** (correction rate range across all P6 pairings) and the **N7 combo spread** (clock failure rate range across all N7 pairings). This lets the orchestrator verify the structural fixes actually worked.

---

## 5. Phase 2: Agent-Directed Exploration

After the structured sweep completes, the agent evaluates the results and decides whether further exploration is warranted.

### If any config passes 6/6:
Report it prominently. Run full heatmaps on the best config using the existing `simulator.py` heatmap output (copy the winning config into `DEFAULT_CONFIG`, run `simulator.py`, save output). Done.

### If best is 5/6:
Identify which criterion still fails. The agent has freedom to run up to **10 additional targeted configs** to try to close the gap. For example:

- If V6 still fails (S-tier too low): try increasing the surplus scoring values (`per_module_remaining_surplus`, `per_knowledge_over_threshold_surplus`) by 1 each on the best config.
- If V2 still fails (P6 too strong): try P6 at threshold -0 (removing the trait effect entirely) on the best config to confirm P6 is the cause, then try intermediate values.
- If V4 still fails (N7 clock): try N7 jitter increment at 0.15 or 0.20 instead of 0.25.
- If V3 or V5 fail (mean/std dev out of range): interpolate between the two closest configs that bracket the target range.

Each exploratory config runs the same 640,000 iterations and reports the same metrics. Append results to the CSV with labels prefixed `exp_` (e.g., `exp_kt14_kr1_ct1_surplus_up`).

### If best is 4/6 or worse:
Stop. Report the failure modes and top configs. Do not attempt further exploration. The structural fixes were insufficient and the orchestrator needs to reassess.

### Exploration constraints:
- Maximum 10 exploratory configs (6.4M additional runs, ~20-30 minutes).
- The agent may modify scoring values, trait parameters, or the N7 jitter increment for exploratory configs. It must NOT modify event pool data, add/remove traits, or change the core simulation logic in `simulator.py`.
- All exploratory modifications are applied via `dataclasses.replace()` on the winning base config, not by editing source files.
- Document the rationale for each exploratory config in the console output.

---

## 6. Architecture

```
simulation/
├── simulator.py        # Existing -- modify only calculate_score for Fix 1
├── game_data.py        # Existing -- apply Fixes 1, 2, 3
├── sweep.py            # Existing v1 -- do not modify
├── sweep_v2.py         # NEW -- v2 parameter sweep with exploration
├── README.md           # Update with v2 sweep instructions
└── output/
    ├── sweep_v2_results.csv        # NEW
    ├── sweep_results.csv           # Existing v1
    ├── correction_rate_heatmap.png # Updated if 6/6 config found
    ├── avg_score_heatmap.png       # Updated if 6/6 config found
    ├── clock_failure_rate_heatmap.png # Updated if 6/6 config found
    └── combo_results.csv           # Updated if 6/6 config found
```

---

## 7. Execution

```bash
cd /repos/within-parameters-visual-novel/simulation
python sweep_v2.py
```

### Expected Runtime

Phase 1: 33 configs x ~2-3 min = 65-100 minutes.
Phase 2: 0-10 configs x ~2-3 min = 0-30 minutes.
Total: 65-130 minutes.

---

## 8. Scope Boundaries

**This spec DOES:**
- Modify `game_data.py` (three structural fixes)
- Modify `simulator.py` `calculate_score` function (third-tier surplus scoring)
- Create `sweep_v2.py` (structured sweep + agent exploration)
- Run the sweep to completion
- Optionally run full heatmaps if a 6/6 config is found

**This spec DOES NOT:**
- Modify `sweep.py` (v1 is preserved for comparison)
- Change event pool data (event costs, knowledge gains, community effects)
- Add or remove traits
- Change the heuristic agent's decision logic
- Push to origin

---

## 9. Agent Execution Notes

Follow the git workflow in AGENTS.md. Branch: `agent/wp-sweep-v2`.

Deliverables:

1. Modified `game_data.py` with structural fixes (section 2)
2. Modified `simulator.py` `calculate_score` with third-tier surplus scoring
3. `simulation/sweep_v2.py` -- v2 sweep runner with exploration logic
4. Updated `simulation/README.md` -- add v2 sweep section
5. Run `sweep_v2.py` to completion (phase 1 + phase 2 if applicable)
6. If a 6/6 config is found: run `simulator.py` with that config and save heatmaps
7. Report: top 10 structured configs, any exploration results, and recommendation
8. Commit all deliverables and output to the feature branch. Do not push.

### Decision authority

The agent has authority to:
- Choose which exploratory configs to test (within the constraints of section 5)
- Adjust the N7 jitter increment within the range 0.10-0.50
- Adjust surplus scoring tier values within +/-2 of the specified defaults
- Skip exploration if structured results are clearly sufficient or clearly hopeless

The agent does NOT have authority to:
- Modify event pool data or trait count
- Change validation criteria targets
- Expand the structured sweep grid beyond 33 configs
- Push to origin or merge branches
