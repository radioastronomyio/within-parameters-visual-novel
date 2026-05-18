<!--
---
title: "Spec"
description: "Specifications and archived implementation prompts for Within Parameters"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-05-18"
version: "3.0"
status: "Active"
tags:
  - type: directory-readme
  - domain: methodology
---
-->

# Spec

This directory contains the current SpecSmith specification set for Within Parameters plus the archived prompts that drove earlier implementation work. The current specs use the date-prefixed naming convention.

---

## 1. Contents

```
spec/
├── archive/                                           # Historical implementation prompts and references
│   ├── engine-spec.md
│   ├── wp-mechanical-design-context.md
│   ├── wp-simulator-spec.md
│   ├── wp-sweep-spec.md
│   └── wp-sweep-v2-spec.md
├── 2026-03-15-spec-01-engine-build.md                # Engine build retrospective spec
├── 2026-04-05-spec-02-balance-simulator.md           # Balance simulator retrospective spec
├── 2026-04-06-spec-03-balance-sweep-v1.md            # First balance sweep retrospective spec
├── 2026-04-06-spec-04-balance-sweep-v2.md            # Second balance sweep retrospective spec
├── 2026-05-18-spec-05-code-commenting-and-cleanup.md # Agent-executable cleanup spec
└── README.md                                         # This file
```

---

## 2. Files

| File | Description | Status |
|------|-------------|--------|
| [2026-03-15-spec-01-engine-build.md](2026-03-15-spec-01-engine-build.md) | Visual novel engine build: layout, dialogue, stats, events, saves | Complete |
| [2026-04-05-spec-02-balance-simulator.md](2026-04-05-spec-02-balance-simulator.md) | Monte Carlo simulator: heuristic agent, run batches, heatmaps | Complete |
| [2026-04-06-spec-03-balance-sweep-v1.md](2026-04-06-spec-03-balance-sweep-v1.md) | First parameter sweep: 33 configs and structural failure analysis | Complete |
| [2026-04-06-spec-04-balance-sweep-v2.md](2026-04-06-spec-04-balance-sweep-v2.md) | Structural fixes and exploratory sweep that found the locked config | Complete |
| [2026-05-18-spec-05-code-commenting-and-cleanup.md](2026-05-18-spec-05-code-commenting-and-cleanup.md) | Dual-audience commenting, README fixes, and repository cleanup | Ready |

---

## 3. Subdirectories

| Directory | Description |
|-----------|-------------|
| [archive/](archive/) | Original prompts and reference documents preserved for historical comparison |

---

## 4. Related

| Document | Relationship |
|----------|--------------|
| [Game Design Document](../game-design/game-design-document.md) | Design authority for mechanics, narrative, and scope |
| [M3 Content Design](../game-design/m3-content-design-draft.md) | Event, NPC, dialogue, and ending content source |
| [Character Generation](../game-design/character-generation.md) | Protagonist generation, dossier, and trait presentation |
| [SpecSmith Case Study](../docs/wp-specsmith-case-study.md) | Methodology case study moved to project documentation |
| [SpecSmith Repository](https://github.com/radioastronomyio/specsmith) | External methodology reference |

---

## 5. Archive

The `archive/` directory keeps the original implementation-prescriptive specs as written. These filenames remain unchanged because they document the earlier workflow.

| Original | Executed By | Result |
|----------|-------------|--------|
| [archive/engine-spec.md](archive/engine-spec.md) | Claude Code | 22 files, 0 TypeScript errors, 13m38s |
| [archive/wp-simulator-spec.md](archive/wp-simulator-spec.md) | GLM-5.1 / OpenCode | Simulator built, first run: 99.7% correction |
| [archive/wp-sweep-spec.md](archive/wp-sweep-spec.md) | GLM-5.1 / OpenCode | 33 configs, best result 4/6, 21m |
| [archive/wp-sweep-v2-spec.md](archive/wp-sweep-v2-spec.md) | GLM-5.1 / OpenCode | 38 configs, 6/6 result, 25m |
| [archive/wp-mechanical-design-context.md](archive/wp-mechanical-design-context.md) | Reference doc | Consolidated stat model for simulator input |
