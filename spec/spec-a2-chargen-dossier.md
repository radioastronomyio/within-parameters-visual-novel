<!--
---
title: "WP Character Generation, Dossier Screen, and Score Display"
description: "Build the roguelike protagonist generation, dossier screen with reroll, trait presentation, and end-of-run score breakdown on top of the reconciled engine"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [character-generation, engine, ui, roguelike]
  - tech: [typescript, vite, html, css]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[Character Generation Design](../game-design/character-generation.md)"
  - "[Trait System v2](../game-design/2026-05-18-m3-trait-system-v2.md)"
  - "[Spec A1: Engine Reconciliation](spec-a1-engine-reconciliation.md)"
---
-->

## Task: WP Character Generation, Dossier Screen, and Score Display

Mode: Code

---

### Objective

Within Parameters generates a random protagonist at run start (gender, name, surname, backstory, one positive and one negative trait), presents a dossier screen where the player reads the protagonist and chooses DEPLOY or REROLL with the reroll scoring penalty shown, and displays an end-of-run score breakdown with letter grade, trait references, and backstory epilogue line on the existing ending screen. The protagonist's traits feed the run through the config-modifier and behavior-flag system delivered in spec A1, and the reroll count drives the score multiplier. When complete, a full run plays start to finish with a generated character: dossier to lore to journey to ending to graded score, all with placeholder portraits.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Toolchain | Node + Vite + TypeScript (existing) |
| Branch | `agent/wp-spec-a2-chargen-dossier` (agent creates; does not push) |
| Precondition | Spec A1 merged to `main` (reconciled engine, typed protagonist state, scoring function) |

---

### Scope

**Pre-existing (do not create):**

- The reconciled engine from spec A1: trait system, behavior flags, scoring cascade, typed protagonist state fields, `rerollCount`
- The UI layer under `src/ui/` (screens, hud, dialogue, layout)
- `src/engine/scene-runner.ts` (the run lifecycle entry point)
- `data/config.json` with the locked values and reroll multiplier
- The character-generation design doc and trait system doc

**Modify:**

- `src/ui/screens.ts` — add the dossier screen; extend the ending screen with the score breakdown
- `src/ui/` — new module(s) for chargen/dossier if cleaner than inlining (agent's call)
- `src/engine/scene-runner.ts` — insert chargen + dossier before the lore card in the run-start flow
- `src/engine/game-state.ts` — protagonist generation function and reroll handling (consuming A1's types)
- `src/styles.css` — dossier and score-breakdown styling (token-disciplined; see Notes)
- New file: `data/protagonist-pool.json` — name pools, backstory list, backstory flavor and epilogue text
- New file: `data/backstories.json` or inclusion in protagonist-pool.json — backstory dossier text, monologue triggers, epilogue lines (agent's call on file split)
- The asset manifest / `characters.json` portrait entries for protagonist portraits (placeholder)

**Reference:**

- `game-design/character-generation.md` — generation sequence, name pools, backstory templates, dossier layout, reroll display, portrait strategy, ending variables
- `game-design/2026-05-18-m3-trait-system-v2.md` — authoritative trait display names and descriptions
- `simulation/game_data.py` — trait ids and display names for label parity
- `AGENTS.md` — repository constraints

**Do not touch:**

- The engine mechanics delivered in A1 (trait math, scoring function, clock model). Consume them; do not retune or reimplement. If A1 left a bug, flag it for the orchestrator rather than patching around it.
- `data/events.json`, `data/scenes.json` content bodies (spec B). Adding the backstory monologue *trigger hooks* is permitted only if it requires no rewrite of existing event text; otherwise defer the monologue insertion to spec B and note it.
- Other repositories; git remote operations.

---

### Deliverables & Validation

#### Deliverable 1: Protagonist data and generation

Create `data/protagonist-pool.json` per the design doc: first-name pools A (Mara, Kira, Dani, Joss, Reese, Tamsin, Asha, Lena) and B (Cole, Reza, Hale, Niko, Dex, Marsh, Joaquin, Samir), shared surname pool (Vasquez, Osei, Novak, Tran, Aguilar, Marsh, Reeves, Kato, Adeyemi, Volkov), the six backstory ids, and a reroll-multiplier reference (sourced from config, not duplicated as a balance value). Capture the six backstories' dossier flavor text and correction/destruction epilogue lines with `{name}`/`{pronoun}`/`{station}` variable slots. Implement a generation function that rolls gender 50/50, picks first name from the gendered pool, surname from the shared pool, one backstory, one positive trait, and one negative trait, and returns a fully populated protagonist object matching the A1 state type. Callsign is always RELAY-7.

Validation:

- [ ] `data/protagonist-pool.json` parses and contains both name pools (8 each), the surname pool (10), and the six backstory ids
- [ ] Generation produces a protagonist with gender, first name from the matching gendered pool, surname, one backstory, one positive trait id, one negative trait id
- [ ] The generated protagonist populates the A1 protagonist state type with no type errors; `tsc --noEmit` passes
- [ ] Trait selection draws from the same 8+8 set as `game_data.py` (id and display-name parity)

#### Deliverable 2: Dossier screen

Add a dossier screen to `src/ui/screens.ts` shown at run start before the lore card (and in place of it on repeat runs, per the design doc). Layout per the doc's wireframe: portrait, name and RELAY-7 callsign, assignment line, backstory paragraph, the two trait cards (positive and negative with name and effect summary), and DEPLOY / REROLL buttons. The reroll line shows current reroll count and the resulting score ceiling. DEPLOY commits the protagonist and proceeds to the lore card; REROLL regenerates and increments `rerollCount`, updating the displayed ceiling.

The score ceiling shown is the compounding multiplier from A1 (`0.92 ^ rerollCount`), displayed as a percentage. The design doc's stepped table (100/92/85/78/72%) is illustrative only; show the actual compounding value (100%, 92%, 85%, 78%, 72% happen to be the rounded compounding values for n=0..4, so the doc and the math agree to the displayed precision; continue compounding beyond 4 rather than flooring).

Validation:

- [ ] The dossier screen renders portrait, name, callsign, assignment, backstory text, both trait cards, and DEPLOY/REROLL controls
- [ ] DEPLOY proceeds to the lore card with the committed protagonist; the run uses that protagonist's traits
- [ ] REROLL regenerates the protagonist and increments the displayed reroll count and score ceiling
- [ ] The score ceiling equals `0.92 ^ rerollCount` shown as a percentage and updates on each reroll
- [ ] Variable slots in backstory text resolve to the generated name and pronouns with no literal `{name}` left in the output

#### Deliverable 3: Run-start flow integration

Wire chargen and the dossier into the run lifecycle in `scene-runner.ts`: NEW GAME triggers generation and shows the dossier; DEPLOY transitions to `scene-lore-01`. The protagonist's config-modifier traits are applied to produce the effective run config (via A1's application path), and the behavior flags are active for the run. Reroll count is captured on the committed `GameState` so scoring uses it.

Validation:

- [ ] Selecting NEW GAME shows the dossier before any scene content
- [ ] The committed protagonist's positive and negative trait config modifiers are reflected in the effective run config (e.g. Well-Supplied yields 8 starting modules: 6 base + 2)
- [ ] Behavior flags from the protagonist's traits are active during the run (verifiable by a scripted check or harness assertion from A1)
- [ ] `rerollCount` on the run state matches the number of rerolls the player performed
- [ ] CONTINUE/LOAD paths still work and do not re-trigger generation

#### Deliverable 4: Score breakdown on the ending screen

Extend the existing ending screen in `src/ui/screens.ts` to show the end-of-run score: the letter grade (S/A/B/C/D/F from A1's thresholds), the final score after the reroll multiplier, a short breakdown of the scoring components (ending base, communities helped, rapport, modules remaining, knowledge over threshold, clock remaining), the reroll penalty line if `rerollCount > 0`, the trait epilogue references from the design doc (short run-summary lines, e.g. "Well-Supplied: started with extra modules. You spent X of them."), and the protagonist's backstory epilogue line matching the ending type. The existing rapport-modified narrative epilogue stays; the score breakdown is additive below it.

Validation:

- [ ] The ending screen shows the letter grade and final (post-multiplier) score
- [ ] The component breakdown sums to the raw score before the multiplier is applied
- [ ] The reroll penalty line appears only when `rerollCount > 0` and reflects the compounding multiplier
- [ ] The protagonist's backstory epilogue line for the achieved ending type is shown
- [ ] Trait epilogue reference lines render for the protagonist's two traits
- [ ] The pre-existing community narrative epilogue still renders above the breakdown

#### Deliverable 5: Placeholder portraits and manifest

Add protagonist portrait entries to the asset manifest / `characters.json` using the portrait strategy's mapping: at minimum the "minimum viable" tier (one base per gender), with the name-index-to-portrait mapping implemented so that swapping in the 8-face ideal tier later requires only manifest/data changes, no code. Use placeholder rendering (the existing `placeholderColor`/`placeholderStyle` fallback pattern) so the dossier and in-game portrait show without final art.

Validation:

- [ ] Protagonist portraits resolve through the manifest with placeholder fallbacks; the dossier shows a portrait for any generated protagonist
- [ ] The name-index-to-portrait mapping is data-driven; adding portraits is a data change, not a code change
- [ ] No missing-asset console errors on a full run with placeholders

#### Deliverable 6: Worklog and registry

Write a worklog following the template at `/opt/agents/work-logs/WORKLOG-TEMPLATE-AGENT.md`. Filename: `2026-06-22-wp-worklog-a2-chargen-dossier.md`. Append a summary row to `/opt/agents/work-logs/work-registry.csv`. Specs stay in-repo under `spec/`; do not archive this spec centrally; do not push git. Leave work on the `agent/wp-spec-a2-chargen-dossier` branch with local commits.

Validation:

- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-a2-chargen-dossier.md` with all frontmatter fields populated
- [ ] Work registry CSV has a new row matching this execution
- [ ] All work committed locally on the named branch; nothing pushed; `main` untouched

---

### Constraints

- Spec A1 must be merged before this runs. This spec consumes A1's types and scoring; it does not reimplement engine mechanics.
- Do not retune balance. Trait effects, scoring constants, and the reroll multiplier come from config and A1; this spec presents them, it does not change them.
- Token-disciplined styling. New dossier and score CSS uses the existing engine style vocabulary (dark charcoal panel, teal accents, monospace) and CSS custom properties where the engine already defines them, so a later gameui-framework adoption is a token swap rather than a rewrite. Do not import the gameui framework in this spec.
- Content files (`events.json`, `scenes.json`) are off-limits for body edits; backstory monologue insertion defers to spec B if it would require rewriting existing event text.
- Local git only: branch, commit locally, never push or merge.
- All work within the working directory except worklog and registry paths.

---

### Execution Order

1. Deliverable 1: Protagonist data and generation
2. Deliverable 2: Dossier screen
3. Deliverable 3: Run-start flow integration
4. Deliverable 4: Score breakdown on the ending screen
5. Deliverable 5: Placeholder portraits and manifest
6. Deliverable 6: Worklog and registry

---

### Notes

This spec is the visible half of the roguelike layer; spec A1 is the invisible half. A1 makes the traits *do* something mechanically and computes the score; A2 lets the player *see* their protagonist, choose whether to keep it, and read their result. Neither is complete without the other, which is why they were split at the mechanics/UI seam: A1 is verifiable by numerical parity with the simulator, A2 is verifiable by playing a run.

One carried discrepancy, resolved here: the character-generation doc's reroll table is stepped, the config is a single compounding multiplier. The compounding values round to the doc's table for the first five rerolls, so there is no visible conflict in normal play; implement compounding and let it continue past reroll 4 rather than hard-flooring at 72%.

Styling is deliberately kept in the engine's own vocabulary rather than pulled from the gameui framework. WP is a planned neon-preset consumer of gameui, but that adoption is its own future step; doing it here would couple two in-flight tracks. Keeping the dossier token-disciplined means that adoption is later a token-file swap, not a rebuild. See the gameui repo's own consumer notes for the eventual integration path.

Spec B (production content: 12 events, expanded scenes, comms beats, found documents, corrected gates) is the next spec after this. It depends on the reconciled config schema (A1) and may use the backstory monologue trigger hooks defined here. After B, spec C wires the placeholder-art launch and the Playwright run-walk verification, applying the gameui screenshot-harness pattern to WP.
