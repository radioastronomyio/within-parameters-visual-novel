<!--
---
title: "Tagging Strategy"
description: "Controlled vocabulary for document classification in within-parameters-visual-novel"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-03-29"
version: "2.0"
tags:
  - type: guide
  - domain: documentation
related_documents:
  - "[Interior README Template](interior-readme-template.md)"
  - "[General KB Template](general-kb-template.md)"
  - "[Worklog README Template](worklog-readme-template.md)"
---
-->

# Tagging Strategy

## 1. Purpose

Controlled tag vocabulary for the within-parameters-visual-novel repository. Consistent tagging enables human navigation and RAG system retrieval.

---

## 2. Why Controlled Vocabulary

Uncontrolled tagging leads to synonyms fragmenting search, inconsistent granularity, and tag proliferation that reduces signal. A controlled vocabulary defines allowed values upfront, ensuring consistency across contributors and time.

---

## 3. Tag Categories

| Category | Question Answered | Required |
|----------|-------------------|----------|
| `type` | What kind of document is this? | Yes |
| `domain` | What subject area? | Yes |
| `status` | What's the lifecycle state? | Recommended |
| `tech` | What technologies involved? | When applicable |

---

## 4. Domain Tags

| Tag | Use For | Boundary |
|-----|---------|----------|
| `narrative` | Story, characters, dialogue, beats, endings, world-building | What the game says and who inhabits it |
| `mechanics` | Stats, intrusion clock, reward trilemma, event system, community tracking | How the game plays, not how it's coded |
| `engine` | TypeScript engine implementation, game state, scene runner, save system | The code that runs the mechanics |
| `ui` | Layout, dialogue rendering, HUD, screens, typewriter effect | Visual presentation layer |
| `data` | JSON schemas, config, scenes, events, communities, characters | Structured data files the engine consumes |
| `art` | Art direction, concept artwork, backgrounds, portraits, cutscenes | Visual assets and their pipeline |
| `audio` | Soundtrack, SFX, BGM crossfade, audio manager | Sound assets and playback |
| `deployment` | Azure SWA, itch.io, Vite build, static hosting | Getting the game to players |
| `balance` | Trait system, scoring, simulator, GDR analysis | Tuning and validating game math |
| `methodology` | Spec-driven development, AI agent workflow | How the game is being built |
| `documentation` | Templates, standards, meta-content about the repo itself | Docs about docs |

---

## 5. Type Tags

| Tag | Use For |
|-----|---------|
| `project-root` | Repository root README |
| `directory-readme` | Interior README for any directory |
| `worklog` | Work log entries and milestone documentation |
| `guide` | Step-by-step procedures and how-to documents |
| `reference` | Lookup information: schemas, character profiles, asset specs |
| `specification` | Engine spec, technical specs |
| `design-doc` | GDD, storyboard, art direction bible |

---

## 6. Status Tags

| Tag | Description |
|-----|-------------|
| `draft` | In development, not yet complete |
| `active` | Current, maintained |
| `locked` | Design-locked, not accepting changes without review |
| `under-review` | Review in progress |
| `deprecated` | Superseded, avoid for new work |
| `archived` | Historical reference only |

---

## 7. Tech Tags

| Tag | Technology |
|-----|-----------|
| `typescript` | TypeScript source code |
| `vite` | Vite build tooling |
| `html` | HTML entry point and structure |
| `css` | CSS custom properties and styling |
| `json` | Game data files |
| `bash` | Shell scripts |
| `python` | Balance simulator, scripting |

---

## 8. Implementation

### Standard Frontmatter

```yaml
<!--
---
title: "Document Title"
description: "What this document covers"
author: "VintageDon (https://github.com/vintagedon/)"
date: "YYYY-MM-DD"
version: "1.0"
status: "Active"
tags:
  - type: design-doc
  - domain: narrative
related_documents:
  - "[Related Doc](path/to/doc.md)"
---
-->
```

### Conventions

- Use lowercase, hyphenated values
- Tech tags use canonical names
- One value per line for readability, or array syntax for multi-value
- `related_documents` links use relative paths within the repo

---

## 9. Maintaining the Vocabulary

- This document is the authoritative source for allowed tag values
- Prefer broader tags over proliferating specific ones
- Check for existing coverage before adding new tags
- Backfill existing documents when adding new tags

---

## 10. References

| Resource | Description |
|----------|-------------|
| [Interior README Template](interior-readme-template.md) | Shows tag usage in directory READMEs |
| [General KB Template](general-kb-template.md) | Shows tag usage for standalone docs |
| [Worklog README Template](worklog-readme-template.md) | Shows tag usage for work log entries |
