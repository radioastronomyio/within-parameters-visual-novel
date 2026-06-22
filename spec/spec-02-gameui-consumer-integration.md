<!--
---
title: "WP GameUI Consumer Integration"
description: "Vendor the GameUI framework into Within Parameters, wire the neon preset, and migrate the existing engine UI surfaces to framework components with Playwright regression proof"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [ui, design-system, engine]
  - tech: [typescript, vite, html, css, playwright]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[GameUI Framework Source Layer](/opt/agents/repos/gameui-browser-gaming-framework/ui/README.md)"
  - "[GameUI Factory Pattern §6](/opt/agents/repos/gameui-browser-gaming-framework/ui/README.md)"
  - "[Spec 01: Engine Reconciliation](spec-01-engine-reconciliation.md)"
---
-->

## Task: WP GameUI Consumer Integration

Mode: Code

---

### Objective

Within Parameters is the first real consumer of the GameUI framework. A pinned copy of the framework's `ui/` tree is vendored into the WP repository, the neon preset is wired into the document, and the existing engine UI surfaces (title, HUD, save/load, settings, ending shell, reward overlay, comms interrupt) are migrated from hand-rolled markup and `styles.css` to GameUI components and the token vocabulary. Playwright captures every migrated screen in the neon preset and a before/after comparison proves no functional regression: the same runs reach the same states, with the UI now rendered through the framework. When complete, WP runs entirely on GameUI's structure and skin, the neon preset is the single styling source, and the game looks coherent and finished with placeholder art. This spec builds the surface that spec 03 (the roguelike layer) composes its new screens on top of.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Framework Source | `/opt/agents/repos/gameui-browser-gaming-framework/ui/` (read-only reference; copy, do not modify in place) |
| Toolchain | Node + Vite + TypeScript; headless Playwright (Chromium) on ML01 |
| Branch | `agent/wp-spec-02-gameui-integration` (agent creates; does not push) |
| Precondition | None on spec 01 (this spec is pure UI and can run in parallel with engine reconciliation); if spec 01 has merged, rebase onto it before finishing |

---

### Scope

**Pre-existing (do not create):**

- The WP engine and UI under `src/` (screens, hud, dialogue, layout, audio)
- `src/styles.css` (the current hand-rolled styling, to be largely replaced)
- `index.html` (the document shell)
- The GameUI framework at `/opt/agents/repos/gameui-browser-gaming-framework/ui/` (the vendor source)
- The git repository (clean working tree)

**Create:**

- `vendor/gameui/` in the WP repo: a verbatim pinned copy of the framework `ui/` tree
- `vendor/gameui/VENDORED.md`: a provenance note recording the source path, the framework version (from its README frontmatter), the copy date, and the refresh procedure

**Modify:**

- `index.html` — add the GameUI `<link>` load order (tokens, neon preset, the component CSS families WP uses) and any import-map entry
- `src/ui/` screens, hud, layout modules — migrate markup and control creation to GameUI classes and factories
- `src/styles.css` — strip the styles now provided by the framework; keep only WP-specific composition rules that have no framework equivalent; migrate any retained custom values onto the token vocabulary
- `package.json` — a Playwright script entry for the screen-capture run if not already present
- New Playwright harness files under `tests/` (or the repo's existing test location)

**Reference:**

- `/opt/agents/repos/gameui-browser-gaming-framework/ui/README.md` — load order (§4), factory pattern and the full factory index (§6), theme-authoring (§3)
- `/opt/agents/repos/gameui-browser-gaming-framework/ui/components/README.md` — family-by-family class and factory scope
- `/opt/agents/repos/gameui-browser-gaming-framework/ui/gallery/index.html` — worked example: real compositions of shell, cards, modal, panels, bars, buttons
- `AGENTS.md` — repository constraints

**Do not touch:**

- The framework repository. Vendor by copy; never edit the source tree, and never make WP reference the framework by an out-of-repo path at runtime (the vendored copy is the only runtime dependency).
- Engine logic under `src/engine/` (this spec is presentation only; if a migration needs an engine hook, expose a minimal accessor and flag it, do not rewrite mechanics)
- `data/` content files
- Git remote operations: branch and commit locally only

---

### Deliverables & Validation

#### Deliverable 1: Vendor the framework and wire the neon preset

Copy the framework `ui/` tree verbatim into `vendor/gameui/` in the WP repo. Add `vendor/gameui/VENDORED.md` recording source path, framework version (read it from the framework README frontmatter), copy date, and the refresh procedure (re-copy the tree, re-run this spec's Playwright capture, review diffs). Wire the document: in `index.html`, load `vendor/gameui/tokens/tokens.css`, then `vendor/gameui/themes/neon.css`, then the component CSS files WP will use (buttons, panels, stat-displays, modals, toasts, settings, layout, loading, cards as needed), in that order, before WP's own `styles.css`. Confirm zero non-origin network requests are introduced (the framework is self-contained; fonts and assets are local).

Validation:

- [ ] `vendor/gameui/` contains the full framework tree (tokens, themes, components, and any assets/fonts the used components reference)
- [ ] `vendor/gameui/VENDORED.md` records source, version, date, and refresh steps
- [ ] `index.html` loads tokens then neon preset then component CSS then `styles.css`, in that order
- [ ] The running game makes no network request beyond its own origin (verify in the Playwright run: no external font/asset/script fetches)
- [ ] `npm run dev` (or the repo's dev command) serves the game without console errors after wiring

#### Deliverable 2: Migrate the HUD to framework stat displays and panels

The in-game HUD (Knowledge, the modules/consumables stat, the Intrusion Clock, rapport, stop indicator) migrates to GameUI stat-display and panel components. Use `.gui-bar` linear and `.gui-bar--segmented` markup for the stats per the gallery's stat-display specimens (the clock is a natural segmented bar: filled pips for elapsed, empty for remaining). Wrap the HUD in a `.gui-panel` with the appropriate accent. The `--amount` custom property drives linear fills; pip `.is-filled` count drives segmented bars. Keep the WP stat semantics and the engine bindings; only the rendering changes.

Validation:

- [ ] HUD stats render as GameUI bars (linear and/or segmented) inside a GameUI panel
- [ ] The Intrusion Clock renders as a segmented bar whose filled pip count tracks the clock value against its max
- [ ] Live stat updates during a run move the bars (the engine binding still drives the values)
- [ ] No HUD styling remains in `styles.css` that duplicates a framework class
- [ ] Playwright screenshot of the in-game HUD in neon shows the migrated components

#### Deliverable 3: Migrate title, settings, save/load, and overlays to framework components

Migrate the remaining existing screens:

- Title screen: buttons become `.gui-btn` variants (primary for NEW GAME/CONTINUE, ghost/outline for secondary). Layout via `createShell` or framework layout if it simplifies; otherwise framework button and panel classes on the existing structure.
- Settings: replace the hand-rolled controls with the settings factories: `createToggle`, `createSwitch`, `createSlider`, `createSelect` (e.g. volume sliders, mute toggle, text-speed select), each wired to WP's existing settings state via `onChange`.
- Save/load: present slots in `.gui-panel` containers with `.gui-btn` actions; the overwrite-save confirm and the load-confirm use the `createModal` dialog factory with `gui-modal--dialog gui-modal--danger` for destructive confirms (per the gallery confirm-dialog specimen).
- Reward overlay and comms interrupt: render in framework panels/modals as appropriate, preserving their existing trigger logic and content.

Use the factory index from the framework README §6 for exact signatures: `createButton({ label, accent, variant, onClick })`, `createSlider({ label, min, max, value, accent, onChange })`, `createModal({ ... open/close/setButtons/onClose })`, etc.

Validation:

- [ ] Title, settings, save/load, reward overlay, and comms interrupt render through GameUI components
- [ ] Settings controls are the GameUI factories and their `onChange` callbacks drive the same settings state as before
- [ ] Destructive confirms (overwrite save, load over current run) use the `createModal` danger dialog
- [ ] All pre-existing flows still work: save, load, delete slot, change a setting and see it take effect, trigger and dismiss a reward overlay and a comms interrupt
- [ ] Playwright screenshots of each screen in neon show the migrated components with no console errors

#### Deliverable 4: Reduce styles.css to WP-specific composition only

After migration, `styles.css` contains only what the framework does not provide: WP-specific layout composition, the dialogue/VN presentation layer (portrait placement, dialogue box, speaker name treatment if not already a framework concern), and scene-transition styling. Every retained custom color, spacing, or font value is expressed through the GameUI token vocabulary (`var(--gui-*)`) rather than literals, so a future preset change reaches WP too. Remove dead rules superseded by framework components.

Validation:

- [ ] `styles.css` no longer contains rules duplicating framework component styles (buttons, panels, bars, modals, toasts, settings controls)
- [ ] Retained custom values reference GameUI tokens, not raw hex/px literals, wherever a token exists for the role (audit: `grep -nE "#[0-9a-fA-F]{3,8}" src/styles.css` returns only values with no token equivalent, each justified by a comment)
- [ ] The VN-specific presentation (dialogue box, portraits, transitions) still renders correctly
- [ ] `tsc --noEmit` passes and the build succeeds

#### Deliverable 5: Playwright regression harness and neon screen capture

Build a Playwright (Chromium headless) harness that boots the game on the dev server and drives it through each migrated screen, capturing a neon screenshot of each: title, dossier-absent run start (lore card), in-game HUD mid-run, settings, save/load with a confirm dialog open, reward overlay, comms interrupt, and the ending shell. The harness asserts no console errors across the walk. Commit the captures as the WP neon baseline (mirroring the framework's own baseline pattern). The harness is the regression proof: it demonstrates the migration preserved every screen and flow.

Because spec 03 will add the dossier and score screens to this same flow, structure the harness so adding screens later is a small extension, not a rewrite (a list of named steps, each capturing a screenshot, is sufficient).

Validation:

- [ ] A Playwright run boots the game and walks title to ending, capturing a neon screenshot per screen
- [ ] The walk asserts zero console errors and zero failed network requests
- [ ] Baseline screenshots are committed under the repo's test location
- [ ] The harness is step-structured so spec 03 can append the dossier and score screens
- [ ] A short `tests/README.md` (or harness header) documents how to run the capture and where baselines live

#### Deliverable 6: Worklog and registry

Write a worklog following the template at `/opt/agents/work-logs/WORKLOG-TEMPLATE-AGENT.md`. Filename: `2026-06-22-wp-worklog-02-gameui-integration.md`. Append a row to `/opt/agents/work-logs/work-registry.csv`. Specs stay in-repo under `spec/`; do not archive centrally; do not push git. Leave work on the `agent/wp-spec-02-gameui-integration` branch with local commits.

Validation:

- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-02-gameui-integration.md` with all frontmatter fields populated
- [ ] Work registry CSV has a new row matching this execution
- [ ] All work committed locally on the named branch; nothing pushed; `main` untouched

---

### Constraints

- Vendor by copy. `vendor/gameui/` is the only runtime dependency on the framework; never reference the framework repo by path at runtime. Do not edit the framework source tree.
- Presentation only. This spec changes how things render, not what the engine computes. If a migration appears to need an engine change, expose a minimal read accessor and flag it for the orchestrator rather than altering mechanics.
- Token discipline. Retained custom CSS uses GameUI tokens, not literals, wherever a token role exists. New WP composition should read as a framework consumer, not a parallel style system.
- No content edits. `data/` is off-limits.
- Local git only: branch, commit locally, never push or merge.
- All work within the working directory except worklog and registry paths.

---

### Execution Order

1. Deliverable 1: Vendor the framework and wire the neon preset
2. Deliverable 2: Migrate the HUD
3. Deliverable 3: Migrate title, settings, save/load, and overlays
4. Deliverable 4: Reduce styles.css to WP-specific composition
5. Deliverable 5: Playwright regression harness and neon screen capture
6. Deliverable 6: Worklog and registry

---

### Notes

This spec and spec 01 are independent: 01 is pure engine (mechanics and scoring), 02 is pure presentation (framework adoption). They can run in either order or in parallel. They converge at spec 03, which needs 01's scoring and typed state and 02's framework-based UI to build the dossier and score screens. If both 01 and 02 land before 03, 03 has the cleanest possible foundation.

The framework was built with Within Parameters named as its first neon consumer; the worked-example view in the gallery (`ui/gallery/index.html`, "Worked Example") is a direct reference for composing shell, panels, cards, bars, buttons, and a confirm modal into a real game screen. Lean on it; the patterns WP needs are demonstrated there.

The one judgment call worth getting right: how much of the dialogue/VN presentation layer (portraits, dialogue box, name plates) is a framework concern versus WP-specific. The framework has panels and cards but no dialogue-box component; the VN presentation is legitimately WP-specific and stays in `styles.css`, expressed through tokens. Do not invent a dialogue component in the framework or in WP's vendored copy; that would be scope creep into the framework's domain.

Spec 03 (roguelike layer: chargen, dossier, reroll, score breakdown) composes its new screens from the same GameUI cards, panels, modals, and buttons vendored here. Spec 04 (production content) and spec 05 (placeholder-art launch and full Playwright run-walk) follow.
