<!--
---
title: "WP Placeholder-Art Launch and Playwright Run-Walk Verification"
description: "Complete the placeholder asset manifest pass and build the launch-gate Playwright harness that plays a full game and verifies every screen renders error-free"
author: "https://github.com/vintagedon/"
date: "2026-06-22"
version: "1.0"
status: "Ready"
tags:
  - type: specification
  - domain: [launch, qa, assets]
  - tech: [typescript, vite, playwright]
related_documents:
  - "[AGENTS.md](../AGENTS.md)"
  - "[M3 Asset Manifest](../game-design/m3-content-design-draft.md)"
  - "[Spec 02: GameUI Consumer Integration](spec-02-gameui-consumer-integration.md)"
  - "[Spec 04: Production Content](spec-04-production-content.md)"
---
-->

## Task: WP Placeholder-Art Launch and Playwright Run-Walk Verification

Mode: Code

---

### Objective

Within Parameters is launch-ready on placeholder art. The asset manifest carries a complete placeholder set for every background, portrait, and audio cue the production content references, with the swap-to-final pipeline intact (replacing a placeholder is a manifest/file change, no code). A launch-gate Playwright harness boots the game and plays complete runs across multiple seeded protagonists and divergent choice paths, asserting every screen renders, no console errors or failed requests occur, and all three endings are reachable. The harness is the launch gate: passing it means the game is playable start to finish, balanced, content-complete, and visually coherent on placeholders, with only the production art sprint remaining before release.

---

### Execution Environment

| Field | Value |
|-------|-------|
| Host | ML01 |
| OS | Ubuntu 24.04 |
| Agent Runtime | OpenCode (GLM-5.2) |
| Working Directory | `/opt/agents/repos/within-parameters-visual-novel/` |
| Toolchain | Node + Vite + TypeScript; headless Playwright (Chromium) on ML01 |
| Branch | `agent/wp-spec-05-launch-verification` (agent creates; does not push) |
| Precondition | Specs 01-04 merged (reconciled engine, framework UI, roguelike layer, production content) |

---

### Scope

**Pre-existing (do not create):**

- The complete game: reconciled engine, framework UI, chargen/dossier/score, production content
- The Playwright harness extended across specs 02/03/04 (the step-structured walk)
- The asset manifest / `characters.json` and existing placeholder assets
- The placeholder generation approach already used in the repo (e.g. `simulation/generate_placeholders.py` or equivalent)
- The M3 asset manifest (the canonical asset list)

**Modify:**

- The asset manifest / `characters.json` — complete the placeholder coverage for all M3-listed backgrounds, portraits, and audio
- `tests/` — finalize the launch-gate harness (multi-seed, multi-path, all-endings)
- `package.json` — a single launch-gate script entry if not present
- Placeholder generation script — extend to cover any missing manifest entries

**Reference:**

- `game-design/m3-content-design-draft.md` §8 — the canonical background (13) and portrait list
- `data/` content — the assets actually referenced by production scenes, events, NPCs
- The framework's own Playwright harness (`vendor/gameui/tests/` or the framework repo) — pattern reference for screenshot capture and baseline structure
- `AGENTS.md`

**Do not touch:**

- Engine mechanics, balance, content text (all locked by prior specs). This spec verifies and completes asset coverage; it does not change the game.
- Final art. This spec is placeholders only; production art is a later, separate effort.
- The vendored framework tree.
- Git remote operations.

---

### Deliverables & Validation

#### Deliverable 1: Complete placeholder asset coverage

Audit every asset reference in the production content (backgrounds per scene, portraits per NPC and expression, audio per scene/cue) against the manifest, and generate placeholders for any missing entry using the repo's existing placeholder approach (labeled background images at 1280x720, labeled portrait placeholders, silent or tone audio stubs where a cue is referenced but no file exists). The M3 §8 manifest lists 13 backgrounds and the NPC portrait set; protagonist portraits come from spec 03. Every referenced key resolves to a file or a manifest fallback.

Validation:

- [ ] Every background, portrait, and audio key referenced anywhere in `data/` resolves through the manifest to a file or a defined placeholder fallback
- [ ] The 13 M3 backgrounds and all NPC expression portraits have placeholder coverage
- [ ] A full playthrough produces zero missing-asset console warnings or 404s
- [ ] The swap-to-final pipeline is intact: replacing a placeholder file or manifest path requires no code change (documented in a short manifest README note)

#### Deliverable 2: Multi-seed, multi-path launch harness

Finalize the Playwright launch-gate harness to play complete runs that exercise the game's variability: at least several seeded protagonists (covering different trait pairs and at least one reroll), and choice paths that reach all three endings (correction, destruction, clock-failure). The harness drives real input through the framework UI (dossier DEPLOY/REROLL, event choices, reward selection, settings, save/load) and asserts each run completes to an ending screen with a rendered score.

Validation:

- [ ] The harness plays at least 3 complete runs with different seeded protagonists, including one with a reroll
- [ ] Choice scripting reaches all three endings across the run set (correction, destruction, clock-failure)
- [ ] Each run reaches an ending screen with a rendered grade and score breakdown
- [ ] Save and load are exercised mid-run in at least one path and resume correctly
- [ ] The harness runs from a single documented command

#### Deliverable 3: Error and integrity assertions

The harness asserts launch-quality integrity across every run: zero console errors, zero unhandled promise rejections, zero failed network requests (and zero non-origin requests, confirming the self-contained framework and assets), and no NaN/undefined leaking into displayed stats or scores. Any assertion failure fails the gate with a clear report of which run, seed, and step triggered it.

Validation:

- [ ] Every run asserts zero console errors and zero unhandled rejections
- [ ] Every run asserts zero failed and zero non-origin network requests
- [ ] Displayed stats, clock, and score values are asserted to be finite numbers (no NaN/undefined render)
- [ ] A failure names the run, seed, and step
- [ ] The gate exits non-zero on any failure, zero on full pass

#### Deliverable 4: Screen-flow capture and launch baseline

Capture the full screen flow in the neon preset as the launch baseline: title, dossier (initial and post-reroll), lore, dispatch, a journey event with choices, a found document, a comms beat, reward selection, the confrontation, and each of the three endings with score breakdown. These become the committed launch baseline, superseding the per-spec captures. Provide a short visual-review index (a generated HTML or markdown contact sheet) so the orchestrator can eyeball the whole game at once.

Validation:

- [ ] The launch baseline captures every listed screen in neon, including all three endings
- [ ] A review index (contact sheet) links or embeds the captures for one-glance review
- [ ] Baselines are committed under the repo's test location
- [ ] The capture set is regenerable from the documented command

#### Deliverable 5: Launch readiness summary and worklog

Write a launch-readiness summary recording what passed, the seeds and paths exercised, the ending coverage, the placeholder-vs-final asset status, and the explicit remaining work (production art sprint). Write a worklog (`2026-06-22-wp-worklog-05-launch-verification.md`) per the template and append to the registry. Specs stay in-repo; no central archive; no git push; leave work on the branch.

Validation:

- [ ] A launch-readiness summary exists recording pass status, coverage, and remaining work
- [ ] The summary states clearly that the game is content-complete and launch-ready on placeholders, art pending
- [ ] Worklog exists at `/opt/agents/work-logs/2026-06-22-wp-worklog-05-launch-verification.md` with all frontmatter
- [ ] Work registry CSV updated; all work committed locally on the branch; `main` untouched

---

### Constraints

- Specs 01-04 must be merged. This spec verifies and completes; it does not change engine, balance, content, or UI behavior.
- Placeholders only. No production art. The point is to prove the game is done except for art.
- The harness is the gate. It must be runnable as one command and must fail loudly and specifically.
- Self-contained integrity: the no-non-origin-request assertion is a real requirement, confirming the framework and assets ship without external dependencies.
- Local git only: branch, commit locally, never push or merge.
- All work within the working directory except worklog and registry paths.

---

### Execution Order

1. Deliverable 1: Complete placeholder asset coverage
2. Deliverable 2: Multi-seed, multi-path launch harness
3. Deliverable 3: Error and integrity assertions
4. Deliverable 4: Screen-flow capture and launch baseline
5. Deliverable 5: Launch readiness summary and worklog

---

### Notes

This is the launch gate, not new game development. By the time it runs, the game is built: spec 01 made it correct, spec 02 made it coherent, spec 03 made it a roguelike, spec 04 filled it with content. This spec proves all of that holds together across the game's actual variability, and completes the one mechanical loose end (full placeholder asset coverage) so nothing 404s.

The multi-seed requirement matters because the game's whole pitch is run variability: 384 mechanically distinct protagonist combinations and a 5-of-12 event draw. A single scripted run proves almost nothing about a roguelike. Several seeds across different trait pairs, with all three endings reached, is the minimum that demonstrates the systems hold under variety. The headless GPU Playwright on ML01 makes this a normal task rather than a heroic one: the agent plays its own game many times and judges the result.

After this gate passes, the only remaining work before release is the production art sprint (NightCafe pipeline: DreamShaper XL Lightning for the WP aesthetic, finals at 4K, the established placeholder-to-final swap). That is explicitly out of scope here and is its own effort. The "agent plays the game" ambition from early planning is effectively realized by this harness; extending it toward richer autonomous playtesting (balance telemetry from real playthroughs, difficulty feedback) is a possible future direction, not a launch requirement.
