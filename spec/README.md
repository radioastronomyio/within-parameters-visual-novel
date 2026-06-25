<!--
---
title: "Spec"
description: "Local archive of original implementation prompts for Within Parameters; active specs live in the central queue"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-06-25"
version: "4.0"
status: "Active"
tags:
  - type: directory-readme
  - domain: methodology
---
-->

# Spec

Active Within Parameters specs live in the central spec queue, not in this repository. This directory retains only the historical `archive/` of original implementation prompts kept for reference.

---

## 1. Where active specs live

| Location | Contents |
|----------|----------|
| `/opt/agents/repos/spec/` | Active, not-yet-executed specs (the live work queue) |
| `/opt/agents/repos/spec/<YYYY-MM>/` | Executed specs, archived by month on closeout |
| `/opt/agents/repos/work-logs/` | Matching worklogs and the work registry |

Specs follow the `YYYY-MM-DD-wp-spec-NN-topic.md` convention and are authored from the `spec-driven-prompt` skill, opened by `spec-startup` and closed by `spec-closeout`.

---

## 2. Contents

```
spec/
├── archive/        # Original implementation-prescriptive prompts, preserved
└── README.md       # This file
```

---

## 3. Subdirectories

| Directory | Description |
|-----------|-------------|
| [archive/](archive/) | Original prompts and reference documents preserved for historical comparison |

---

## 4. Archive

The `archive/` directory keeps the original implementation-prescriptive specs as written. These predate the outcome-driven spec methodology and are kept for historical comparison.

| File | What it was |
|------|-------------|
| [archive/engine-spec.md](archive/engine-spec.md) | Engine build reference (22 files) |
| [archive/wp-simulator-spec.md](archive/wp-simulator-spec.md) | Monte Carlo balance simulator build |
| [archive/wp-sweep-spec.md](archive/wp-sweep-spec.md) | Parameter sweep v1 |
| [archive/wp-sweep-v2-spec.md](archive/wp-sweep-v2-spec.md) | Structural fixes and exploratory sweep |
| [archive/wp-mechanical-design-context.md](archive/wp-mechanical-design-context.md) | Consolidated stat model for simulator input |

---

## 5. Related

| Document | Relationship |
|----------|--------------|
| [Game Design Document](../game-design/game-design-document.md) | Design authority for mechanics, narrative, and scope |
| [M3 Content Design](../game-design/m3-content-design-draft.md) | Event, NPC, dialogue, and ending content source |
| [Character Generation](../game-design/character-generation.md) | Protagonist generation, dossier, and trait presentation |
| [SpecSmith Case Study](../docs/wp-specsmith-case-study.md) | Methodology case study |
