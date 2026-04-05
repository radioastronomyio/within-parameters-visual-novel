<!--
---
title: "Assets"
description: "Art, audio, and UI assets for Within Parameters"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-04-05"
version: "1.0"
status: "Active"
tags:
  - type: directory-readme
  - domain: [art, audio]
---
-->

# Assets

Art, audio, and UI assets for Within Parameters. Currently contains concept artwork drafts; production assets are pending the NB2 sprint.

---

## 1. Contents

```
assets/
├── concept-artwork/    # NightCafe DreamShaper XL Lightning drafts, organized by scene
│   ├── scene01/ – scene08/
│   ├── ui/
│   └── README.md
└── README.md           # This file
```

---

## 2. Status

| Asset Type | Status | Notes |
|------------|--------|-------|
| Concept backgrounds (10 scenes) | Complete | DreamShaper XL Lightning via NightCafe free tier |
| UI mockup | Complete | Nano Banana Pro 2; three-pane layout target |
| Character portraits | Pending | NB2 sprint |
| Production backgrounds | Pending | NB2 finals from selected concepts |
| Cutscenes | Pending | Seedance 1.5 Pro (image-to-video), ~8s clips |
| Soundtrack / SFX | Pending | Gemini 3 Pro music generation |

The engine uses CSS gradient placeholders during development — no real assets are required to run the game.

---

## 3. Related

| Document | Relationship |
|----------|--------------|
| [Art Direction Bible](../game-design/art-direction-bible.md) | Visual identity, generation prompts, asset pipeline, consistency checklist |
| [Engine Spec](../spec/engine-spec.md) | Asset manifest schema — how the engine references assets |
