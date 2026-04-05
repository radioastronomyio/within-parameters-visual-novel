<!--
---
title: "Character Generation System"
description: "Random protagonist generation: name pools, backstory templates, dossier screen, portrait strategy"
author: "VintageDon"
date: "2026-04-05"
version: "1.0"
status: "Design Final"
tags:
  - type: game-design
  - domain: [character-generation, roguelike]
related_documents:
  - "[Trait System v2](../spec/m3-trait-system-v2.md)"
  - "[Game Design Document](game-design-document.md)"
---
-->

# Within Parameters — Character Generation System

**Status:** Design final pending simulator validation

---

## 1. Generation Sequence

At run start, before the lore card:

1. Roll gender (50/50)
2. Pick first name from gendered pool (8 per gender)
3. Pick surname from shared pool (10)
4. Draw backstory template (1 of 6)
5. Draw positive trait (1 of 8)
6. Draw negative trait (1 of 8)
7. Display dossier screen

Callsign is always RELAY-7 regardless of roll. Jay Chen uses the callsign in comms, not the name. The name appears on the dossier and in internal monologue headers.

---

## 2. Name Pools

### First Names (8 per gender)

**Pool A (female-presenting):**
Mara, Kira, Dani, Joss, Reese, Tamsin, Asha, Lena

**Pool B (male-presenting):**
Cole, Reza, Hale, Niko, Dex, Marsh, Joaquin, Samir

### Surnames (10, shared)

Vasquez, Osei, Novak, Tran, Aguilar, Marsh, Reeves, Kato, Adeyemi, Volkov

### Display

Dossier screen: "[First] [Surname] — RELAY-7"
Internal monologue headers: "[First]:"
Comms: "RELAY-7" (always)

---

## 3. Backstory Templates

Six templates. Each provides: one paragraph of dossier flavor text, and 1-2 single-sentence monologue variants at specific story moments. Variable slots for name and pronouns.

Backstories do not modify stats. They provide flavor and one unique internal monologue line when a matching event type is drawn. Discoverable texture, not mechanical advantage.

### BS-01: Water Systems Transfer

**Dossier:** "Former water reclamation tech. Transferred to relay work after {station}'s filtration cascade three years ago. Knows pressure differentials and pump architecture better than most engineers. Took the relay cert because standing around watching gauges wasn't cutting it anymore."

**Monologue trigger:** Water Relay Failure event (CE-01). "I've seen this pressure curve before. {station} had the same signature before the cascade. This time I can fix it."

### BS-02: Tunnel Surveyor

**Dossier:** "Former tunnel surveyor for the {eastern/western/southern} expansion project. Mapped twelve kilometers of unmaintained corridor before the project was shelved. Reassigned to relay maintenance because the corps needed bodies and {they/she/he} already knew the tunnels."

**Monologue trigger:** Any transit event. "I've mapped corridors like this. The structural tells are wrong here; something's been removing load-bearing conduit."

### BS-03: Apprentice Legacy

**Dossier:** "Apprentice-trained under RELAY-4, the last tech who tried to trace the infrastructure failures to their source. RELAY-4 went into the eastern maintenance network nine months ago and didn't come back. Dispatch listed it as a structural collapse. The relay corps doesn't talk about it."

**Monologue trigger:** Approach event (any). "RELAY-4 made it this far. I know because their tool marks are on this junction box. Whatever stopped them is ahead of me."

### BS-04: Station-Born

**Dossier:** "Born at {random station}. Left to join the relay corps at seventeen because the station walls were closing in. {Random station} is still home. The people there still wave when {they/she/he} comes through on rotation. The relay corps is the job. {Random station} is the reason."

**Monologue trigger:** Any community event. "Every station looks like {home station} if you squint. Same problems. Same people trying to hold things together."

### BS-05: Infrastructure Lineage

**Dossier:** "Third generation infrastructure. Grandmother was a power systems engineer before the collapse. The diagnostic tools in the kit are inherited. The instinct for tracing faults through complex systems might be too."

**Monologue trigger:** Facility interior (Beat 5B). "My grandmother would have known what to do with this. She built systems like this one. I just fix them."

### BS-06: Walk-In

**Dossier:** "Walked in from the {eastern/southern/western} tunnel network three years ago. No station of origin on file. The relay corps took {them/her/him} because {they/she/he} could already read a schematic and the corps doesn't ask questions. Dispatch suspects {they/she/he} came from somewhere that doesn't exist anymore."

**Monologue trigger:** Clock failure ending. "{They} came from a place that died. That's how {they} got here. {They} thought this time {they} could stop it."

---

## 4. Dossier Screen

Displayed after the lore card (or instead of it on repeat runs). Player reads, then clicks DEPLOY or REROLL.

```
+---------------------------------------------------+
|                                                   |
|          +----------------+                       |
|          |                |                       |
|          |   [PORTRAIT]   |   MARA VASQUEZ        |
|          |                |   RELAY-7             |
|          +----------------+                       |
|                                                   |
|  ASSIGNMENT: Field investigation, infrastructure  |
|  anomaly -- eastern maintenance corridor          |
|                                                   |
|  BACKSTORY:                                       |
|  Former water reclamation tech. Transferred to    |
|  relay work after Deepwell Station's filtration    |
|  cascade three years ago...                       |
|                                                   |
|  +--------------------+ +--------------------+    |
|  | + WELL-SUPPLIED    | | - TUNNEL NERVES    |    |
|  | +2 starting        | | Approach events    |    |
|  | bypass modules     | | cost +1 clock      |    |
|  +--------------------+ +--------------------+    |
|                                                   |
|       [ DEPLOY ]          [ REROLL ]              |
|                        Rerolls: 0 (x100%)         |
|                                                   |
+---------------------------------------------------+
```

Visual language: dark charcoal panel, teal accents, monospace type. Same as game UI.

### Reroll Display

After each reroll, the display updates with the new protagonist and shows the scoring penalty:

```
REROLLS: 0          SCORE CEILING: x100%     BEST POSSIBLE: S
REROLLS: 1          SCORE CEILING: x92%      BEST POSSIBLE: S (tight)
REROLLS: 2          SCORE CEILING: x85%      BEST POSSIBLE: A
REROLLS: 3          SCORE CEILING: x78%      BEST POSSIBLE: A (tight)
REROLLS: 4          SCORE CEILING: x72%      BEST POSSIBLE: B
```

---

## 5. Portrait Strategy

With random protagonists, portrait variation makes rerolls feel visual.

| Tier | Assets | Mapping |
|------|--------|---------|
| Minimum viable | 2 base (1 per gender) x 2 expressions = 4 | Every run looks like one of two people |
| Better | 4 base (2 per gender) x 2 expressions = 8 | Names 1-4 get portrait A, 5-8 get portrait B |
| Ideal (NB2 sprint) | 8 base (4 per gender) x 2 expressions = 16 | Each name maps to a unique face |

The portrait pool is a JSON array. The generation function picks based on the name index. Swapping in more portraits later requires zero code changes.

---

## 6. Ending Variables

### Backstory Epilogue Lines

Each backstory gets one sentence in the ending epilogue if its trigger condition was met:

| Backstory | Correction Ending | Destruction Ending |
|-----------|-------------------|-------------------|
| Water Systems | "The filtration knowledge from {station} paid off twice today." | "Another cascade. This time, {they} couldn't stop it at the source." |
| Tunnel Surveyor | "Twelve kilometers of survey work and it led here. Worth it." | "The maps were right. The destination was wrong." |
| Apprentice Legacy | "RELAY-4 would have done the same thing. Maybe {they} tried." | "Now {they} know what stopped RELAY-4." |
| Station-Born | "{Home station}'s lights are still on. That's what matters." | "{Home station} is dark. {They} can see it from here." |
| Infrastructure Lineage | "Three generations of keeping the lights on. Still holding." | "Grandmother built things that lasted. This wasn't one of them." |
| Walk-In | "{They} came from a place that died. This one didn't have to." | "{They} came from a place that died. This one did too." |

### Trait Epilogue Lines

Traits get short references in the score breakdown, not the narrative epilogue:

- "Well-Supplied: started with extra modules. You spent {X} of them."
- "Exhausted: the clock was never on your side. Every stop cost maximum time."
- "Clear-Headed: your instincts opened doors others would have missed."
- "Lone Wolf: you started with nothing. You earned everything."

These appear on the score screen below the grade as a run summary.

---

## 7. Combination Depth

The math on depth-from-simplicity:

- 16 names x 10 surnames x 6 backstories x 8 positive traits x 8 negative traits = 614,400 possible dossiers
- 384 mechanically distinct combinations (backstory x positive x negative)
- Combined with 5-of-12 event draws, runs feel genuinely different for minimal content investment

---

## 8. Data Schema

### `data/protagonist-pool.json` (new file)

```json
{
  "names": {
    "poolA": ["Mara", "Kira", "Dani", "Joss", "Reese", "Tamsin", "Asha", "Lena"],
    "poolB": ["Cole", "Reza", "Hale", "Niko", "Dex", "Marsh", "Joaquin", "Samir"],
    "surnames": ["Vasquez", "Osei", "Novak", "Tran", "Aguilar", "Marsh", "Reeves", "Kato", "Adeyemi", "Volkov"]
  },
  "backstories": ["bs-water-systems", "bs-tunnel-surveyor", "bs-apprentice-legacy", "bs-station-born", "bs-infrastructure-lineage", "bs-walk-in"],
  "scoring": {
    "rerollMultiplier": 0.92
  }
}
```

Trait definitions and scoring components are in `spec/m3-trait-system-v2.md` and `data/config.json`.
