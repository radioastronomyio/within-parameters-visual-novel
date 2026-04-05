<!--
---
title: "Data"
description: "Game data JSON files consumed by the Within Parameters engine"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-04-05"
version: "1.0"
status: "Active"
tags:
  - type: directory-readme
  - domain: data
  - tech: json
---
-->

# Data

Game data JSON files consumed by the Within Parameters engine at runtime. All files are typed against the contracts in `src/types/`.

---

## 1. Contents

| File | Description | Status |
|------|-------------|--------|
| [config.json](config.json) | Baseline game config — trait-modifiable values (starting modules, clock base, reward amounts, score thresholds) | Active |
| [characters.json](characters.json) | Character, portrait, background, and audio manifests — references all asset paths | Active |
| [communities.json](communities.json) | Community name pool for random assignment at run start | Active |
| [scenes.json](scenes.json) | Scene and dialogue data — test/placeholder content pending content build | Placeholder |
| [events.json](events.json) | Event pool data — test/placeholder content pending content build | Placeholder |

---

## 2. Notes

`scenes.json` and `events.json` contain test content and will be rewritten during the content build from `game-design/m3-content-design-draft.md`. All other files reflect the current locked design.

`config.json` is the single source of truth for all trait-modifiable numeric values. Traits reference these values by key rather than hardcoding numbers.

---

## 3. Related

| Document | Relationship |
|----------|--------------|
| [Engine Spec](../spec/engine-spec.md) | Data schema definitions — types the engine expects |
| [M3 Content Design Draft](../game-design/m3-content-design-draft.md) | Source for the events.json and scenes.json rewrite |
| [Trait System v2](../spec/m3-trait-system-v2.md) | Defines which config.json values traits modify |
