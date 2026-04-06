<!--
---
title: "Spec"
description: "Specifications, retrospectives, and reference documents for Within Parameters"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-04-06"
version: "2.0"
status: "Active"
tags:
  - type: directory-readme
  - domain: [engine, balance, methodology]
---
-->

# Spec

Technical specifications for Within Parameters. This directory contains both the original implementation-prescriptive specs (in `archive/`) and SpecSmith canonical retrospectives showing what outcome-driven versions would have looked like.

This project uses the [SpecSmith](https://github.com/radioastronomyio/specsmith) methodology.

---

## 1. Contents

### SpecSmith Retrospective Specs

Outcome-driven rewrites of the original specs, written after the work was complete. Each includes test gates, constraints, and retrospective notes in HTML comments documenting what worked and what SpecSmith would have changed.

| Spec | Status | Description |
|------|--------|-------------|
| [01-engine-build.md](01-engine-build.md) | Complete | Visual novel engine: three-pane layout, dialogue, stats, events, saves |
| [02-balance-simulator.md](02-balance-simulator.md) | Complete | Monte Carlo simulator: 640K runs, heuristic agent, heatmaps |
| [03-balance-sweep-v1.md](03-balance-sweep-v1.md) | Complete | Parameter sweep: 33 configs, identified 3 structural failures |
| [04-balance-sweep-v2.md](04-balance-sweep-v2.md) | Complete | Structural fixes + exploration: found 6/6 winning config |

### Agent-Executable Specs

| Spec | Status | Description |
|------|--------|-------------|
| [05-code-commenting-and-cleanup.md](05-code-commenting-and-cleanup.md) | Ready | Dual-audience commenting, README fixes, repo cleanup |

### Reference Documents

| Document | Description |
|----------|-------------|
| [m3-trait-system-v2.md](m3-trait-system-v2.md) | Authoritative trait definitions, interaction matrix, scoring |
| [wp-specsmith-case-study.md](wp-specsmith-case-study.md) | Case study: how spec-driven development shaped this project |

### Archive (Original Specs As-Written)

The specs that were actually executed by coding agents. Preserved for historical reference and as SpecSmith comparison material.

| Original | Executed By | Result |
|----------|-------------|--------|
| [archive/engine-spec.md](archive/engine-spec.md) | Claude Code | 22 files, 0 TS errors, 13m38s |
| [archive/wp-simulator-spec.md](archive/wp-simulator-spec.md) | GLM-5.1 / OpenCode | Simulator built, first run: 99.7% correction |
| [archive/wp-sweep-spec.md](archive/wp-sweep-spec.md) | GLM-5.1 / OpenCode | 33 configs, best 4/6, 21m |
| [archive/wp-sweep-v2-spec.md](archive/wp-sweep-v2-spec.md) | GLM-5.1 / OpenCode | 38 configs, 6/6 found, 25m |
| [archive/wp-mechanical-design-context.md](archive/wp-mechanical-design-context.md) | (reference doc) | Consolidated stat model for simulator input |

---

## 2. Related

| Document | Location | Relationship |
|----------|----------|-------------|
| [Game Design Document](../game-design/game-design-document.md) | game-design/ | Authoritative design reference |
| [M3 Content Design](../game-design/m3-content-design-draft.md) | game-design/ | Events, NPCs, dialogue, endings |
| [Character Generation](../game-design/character-generation.md) | game-design/ | Name pools, backstories, dossier |
| [SpecSmith Repository](https://github.com/radioastronomyio/specsmith) | External | Methodology reference |
