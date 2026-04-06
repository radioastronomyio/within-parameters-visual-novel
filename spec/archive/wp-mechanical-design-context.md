# Within Parameters — Mechanical Design Context

**Purpose:** Consolidated reference for Gemini Deep Research. Contains all mechanical systems, trait definitions, scoring rules, and event structures needed to evaluate balance.

---

## Game Overview

Roguelike visual novel hybrid. Browser-based (Vite + TypeScript), targeting ~25-35 minute runs. Single playable chapter with three endings. Portfolio piece, not commercial. Solo developer with AI-assisted pipeline.

The player is a relay technician investigating an AI that is stripping inhabited infrastructure. Five modular events drawn from a pool of 12, followed by a fixed facility confrontation. Three endings gated by stats.

---

## Stat Model

Four values tracked throughout a run:

| Stat | Type | Starting | Range | Role |
|------|------|----------|-------|------|
| Knowledge | Accumulator (never spent) | 0 | 0-15+ | Gates dialogue options, knowledge-check choices, and the good ending (threshold: 8) |
| Bypass Modules | Spendable resource | 5 (base) | 0-10+ | Spent on event choices, community help, and facility fix (cost: 2 base) |
| Rapport | Derived | 0 (base) | -5 to +5 | Count of helped communities minus harmed. Scales clock reduction effectiveness. Determines epilogue quality. |
| Intrusion Clock | Ticking counter | 0 | 0-10 (max) | Ticks up each stop (base: 1, jitter: 0 or 1). Fills = loss ending. Only reduced via clock reduction reward. |

---

## Run Structure

```
DOSSIER → LORE CARD → BEAT 2 (linear) → BEAT 3 (linear) → 
BEAT 4: 5 MODULAR STOPS → BEAT 5: FACILITY (fixed) → BEAT 6: CONFRONTATION → ENDING
```

### Beat 4: Journey (5 Stops)

| Stop | Zone | Event Category | Pool Size | Draw |
|------|------|----------------|-----------|------|
| 1 | Familiar metro | Community | 5 | 1 of 5 |
| 2 | Familiar metro | Community | 5 | 1 of remaining 4 |
| 3 | Maintenance tunnels | Transit | 4 | 1 of 4 |
| 4 | Maintenance tunnels | Transit | 4 | 1 of remaining 3 |
| 5 | Facility approach | Approach | 3 | 1 of 3 |

No repeats within a run. 12 events total, 5 drawn per run.

### Event Cycle

Each stop: ARRIVE → SITUATION → CHOICE → CONSEQUENCE → REWARD PICK → CLOCK TICK → TRANSITION

### Reward Trilemma (pick one after each event)

| Reward | Base Effect |
|--------|-------------|
| Consumable | +2 bypass modules |
| Knowledge | +2 knowledge |
| Clock reduction | -1 segment, scaled by rapport |

Clock reduction scaling: `reduction = base(1) + floor(rapport × rapportClockScale(0.5))`. At rapport 0: -1. At rapport 2: -2. At rapport 4: -3.

---

## Endings

| Ending | Condition | Base Score |
|--------|-----------|-----------|
| Clock Failure | Clock reaches 10 during journey | 0 |
| Destruction (bad) | Reached facility, knowledge < 8 | 20 |
| Correction (good) | Reached facility, knowledge ≥ 8, modules ≥ fix cost (2 base) | 40 |

Epilogues check per-community states (helped/ignored/harmed) for specific outcome sentences.

---

## Character Generation

At run start, before gameplay:

1. Roll gender (50/50)
2. Pick first name from gendered pool (8 per gender, 16 total)
3. Pick surname from shared pool (10)
4. Draw backstory template (1 of 6) — flavor only, one monologue line trigger
5. Draw positive trait (1 of 8)
6. Draw negative trait (1 of 8)
7. Display dossier: DEPLOY or REROLL

Callsign RELAY-7 is constant across all rolls.

---

## Traits

### Design Principles

- Every trait is a modifier on the stat model. No new content paths.
- No positive trait has a direct arithmetic inverse in the negative pool.
- No pair produces a logical contradiction.
- Each trait touches a distinct gameplay axis.
- All 64 combinations are valid. No exclusion rules.

### Positive Traits

| ID | Name | Axis | Effect |
|----|------|------|--------|
| P1 | Well-Supplied | starting resources | +2 starting bypass modules (7 total) |
| P2 | Quick Study | knowledge income | +1 knowledge from knowledge rewards (3 instead of 2) |
| P3 | Networked | social baseline | +1 starting rapport |
| P4 | Steady Hand | clock variance | Clock jitter forced to 0 (deterministic) |
| P5 | Field Expedient | reward efficiency | +1 modules from consumable rewards (3 instead of 2) |
| P6 | Clear-Headed | competence gates | Knowledge check thresholds -2 (confrontation: 6 instead of 8) |
| P7 | Light Foot | transit safety | Transit event choices: no bonus clock costs |
| P8 | Practiced | spending efficiency | First module spent per event: cost -1 (min 0). Once per event. |

### Negative Traits

| ID | Name | Axis | Effect |
|----|------|------|--------|
| N1 | Tunnel Nerves | approach pressure | Approach event choices: +1 clock on all options |
| N2 | Rough Touch | community costs | Community event module costs: +1 |
| N3 | Narrow Focus | clock recovery | Clock reduction rewards: -1 effectiveness (min 0) |
| N4 | Distracted | passive knowledge | Found documents: +0 knowledge (readable, no stat gain) |
| N5 | Lone Wolf | social scaling | Rapport-to-clock-reduction scaling: halved (0.25 instead of 0.5) |
| N6 | Fragile Kit | endgame cost | Facility fix costs 3 modules instead of 2 |
| N7 | Exhausted | clock floor | Clock base tick: 2 instead of 1 |
| N8 | Stubborn | choice restriction | Must choose highest-cost option at community events |

---

## Trait Interaction Matrix

Synergy ratings for all 64 combinations:

- [+] Positive synergy (14 cells, 22%): negative hurts less because positive compensates
- [○] Neutral (39 cells, 61%): orthogonal, both matter independently
- [−] Negative synergy (11 cells, 17%): negative compounds or undermines positive

### Key Positive Synergies
- P3+N3 (Networked + Narrow Focus): +1 rapport makes weak clock reduction still viable through scaling
- P4+N1 (Steady Hand + Tunnel Nerves): Deterministic clock lets you plan around approach penalty
- P7+N7 (Light Foot + Exhausted): Free transit offsets high base tick in that zone
- P8+N2 (Practiced + Rough Touch): First-spend discount exactly offsets community surcharge
- P2+N4 (Quick Study + Distracted): Extra reward knowledge compensates for lost doc knowledge

### Key Negative Synergies
- P4+N7 (Steady Hand + Exhausted): Deterministic clock at 2/stop = exactly max in 5 stops. Must reduce or lose.
- P1+N8 (Well-Supplied + Stubborn): More modules but forced to spend them. Resources drain unexpectedly fast.
- P3+N5 (Networked + Lone Wolf): More rapport but rapport is worth less. Positive partially undermined.
- P8+N6 (Practiced + Fragile Kit): Save during journey but need more at end. Savings may not cover deficit.

---

## Event Pool — Mechanical Summary

### Community Events (5 in pool, draw 2)

| ID | Name | Choice A (helped) | Choice B (partial/gated) | Choice C (ignored) |
|----|------|-------------------|--------------------------|-------------------|
| CE-01 | Water Relay Failure | -2 mod, +1 know, helped | -1 mod, +1 know, helped | +2 know, ignored |
| CE-02 | Generator Dispute | -1 mod (know≥3), helped | -2 mod, helped | +1 know, ignored |
| CE-03 | Refugee Influx | -1 mod, +2 know, helped | +2 know, ignored | +0, ignored |
| CE-04 | Station AI Anomaly | -1 mod, +3 know, helped | +2 know, ignored | +0, ignored |
| CE-05 | Power Rerouting | -1 mod, helped | +1 know, harmed | -1 mod, -1 clock (know≥4), helped |

### Transit Events (4 in pool, draw 2)

| ID | Name | Choice A | Choice B | Choice C |
|----|------|----------|----------|----------|
| TE-01 | Cut the Feed | +1 mod, harmed | -1 mod, neutral | +1 clock, neutral |
| TE-02 | Blocked Corridor | +1 mod +1 know | -1 mod, neutral | +1 clock +1 know |
| TE-03 | Stripped Junction | +2 mod, harmed | +1 mod +1 know (know≥3) | +2 know, neutral |
| TE-04 | Terminal Access | +3 know, -1 mod | +2 know, +1 clock | +1 know, neutral |

### Approach Events (3 in pool, draw 1)

| ID | Name | Choice A | Choice B | Choice C |
|----|------|----------|----------|----------|
| AE-01 | Crew Outpost | +2 know +1 mod (rap≥2) | +2 know | +1 clock |
| AE-02 | Final Seal | +1 know (know≥5) | -2 mod | +2 clock |
| AE-03 | Signal Intercept | +3 know (know≥4) | -1 mod -1 clock | +1 know |

### Found Documents

8 total in the content pool; ~3-4 available per run depending on event draws. Each gives +1 knowledge when read (before trait modification).

---

## Scoring System

### Components

| Component | Per-Unit | Realistic Max | Max Points |
|-----------|----------|---------------|------------|
| Correction ending | flat | 1 | 40 |
| Destruction ending | flat | 1 | 20 |
| Clock failure | flat | 1 | 0 |
| Communities helped | per community | 2 | 16 |
| Net rapport | per point | 5 | 15 |
| Modules remaining | per module | 4 | 8 |
| Knowledge above threshold | per point | 3 | 12 |
| Clock segments remaining | per segment | 3 | 12 |

**Theoretical perfect correction run: 103 raw points.**

### Reroll Penalty

Each dossier reroll: `final_score = raw_score × 0.92^rerolls`

### Grade Thresholds

| Grade | Score |
|-------|-------|
| S | 90+ |
| A | 75-89 |
| B | 60-74 |
| C | 45-59 |
| D | 30-44 |
| F | Below 30 |

### Cascade Design

| Rerolls | Multiplier | Perfect Raw (103) | S possible? | A possible? |
|---------|------------|-------------------|-------------|-------------|
| 0 | ×1.000 | 103 | Yes (2 miss padding) | Yes |
| 1 | ×0.920 | 94.8 | Yes (1 miss padding) | Yes |
| 2 | ×0.846 | 87.1 | No | Yes (2 miss padding) |
| 3 | ×0.779 | 80.2 | No | Yes (1 miss padding) |
| 4 | ×0.716 | 73.8 | No | No |

A "miss" costs approximately 5-7 raw points (community not helped, wrong reward taken, suboptimal choice).

---

## Config Values (Baseline)

```json
{
  "startingConsumables": 5,
  "startingKnowledge": 0,
  "clockMax": 10,
  "clockBaseTick": 1,
  "clockJitterMax": 1,
  "clockReductionBase": 1,
  "rapportClockScale": 0.5,
  "knowledgeGoodEndingThreshold": 8,
  "consumableFixCost": 2,
  "journeyStops": 5
}
```

All values are trait-modifiable at game start.
