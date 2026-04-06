# Within Parameters — Balance Simulator Spec

**Target:** ML01 (`/opt/repos/within-parameters-visual-novel/simulation/`)
**Agent runtime:** Claude Code or OpenCode
**Language:** Python 3.12+, standard library + matplotlib + numpy
**Estimated scope:** ~400 LOC, single-file core + separate data file
**Purpose:** Monte Carlo balance validation of the 64-cell trait matrix

---

## 1. Objective

Run 10,000 randomized iterations per trait combination (640,000 total runs) using a priority-weighted heuristic agent. Output: 8×8 heatmaps showing win rates, average scores, and ending distributions per cell. Flag cells where correction ending rate is below 15% or above 85% as balance anomalies.

The simulator answers three questions:

1. Are there trait combinations where the good ending is impossible regardless of play?
2. Are there trait combinations where the good ending is trivially guaranteed?
3. Does the scoring cascade produce the intended grade distribution?

---

## 2. Architecture

```
simulation/
├── simulator.py        # Core: state, events, traits, agent, runner, output
├── game_data.py        # Event pool, trait definitions, config values
├── README.md           # What this is, how to run it
└── output/             # Generated heatmaps and reports (gitignored)
```

Two files. `game_data.py` contains all the tunable values as Python dataclasses. `simulator.py` contains the engine, agent, runner, and visualization. This separation lets the developer tweak values in `game_data.py` and rerun instantly without touching simulation logic.

---

## 3. Data Structures (`game_data.py`, ~80 LOC)

### Config

```python
@dataclass(frozen=True)
class Config:
    starting_modules: int = 5
    starting_knowledge: int = 0
    starting_rapport: int = 0
    clock_max: int = 10
    clock_base_tick: int = 1
    clock_jitter_chance: float = 0.5
    clock_jitter_amount: int = 1
    clock_reduction_base: int = 1
    clock_reduction_max: int = 2
    rapport_clock_scale: float = 0.5
    knowledge_threshold: int = 8
    fix_cost: int = 2
    journey_stops: int = 5
    max_raw_score: int = 103
    reroll_multiplier: float = 0.92
```

### Trait

```python
@dataclass(frozen=True)
class Trait:
    id: str
    name: str
    axis: str

    def apply(self, config: Config) -> Config:
        """Return a new Config with this trait's modifications applied."""
        ...
```

Each trait subclasses or uses a factory that returns a modified Config. Traits that affect per-event behavior (N2 Rough Touch's per-module surcharge, N8 Stubborn's forced choice, P8 Practiced's first-spend discount) are handled via flags on the Config that the event engine checks.

### Event

```python
@dataclass(frozen=True)
class EventChoice:
    label: str
    knowledge_change: int = 0
    module_change: int = 0
    clock_change: int = 0
    community_effect: str = "none"  # "helped", "ignored", "harmed"
    knowledge_gate: int = 0         # minimum knowledge to select
    module_gate: int = 0            # minimum modules to select
    rapport_gate: int = 0           # minimum rapport to select

@dataclass(frozen=True)
class Event:
    id: str
    category: str  # "community", "transit", "approach"
    choices: list[EventChoice]
    has_found_document: bool = False
```

### Event Pool

12 events matching the M3 content design draft. Stat values from the event tables:

**Community (5):** CE-01 through CE-05 with 3 choices each.
**Transit (4):** TE-01 through TE-04 with 3 choices each.
**Approach (3):** AE-01 through AE-03 with 3 choices each.

Found document flags: CE-01, CE-04, TE-02, TE-04, AE-03 have found documents (5 of 12; ~2-3 per run).

### Reward Options

```python
@dataclass(frozen=True)
class Reward:
    type: str  # "consumable", "knowledge", "clock_reduction"
    base_value: int
```

Three rewards per stop, always the same structure:
- Consumable: +2 modules (modified by P5 Field Expedient to +3)
- Knowledge: +2 knowledge (modified by P2 Quick Study to +3)
- Clock reduction: calculated at runtime from rapport and config

### Trait Definitions

8 positive, 8 negative, defined as data. Each trait stores its ID, name, and a function or flag set that modifies Config or event-time behavior.

---

## 4. Game State (`simulator.py`, state section, ~30 LOC)

```python
@dataclass
class GameState:
    knowledge: int
    modules: int
    rapport: int
    clock: int
    communities_helped: int = 0
    communities_harmed: int = 0
    communities_ignored: int = 0
    events_drawn: list[str] = field(default_factory=list)
    stop: int = 0
    alive: bool = True
    docs_read: int = 0
```

Mutable. The simulator doesn't need immutability since each run is independent and discarded after recording results.

---

## 5. Event Engine (`simulator.py`, engine section, ~100 LOC)

### Run Flow

```python
def run_game(config: Config, pos_trait: Trait, neg_trait: Trait, rng: Random) -> RunResult:
    # Apply traits to config
    effective_config = pos_trait.apply(neg_trait.apply(config))

    # Initialize state
    state = GameState(
        knowledge=effective_config.starting_knowledge,
        modules=effective_config.starting_modules,
        rapport=effective_config.starting_rapport,
        clock=0
    )

    # Draw events
    community_events = rng.sample(COMMUNITY_POOL, 2)
    transit_events = rng.sample(TRANSIT_POOL, 2)
    approach_events = rng.sample(APPROACH_POOL, 1)
    drawn = community_events + transit_events + approach_events

    # Journey: 5 stops
    for stop_index, event in enumerate(drawn):
        state.stop = stop_index + 1

        # Agent selects event choice
        choice = agent_select_choice(state, event, effective_config)
        apply_choice(state, choice, effective_config)

        # Found document
        if event.has_found_document:
            apply_found_document(state, effective_config)

        # Agent selects reward
        reward = agent_select_reward(state, effective_config)
        apply_reward(state, reward, effective_config)

        # Clock tick
        apply_clock_tick(state, effective_config, rng)

        # Check loss
        if state.clock >= effective_config.clock_max:
            state.alive = False
            break

    # Determine ending
    return determine_ending(state, effective_config)
```

### Trait-Modified Event Processing

The engine checks Config flags at specific timing points:

| Flag | When Checked | Effect |
|------|-------------|--------|
| `rough_touch` | Community event choice application | Multiply module cost by (1 + extra per module) |
| `stubborn` | Community event choice selection | Agent must select highest-cost choice |
| `practiced` | Any event choice application | First module spend reduced by 1 (min 0), once per event |
| `light_foot` | Transit event choice application | Zero out any bonus clock costs |
| `tunnel_nerves` | Approach event choice application | Add 1 to clock change |
| `distracted` | Found document application | Knowledge gain set to 0 |
| `narrow_focus` | Clock reduction reward | Reduce effectiveness by 1 (min 0) |

### Clock Tick

```python
def apply_clock_tick(state: GameState, config: Config, rng: Random):
    tick = config.clock_base_tick
    if rng.random() < config.clock_jitter_chance:
        tick += config.clock_jitter_amount
    state.clock += tick
```

### Clock Reduction Calculation

```python
def calc_clock_reduction(state: GameState, config: Config) -> int:
    raw = config.clock_reduction_base + int(state.rapport * config.rapport_clock_scale)
    return min(raw, config.clock_reduction_max)
```

---

## 6. Heuristic Agent (`simulator.py`, agent section, ~80 LOC)

The agent makes two decisions per stop: which event choice to take, and which reward to select. It uses a priority-weighted rule set that approximates competent (not perfect) human play.

### Event Choice Selection

Priority order:

1. **If Stubborn (N8) and community event:** Select highest module-cost choice that the player can afford. If none affordable, select cheapest.
2. **If a knowledge-gated choice is available and player meets the gate:** Select it (these are generally the most efficient options).
3. **If a "helped" community choice is affordable and clock < 7:** Select it (build rapport early).
4. **Otherwise:** Select the cheapest available option (conserve resources).

### Reward Selection

Priority order:

1. **Survival override:** If clock + expected next tick >= clock_max - 1, select clock reduction.
2. **Economic solvency:** If modules < effective fix cost (2 or 3 depending on Fragile Kit), select consumable.
3. **Win condition priority:** If stop >= 3 and knowledge < effective threshold, select knowledge.
4. **Late-game clock management:** If stop >= 4 and clock >= 6, select clock reduction.
5. **Default:** Select knowledge (accumulator, never wasted).

The agent is deliberately imperfect. It doesn't look ahead, doesn't calculate optimal reward sequences, and doesn't account for future event draws. This models a competent-but-not-omniscient player.

---

## 7. Monte Carlo Runner (`simulator.py`, runner section, ~60 LOC)

```python
def run_monte_carlo(iterations_per_combo: int = 10000, seed: int = 42):
    results = {}

    for pos_trait in POSITIVE_TRAITS:
        for neg_trait in NEGATIVE_TRAITS:
            combo_key = (pos_trait.id, neg_trait.id)
            combo_results = []

            for i in range(iterations_per_combo):
                rng = Random(seed + hash(combo_key) + i)
                result = run_game(DEFAULT_CONFIG, pos_trait, neg_trait, rng)
                combo_results.append(result)

            results[combo_key] = analyze_combo(combo_results)

    return results
```

### RunResult

```python
@dataclass
class RunResult:
    ending: str           # "clock_failure", "destruction", "correction"
    raw_score: int
    modules_remaining: int
    knowledge_final: int
    rapport_final: int
    clock_final: int
    communities_helped: int
    communities_harmed: int
```

### ComboAnalysis

```python
@dataclass
class ComboAnalysis:
    correction_rate: float   # % of runs reaching good ending
    destruction_rate: float  # % reaching bad ending
    clock_failure_rate: float  # % dying to clock
    avg_raw_score: float
    median_raw_score: float
    avg_final_clock: float
    avg_final_modules: float
    avg_final_knowledge: float
```

---

## 8. Output (`simulator.py`, output section, ~50 LOC)

### Heatmaps (matplotlib)

Three 8×8 heatmaps saved to `simulation/output/`:

1. **`correction_rate_heatmap.png`** — Percentage of runs achieving the good ending per trait combination. Color scale: red (<20%) to green (>60%). Flags cells below 15% or above 85%.

2. **`avg_score_heatmap.png`** — Average raw score per combination. Color scale: blue (low) to yellow (high).

3. **`clock_failure_rate_heatmap.png`** — Percentage of runs lost to clock. Identifies combinations where clock pressure is lethal.

Axis labels: positive traits on Y-axis (P1-P8), negative traits on X-axis (N1-N8). Cell annotations show the percentage value.

### Console Report

Print to stdout:

- Top 5 easiest combinations (highest correction rate)
- Top 5 hardest combinations (lowest correction rate)
- Any flagged degenerate cells (correction rate <15% or >85%)
- Overall statistics: mean correction rate, std dev, min, max
- Scoring cascade check: for each reroll count (0-4), percentage of combinations where S/A/B tier is achievable

### CSV Export

`simulation/output/combo_results.csv` with one row per combination, all ComboAnalysis fields. For manual analysis or import into spreadsheets.

---

## 9. Validation Criteria

The simulator passes if:

1. **No combination has a correction rate of 0%.** Every pair must be winnable with competent play.
2. **No combination has a correction rate above 90%.** No pair should trivialize the game.
3. **Mean correction rate across all 64 combinations is between 30-55%.** The game should be challenging but fair.
4. **Clock failure rate for revised N7 (Exhausted) combinations is below 60%.** N7 should be hard, not lethal.
5. **Standard deviation of correction rates is between 10-25%.** Enough variance to feel different, not so much that some rolls are hopeless.
6. **The scoring cascade produces the intended grade distribution at 0 rerolls:** S-tier achievable in 10-20% of correction-ending runs, A-tier in 30-50%.

If any criterion fails, the developer adjusts values in `game_data.py` and reruns. Iteration cycle target: under 30 seconds per full sweep.

---

## 10. Execution

### Setup

```bash
cd /opt/repos/within-parameters-visual-novel
mkdir -p simulation/output
```

### Dependencies

```bash
pip install matplotlib numpy --break-system-packages
```

### Run

```bash
cd simulation
python simulator.py
```

Output appears in `simulation/output/` and stdout.

### Iteration

Edit `game_data.py` to adjust config values, trait effects, or event stat tables. Rerun `simulator.py`. Compare heatmaps visually or diff the CSV.

---

## 11. Scope Boundaries

**The simulator models:**
- All 64 trait combinations
- Event pool drawing (category-filtered, no repeats)
- Event choice selection via heuristic agent
- Reward selection via priority rules
- Clock tick with jitter
- Clock reduction with rapport scaling and cap
- Ending determination (clock failure, destruction, correction)
- Score calculation with diminishing returns and hard cap

**The simulator does NOT model:**
- Narrative content, dialogue, or found document text
- Multiple difficulty settings or starting conditions beyond traits
- Human psychological bias (sunk cost, narrative attachment)
- Coworker comms beats (no mechanical effect)
- Backstory templates (flavor only)
- The dossier reroll mechanic itself (just the penalty math)

---

## 12. Agent Execution Notes

This spec is designed for a single agent session. The deliverables:

1. `simulation/game_data.py` — All data definitions
2. `simulation/simulator.py` — Engine, agent, runner, output
3. `simulation/README.md` — What, why, how to run
4. `simulation/output/.gitkeep` — Ensure output directory exists
5. Update `.gitignore` — Add `simulation/output/*.png`, `simulation/output/*.csv`

The agent should write both files, run the simulator, verify output, and report results. If any validation criterion fails, the agent should note which criterion failed and what the actual values were, but should NOT attempt to rebalance. Rebalancing is strategic work for the orchestrator (Claude.ai).

After the simulator runs successfully, the heatmap images and CSV should be committed to the repo for reference.
