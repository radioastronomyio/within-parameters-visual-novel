<!--
---
title: "Worklog: M3 Content Design & Balance"
description: "Content design session covering events, NPCs, character generation, trait system, scoring, and balance validation"
author: "VintageDon + Claude"
date: "2026-04-05"
status: "Complete"
tags:
  - type: worklog
  - domain: [game-design, balance]
---
-->

# Worklog: M3 Content Design & Balance

**Date:** 2026-04-05
**Phase:** Phase 2, Content Design & Balance
**Session type:** Strategic design (Claude.ai Projects)

---

## Objective

Design the complete content layer for Within Parameters: resolve all open identity questions, spec the full event pool, design the character generation system with random traits, validate balance via GDR, and prepare the repo for agent-executable implementation.

## Outcome

Complete M3 content design package produced. Character generation system with 64 trait combinations designed, GDR-validated, and revised. Balance simulator specified for agent build. Repo documentation updated to reflect current state.

---

## Key Decisions

| Decision | Resolution | Rationale |
|----------|------------|-----------|
| Protagonist identity | Random generation (name pools, backstory, traits) instead of fixed character | Roguelike half of "roguelike VN" needs the player to be a variable. 614,400 possible dossiers from small pools. |
| Stop count | 5 modular (was 6) | Event pool numbers map cleanly: 2 community + 2 transit + 1 approach. Beat 5 (facility) is fixed content, not a modular stop. |
| Consumable name | Bypass module | Universal relay component from field kit. Fits the technician role. |
| NPC cast | Aguilar (authority), Dex (scrapper), Sato (believer) | One NPC per faction flavor. They're not faction reps; they color community events differently. |
| Coworker name | Jay Chen | Dispatch operator. Voice on comms throughout journey. Uses callsign RELAY-7. |
| Scoring system | 103 hard cap, 8% multiplicative reroll, S/A/B/C/D/F grades | Each tier gives roughly one more reroll of budget than the tier above. Rerolling is practice mode; deploying first roll is the S-tier path. |
| Clock reduction cap | Max 2 per reward | GDR identified exponential rapport feedback loop allowing 3+ segment erasure. Cap kills the exploit while keeping high rapport advantageous. |
| N7 Exhausted (revised) | Jitter forced to 1 (was: base tick 2) | GDR proved base tick 2 guarantees clock-out at exactly 10 after 5 stops. Jitter forced to 1 raises average to 10 (tight but survivable). |
| P4 Steady Hand (revised) | Jitter probability halved to 25% (was: forced to 0) | GDR showed eliminating jitter turns the game into a solved puzzle. Halving preserves variance reduction without perfection. |
| N2 Rough Touch (revised) | +1 per module spent (was: +1 per event) | GDR showed +1 per event exactly offset P1 Well-Supplied, producing a null pairing. Per-module scaling creates real drain. |

## Artifacts Produced

| File | Location | Purpose |
|------|----------|---------|
| M3 Content Design Draft | `game-design/m3-content-design-draft.md` | Events, NPCs, comms beats, found documents, endings |
| Character Generation | `game-design/character-generation.md` | Name pools, backstories, dossier screen, portraits |
| Trait System v2 | `spec/m3-trait-system-v2.md` | Post-GDR trait definitions, matrix, scoring |
| Simulator Spec | `spec/wp-simulator-spec.md` | Monte Carlo balance simulator for agent build |
| Mechanical Context | `spec/wp-mechanical-design-context.md` | Consolidated reference for simulator |
| GDR Results | `work-logs/03-content-design/gdr-trait-balance-results.md` | Gemini Deep Research balance analysis |

## Documents Updated

| File | Changes |
|------|---------|
| `AGENTS.md` | Full rewrite: Phase 2, trait system, character gen, scoring, dev environment, document hierarchy |
| `game-design/game-design-document.md` | Closed 7 open questions, added new systems section, updated related documents, bumped date |

## GDR Findings (Summary)

Gemini Deep Research validated the trait matrix and scoring cascade, identifying five critical issues (all resolved in v2):

1. N7 (Exhausted) systematically unwinnable at base tick 2
2. P4 (Steady Hand) trivializes the game by removing all clock variance
3. Rapport-to-clock-reduction scaling creates exponential feedback loop
4. P1+N2 (Well-Supplied + Rough Touch) cancel to zero asymmetry
5. Raw score ceiling can be inflated by surplus-stat farming

Simulator recommended: Monte Carlo at 10,000 iterations per trait combination, heuristic agent, 8x8 heatmap output. Spec written for agent execution.

## What's Next

1. **Copy remaining session outputs into repo** (m3-content-design-draft.md, GDR results, mechanical context)
2. **Agent task:** Build the balance simulator from `spec/wp-simulator-spec.md` on ML01
3. **Agent task:** Translate M3 content into production JSON (scenes.json, events.json rewrite)
4. **Agent task:** Generate placeholder art (scene-name PNGs)
5. **Art sprint:** NB2 production finals from NightCafe concepts
6. **Music:** Gemini 3 Pro exploration
