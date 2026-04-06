<!--
---
title: "Spec 01: Visual Novel Engine"
description: "SpecSmith retrospective: outcome-driven specification for the Within Parameters engine build"
author: "VintageDon + Claude"
date: "2026-03-15"
version: "1.0-retrospective"
status: "Complete"
tags:
  - type: specification
  - domain: engine
related_documents:
  - "[Original Engine Spec (as-written)](archive/engine-spec.md)"
  - "[Game Design Document](../game-design/game-design-document.md)"
  - "[Art Direction Bible](../game-design/art-direction-bible.md)"
---
-->

# Spec 01: Visual Novel Engine

A Vite + TypeScript visual novel engine that renders a three-pane layout, drives dialogue with typewriter effects and branching choices, manages a four-stat roguelike resource model, and persists game state to localStorage. No framework. Placeholder assets throughout.

**SpecSmith note:** This is a retrospective rewrite. The original spec (`archive/engine-spec.md`) was implementation-prescriptive: 22 named source files, complete TypeScript interfaces, component behavioral specs, and a six-phase build order. That spec worked; Claude Code built the engine from it in 13 minutes with zero TypeScript errors. This retrospective captures what the outcome-driven version would have looked like under SpecSmith methodology.

---

## 1. Outcome

A browser-based visual novel engine that:

- Renders a three-pane layout (main viewport, sidebar, bottom bar) at 1920x1080 base resolution matching the NB2 UI mockup aesthetic (dark charcoal panels, teal accents, monospace typography)
- Displays dialogue with a typewriter effect, skip-on-click, character portraits, and branching choice buttons
- Tracks four player stats (Knowledge accumulator, Bypass Modules spendable, Rapport derived, Intrusion Clock counter) with visual HUD elements
- Runs a journey phase with modular events drawn from category-filtered pools, each presenting situation/choice/consequence/reward cycles
- Manages community tracking (helped/ignored/harmed flags) with a visible timeline
- Determines endings based on stat thresholds (clock loss, destruction, correction)
- Saves and loads game state via localStorage with multiple slots and autosave
- Builds to static output suitable for Azure Static Web Apps and itch.io deployment
- Functions with zero real assets (CSS gradients for backgrounds, colored rectangles for portraits)

---

## 2. Test Gates

| Gate | Verification |
|------|-------------|
| Clean build | `npm run build` produces `dist/` with no TypeScript errors |
| Three-pane layout renders | Dev server shows viewport (65%), sidebar (35%), and bottom bar (33vh) with correct proportions |
| Dialogue typewriter | Text appears character-by-character; clicking skips to full text; next click advances |
| Branching choices | Choice buttons appear after dialogue; clicking one advances the scene with the selected branch |
| Knowledge-gated choices | Choices with knowledge gates are hidden when player knowledge is below threshold |
| Stat HUD updates | Sidebar displays current knowledge, modules, rapport, and clock; values update after each event choice |
| Clock visual | Intrusion clock displays as segmented bar with color transitions (green → amber → red) |
| Community timeline | Sidebar shows community names with helped/ignored/harmed state indicators |
| Event pool draw | Journey phase draws events from category-filtered pools (community, transit, approach) without repeats |
| Reward selection | After each event, three reward buttons appear (consumable, knowledge, clock reduction); selecting one applies the stat change |
| Save/load | Saving to a slot and loading from it restores exact game state including stats, scene position, and community flags |
| Autosave | Game autosaves at scene transitions; "Continue" on title screen loads autosave |
| Placeholder rendering | Engine renders with no image files present; backgrounds show CSS gradients, portraits show colored circles |
| Static output | `dist/` contents serve from a static file server with no backend required |

---

## 3. Constraints

- Vite + TypeScript with vanilla DOM manipulation. No React, Vue, or other framework.
- All state mutations return new objects (immutable state pattern). Rapport is derived from community flags, never stored directly.
- Data-driven: all scenes, events, characters, and communities defined in JSON files under `data/`. The engine consumes typed data; it does not contain scenario-specific logic.
- CSS custom properties for theming (colors, typography, spacing). No CSS framework.
- Client-side only. No backend, no analytics, no network requests at runtime.
- Must work in modern Chromium-based browsers. No IE/Safari-specific accommodation.

---

## 4. Scope

**Pre-existing (do not create or modify):**

- `data/config.json` (baseline game config with stat values)
- `data/scenes.json`, `events.json`, `characters.json`, `communities.json` (test content)
- `assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png` (visual target)
- `game-design/game-design-document.md` (mechanics reference)

**Create:**

- TypeScript source files implementing the engine (types, engine modules, UI modules, audio manager, bootstrap)
- CSS file implementing the three-pane layout and HUD styling
- HTML entry point for Vite

**Out of scope:**

- Production art assets (placeholder-only for this spec)
- Sound/music (audio manager scaffolded but silent)
- Mobile responsiveness
- Character generation / trait system (added later)
- Content beyond test data in JSON files

---

## 5. Dependencies

| Dependency | Relationship |
|------------|-------------|
| [Game Design Document](../game-design/game-design-document.md) | Defines the four-stat model, event cycle, reward trilemma, and ending conditions |
| [Art Direction Bible](../game-design/art-direction-bible.md) | Defines the visual language the CSS must target |
| [NB2 UI Mockup](../assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png) | Visual reference for layout proportions and color scheme |

---

## 6. References

| Resource | Description |
|----------|-------------|
| [Original engine spec](archive/engine-spec.md) | The implementation-prescriptive spec that was actually executed |

---

<!--
RETROSPECTIVE NOTES:

What the original spec got right:
- Complete type contracts meant the agent produced zero TypeScript errors on first build
- Explicit build order (6 phases) meant files were created in dependency order
- CSS custom property definitions produced a consistent visual language

What SpecSmith would have changed:
- The original spec named all 22 files. An outcome spec would let the agent decide file organization.
- The original spec included complete TypeScript interface definitions. An outcome spec would describe the data contracts in prose and let the agent choose the type structure.
- The original spec prescribed the component architecture. An outcome spec would describe the observable behaviors and let the agent determine internal structure.

The tradeoff: the prescriptive spec produced a perfect first build. An outcome spec might have required iteration on file organization or type structure, but would have given the agent more room to find a better architecture. For a solo developer's portfolio project with a tight scope, the prescriptive approach was the right call. For a team or a more complex system, the outcome approach scales better.

Post-build bugs found by KC/GLM-5 code review:
1. Black screen: bottom bar hidden in fullscreen mode
2. setBackground property ordering bug
3. Duplicate flags in scenes.json
4. Missing eventSceneComplete() call broke reward triggering
5. Consumable pip display floor of 5

All five bugs were in areas where the spec was unclear or silent. The spec gap → bug pattern is exactly what SpecSmith predicts: if it's not in the spec, the agent won't infer it.
-->
