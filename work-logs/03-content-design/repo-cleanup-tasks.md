<!--
---
title: "Repo Cleanup Task List"
description: "Files needing updates or creation before initial commit"
author: "VintageDon"
date: "2026-04-05"
status: "Active"
tags:
  - type: worklog
  - domain: methodology
---
-->

# Repo Cleanup Task List — Pre-Commit

Generated from full directory audit, 2026-04-05. For agent execution (Claude Code / Sonnet).

**Rule:** Read `AGENTS.md` first. Match the style and conventions of surrounding files. Use templates from `docs/documentation-standards/` where applicable. Do not modify any design documents, spec files, or engine source. This task is documentation and scaffolding only.

---

## Critical (Done — Do Not Touch)

These were handled in the strategic session and should not be modified:

- [x] `.gitignore` — removed `spec/` from exclusions, added `simulation/output/*.png` and `simulation/output/*.csv`
- [x] `AGENTS.md` — full rewrite, Phase 2
- [x] `README.md` — full rewrite, current status
- [x] `LICENSE` — placeholders filled (2026, VintageDon)
- [x] `LICENSE-DATA` — placeholders filled (2026, VintageDon)
- [x] `game-design/game-design-document.md` — open questions closed, new systems section added
- [x] `game-design/character-generation.md` — new file, written
- [x] `docs/documentation-standards/tagging-strategy.md` — added `balance` domain, `python` tech tag
- [x] `work-logs/03-content-design/README.md` — session worklog written

---

## Files to Copy (Manual — User Action)

These files exist in the user's downloads from the Claude.ai session. Copy to repo:

| Source (downloads) | Destination | Notes |
|-------------------|-------------|-------|
| `m3-content-design-draft.md` | `game-design/m3-content-design-draft.md` | Full event pool, NPCs, comms beats, found docs, endings |
| `wp-mechanical-design-context.md` | `spec/wp-mechanical-design-context.md` | Consolidated stat model reference for simulator |
| `Roguelike_Trait_Balance_Simulation.md` | `work-logs/03-content-design/gdr-trait-balance-results.md` | GDR output |

---

## Interior READMEs to Update (Agent Task)

### 1. `docs/README.md`

**Problem:** References `within-parameters-game-design-document.md` which doesn't exist at that path. The GDD is at `game-design/game-design-document.md`. Tree structure is wrong.

**Fix:** Rewrite to reflect current docs/ contents (only `documentation-standards/` subdirectory). Remove the stale GDD reference. The docs/ directory contains documentation standards, not design documents.

### 2. `game-design/README.md`

**Problem:** File inventory table only lists 3 files (GDD, storyboard, art bible). Missing `m3-content-design-draft.md` and `character-generation.md`. "Planned Additions" section lists 9 items, most of which are now complete and exist as files.

**Fix:** Update contents table to include all 5 files with current status. Replace "Planned Additions" with a "Related Specifications" section pointing to `spec/m3-trait-system-v2.md` and `spec/wp-simulator-spec.md`. Add frontmatter.

### 3. `spec/README.md`

**Problem:** Only lists `engine-spec.md`. Missing `m3-trait-system-v2.md`, `wp-simulator-spec.md`, `wp-mechanical-design-context.md`. "Planned Additions" is stale.

**Fix:** Update contents table to include all 4 spec files. Remove "Planned Additions." Add frontmatter.

### 4. `work-logs/README.md`

**Problem:** Tree structure shows placeholder `[03-domain-specific]` instead of actual `03-content-design/`. Also shows `01-concept-and-art-direction/` which exists.

**Fix:** Update tree to show all three actual subdirectories: `01-concept-and-art-direction/`, `01-ideation-and-setup/`, `02-github-project-frameout/`, `03-content-design/`. Add brief description of each.

### 5. `work-logs/01-concept-and-art-direction/README.md`

**Problem:** Status says "In Progress" but this milestone is complete. Artifact paths reference `spec/game-design-document.md` and `spec/art-direction-bible.md` which are wrong (files are in `game-design/`).

**Fix:** Change status to "Complete." Fix artifact paths to `game-design/game-design-document.md` and `game-design/art-direction-bible.md`. Update the frontmatter status tag.

---

## New Files to Create (Agent Task)

### 6. `simulation/README.md`

**Content:** Interior README for the simulation directory. Reference the simulator spec at `spec/wp-simulator-spec.md`. Note that the simulator is not yet built. Describe purpose: Monte Carlo balance validation of the 64-cell trait matrix. Mention expected files: `simulator.py`, `game_data.py`, `output/`.

### 7. `simulation/output/.gitkeep`

**Content:** Empty file. Ensures the output directory exists in git while its contents (PNGs, CSVs) are gitignored.

### 8. `data/README.md`

**Content:** Interior README for the data directory. List all 5 JSON files with brief descriptions. Note that `scenes.json` and `events.json` contain test/placeholder content pending content build from `game-design/m3-content-design-draft.md`. Reference `data/config.json` as the baseline game config (trait-modifiable values).

### 9. `assets/README.md`

**Content:** Interior README for assets directory. Note that `concept-artwork/` contains NightCafe DreamShaper XL Lightning drafts organized by scene. Reference art direction bible at `game-design/art-direction-bible.md`. Note that production assets are pending the NB2 sprint.

### 10. `assets/concept-artwork/README.md`

**Content:** Interior README listing the 8 scene directories plus `ui/` with the NB2 mockup. Reference art bible for scene descriptions and generation prompts.

---

## Low-Priority Cleanup (Agent Task, Optional)

### 11. `work-logs/milestones-one-and-two-procedures.md`

**Problem:** References `.kilocode/rules/memory-bank/` in Phase C Documentation. That pattern is dead. AGENTS.md is now the sole agent context document.

**Fix:** Replace all memory bank references with AGENTS.md. Remove the memory bank file list from Phase C. Note that the milestones procedure is a general-purpose document and may be updated in the project-template-repository upstream.

### 12. `work-logs/01-ideation-and-setup/README-pending.md`

**Status:** Empty pending file. M01 was completed but the worklog was never written. Can remain as-is (pending files are gitignored) or be replaced with a brief summary README.

### 13. `work-logs/02-github-project-frameout/README-pending.md`

**Status:** Empty pending file. M02 was explicitly skipped. Can remain as-is or the directory can be removed/renamed to indicate it was skipped.

### 14. `shared/README.md`

**Problem:** "Last Updated: 2025-01-01" is clearly a template default. Minor.

**Fix:** Update date to 2026-03-29 or current. Add frontmatter.

---

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| Manual copy | 3 | Session output files to place in repo |
| README updates | 5 | Stale interior READMEs with wrong paths/content |
| New files | 5 | Missing READMEs and simulation scaffolding |
| Low-priority | 4 | Stale dates, dead pattern references, empty pendings |
