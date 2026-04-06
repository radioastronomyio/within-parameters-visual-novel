import csv
import os
import statistics
import time
from dataclasses import replace
from itertools import product
from multiprocessing import Pool, cpu_count
from random import Random

from game_data import (
    Config,
    DEFAULT_CONFIG,
    POSITIVE_TRAITS,
    NEGATIVE_TRAITS,
)
from simulator import run_game

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")

KNOWLEDGE_THRESHOLDS = [8, 10, 12, 13, 14, 16]
KNOWLEDGE_REWARD_TOTALS = [0, 1, 2]
CLOCK_BASE_TICKS = [1, 2]

EXCLUSIONS = {
    (8, 2, 1),
    (16, 0, 1),
    (16, 0, 2),
}

ITERATIONS_PER_COMBO = 10000
BASE_SEED = 42


def reward_total_to_bonus(total: int) -> int:
    return total - 2


def build_variants() -> list[tuple[str, dict]]:
    variants = []
    for kt, kr_total, ct in product(
        KNOWLEDGE_THRESHOLDS, KNOWLEDGE_REWARD_TOTALS, CLOCK_BASE_TICKS
    ):
        if (kt, kr_total, ct) in EXCLUSIONS:
            continue
        label = f"kt{kt}_kr{kr_total}_ct{ct}"
        cfg = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr_total),
            clock_base_tick=ct,
        )
        variants.append(
            (
                label,
                {
                    "knowledge_threshold": cfg.knowledge_threshold,
                    "knowledge_reward_bonus": cfg.knowledge_reward_bonus,
                    "clock_base_tick": cfg.clock_base_tick,
                },
            )
        )
    return variants


def build_exploratory_variant(label: str, config: Config) -> tuple[str, dict]:
    return (
        label,
        {
            "knowledge_threshold": config.knowledge_threshold,
            "knowledge_reward_bonus": config.knowledge_reward_bonus,
            "clock_base_tick": config.clock_base_tick,
            "starting_modules": config.starting_modules,
            "clock_jitter_chance": config.clock_jitter_chance,
            "per_module_remaining_surplus": config.per_module_remaining_surplus,
            "per_module_remaining_surplus_2": config.per_module_remaining_surplus_2,
            "per_knowledge_over_threshold_surplus": config.per_knowledge_over_threshold_surplus,
            "per_knowledge_over_threshold_surplus_2": config.per_knowledge_over_threshold_surplus_2,
            "per_community_helped": config.per_community_helped,
            "per_rapport_point": config.per_rapport_point,
            "ending_correction": config.ending_correction,
        },
    )


def _reconstruct_config(params: dict) -> Config:
    return replace(DEFAULT_CONFIG, **params)


def _run_variant_worker(args: tuple[str, dict]) -> dict:
    label, params = args
    config = _reconstruct_config(params)

    combo_corr_rates = []
    n7_clock_failure_rates = []
    p6_corr_rates = []
    total_correction = 0
    total_destruction = 0
    total_clock_failure = 0
    total_runs = 0
    score_sum = 0
    corr_score_sum = 0
    corr_count_for_stier = 0
    s_tier_count = 0
    module_crunch_count = 0

    for pos_trait in POSITIVE_TRAITS:
        for neg_trait in NEGATIVE_TRAITS:
            combo_key = (pos_trait[0], neg_trait[0])
            base_seed = BASE_SEED + hash(combo_key) % (2**31)

            combo_correction = 0
            combo_destruction = 0
            combo_clock_failure = 0

            for i in range(ITERATIONS_PER_COMBO):
                rng = Random(base_seed + i)
                result = run_game(config, pos_trait, neg_trait, rng)
                total_runs += 1
                score_sum += result.raw_score

                if result.ending == "correction":
                    combo_correction += 1
                    total_correction += 1
                    corr_score_sum += result.raw_score
                    corr_count_for_stier += 1
                    if result.raw_score >= 90:
                        s_tier_count += 1
                elif result.ending == "destruction":
                    combo_destruction += 1
                    total_destruction += 1
                else:
                    combo_clock_failure += 1
                    total_clock_failure += 1

                if result.modules_remaining == 0:
                    module_crunch_count += 1

            combo_corr_rate = combo_correction / ITERATIONS_PER_COMBO
            combo_corr_rates.append(combo_corr_rate)

            if neg_trait[0] == "N7":
                n7_cf_rate = combo_clock_failure / ITERATIONS_PER_COMBO
                n7_clock_failure_rates.append(n7_cf_rate)

            if pos_trait[0] == "P6":
                p6_corr_rates.append(combo_corr_rate)

    mean_combo_corr = statistics.mean(combo_corr_rates)
    std_combo_corr = (
        statistics.stdev(combo_corr_rates) if len(combo_corr_rates) > 1 else 0
    )
    min_combo_corr = min(combo_corr_rates)
    max_combo_corr = max(combo_corr_rates)

    correction_pct = total_correction / total_runs
    destruction_pct = total_destruction / total_runs
    clock_failure_pct = total_clock_failure / total_runs

    avg_score = score_sum / total_runs
    avg_corr_score = (
        corr_score_sum / corr_count_for_stier if corr_count_for_stier > 0 else 0
    )

    module_crunch_pct = module_crunch_count / total_runs
    s_tier_pct = s_tier_count / corr_count_for_stier if corr_count_for_stier > 0 else 0
    max_n7_cf = max(n7_clock_failure_rates) if n7_clock_failure_rates else 0

    p6_spread = (min(p6_corr_rates), max(p6_corr_rates)) if p6_corr_rates else (0, 0)
    n7_spread = (
        (min(n7_clock_failure_rates), max(n7_clock_failure_rates))
        if n7_clock_failure_rates
        else (0, 0)
    )

    v1_pass = min_combo_corr > 0
    v2_pass = max_combo_corr <= 0.90
    v3_pass = 0.30 <= mean_combo_corr <= 0.55
    v4_pass = max_n7_cf < 0.60
    v5_pass = 0.10 <= std_combo_corr <= 0.25
    v6_pass = 0.10 <= s_tier_pct <= 0.20

    criteria_passed = sum([v1_pass, v2_pass, v3_pass, v4_pass, v5_pass, v6_pass])

    return {
        "label": label,
        "knowledge_threshold": config.knowledge_threshold,
        "knowledge_reward_total": 2 + config.knowledge_reward_bonus,
        "clock_base_tick": config.clock_base_tick,
        "criteria_passed": criteria_passed,
        "correction_pct": correction_pct,
        "destruction_pct": destruction_pct,
        "clock_failure_pct": clock_failure_pct,
        "mean_combo_corr": mean_combo_corr,
        "std_combo_corr": std_combo_corr,
        "min_combo_corr": min_combo_corr,
        "max_combo_corr": max_combo_corr,
        "avg_score": avg_score,
        "avg_corr_score": avg_corr_score,
        "module_crunch_pct": module_crunch_pct,
        "s_tier_pct": s_tier_pct,
        "max_n7_cf": max_n7_cf,
        "v1_no_zero_corr": v1_pass,
        "v2_no_above_90": v2_pass,
        "v3_mean_30_55": v3_pass,
        "v4_n7_below_60": v4_pass,
        "v5_std_10_25": v5_pass,
        "v6_s_tier_10_20": v6_pass,
        "p6_spread_min": p6_spread[0],
        "p6_spread_max": p6_spread[1],
        "n7_spread_min": n7_spread[0],
        "n7_spread_max": n7_spread[1],
    }


def write_csv(rows: list[dict], filename: str = "sweep_v2_results.csv"):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    columns = [
        "label",
        "knowledge_threshold",
        "knowledge_reward_total",
        "clock_base_tick",
        "criteria_passed",
        "correction_pct",
        "destruction_pct",
        "clock_failure_pct",
        "mean_combo_corr",
        "std_combo_corr",
        "min_combo_corr",
        "max_combo_corr",
        "avg_score",
        "avg_corr_score",
        "module_crunch_pct",
        "s_tier_pct",
        "max_n7_cf",
        "v1_no_zero_corr",
        "v2_no_above_90",
        "v3_mean_30_55",
        "v4_n7_below_60",
        "v5_std_10_25",
        "v6_s_tier_10_20",
        "p6_spread_min",
        "p6_spread_max",
        "n7_spread_min",
        "n7_spread_max",
    ]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            out = {}
            for col in columns:
                val = row[col]
                if isinstance(val, bool):
                    out[col] = "PASS" if val else "FAIL"
                elif isinstance(val, float):
                    out[col] = f"{val:.4f}"
                else:
                    out[col] = val
            writer.writerow(out)
    print(f"\n  Saved {filepath}")


def print_top10(rows: list[dict]):
    print("\n" + "=" * 90)
    print("TOP 10 CONFIGS")
    print("-" * 90)
    fmt = "{:<20s} {:>3s} {:>3s} {:>3s} {:>6s} {:>8s} {:>8s} {:>8s} {:>8s}"
    print(
        fmt.format(
            "label", "kt", "kr", "ct", "pass", "corr%", "destr%", "clock%", "stier%"
        )
    )
    print("-" * 90)
    for r in rows[:10]:
        print(
            fmt.format(
                r["label"],
                str(r["knowledge_threshold"]),
                str(r["knowledge_reward_total"]),
                str(r["clock_base_tick"]),
                str(r["criteria_passed"]),
                f"{r['correction_pct'] * 100:.1f}",
                f"{r['destruction_pct'] * 100:.1f}",
                f"{r['clock_failure_pct'] * 100:.1f}",
                f"{r['s_tier_pct'] * 100:.1f}",
            )
        )


def print_validation_table(r: dict):
    print(f"\n  Config: {r['label']}")
    print(f"  {'#':<4} {'Criterion':<35} {'Target':<20} {'Actual':<12} {'Status'}")
    print(f"  {'-' * 80}")
    entries = [
        (
            "V1",
            "No 0% correction combos",
            "Min > 0%",
            r["min_combo_corr"],
            r["v1_no_zero_corr"],
        ),
        (
            "V2",
            "No combo above 90% correction",
            "Max ≤ 90%",
            r["max_combo_corr"],
            r["v2_no_above_90"],
        ),
        (
            "V3",
            "Mean correction rate",
            "30-55%",
            r["mean_combo_corr"],
            r["v3_mean_30_55"],
        ),
        (
            "V4",
            "N7 max clock failure rate",
            "< 60%",
            r["max_n7_cf"],
            r["v4_n7_below_60"],
        ),
        (
            "V5",
            "Correction rate std dev",
            "10-25%",
            r["std_combo_corr"],
            r["v5_std_10_25"],
        ),
        (
            "V6",
            "S-tier in correction runs",
            "10-20%",
            r["s_tier_pct"],
            r["v6_s_tier_10_20"],
        ),
    ]
    for num, name, target, actual, passed in entries:
        status = "PASS" if passed else "FAIL"
        actual_str = f"{actual:.1%}" if isinstance(actual, float) else str(actual)
        print(f"  {num:<4} {name:<35} {target:<20} {actual_str:<12} {status}")

    print(
        f"\n  P6 combo spread: {r['p6_spread_min']:.1%} - {r['p6_spread_max']:.1%} correction"
    )
    print(
        f"  N7 combo spread: {r['n7_spread_min']:.1%} - {r['n7_spread_max']:.1%} clock failure"
    )


def run_phase2_exploration(results: list[dict]) -> list[dict]:
    best = results[0]
    if best["criteria_passed"] < 5:
        print(
            f"\n  Best structured config is {best['criteria_passed']}/6. Skipping exploration (need ≥5/6)."
        )
        return []

    print(f"\n{'=' * 90}")
    print("PHASE 2: AGENT-DIRECTED EXPLORATION")
    print(f"{'=' * 90}")
    print(f"  Base config: {best['label']} ({best['criteria_passed']}/6)")

    fails = []
    if not best["v1_no_zero_corr"]:
        fails.append("V1")
    if not best["v2_no_above_90"]:
        fails.append("V2")
    if not best["v3_mean_30_55"]:
        fails.append("V3")
    if not best["v4_n7_below_60"]:
        fails.append("V4")
    if not best["v5_std_10_25"]:
        fails.append("V5")
    if not best["v6_s_tier_10_20"]:
        fails.append("V6")
    print(f"  Failing: {', '.join(fails)}")

    exploratory = []
    failing_criterion = fails[0] if fails else None

    if failing_criterion == "V6":
        s_tier_actual = best["s_tier_pct"]
        print(f"\n  V6 fails: S-tier rate is {s_tier_actual:.1%}, need 10-20%.")
        print(
            "  Rationale: Increasing surplus scoring to push more correction runs above 90."
        )

        kt = best["knowledge_threshold"]
        kr = best["knowledge_reward_total"]
        ct = best["clock_base_tick"]

        base_config = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
            per_module_remaining_surplus=4,
            per_knowledge_over_threshold_surplus=3,
        )
        exploratory.append(
            build_exploratory_variant(f"exp_{best['label']}_surplus_up", base_config)
        )

        base_config2 = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
            per_module_remaining_surplus=4,
            per_module_remaining_surplus_2=2,
            per_knowledge_over_threshold_surplus=3,
            per_knowledge_over_threshold_surplus_2=2,
        )
        exploratory.append(
            build_exploratory_variant(f"exp_{best['label']}_surplus_up_2", base_config2)
        )

        base_config3 = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
            per_community_helped=10,
            per_rapport_point=6,
        )
        exploratory.append(
            build_exploratory_variant(f"exp_{best['label']}_community_up", base_config3)
        )

        base_config4 = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
            ending_correction=45,
            per_module_remaining_surplus=4,
            per_knowledge_over_threshold_surplus=3,
        )
        exploratory.append(
            build_exploratory_variant(
                f"exp_{best['label']}_base45_surplus_up", base_config4
            )
        )

        base_config5 = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
            ending_correction=48,
            per_module_remaining_surplus=5,
            per_module_remaining_surplus_2=2,
            per_knowledge_over_threshold_surplus=3,
            per_knowledge_over_threshold_surplus_2=2,
        )
        exploratory.append(
            build_exploratory_variant(
                f"exp_{best['label']}_base48_tier3x", base_config5
            )
        )

    elif failing_criterion == "V2":
        print(
            f"\n  V2 fails: max correction is {best['max_combo_corr']:.1%}, need ≤90%."
        )
        print("  Root cause: P2 Quick Study pushes some combos above 90% at ct=1.")
        print(
            "  Rationale: Raising threshold or adjusting starting resources to cap P2 without tanking V3."
        )
        kt = best["knowledge_threshold"]
        kr = best["knowledge_reward_total"]
        ct = best["clock_base_tick"]

        base_config = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=kt + 1,
            knowledge_reward_bonus=reward_total_to_bonus(kr),
            clock_base_tick=ct,
        )
        exploratory.append(
            build_exploratory_variant(f"exp_{best['label']}_kt+1", base_config)
        )

        winning_config = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=11,
            knowledge_reward_bonus=-2,
            clock_base_tick=1,
            starting_modules=6,
            clock_jitter_chance=0.3,
        )
        exploratory.append(
            build_exploratory_variant("exp_kt11_kr0_ct1_mod6_j03", winning_config)
        )

        near_miss = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=11,
            knowledge_reward_bonus=-2,
            clock_base_tick=1,
            starting_modules=6,
        )
        exploratory.append(
            build_exploratory_variant("exp_kt11_kr0_ct1_mod6", near_miss)
        )

        jitter_up = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=11,
            knowledge_reward_bonus=-2,
            clock_base_tick=1,
            starting_modules=6,
            clock_jitter_chance=0.35,
        )
        exploratory.append(
            build_exploratory_variant("exp_kt11_kr0_ct1_mod6_j035", jitter_up)
        )

        jitter_down = replace(
            DEFAULT_CONFIG,
            knowledge_threshold=11,
            knowledge_reward_bonus=-2,
            clock_base_tick=1,
            starting_modules=6,
            clock_jitter_chance=0.25,
        )
        exploratory.append(
            build_exploratory_variant("exp_kt11_kr0_ct1_mod6_j025", jitter_down)
        )

    elif failing_criterion == "V3":
        mean_actual = best["mean_combo_corr"]
        print(f"\n  V3 fails: mean correction is {mean_actual:.1%}, need 30-55%.")
        print("  Rationale: Interpolating between configs bracketing the target.")

        lower = None
        upper = None
        for r in results:
            m = r["mean_combo_corr"]
            if m < 0.425 and (lower is None or m > lower["mean_combo_corr"]):
                lower = r
            if (
                m >= 0.425
                and m <= 0.55
                and (upper is None or m < upper["mean_combo_corr"])
            ):
                upper = r
        if lower:
            print(
                f"  Nearest below target: {lower['label']} at {lower['mean_combo_corr']:.1%}"
            )
        if upper:
            print(
                f"  Nearest above target: {upper['label']} at {upper['mean_combo_corr']:.1%}"
            )

    elif failing_criterion == "V4":
        print(
            f"\n  V4 fails: N7 max clock failure is {best['max_n7_cf']:.1%}, need <60%."
        )
        print("  Rationale: Testing lower N7 jitter increment.")

    if not exploratory:
        print("  No targeted exploratory configs generated. Stopping.")
        return []

    exploratory = exploratory[:10]
    print(f"\n  Running {len(exploratory)} exploratory configs...")
    start = time.time()

    with Pool(processes=min(cpu_count(), len(exploratory))) as pool:
        exp_results = pool.map(_run_variant_worker, exploratory)

    elapsed = time.time() - start
    print(f"  Exploration elapsed: {elapsed:.1f}s ({elapsed / 60:.1f} min)")

    for r in exp_results:
        marker = " <<<" if r["criteria_passed"] >= 5 else ""
        print(
            f"  {r['label']} | "
            f"corr={r['correction_pct'] * 100:.1f}% "
            f"destr={r['destruction_pct'] * 100:.1f}% "
            f"clock={r['clock_failure_pct'] * 100:.1f}% | "
            f"pass={r['criteria_passed']}/6{marker}"
        )

    return exp_results


def main():
    print("Within Parameters — Balance Parameter Sweep v2")
    print("=" * 90)
    print("Structural fixes applied: scoring tiers, P6 -1, N7 +0.25 jitter")
    print()

    variants = build_variants()
    print(
        f"Phase 1: {len(variants)} structured variants × 64 combos × {ITERATIONS_PER_COMBO} iterations"
    )
    print(f"Parallel workers: {min(cpu_count(), len(variants))}")
    print()

    start_time = time.time()

    with Pool(processes=min(cpu_count(), len(variants))) as pool:
        results = pool.map(_run_variant_worker, variants)

    for idx, row in enumerate(results, 1):
        marker = " <<<" if row["criteria_passed"] >= 5 else ""
        print(
            f"[{idx}/{len(variants)}] {row['label']} | "
            f"corr={row['correction_pct'] * 100:.1f}% "
            f"destr={row['destruction_pct'] * 100:.1f}% "
            f"clock={row['clock_failure_pct'] * 100:.1f}% | "
            f"pass={row['criteria_passed']}/6{marker}"
        )

    phase1_elapsed = time.time() - start_time
    print(f"\nPhase 1 elapsed: {phase1_elapsed:.1f}s ({phase1_elapsed / 60:.1f} min)")

    results.sort(
        key=lambda r: (-r["criteria_passed"], abs(r["mean_combo_corr"] - 0.425))
    )

    best_pass = results[0]["criteria_passed"]

    if best_pass == 6:
        print(f"\n*** CONFIG PASSES ALL 6 CRITERIA: {results[0]['label']} ***")
    elif best_pass >= 5:
        print(f"\nBest is {best_pass}/6. Launching Phase 2 exploration...")
    else:
        print(f"\nBest is {best_pass}/6. Phase 2 exploration not applicable.")

    all_results = list(results)

    if 5 <= best_pass < 6:
        exp_results = run_phase2_exploration(results)
        all_results.extend(exp_results)
        all_results.sort(
            key=lambda r: (-r["criteria_passed"], abs(r["mean_combo_corr"] - 0.425))
        )

    write_csv(all_results)
    print_top10(all_results)

    print("\n" + "=" * 90)
    print("TOP 3 FULL VALIDATION DETAIL")
    print("=" * 90)
    for r in all_results[:3]:
        print_validation_table(r)

    print("\n" + "=" * 90)
    passing_all = [r for r in all_results if r["criteria_passed"] == 6]
    if passing_all:
        print(f"\n{len(passing_all)} config(s) pass all 6 validation criteria!")
        for p in passing_all:
            print(
                f"  {p['label']}: corr={p['correction_pct'] * 100:.1f}% s_tier={p['s_tier_pct'] * 100:.1f}%"
            )
    elif best_pass >= 5:
        print(
            f"\nBest after exploration: {all_results[0]['criteria_passed']}/6 ({all_results[0]['label']})"
        )
        fails = []
        r = all_results[0]
        if not r["v1_no_zero_corr"]:
            fails.append("V1")
        if not r["v2_no_above_90"]:
            fails.append("V2")
        if not r["v3_mean_30_55"]:
            fails.append("V3")
        if not r["v4_n7_below_60"]:
            fails.append("V4")
        if not r["v5_std_10_25"]:
            fails.append("V5")
        if not r["v6_s_tier_10_20"]:
            fails.append("V6")
        print(f"  Still failing: {', '.join(fails)}")
    else:
        print(
            f"\nZero configs pass 5+ criteria. Best: {best_pass}/6 ({sum(1 for r in results if r['criteria_passed'] == best_pass)} config(s))."
        )
        failure_modes = []
        for r in all_results[:3]:
            fails = []
            if not r["v1_no_zero_corr"]:
                fails.append("V1")
            if not r["v2_no_above_90"]:
                fails.append("V2")
            if not r["v3_mean_30_55"]:
                fails.append("V3")
            if not r["v4_n7_below_60"]:
                fails.append("V4")
            if not r["v5_std_10_25"]:
                fails.append("V5")
            if not r["v6_s_tier_10_20"]:
                fails.append("V6")
            failure_modes.append(f"  {r['label']}: fails {', '.join(fails)}")
        print("Failure modes for top configs:")
        for fm in failure_modes:
            print(fm)

    total_elapsed = time.time() - start_time
    print(f"\nTotal elapsed: {total_elapsed:.1f}s ({total_elapsed / 60:.1f} min)")
    print("=" * 90)


if __name__ == "__main__":
    main()
