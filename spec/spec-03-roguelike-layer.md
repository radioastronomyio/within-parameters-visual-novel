<!--
---
title: "WP Roguelike Layer: Chargen, Dossier, Reroll, and Score Display"
description: "Build random protagonist generation, the dossier screen with reroll, and the end-of-run score breakdown, composed from GameUI components on the reconciled engine"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [character-generation, roguelike, ui, engine]
  - tech: [typescript, vite, html, css]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[Character Generation Design](../game-design/character-generation.md)"
  - "[Trait System v2](../game-design/2026-05-18-m3-trait-system-v2.md)"
  - "[GameUI Factory Pattern §6](/opt/agents/repos/gameui-browser-gaming-framework/ui/README.md)"
  - "[Spec 01: Engine Reconciliation](spec-01-engine-reconciliation.md)"
  - "[Spec 02: GameUI Consumer Integration](spec-02-gameui-consumer-integration.md)"
---
-->

## Task: WP Roguelike Layer — Chargen, Dossier, Reroll, and Score Display

Mode: Code

---

### Objective

Within Parameters generates a random protagonist at run start, presents a dossier screen built from GameUI components where the player reads the protagonist and chooses DEPLOY or REROLL with the reroll scoring penalty shown, and displays an end-of-run score breakdown with letter grade, scoring components, trait references, and backstory epilogue line on the ending screen. The protagonist's traits drive the run through the reconciled engine's trait system (spec 01), the reroll count drives the score multiplier, and every new surface is composed from the GameUI cards, panels, modals, and buttons vendored in spec 02. When complete, a full run plays start to finish with a generated character: dossier, lore, journey, ending, graded score, all in the neon preset with placeholder portraits.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Toolchain | Node + Vite + TypeScript; headless Playwright (Chromium) on ML01 |
| Branch | `agent/wp-spec-03-roguelike-layer` (agent creates; does not push) |
| Precondition | Spec 01 and spec 02 both merged to `main` (reconciled engine + scoring; vendored GameUI + framework-based UI) |

---

### Scope

**Pre-existing (do not create):**

- The reconciled engine from spec 01: trait system and flags, scoring cascade, ending determination, typed protagonist state fields, `rerollCount`
- The framework-based UI from spec 02: vendored `vendor/gameui/`, neon preset wired, screens migrated to GameUI components, step-structured Playwright harness
- `src/engine/scene-runner.ts` (run lifecycle)
- The character-generation and trait-system design docs

**Modify:**

- `src/ui/` — add the dossier screen and the score breakdown, composed from GameUI factories
- `src/engine/scene-runner.ts` — insert chargen + dossier before the lore card in run start
- `src/engine/game-state.ts` — protagonist generation and reroll handling (consuming spec 01 types)
- `src/styles.css` — only WP-specific composition for the new screens, on GameUI tokens (most styling comes from framework components)
- `tests/` — extend the spec 02 Playwright harness with dossier and score steps
- The asset manifest / `characters.json` — protagonist portrait entries (placeholder)

**Create:**

- `data/protagonist-pool.json` — name pools, backstory ids, backstory flavor and epilogue text (agent may split backstory text into a second file if cleaner)

**Reference:**

- `game-design/character-generation.md` — generation sequence, name pools, backstory templates, dossier layout, reroll display, portrait strategy, ending variables
- `game-design/2026-05-18-m3-trait-system-v2.md` and `simulation/game_data.py` — trait ids and display names for label parity
- `/opt/agents/repos/gameui-browser-gaming-framework/ui/README.md` §6 — factory signatures
- `/opt/agents/repos/gameui-browser-gaming-framework/ui/gallery/index.html` — card and modal composition reference

**Do not touch:**

- Engine mechanics from spec 01 (trait math, scoring). Consume; do not reimplement or retune. Flag bugs for the orchestrator.
- The vendored `vendor/gameui/` tree (consume it; refreshing the vendor is a spec 02 concern)
- `data/events.json`, `data/scenes.json` bodies (spec 04). Backstory monologue trigger hooks are permitted only if they require no rewrite of existing event text; otherwise defer to spec 04 and note it.
- Git remote operations.

---

### Deliverables & Validation

#### Deliverable 1: Protagonist data and generation

Create `data/protagonist-pool.json` per the design doc: first-name pool A (Mara, Kira, Dani, Joss, Reese, Tamsin, Asha, Lena), pool B (Cole, Reza, Hale, Niko, Dex, Marsh, Joaquin, Samir), shared surnames (Vasquez, Osei, Novak, Tran, Aguilar, Marsh, Reeves, Kato, Adeyemi, Volkov), the six backstory ids, and each backstory's dossier flavor paragraph plus correction/destruction epilogue lines with `{name}`/`{pronoun}`/`{station}` slots. Implement generation: roll gender 50/50, pick first name from the gendered pool, surname from shared, one backstory, one positive trait, one negative trait; return a protagonist populating the spec 01 state type. Callsign is always RELAY-7.

Validation:

- [ ] `data/protagonist-pool.json` parses with both name pools (8 each), surnames (10), and six backstories with flavor and epilogue text
- [ ] Generation yields a protagonist with gender, matching-pool first name, surname, backstory, one positive and one negative trait id from the 8+8 set in `game_data.py`
- [ ] The protagonist populates the spec 01 type; `tsc --noEmit` passes
- [ ] Variable slots resolve with no literal `{name}`/`{pronoun}` left in rendered text

#### Deliverable 2: Dossier screen from GameUI components

Build the dossier screen, shown at run start before the lore card (and in place of it on repeat runs per the design doc). Compose it from GameUI:

- A `.gui-panel` (primary accent) as the dossier container, with `.gui-panel__header` carrying the name and RELAY-7 callsign.
- The protagonist portrait in the panel (placeholder rendering via the manifest fallback).
- The assignment line and backstory paragraph in the panel body.
- The two trait cards via `createCard`: one positive (success or magic accent), one negative (danger or warning accent), each with `title` = trait display name and `body` = effect summary. Signature per framework README §6: `createCard({ title, tag, body, accent })`.
- DEPLOY and REROLL as `createButton` controls (`createButton({ label, accent, onClick })`): DEPLOY primary, REROLL ghost/outline.
- A reroll-status line showing current reroll count and the resulting score ceiling.

DEPLOY commits the protagonist and proceeds to the lore card. REROLL regenerates, increments `rerollCount`, and updates the displayed ceiling. The ceiling is the compounding multiplier from spec 01 (`0.92 ^ rerollCount`) shown as a percentage; the design doc's stepped table is illustrative and agrees with compounding to displayed precision for the first several rerolls. Continue compounding past reroll 4 rather than flooring.

Validation:

- [ ] The dossier renders as a GameUI panel containing portrait, name, callsign, assignment, backstory, two `createCard` trait cards, and `createButton` DEPLOY/REROLL controls
- [ ] DEPLOY proceeds to the lore card with the committed protagonist; the run uses that protagonist's traits
- [ ] REROLL regenerates and increments the displayed reroll count and score ceiling
- [ ] The score ceiling equals `0.92 ^ rerollCount` as a percentage and updates each reroll
- [ ] The screen renders in the neon preset with no console errors

#### Deliverable 3: Run-start flow integration

Wire chargen and the dossier into `scene-runner.ts`: NEW GAME triggers generation and shows the dossier; DEPLOY transitions to `scene-lore-01`. The protagonist's config-modifier traits produce the effective run config via spec 01's application path, and the behavior flags are active for the run. The committed `rerollCount` is stored on `GameState` so scoring uses it. CONTINUE/LOAD must not re-trigger generation.

Validation:

- [ ] NEW GAME shows the dossier before any scene content
- [ ] The committed protagonist's trait config modifiers are reflected in the effective run config (e.g. Well-Supplied yields 8 starting modules: 6 base + 2)
- [ ] The protagonist's behavior flags are active during the run (verifiable via a scripted assertion using spec 01's trait application)
- [ ] `rerollCount` on the run state matches the rerolls performed
- [ ] CONTINUE/LOAD resume without regenerating the protagonist

#### Deliverable 4: Score breakdown on the ending screen

Extend the ending screen (already framework-based from spec 02) with the end-of-run score, composed from GameUI panels/bars/chips:

- The letter grade (S/A/B/C/D/F from spec 01 thresholds) prominently displayed.
- The final score after the reroll multiplier.
- A component breakdown (ending base, communities helped, rapport, modules remaining, knowledge over threshold, clock remaining) presented as stat rows or panel chips; the components sum to the raw score before the multiplier.
- The reroll penalty line, shown only when `rerollCount > 0`, reflecting the compounding multiplier.
- The protagonist's backstory epilogue line for the achieved ending type.
- Trait epilogue reference lines for the protagonist's two traits (the short run-summary lines from the design doc).

The pre-existing rapport-modified narrative epilogue stays above the breakdown; the score breakdown is additive.

Validation:

- [ ] The ending screen shows letter grade and final (post-multiplier) score
- [ ] The component breakdown sums to the raw score before the multiplier
- [ ] The reroll penalty line appears only when `rerollCount > 0`
- [ ] The protagonist's backstory epilogue line for the achieved ending type renders
- [ ] Trait epilogue reference lines render for both traits
- [ ] The pre-existing community narrative epilogue still renders above the breakdown
- [ ] The breakdown is composed from GameUI components and renders in neon with no console errors

#### Deliverable 5: Placeholder portraits and manifest

Add protagonist portrait entries to the manifest / `characters.json` using the portrait strategy's name-index mapping. At minimum the "minimum viable" tier (one base per gender); implement the name-index-to-portrait mapping so swapping in the 8-face ideal tier later is a data change only. Use placeholder rendering (the existing `placeholderColor`/`placeholderStyle` fallback) so the dossier and in-run portrait show without final art.

Validation:

- [ ] Protagonist portraits resolve through the manifest with placeholder fallbacks; the dossier shows a portrait for any generated protagonist
- [ ] The name-index-to-portrait mapping is data-driven (adding portraits is a data change, not code)
- [ ] No missing-asset console errors on a full run

#### Deliverable 6: Extend the Playwright walk and worklog

Extend the spec 02 Playwright harness with two new steps: capture the dossier screen (including a post-reroll state showing an incremented ceiling) and capture the ending score breakdown after completing a run. The harness now walks the full game including the roguelike layer. Write a worklog (`2026-06-22-wp-worklog-03-roguelike-layer.md`) per the template, append to the work registry. Specs stay in-repo; do not archive centrally; do not push git. Leave work on the named branch.

Validation:

- [ ] The Playwright walk captures the dossier (initial and post-reroll) and the ending score breakdown in neon
- [ ] The full walk asserts zero console errors and zero failed network requests
- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-03-roguelike-layer.md` with all frontmatter fields
- [ ] Work registry CSV has a new row; all work committed locally on the branch; `main` untouched

---

### Constraints

- Specs 01 and 02 must be merged before this runs. This spec consumes spec 01's engine/scoring and spec 02's framework UI; it reimplements neither.
- Compose from GameUI. The dossier and score screens are built from vendored framework components (cards, panels, modals, buttons), not hand-rolled markup. New custom CSS is WP-specific composition on GameUI tokens only.
- Do not retune balance. Trait effects, scoring constants, and the reroll multiplier come from config and spec 01.
- Content files off-limits for body edits; backstory monologue insertion defers to spec 04 if it would rewrite existing event text.
- Local git only: branch, commit locally, never push or merge.
- All work within the working directory except worklog and registry paths.

---

### Execution Order

1. Deliverable 1: Protagonist data and generation
2. Deliverable 2: Dossier screen from GameUI components
3. Deliverable 3: Run-start flow integration
4. Deliverable 4: Score breakdown on the ending screen
5. Deliverable 5: Placeholder portraits and manifest
6. Deliverable 6: Extend the Playwright walk and worklog

---

### Notes

This is the visible roguelike layer; spec 01 was the invisible one. Spec 01 makes traits do something and computes the score; this spec lets the player see their protagonist, choose whether to keep it, and read their graded result, all through the framework adopted in spec 02. The split kept three concerns on three verification gates: numerical parity (01), no-regression migration (02), and a playable run with the new screens (this spec).

The carried doc/sim discrepancy resolves here as it did in spec 01: implement the compounding `0.92` multiplier, which agrees with the design doc's stepped table to displayed precision for the first several rerolls, and continue compounding past reroll 4.

Trait card accents are a small presentation choice: positive traits read well in success or magic, negatives in danger or warning. Pick a consistent mapping and apply it; the gallery's card specimens show the accent options. The dossier is exactly the kind of card-plus-panel composition the framework's worked-example view demonstrates, so that view is the closest reference for getting it right.

Spec 04 (production content: 12 events, scene expansion, chargen text pools, comms beats, found documents, corrected gates) may use the backstory monologue trigger hooks defined here. Spec 05 (placeholder-art launch and full Playwright run-walk) extends this spec's harness into the launch verification gate.
