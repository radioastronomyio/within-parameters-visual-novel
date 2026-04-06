#!/usr/bin/env python3
"""
Script Name  : simulator.py
Description  : Monte Carlo balance simulator for the 64-cell trait matrix in Within Parameters
Repository   : within-parameters-visual-novel
Author       : VintageDon (https://github.com/vintagedon/)
Created      : 2026-04-01
Link         : https://github.com/radioastronomyio/within-parameters-visual-novel

Description
-----------
Runs 10,000 randomized iterations per trait combination (64 combos, 640,000 total runs)
using a priority-weighted heuristic agent. Outputs PNG heatmaps and a CSV to
simulation/output/. Also prints a balance report with top/bottom combos, anomalies,
and validation criteria pass/fail to stdout.

Usage
-----
    python simulator.py

Examples
--------
    python simulator.py
        Runs full 640,000 iteration suite and saves all output to simulation/output/
"""

# =============================================================================
# Imports
# =============================================================================
import csv
import math
import os
import statistics
from dataclasses import dataclass, field
from random import Random
from typing import Optional

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from game_data import (
    Config,
    DEFAULT_CONFIG,
    Event,
    EventChoice,
    POSITIVE_TRAITS,
    NEGATIVE_TRAITS,
    COMMUNITY_POOL,
    TRANSIT_POOL,
    APPROACH_POOL,
    TraitDef,
)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")


# =============================================================================
# Data Structures
# =============================================================================
@dataclass
class GameState:
    """
    Mutable run state for one simulated playthrough. Unlike the TypeScript engine
    (which uses immutable state), the simulator mutates state in place for performance.
    rapport is derived via property — never stored directly.
    """
    knowledge: int
    modules: int
    clock: int
    starting_rapport: int = 0
    communities_helped: int = 0
    communities_harmed: int = 0
    communities_ignored: int = 0
    events_drawn: list[str] = field(default_factory=list)
    stop: int = 0
    alive: bool = True
    docs_read: int = 0

    @property
    def rapport(self) -> int:
        return self.starting_rapport + self.communities_helped - self.communities_harmed


@dataclass
class RunResult:
    """Outcome of a single completed run, captured for statistical analysis."""
    ending: str
    raw_score: int
    modules_remaining: int
    knowledge_final: int
    rapport_final: int
    clock_final: int
    communities_helped: int
    communities_harmed: int


@dataclass
class ComboAnalysis:
    """Aggregated statistics for one trait combination across all iterations."""
    correction_rate: float
    destruction_rate: float
    clock_failure_rate: float
    avg_raw_score: float
    median_raw_score: float
    avg_final_clock: float
    avg_final_modules: float
    avg_final_knowledge: float


# =============================================================================
# Choice and Reward Logic
# =============================================================================
def calc_effective_module_cost(
    choice: EventChoice,
    config: Config,
    event_category: str,
    practiced_available: bool,
) -> int:
    """
    Computes the actual module cost of a choice after applying trait modifiers.
    Rough Touch adds 1 to community event costs. Practiced reduces cost by 1
    (once per stop). Returns 0 for choices that grant modules.
    """
    if choice.module_change >= 0:
        return 0
    cost = abs(choice.module_change)
    if config.rough_touch and event_category == "community" and cost > 0:
        cost += 1
    if config.practiced and practiced_available and cost > 0:
        cost = max(0, cost - 1)
        practiced_available = False
    return cost


def calc_clock_reduction(state: GameState, config: Config) -> int:
    """
    Computes available clock reduction for the reward cycle.
    Scales with rapport but is capped at config.clock_reduction_max (2 segments).
    Narrow Focus reduces by 1, minimum 0.
    """
    raw = config.clock_reduction_base + int(state.rapport * config.rapport_clock_scale)
    reduction = min(raw, config.clock_reduction_max)
    if config.narrow_focus:
        reduction = max(0, reduction - 1)
    return reduction


# =============================================================================
# Heuristic Agent
# =============================================================================
def agent_select_choice(
    state: GameState,
    event: Event,
    config: Config,
    practiced_available: bool,
) -> tuple[EventChoice, bool]:
    """
    Priority-weighted heuristic agent for choice selection. Priority order:
    1. Knowledge-gated choices (high information value)
    2. Community help choices (when clock pressure is low, i.e. clock < 7)
    3. Lowest effective module cost (resource conservation fallback)
    Stubborn trait overrides: always picks the highest-cost community choice available.
    """
    available: list[tuple[EventChoice, bool]] = []
    practiced_left = practiced_available
    for choice in event.choices:
        if choice.knowledge_gate > 0 and state.knowledge < choice.knowledge_gate:
            continue
        if choice.rapport_gate > 0 and state.rapport < choice.rapport_gate:
            continue
        eff_cost = calc_effective_module_cost(
            choice, config, event.category, practiced_left
        )
        if eff_cost > state.modules:
            continue
        entry_practiced = practiced_left
        if config.practiced and practiced_left and choice.module_change < 0:
            practiced_left = False
        available.append((choice, entry_practiced))
        practiced_left = practiced_available

    if not available:
        fallback = event.choices[0]
        return fallback, practiced_available

    if config.stubborn and event.category == "community":
        affordable = [(c, p) for c, p in available if c.module_change <= 0]
        if affordable:
            selected = max(affordable, key=lambda x: abs(x[0].module_change))
            return selected
        selected = min(available, key=lambda x: abs(x[0].module_change))
        return selected

    gated = [(c, p) for c, p in available if c.knowledge_gate > 0]
    if gated:
        return gated[0]

    if state.clock < 7:
        helped = [(c, p) for c, p in available if c.community_effect == "helped"]
        if helped:
            return helped[0]

    selected = min(
        available,
        key=lambda x: calc_effective_module_cost(x[0], config, event.category, x[1]),
    )
    return selected


def agent_select_reward(state: GameState, config: Config) -> str:
    """
    Selects the reward type for the current stop. Priority:
    1. Clock reduction if projected tick would bring clock near max
    2. Consumables if below fix-cost threshold
    3. Knowledge if late journey and below knowledge threshold
    4. Clock reduction again if stop 4+ and clock is high
    5. Knowledge (default — optimal for correction ending)
    """
    expected_tick = (
        config.clock_base_tick + config.clock_jitter_chance * config.clock_jitter_amount
    )
    if state.clock + expected_tick >= config.clock_max - 1:
        return "clock_reduction"
    if state.modules < config.fix_cost:
        return "consumable"
    if state.stop >= 3 and state.knowledge < config.knowledge_threshold:
        return "knowledge"
    if state.stop >= 4 and state.clock >= 6:
        return "clock_reduction"
    return "knowledge"


# =============================================================================
# State Mutation
# =============================================================================
def apply_choice(
    state: GameState,
    choice: EventChoice,
    config: Config,
    event_category: str,
    practiced_available: bool,
) -> bool:
    """
    Applies a choice's effects to mutable GameState. Returns True if the
    Practiced trait discount was consumed this stop (caller tracks this).
    """
    # AI NOTE: Light Foot suppresses transit clock_change > 0. Tunnel Nerves
    # adds +1 to all approach clock changes. Both apply to clock_change in-place.
    used_practiced = False
    if choice.module_change >= 0:
        state.modules += choice.module_change
    else:
        cost = calc_effective_module_cost(
            choice, config, event_category, practiced_available
        )
        if config.practiced and practiced_available:
            used_practiced = True
        state.modules -= cost
    state.knowledge += choice.knowledge_change

    clock_adj = choice.clock_change
    if config.light_foot and event_category == "transit" and clock_adj > 0:
        clock_adj = 0
    if config.tunnel_nerves and event_category == "approach":
        clock_adj += 1
    state.clock = max(0, state.clock + clock_adj)

    if choice.community_effect == "helped":
        state.communities_helped += 1
    elif choice.community_effect == "harmed":
        state.communities_harmed += 1
    elif choice.community_effect == "ignored":
        state.communities_ignored += 1

    used_practiced = (
        config.practiced and practiced_available and choice.module_change < 0
    )
    return used_practiced


def apply_found_document(state: GameState, config: Config):
    state.docs_read += 1
    if not config.distracted:
        state.knowledge += 1


def apply_reward(state: GameState, reward_type: str, config: Config):
    if reward_type == "consumable":
        state.modules += 2 + config.consumable_reward_bonus
    elif reward_type == "knowledge":
        state.knowledge += 2 + config.knowledge_reward_bonus
    elif reward_type == "clock_reduction":
        reduction = calc_clock_reduction(state, config)
        state.clock = max(0, state.clock - reduction)


def apply_clock_tick(state: GameState, config: Config, rng: Random):
    tick = config.clock_base_tick
    if rng.random() < config.clock_jitter_chance:
        tick += config.clock_jitter_amount
    state.clock += tick


def calculate_score(state: GameState, config: Config, ending: str) -> int:
    if ending == "correction":
        base = config.ending_correction
        mods_remaining = max(0, state.modules - config.fix_cost)
    elif ending == "destruction":
        base = config.ending_destruction
        mods_remaining = max(0, state.modules)
    else:
        base = config.ending_clock_failure
        mods_remaining = max(0, state.modules)

    score = base

    score += state.communities_helped * config.per_community_helped

    effective_rapport = max(0, state.rapport)
    score += effective_rapport * config.per_rapport_point

    if mods_remaining >= 1:
        score += config.per_module_remaining
    if mods_remaining >= 2:
        score += config.per_module_remaining_surplus
    if mods_remaining >= 3:
        score += (mods_remaining - 2) * config.per_module_remaining_surplus_2

    knowledge_over = max(0, state.knowledge - config.knowledge_threshold)
    if knowledge_over >= 1:
        score += config.per_knowledge_over_threshold
    if knowledge_over >= 2:
        score += config.per_knowledge_over_threshold_surplus
    if knowledge_over >= 3:
        score += (knowledge_over - 2) * config.per_knowledge_over_threshold_surplus_2

    clock_remaining = max(0, config.clock_max - state.clock)
    for seg in range(min(clock_remaining, 10)):
        if seg < 3:
            score += config.per_clock_segment_remaining
        elif seg == 3:
            score += 1

    return min(score, config.max_raw_score)


def determine_ending(state: GameState, config: Config) -> RunResult:
    if not state.alive:
        ending = "clock_failure"
    elif (
        state.knowledge >= config.knowledge_threshold
        and state.modules >= config.fix_cost
    ):
        ending = "correction"
    else:
        ending = "destruction"

    raw_score = calculate_score(state, config, ending)
    return RunResult(
        ending=ending,
        raw_score=raw_score,
        modules_remaining=state.modules,
        knowledge_final=state.knowledge,
        rapport_final=state.rapport,
        clock_final=state.clock,
        communities_helped=state.communities_helped,
        communities_harmed=state.communities_harmed,
    )


# =============================================================================
# Monte Carlo Runner
# =============================================================================
def run_game(
    config: Config,
    pos_trait: TraitDef,
    neg_trait: TraitDef,
    rng: Random,
) -> RunResult:
    """
    Simulates one complete run for a given trait combination. Applies trait modifiers
    to produce an effective config, draws the event pool, and runs all 5 stops.
    Each stop uses a fresh practiced_available flag — Practiced resets each stop.
    """
    # AI NOTE: Trait application order is pos then neg: neg_trait[3](pos_trait[3](config)).
    effective_config = neg_trait[3](pos_trait[3](config))

    state = GameState(
        knowledge=effective_config.starting_knowledge,
        modules=effective_config.starting_modules,
        clock=0,
        starting_rapport=effective_config.starting_rapport,
    )

    community_events = rng.sample(COMMUNITY_POOL, 2)
    transit_events = rng.sample(TRANSIT_POOL, 2)
    approach_events = rng.sample(APPROACH_POOL, 1)
    drawn = community_events + transit_events + approach_events
    state.events_drawn = [e.id for e in drawn]

    for stop_index, event in enumerate(drawn):
        state.stop = stop_index + 1
        practiced_available = True

        choice, practiced_flag = agent_select_choice(
            state, event, effective_config, practiced_available
        )
        used_practiced = apply_choice(
            state, choice, effective_config, event.category, practiced_available
        )
        if used_practiced:
            practiced_available = False

        if event.has_found_document:
            apply_found_document(state, effective_config)

        reward = agent_select_reward(state, effective_config)
        apply_reward(state, reward, effective_config)

        apply_clock_tick(state, effective_config, rng)

        if state.clock >= effective_config.clock_max:
            state.alive = False
            break

    return determine_ending(state, effective_config)


def analyze_combo(results: list[RunResult]) -> ComboAnalysis:
    total = len(results)
    correction = sum(1 for r in results if r.ending == "correction")
    destruction = sum(1 for r in results if r.ending == "destruction")
    clock_fail = sum(1 for r in results if r.ending == "clock_failure")
    scores = [r.raw_score for r in results]

    return ComboAnalysis(
        correction_rate=correction / total,
        destruction_rate=destruction / total,
        clock_failure_rate=clock_fail / total,
        avg_raw_score=statistics.mean(scores),
        median_raw_score=statistics.median(scores),
        avg_final_clock=statistics.mean([r.clock_final for r in results]),
        avg_final_modules=statistics.mean([r.modules_remaining for r in results]),
        avg_final_knowledge=statistics.mean([r.knowledge_final for r in results]),
    )


def run_monte_carlo(iterations_per_combo: int = 10000, seed: int = 42):
    results: dict[tuple[str, str], ComboAnalysis] = {}
    total_combos = len(POSITIVE_TRAITS) * len(NEGATIVE_TRAITS)
    done = 0

    for pos_trait in POSITIVE_TRAITS:
        for neg_trait in NEGATIVE_TRAITS:
            combo_key = (pos_trait[0], neg_trait[0])
            combo_results: list[RunResult] = []
            base_seed = seed + hash(combo_key) % (2**31)

            for i in range(iterations_per_combo):
                rng = Random(base_seed + i)
                result = run_game(DEFAULT_CONFIG, pos_trait, neg_trait, rng)
                combo_results.append(result)

            results[combo_key] = analyze_combo(combo_results)
            done += 1
            print(
                f"\r  [{done}/{total_combos}] {pos_trait[0]}+{neg_trait[0]} complete",
                end="",
                flush=True,
            )

    print()
    return results


# =============================================================================
# Output
# =============================================================================
def build_heatmap_data(results: dict[tuple[str, str], ComboAnalysis], field_name: str):
    pos_ids = [t[0] for t in POSITIVE_TRAITS]
    neg_ids = [t[0] for t in NEGATIVE_TRAITS]
    data = np.zeros((len(pos_ids), len(neg_ids)))

    for i, pid in enumerate(pos_ids):
        for j, nid in enumerate(neg_ids):
            val = getattr(results[(pid, nid)], field_name)
            data[i][j] = val

    return data, pos_ids, neg_ids


def plot_heatmap(
    data,
    pos_labels,
    neg_labels,
    title,
    filename,
    vmin=None,
    vmax=None,
    cmap="RdYlGn",
    fmt=".1f",
    annotate=True,
):
    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(data, cmap=cmap, vmin=vmin, vmax=vmax, aspect="auto")

    ax.set_xticks(range(len(neg_labels)))
    ax.set_yticks(range(len(pos_labels)))
    ax.set_xticklabels(neg_labels, fontsize=10)
    ax.set_yticklabels(pos_labels, fontsize=10)
    ax.set_xlabel("Negative Traits", fontsize=12)
    ax.set_ylabel("Positive Traits", fontsize=12)
    ax.set_title(title, fontsize=14, pad=15)

    if annotate:
        for i in range(len(pos_labels)):
            for j in range(len(neg_labels)):
                val = data[i, j]
                if fmt == ".1f":
                    text = f"{val:.1f}"
                elif fmt == ".0f":
                    text = f"{val:.0f}"
                else:
                    text = f"{val:{fmt}}"
                color = (
                    "white"
                    if val < (vmin or 0) + 0.3 * ((vmax or 1) - (vmin or 0))
                    else "black"
                )
                ax.text(j, i, text, ha="center", va="center", color=color, fontsize=9)

    plt.colorbar(im, ax=ax, shrink=0.8)
    plt.tight_layout()
    filepath = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(filepath, dpi=150)
    plt.close(fig)
    print(f"  Saved {filepath}")


def output_heatmaps(results: dict[tuple[str, str], ComboAnalysis]):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    corr_data, pos_ids, neg_ids = build_heatmap_data(results, "correction_rate")
    plot_heatmap(
        corr_data * 100,
        pos_ids,
        neg_ids,
        "Correction Ending Rate (%)",
        "correction_rate_heatmap.png",
        vmin=0,
        vmax=100,
        cmap="RdYlGn",
        fmt=".1f",
    )

    score_data, pos_ids, neg_ids = build_heatmap_data(results, "avg_raw_score")
    plot_heatmap(
        score_data,
        pos_ids,
        neg_ids,
        "Average Raw Score",
        "avg_score_heatmap.png",
        vmin=0,
        vmax=100,
        cmap="YlGnBu",
        fmt=".1f",
    )

    clock_data, pos_ids, neg_ids = build_heatmap_data(results, "clock_failure_rate")
    plot_heatmap(
        clock_data * 100,
        pos_ids,
        neg_ids,
        "Clock Failure Rate (%)",
        "clock_failure_rate_heatmap.png",
        vmin=0,
        vmax=100,
        cmap="YlOrRd",
        fmt=".1f",
    )


def output_csv(results: dict[tuple[str, str], ComboAnalysis]):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, "combo_results.csv")

    with open(filepath, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "positive_trait",
                "negative_trait",
                "correction_rate",
                "destruction_rate",
                "clock_failure_rate",
                "avg_raw_score",
                "median_raw_score",
                "avg_final_clock",
                "avg_final_modules",
                "avg_final_knowledge",
            ]
        )
        for pos in POSITIVE_TRAITS:
            for neg in NEGATIVE_TRAITS:
                key = (pos[0], neg[0])
                a = results[key]
                writer.writerow(
                    [
                        pos[0],
                        neg[0],
                        f"{a.correction_rate:.4f}",
                        f"{a.destruction_rate:.4f}",
                        f"{a.clock_failure_rate:.4f}",
                        f"{a.avg_raw_score:.2f}",
                        f"{a.median_raw_score:.1f}",
                        f"{a.avg_final_clock:.2f}",
                        f"{a.avg_final_modules:.2f}",
                        f"{a.avg_final_knowledge:.2f}",
                    ]
                )

    print(f"  Saved {filepath}")


def output_report(results: dict[tuple[str, str], ComboAnalysis]):
    combos = []
    for pos in POSITIVE_TRAITS:
        for neg in NEGATIVE_TRAITS:
            key = (pos[0], neg[0])
            a = results[key]
            combos.append((pos, neg, a))

    sorted_by_corr = sorted(combos, key=lambda x: x[2].correction_rate, reverse=True)

    print("\n=== TOP 5 EASIEST COMBINATIONS (highest correction rate) ===")
    for pos, neg, a in sorted_by_corr[:5]:
        print(
            f"  {pos[0]}+{neg[0]:3s} ({pos[1]:14s} + {neg[1]:12s}): {a.correction_rate:.1%} correction, avg score {a.avg_raw_score:.1f}"
        )

    print("\n=== TOP 5 HARDEST COMBINATIONS (lowest correction rate) ===")
    for pos, neg, a in sorted_by_corr[-5:]:
        print(
            f"  {pos[0]}+{neg[0]:3s} ({pos[1]:14s} + {neg[1]:12s}): {a.correction_rate:.1%} correction, avg score {a.avg_raw_score:.1f}"
        )

    print("\n=== BALANCE ANOMALIES ===")
    anomalies = []
    for pos, neg, a in combos:
        if a.correction_rate < 0.15:
            anomalies.append((pos, neg, a, "BELOW 15%"))
        elif a.correction_rate > 0.85:
            anomalies.append((pos, neg, a, "ABOVE 85%"))
    if anomalies:
        for pos, neg, a, flag in anomalies:
            print(
                f"  ** {pos[0]}+{neg[0]}: {a.correction_rate:.1%} correction — {flag}"
            )
    else:
        print("  None detected.")

    rates = [a.correction_rate for _, _, a in combos]
    print(f"\n=== OVERALL STATISTICS ===")
    print(f"  Mean correction rate:   {statistics.mean(rates):.1%}")
    print(f"  Std dev:                {statistics.stdev(rates):.1%}")
    print(f"  Min:                    {min(rates):.1%}")
    print(f"  Max:                    {max(rates):.1%}")

    print(f"\n=== N7 (Exhausted) CLOCK FAILURE CHECK ===")
    n7_combos = [(pos, neg, a) for pos, neg, a in combos if neg[0] == "N7"]
    for pos, neg, a in n7_combos:
        print(
            f"  {pos[0]}+N7 ({pos[1]:14s}): clock failure {a.clock_failure_rate:.1%}, correction {a.correction_rate:.1%}"
        )
    n7_avg_cf = statistics.mean([a.clock_failure_rate for _, _, a in n7_combos])
    print(f"  N7 average clock failure rate: {n7_avg_cf:.1%}")

    print(f"\n=== SCORING CASCADE CHECK (0 rerolls) ===")
    for pos, neg, a in combos:
        pass
    correction_combos = [
        (pos, neg, a) for pos, neg, a in combos if a.correction_rate > 0
    ]
    if correction_combos:
        s_tier_count = sum(1 for _, _, a in correction_combos if a.avg_raw_score >= 90)
        a_tier_count = sum(1 for _, _, a in correction_combos if a.avg_raw_score >= 75)
        b_tier_count = sum(1 for _, _, a in correction_combos if a.avg_raw_score >= 60)
        total = len(correction_combos)
        print(
            f"  S-tier achievable (avg >= 90): {s_tier_count}/{total} combos ({s_tier_count / total:.1%})"
        )
        print(
            f"  A-tier achievable (avg >= 75): {a_tier_count}/{total} combos ({a_tier_count / total:.1%})"
        )
        print(
            f"  B-tier achievable (avg >= 60): {b_tier_count}/{total} combos ({b_tier_count / total:.1%})"
        )

    print(f"\n=== VALIDATION SUMMARY ===")
    all_pass = True

    min_corr = min(rates)
    if min_corr > 0:
        print(f"  [PASS] No 0% correction combos (min: {min_corr:.1%})")
    else:
        print(f"  [FAIL] Found 0% correction combo(s)")
        all_pass = False

    max_corr = max(rates)
    if max_corr <= 0.90:
        print(f"  [PASS] No combo above 90% correction (max: {max_corr:.1%})")
    else:
        print(f"  [FAIL] Found combo above 90%: {max_corr:.1%}")
        all_pass = False

    mean_corr = statistics.mean(rates)
    if 0.30 <= mean_corr <= 0.55:
        print(f"  [PASS] Mean correction rate in 30-55% range: {mean_corr:.1%}")
    else:
        print(f"  [FAIL] Mean correction rate {mean_corr:.1%} outside 30-55% range")
        all_pass = False

    n7_cf = [a.clock_failure_rate for _, _, a in n7_combos]
    max_n7_cf = max(n7_cf) if n7_cf else 0
    if max_n7_cf < 0.60:
        print(f"  [PASS] N7 max clock failure rate below 60%: {max_n7_cf:.1%}")
    else:
        print(f"  [FAIL] N7 max clock failure rate {max_n7_cf:.1%} >= 60%")
        all_pass = False

    std_corr = statistics.stdev(rates)
    if 0.10 <= std_corr <= 0.25:
        print(f"  [PASS] Std dev in 10-25% range: {std_corr:.1%}")
    else:
        print(f"  [FAIL] Std dev {std_corr:.1%} outside 10-25% range")
        all_pass = False

    print()
    if all_pass:
        print("  ALL VALIDATION CRITERIA PASSED")
    else:
        print("  ONE OR MORE VALIDATION CRITERIA FAILED — see above for details")
    print("=" * 60)


def main():
    print("Within Parameters — Balance Simulator")
    print("=" * 60)
    print(
        f"Running 10,000 iterations per trait combination (64 combos, 640,000 total runs)"
    )
    print()

    results = run_monte_carlo(iterations_per_combo=10000, seed=42)

    print("\nGenerating output...")
    output_heatmaps(results)
    output_csv(results)
    output_report(results)


if __name__ == "__main__":
    main()
