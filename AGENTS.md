# AGENTS.md

Entry point for AI coding agents working on this repository.

## Project Identity

**Domain:** Game Development / Visual Novel / Roguelike
**Repository:** https://github.com/radioastronomyio/within-parameters-visual-novel
**Purpose:** A roguelike visual novel set in a post-solar-storm underground civilization where narrow maintenance AIs govern humanity using operational logic never designed for the task. The player is a randomly generated relay technician investigating an archive AI that is cannibalizing inhabited infrastructure in a relentless attempt to reconnect to an internet that no longer exists. Portfolio piece targeting Azure Static Web Apps and itch.io publication.

**Stack:** Vite + TypeScript (strict mode), vanilla DOM manipulation, CSS custom properties, localStorage saves

## Current State

**Phase:** Phase 2, Content Design & Balance
**Date:** April 2026

### Locked

- Core concept, world-building, and setting (DC metro area, entirely underground)
- Game mechanics: 4-stat model (knowledge, bypass modules, rapport, intrusion clock), reward trilemma, community tracking, three endings
- Character generation system: random protagonist with positive/negative trait pairs, scoring cascade with reroll penalty
- Trait system v2: 8 positive × 8 negative traits, 64 valid combinations, modifier-only (post-GDR balance revision)
- Scoring system: 103 hard cap, 8% multiplicative reroll penalty, S/A/B/C/D/F grades, diminishing returns on surplus
- Clock reduction cap: max 2 segments per reward regardless of rapport
- Art direction style, concept drafts complete (10 scenes, 1 UI mockup)
- Tech stack: Vite + TypeScript, vanilla DOM (no framework)
- Engine spec: `spec/engine-spec.md` (the authoritative build reference)
- Engine build: all 22 source files built, five bugs patched, end-to-end functional with placeholder assets
- Journey structure: 5 modular stops (2 community, 2 transit, 1 approach) + fixed facility entry
- Event pool: 12 events (5 community, 4 transit, 3 approach), draw 5 per run, no repeats
- NPC cast: protagonist (random), Jay Chen (coworker), Torres (supervisor), Aguilar (authority), Dex (scrapper), Sato (believer)
- Consumable identity: bypass module

### Ready for Agent Execution

- Balance simulator build (spec at `spec/wp-simulator-spec.md`)
- Content build: translating approved design docs into engine JSON
- Placeholder art generation (scene-name PNGs)
- AGENTS.md and GDD are current

### Not Started

- Simulator implementation and balance validation
- Production JSON content (scenes.json, events.json rewrite with full content)
- Playwright smoke tests against live dev server
- Production art (NB2 finals from NightCafe concepts)
- Cutscenes (Seedance 1.5 Pro)
- Soundtrack (Gemini 3 Pro music generation)
- Integration, polish, and deployment

## Key Documents

| Document | Path | Purpose |
|----------|------|---------|
| Engine Spec | `spec/engine-spec.md` | **Build reference**: types, components, UI, data schemas, build order, success criteria |
| Game Design Document | `game-design/game-design-document.md` | Authoritative design reference: all mechanics |
| Storyboard | `game-design/storyboard.md` | Scene-by-scene narrative breakdown with asset specs |
| Art Direction Bible | `game-design/art-direction-bible.md` | Visual identity, generation prompts, asset pipeline |
| M3 Content Design | `game-design/m3-content-design-draft.md` | Full event specs, NPC profiles, comms beats, found documents, endings |
| Character Generation | `game-design/character-generation.md` | Name pools, backstory templates, dossier screen, portrait strategy |
| Trait System v2 | `spec/m3-trait-system-v2.md` | Authoritative trait definitions, interaction matrix, scoring (post-GDR) |
| Simulator Spec | `spec/wp-simulator-spec.md` | Monte Carlo balance simulator agent execution target |
| Mechanical Context | `spec/wp-mechanical-design-context.md` | Consolidated stat model reference for simulator |
| NB2 UI Mockup | `assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png` | Visual target for the three-pane layout |

**Read the engine spec before writing any engine code.** It is the execution contract.
**Read the trait system v2 before touching traits, scoring, or character generation.** It supersedes all prior trait documents.

## Narrative

- Randomly generated protagonist: relay technician with defined voice (dry, professional, competent). Name, gender, backstory, and traits rolled at run start.
- Callsign RELAY-7 is constant across all rolls.
- Coworker: Jay Chen (dispatch operator, voice on comms throughout journey)
- Antagonist: archive AI, a pre-collapse academic research/data preservation model in a hardened underground data center with its own micro-reactor. Operating on an outdated network topology map. Not evil, just executing its purpose within parameters it can't update.
- Setting: DC metro underground + maintenance tunnel network connecting to the data center
- Six narrative beats: lore card, status quo, discovery, journey (roguelike phase, five modular stops), facility penetration, confrontation
- Three endings (clock loss, bad/destruction, good/correction) with rapport-modified epilogues that name specific communities and their outcomes
- Backstory-specific and trait-acknowledgment lines in epilogues

## Mechanics

### Stat Model

| Stat | Type | Starting | Function |
|------|------|----------|----------|
| Knowledge | Accumulator | 0 | Gates choices, determines ending (threshold: 8, modified by Clear-Headed to 6) |
| Bypass Modules | Spendable | 5 (trait-modified) | Spent on event choices, community help, facility fix (cost: 2, modified by Fragile Kit to 3) |
| Rapport | Derived | 0 (trait-modified) | Helped minus harmed communities. Scales clock reduction (capped at 2). Determines epilogue quality. |
| Intrusion Clock | Counter | 0 | Ticks each stop (base 1 + jitter). Max 10. Fills = loss. Only reduced via clock reduction reward. |

### Character Generation

Random protagonist rolled at run start: gender (50/50), name from gendered pools (8 per gender, 10 surnames), backstory (1 of 6), positive trait (1 of 8), negative trait (1 of 8). Displayed on dossier screen with DEPLOY/REROLL buttons. Each reroll applies 8% multiplicative scoring penalty. 64 valid trait combinations, no exclusions.

### Trait System

All traits are modifier tuples on the stat model. No new content paths. Traits modify starting values, per-event costs, reward effectiveness, clock behavior, choice restrictions, or confrontation thresholds. Authoritative definitions in `spec/m3-trait-system-v2.md`.

### Scoring

Raw score 0-103 (hard cap), graded S (90+) through F (<30). Components: ending type, communities helped, rapport, remaining modules, surplus knowledge, remaining clock segments. Surplus stats use diminishing returns. Reroll penalty: `final = raw × 0.92^rerolls`.

### Event Cycle

Every stop: arrive, situation, choice, consequence, reward pick (consumable/knowledge/clock reduction), clock tick, transition.

### Reward Trilemma

Pick one per event: +2 modules (trait-modified), +2 knowledge (trait-modified), or clock reduction (1-2 segments, scaled by rapport, capped at 2).

### Journey Structure

5 modular stops drawn from 12-event pool:

| Stop | Zone | Category | Pool |
|------|------|----------|------|
| 1-2 | Familiar metro | Community | 5 events |
| 3-4 | Maintenance tunnels | Transit | 4 events |
| 5 | Facility approach | Approach | 3 events |

After stop 5, Beat 5 (Facility Penetration) begins as fixed narrative content.

## Architecture

### Source Layout (22 files)

```
src/
  types/          # Data contracts
    index.ts, scene.ts, event.ts, state.ts, characters.ts
  engine/
    game-state.ts   # Immutable stat mutations (return new GameState)
    scene-runner.ts  # Beat transitions, dialogue sequencing
    event-system.ts  # Zone-filtered pool draw, reward cycle
    save-manager.ts  # localStorage serialization, slot management
  ui/
    layout.ts     # Three-pane DOM (viewport 65% + sidebar 35% + bottom bar 33%)
    dialogue.ts   # Typewriter effect, skip-on-click, portraits, choices
    hud.ts        # Stat bars, intrusion clock, location timeline
    screens.ts    # Title, save/load modal, ending, lore card, settings
  audio/
    audio-manager.ts  # BGM crossfade, SFX, mute persistence
  styles.css
  main.ts         # Bootstrap: load data, init engine, attach DOM
data/
  config.json, scenes.json, events.json, communities.json, characters.json
```

### Key Design Patterns

**Immutable state:** All mutations in `game-state.ts` return new `GameState` objects. Rapport is derived from community states, not stored. Save snapshots are trivial.

**Journey stop cycle:** arrive, situation, choice, consequence, reward selection, clock tick.

**Modifier-only traits:** Traits modify config values and event-time behavior via flags. No branching logic, no new content paths.

**Placeholder rendering:** Engine works with zero real assets. CSS gradients for backgrounds, colored rectangles for portraits.

### Build Commands

```bash
npm run dev      # Vite dev server with hot reload
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Key Constraints

- **Data-driven:** Stats, events, communities, dialogue in structured JSON. Engine consumes typed data and renders the game. Scenario-agnostic.
- **Immutable state:** Never mutate GameState in place.
- **Modifier-only traits:** Traits are stat modifiers, not content branches.
- **Placeholder-first:** Engine must work with zero real assets.
- **Client-side only:** No backend, localStorage for saves, no analytics.
- **Portfolio scope:** 1 complete run, 3 endings, ~12 events, ~6 characters, ~25-35 minute runs.

### Out of Scope (v1)

Mobile responsiveness, accessibility beyond basic keyboard nav, analytics, multiplayer, dynamic scenario loading, meta-progression beyond scoring.

## Art & Audio

- Art direction style locked: hyperreal digital painting
- 10 concept scene drafts complete (DreamShaper XL Lightning via NightCafe)
- 1 UI mockup (Nano Banana 2)
- Production assets awaiting NB2 sprint (style-matched finals from NightCafe concepts)
- Cutscenes: ~8s clips via Seedance 1.5 Pro (image-to-video), skippable
- Soundtrack via Gemini 3 Pro music generation
- Engine uses placeholder assets during development

## Execution Environment

**Primary execution:** ML01 (`/opt/repos/within-parameters-visual-novel/`)
**Dev URL:** `https://wp-dev.donfather.dev` (Traefik on docker01, port 5173)
**Agent runtime:** OpenCode, Claude Code
**Strategic work:** Claude.ai Projects
**Balance testing:** Python simulator (`simulation/`)

## Repository Structure

```
within-parameters-visual-novel/
├── assets/                         # Art, audio, and UI assets
│   └── concept-artwork/            # Concept drafts and UI mockups (scenes 01-08, ui/)
├── data/                           # Game data JSON files
│   ├── config.json                 # Baseline game config (trait-modifiable)
│   ├── scenes.json                 # Scene/dialogue data (test content, awaiting rewrite)
│   ├── events.json                 # Event data (test content, awaiting rewrite)
│   ├── characters.json             # Character, portrait, background, audio manifests
│   └── communities.json            # Community name pool
├── docs/
│   └── documentation-standards/    # Templates, tagging strategy
├── game-design/                    # Design documents (GDD, storyboard, art bible, content specs)
├── public/                         # Static assets for Vite
├── shared/                         # Cross-project utilities
├── simulation/                     # Python balance simulator (spec ready, not yet built)
├── spec/                           # Technical specifications and agent prompts
├── src/                            # TypeScript source (22 files, engine complete)
│   ├── types/                      # Data contracts
│   ├── engine/                     # Game state, scene runner, events, saves
│   ├── ui/                         # Layout, dialogue, HUD, screens
│   └── audio/                      # BGM and SFX management
├── staging/                        # Staged work (gitignored)
├── work-logs/                      # Development history
├── AGENTS.md                       # This file
├── CLAUDE.md                       # Pointer to AGENTS.md
├── index.html                      # Vite entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE                         # MIT (code)
└── LICENSE-DATA                    # CC-BY-4.0 (content)
```

## Conventions

- **Documentation:** Use templates from `docs/documentation-standards/`
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `art:`)
- **Frontmatter:** YAML frontmatter with tags from `docs/documentation-standards/tagging-strategy.md`
- **Interior READMEs:** Every directory has one
- **GDD is design authority; engine spec is build authority; trait system v2 is balance authority**
- **Agent context:** AGENTS.md is the single source of agent context. No memory bank files.

## Scope Discipline

- Do what's requested, not what seems helpful
- GDD is the authoritative design reference; check it before assuming
- Engine spec is the build reference; follow the type contracts and component specs
- Trait system v2 is the balance reference; do not modify trait values without orchestrator approval
- `game-design/` is the working space for all design documents
- `spec/` is for technical specifications and agent prompts only

## Related Repositories

| Repository | Relationship |
|-----------|-------------|
| `holdfast-roguelite-deckbuilder` | Sibling game project, shared spec-driven methodology, modifier-only design philosophy |
| `the-beating-dark` | Sibling game project (Unity dungeon crawler) |
| `ml01-agentic-ops` | Infrastructure repo; dev environment specs (Traefik, Playwright) |
