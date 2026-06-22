<!--
---
title: "WP Production Content Build"
description: "Translate the M3 content design into production JSON: the 12-event pool, expanded scenes, found documents, comms beats, and rapport-modified epilogues, with stat values matched to the balance simulator"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [content, narrative, game-design]
  - tech: [typescript, json]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[M3 Content Design](../game-design/m3-content-design-draft.md)"
  - "[game_data.py event pools](../simulation/game_data.py)"
  - "[Spec 01: Engine Reconciliation](spec-01-engine-reconciliation.md)"
  - "[Spec 03: Roguelike Layer](spec-03-roguelike-layer.md)"
---
-->

## Task: WP Production Content Build

Mode: Code

---

### Objective

Within Parameters carries its full production content: the complete 12-event pool (5 community, 4 transit, 3 approach) with dialogue, the 8 found documents, the three-tier coworker comms beats, expanded scene content, and the three endings with per-community rapport-modified epilogues. Every event's mechanical values match the balance simulator's event pools exactly, so the validated balance holds; every event's text matches the M3 content design. Knowledge gates reference the locked threshold. When complete, a run draws from the real content pool (2 community, 2 transit, 1 approach per run) and plays through written events to a written, rapport-differentiated ending, replacing the test scaffold entirely.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Toolchain | Node + Vite + TypeScript; headless Playwright (Chromium) on ML01 |
| Branch | `agent/wp-spec-04-production-content` (agent creates; does not push) |
| Precondition | Spec 01 merged (config schema, gates, event data contract); spec 03 merged (chargen hooks, backstory monologue seam) |

---

### Scope

**Pre-existing (do not create):**

- The reconciled engine (spec 01): event/choice schema, trait flags, scoring, the locked config
- The roguelike layer (spec 03): chargen, dossier, backstory monologue trigger seam
- `data/events.json` (4 test events, to be replaced by the 12-event pool)
- `data/scenes.json` (skeleton spine, to be expanded)
- The M3 content design doc (the text and structure authority)
- `simulation/game_data.py` (the event pools, the mechanical-value authority)

**Modify:**

- `data/events.json` — replace test events with the 12-event production pool
- `data/scenes.json` — expand: lore, dispatch/authorization, per-stop framing, facility entry, three endings with rapport-modified epilogue assembly
- `data/config.json` — confirm the zone map (2 community, 2 transit, 1 approach across 5 stops) if spec 01 left it generic; do not change locked balance values
- `data/protagonist-pool.json` — add backstory monologue lines if deferred from spec 03
- New `data/found-documents.json` (or inclusion in events) — the 8 found documents
- New `data/comms-beats.json` (or inclusion in scenes) — the three-tier comms beats
- `characters.json` / asset manifest — NPC entries (Jay, Torres, Aguilar, Dex, Sato, Archive AI) and their placeholder portraits/backgrounds per the M3 asset manifest
- `src/` only where content schema needs a loader for a new content type (found documents, comms beats); flag if engine wiring is required beyond loading

**Reference:**

- `game-design/m3-content-design-draft.md` — events, dialogue, found documents, comms beats, epilogues, asset manifest (TEXT and STRUCTURE authority)
- `simulation/game_data.py` — `COMMUNITY_POOL`, `TRANSIT_POOL`, `APPROACH_POOL` (MECHANICAL-VALUE authority)
- `game-design/character-generation.md` — backstory monologue triggers and epilogue lines
- `AGENTS.md`

**Do not touch:**

- Engine mechanics (specs 01, 03). Content is data; if a content type needs a loader, add the loader, do not alter mechanics.
- Balance values. The locked config and the simulator's event stat values are authoritative; content text wraps them, it does not retune them.
- The vendored `vendor/gameui/` tree.
- Git remote operations.

---

### Deliverables & Validation

#### Deliverable 1: The 12-event production pool

Replace `data/events.json` with the full pool from the M3 design: 5 community (CE-01..CE-05), 4 transit (TE-01..TE-04), 3 approach (AE-01..AE-03). Each event carries its situation framing, NPC reference where applicable, choices with labels and dialogue, and any attached found document. The mechanical values on every choice (knowledge, module/consumable, clock, community effect, knowledge/rapport gates) must match the corresponding `EventChoice` in `game_data.py` exactly. Where the design doc's dialogue-sketch stat values differ from the simulator (the doc predates final balance), the simulator wins on numbers and the doc wins on text. Knowledge gates use the values in `game_data.py` (e.g. CE-02 choice A gate 3, CE-05 choice C gate 4, AE-02 choice A gate 5, AE-03 choice A gate 4); the old `[Requires Knowledge 8]` test-gate text is removed.

Validation:

- [ ] `data/events.json` contains exactly 12 events: 5 community, 4 transit, 3 approach, with the M3 ids
- [ ] Every choice's knowledge/module/clock/community/gate values match the matching `EventChoice` in `game_data.py` (audit each event against the simulator pool)
- [ ] Each event has written situation text and per-choice dialogue from the M3 design
- [ ] Found-document attachments match the M3 found-documents table (CE-01, CE-04, TE-02, TE-04, AE-03 carry documents)
- [ ] No stale `[Requires Knowledge 8]` or test-gate text remains; gates use the locked-threshold-relative values from the simulator
- [ ] The engine draws 2 community + 2 transit + 1 approach per run and every event renders without error

#### Deliverable 2: Found documents

Create the 8 found documents (FD-01..FD-08) with their full text from the M3 design, in `data/found-documents.json` (or attached inline to events, agent's call on structure). Each grants +1 knowledge when read, subject to the Distracted trait suppression already implemented in spec 01. Wire the loader if a new content type is needed; the reading UI may reuse the framework panel/modal from spec 02.

Validation:

- [ ] All 8 found documents exist with full M3 text and correct event attachment
- [ ] Reading a found document grants +1 knowledge, suppressed when the protagonist has Distracted (spec 01 behavior)
- [ ] Documents render in a readable surface (framework panel/modal) without console errors
- [ ] Found-document availability tracks event draws (3-4 per run depending on draw)

#### Deliverable 3: Comms beats

Create the coworker comms beats (Jay Chen) as three clock-scaled tiers (green 0-3, amber 4-6, red 7-9), two beats each, triggered after stop 1 and after stop 3 per the M3 timing. The engine selects the tier by current clock state at trigger time. Use the existing comms-interrupt surface (framework-based from spec 02).

Validation:

- [ ] Comms beats exist for all three tiers with both beats each, full M3 dialogue
- [ ] The correct tier fires based on clock state at the trigger points (after stop 1, after stop 3)
- [ ] Beats render through the comms-interrupt surface without console errors
- [ ] Tier selection is driven by live clock state, not hardcoded

#### Deliverable 4: Scene expansion and NPCs

Expand `data/scenes.json` beyond the skeleton: the lore card, dispatch/authorization scene (Torres clearing the investigation), per-stop framing as needed, facility entry, and the three ending scenes. Add NPC entries to `characters.json` (Jay, Torres, Aguilar, Dex, Sato, Archive AI) with the expressions listed in the M3 profiles, plus placeholder portrait and background manifest entries per the M3 asset manifest (13 backgrounds, the NPC portrait set). The Archive AI confrontation uses its distinct "system update" voice from the design.

Validation:

- [ ] Scenes cover lore, authorization, journey framing, facility entry, and three endings
- [ ] All six NPCs exist in `characters.json` with their M3 expressions and name colors
- [ ] Placeholder backgrounds and portraits resolve through the manifest with fallbacks (no missing-asset errors)
- [ ] The Archive AI confrontation scene uses its specified voice and leads into the ending determination

#### Deliverable 5: Rapport-modified epilogues

Implement the three endings with per-community rapport-modified epilogue assembly per the M3 design: clock-failure (no community check), destruction (helped/ignored/harmed variants per community), correction (helped/ignored/harmed variants per community). The engine assembles the epilogue from the base text plus one inserted line per community based on its final state, then appends the closing. This integrates with the score breakdown from spec 03 (narrative epilogue above, score breakdown below) and the backstory epilogue line.

Validation:

- [ ] Each ending assembles base text plus per-community modifier lines matching each community's final state
- [ ] Clock-failure shows no community modifiers (per design); destruction and correction show one line per visited community keyed to helped/ignored/harmed
- [ ] The closing text for each ending renders
- [ ] The narrative epilogue composes correctly with the spec 03 score breakdown and backstory epilogue line
- [ ] A helped-heavy run and a harmed-heavy run produce visibly different epilogues

#### Deliverable 6: Content-complete run verification and worklog

Extend the Playwright walk (from specs 02/03) to play a full run through production content end to end, asserting no console errors and capturing the journey, a found-document read, a comms beat, the confrontation, and a rapport-differentiated ending. Write a worklog (`2026-06-22-wp-worklog-04-production-content.md`) per the template and append to the registry. Specs stay in-repo; no central archive; no git push; leave work on the branch.

Validation:

- [ ] A Playwright run completes a full production-content playthrough with zero console errors
- [ ] The walk captures a journey event, a found document, a comms beat, the confrontation, and an ending
- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-04-production-content.md` with all frontmatter
- [ ] Work registry CSV updated; all work committed locally on the branch; `main` untouched

---

### Constraints

- Specs 01 and 03 must be merged before this runs. This spec is content data plus minimal loaders; it does not alter engine mechanics or balance.
- Two authorities, cleanly split: `game_data.py` is authoritative for every mechanical value (the balance was validated against it); the M3 content design is authoritative for every word of text and the content structure. Where they differ on a number, the simulator wins; where the simulator has no text, the design provides it.
- No balance retuning. Locked config values and simulator event stats are fixed.
- Compose reading/comms surfaces from the framework (spec 02), do not hand-roll new UI chrome.
- Local git only: branch, commit locally, never push or merge.
- All work within the working directory except worklog and registry paths.

---

### Execution Order

1. Deliverable 1: The 12-event production pool
2. Deliverable 2: Found documents
3. Deliverable 3: Comms beats
4. Deliverable 4: Scene expansion and NPCs
5. Deliverable 5: Rapport-modified epilogues
6. Deliverable 6: Content-complete run verification and worklog

---

### Notes

The content already exists in finished prose; this spec is translation, not authorship. The M3 design doc carries every event's dialogue, all 8 found documents verbatim, the comms beats, and the epilogues. The single discipline that matters is the two-authority split: text from the design, numbers from the simulator. The design doc predates final balance and its inline stat tables are illustrative; `game_data.py` is what the 640,000-run validation actually used, so its `EventChoice` values are the contract. An event whose text says "+1 knowledge" in the doc but whose simulator entry says `knowledge_change=2` ships as 2 with the doc's prose.

The zone map is 2 community, 2 transit, 1 approach across 5 stops, matching both the simulator's `rng.sample` draw and the design doc's §7. If spec 01 set this, confirm it; if it left the map generic, set it here.

Found documents and comms beats may be new content types needing loaders. Adding a loader is in scope; reshaping the engine's event or scene model is not. If a content type cannot be loaded without an engine change, flag it for the orchestrator rather than forcing it.

Spec 05 (placeholder-art launch and the full Playwright run-walk gate) follows: it does the complete asset-manifest placeholder pass and the launch verification harness. After 05, the game is content-complete and launch-ready on placeholders, with the production art sprint as the only remaining work before release.
