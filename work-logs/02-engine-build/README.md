<!--
---
title: "Phase 02: Engine Build"
description: "Engine specification, agent build, code review, and bug fixes"
author: "VintageDon + Claude"
date: "2026-03-15"
version: "1.0"
status: "Complete"
tags:
  - type: worklog
  - domain: [engine, methodology]
---
-->

# Phase / Milestone 02: Engine Build

## Summary

| Attribute | Value |
|-----------|-------|
| Status | Complete |
| Sessions | 2 (mechanics finalization + engine spec/build) |
| Date | 2026-03-15 |
| Artifacts | 22 source files, 1 CSS file, 5 data JSON files, engine spec |
| Agent runtime | Claude Code (13m 38s build), KiloCode + GLM-5 (code review) |

Objective: Finalize game mechanics, write a complete engine specification, and build the visual novel engine from spec using AI coding agents.

Outcome: All mechanics locked. Engine spec written as a prescriptive 22-file specification with complete TypeScript interfaces. Claude Code built the entire engine from spec with zero TypeScript errors. Post-build code review by KiloCode/GLM-5 found five bugs, all patched. Engine confirmed working end-to-end with placeholder assets.

---

## 1. Contents

```
02-engine-build/
└── README.md               # This file
```

---

## 2. Work Completed

### Session 1: Mechanics Finalization

Design review and mechanics finalization session. Resolved all remaining open questions from the GDD.

| Decision | Resolution | Rationale |
|----------|------------|-----------|
| Resource trilemma | Knowledge (accumulator), Consumables (spendable), Rapport (derived) | Three orthogonal resource types with different management patterns |
| Clock reduction as third reward | Scales with rapport, creates painful three-way choice | When clock is high and rapport is high but modules are depleted, every reward option hurts |
| Community states | Concrete flags (helped/ignored/harmed) not abstract numbers | Rapport derived from flags; epilogues name specific communities and their outcomes |
| Ending count | 3 (clock loss, destruction, correction) | Simplified from 5; rapport modifies epilogue quality within each ending |
| Setting confirmation | All underground, DC metro + maintenance tunnels + data center | No surface scenes; the protagonist never leaves the infrastructure |

### Session 2: Engine Spec and Build

| Task | Description | Result |
|------|-------------|--------|
| Tech stack decision | Evaluated z.ai reference projects (Metro 2033 VN, Depths of Dagger) | Vite + TypeScript, vanilla DOM. No framework. KISS for portfolio teaching value. |
| Engine spec | Complete 22-file specification with TypeScript interfaces, component specs, build order, CSS design language | `spec/engine-spec.md` |
| Agent build | Handed spec to Claude Code | 22 files built, zero TypeScript errors, 13m 38s |
| Code review | KiloCode + GLM-5 reviewed all source files | 5 bugs identified |
| Bug fixes | PowerShell patch script written and applied | All 5 bugs resolved, clean build confirmed |
| End-to-end validation | Dev server verified | Three-pane layout, sidebar stats, community timeline, placeholder portraits, knowledge-gated choices all functional |

### Post-Build Bugs

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Black screen on launch | Bottom bar hidden in fullscreen mode | CSS visibility fix |
| 2 | Background not rendering | `setBackground` property ordering | Reorder property assignment |
| 3 | Duplicate scene flags | `scenes.json` had duplicate flag entries | Remove duplicates |
| 4 | Rewards never trigger | Missing `eventSceneComplete()` call | Add call after event choice resolution |
| 5 | Consumable display wrong | Pip display floor of 5 | Fix display calculation |

All five bugs were in areas where the spec was silent or ambiguous. This confirmed the SpecSmith axiom: spec gaps surface as bugs, not as helpful agent improvisation.

---

## 3. Artifacts Produced

| Artifact | Type | Location |
|----------|------|----------|
| Engine Spec | spec | `spec/engine-spec.md` (original), `spec/01-engine-build.md` (SpecSmith retrospective) |
| TypeScript source (22 files) | code | `src/` |
| CSS styles | code | `src/styles.css` |
| Data JSON files (5) | data | `data/` |
| HTML entry point | code | `index.html` |
| Vite config | config | `vite.config.ts`, `tsconfig.json`, `package.json` |

---

## 4. Key Decisions

| Decision | Rationale |
|----------|-----------|
| Prescriptive spec (not outcome-driven) | Tight scope, solo developer, wanted zero-iteration first build. Tradeoff: constrained agent architecture choices. |
| Vanilla DOM, no framework | KISS. Public repo teaching value. Clean static output for Azure Static Web Apps. |
| Immutable state pattern | All mutations return new GameState. Rapport derived, never stored. Save snapshots trivial. |
| Placeholder-first | Engine must work with zero real assets. CSS gradients for backgrounds, colored rectangles for portraits. |
| Data-driven events | Events, scenes, characters in JSON. Engine is scenario-agnostic. |

---

## 5. Next Phase

Handoff: Engine is complete and functional. Content design (M3) can begin: NPC profiles, event pool with dialogue, character generation system, trait design, and balance validation.
