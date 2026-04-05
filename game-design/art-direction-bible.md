<!--
---
title: "Art Direction Bible"
description: "Visual identity, asset specifications, and generation prompt strategy for Within Parameters"
author: "VintageDon (https://github.com/vintagedon/)"
date: "2026-03-15"
version: "2.1"
status: "Active — style locked"
tags:
  - type: specification
  - domain: art
  - tech: [dreamshaper-xl, nightcafe, nano-banana-2, gemini-3.1-flash]
related_documents:
  - "[Game Design Document](game-design-document.md)"
---
-->

# Art Direction Bible — Within Parameters

**Status:** Active — style direction locked
**Last Updated:** 2026-03-15

---

## 1. Purpose

This document defines the visual identity for Within Parameters and provides structured prompts for AI-assisted asset generation. All art generation should reference this bible to maintain visual consistency across portraits, backgrounds, UI elements, and environmental details.

---

## 2. Locked Style Direction

### Style Summary

Detailed digital painting with a hyperreal rendering style. Sits between painterly illustration and photorealism — detailed enough to feel immersive, stylized enough that character portrait compositing looks natural and minor inconsistencies between backgrounds won't be jarring. Dense environmental storytelling through clutter, wear, and infrastructure detail.

### Generation Toolchain

| Phase | Tool | Purpose |
|-------|------|---------|
| Exploration & drafts | NightCafe (DreamShaper XL Lightning) | Free-tier generation, style exploration, composition tests |
| Style presets | Hyperreal, 3D Game v2, or None | Hyperreal for primary direction, 3D Game v2 for detail/clutter reference |
| Pro models (optional) | NightCafe Pro (Seedream 4.0, HiDream I1 Full) | Higher quality finals, better prompt adherence. $7.49/mo to resume paused sub |
| Video cutscenes | NightCafe Pro (Seedance 1.5 Pro) | Image-to-video from finished backgrounds for cinematic transitions |
| Upscaling | NightCafe Clarify Upscaler | Free-tier upscale of selected drafts |
| Final production | Nano Banana 2 (paid API, 4K) | High-resolution final assets using locked references |
| Image editing | FLUX.1 Kontext (NightCafe) | Iterative edits on existing assets (style transfer, targeted modifications) |
| Soundtrack | Gemini 3.1 music generation | Theme variations per context |

### NightCafe Working Formula

- **Model:** DreamShaper XL Lightning
- **Images:** 4 per generation preferred (produces subtle variations in angle/lighting within consistent style — useful for picking best composition)
- **Aspect:** 16:9 for backgrounds, 3:4 for portraits, 1:1 for UI/detail elements
- **Style presets:** Hyperreal (primary), 3D Game v2 (detail reference), None (raw prompt control)
- **Iteration:** Different scene prompts produce genuinely different compositions; same prompt in batch of 4 gives useful angle/lighting variations to choose from
- **Negative prompt (when supported):** `bright colors, neon, clean surfaces, holographic, futuristic, cyberpunk neon, sunlight, outdoor, fantasy, crystals, robots, armor, happy, smiling, anime eyes, chibi`

### Pro Model Strategy

Do not resume NightCafe Pro subscription during design/exploration phase. Resume for one focused production sprint once Chapter 1 is outlined, characters are defined, and exact asset list is known. 3,200+ existing credits carry over. Key pro models: Seedream 4.0 (native 2K-4K, top-ranked prompt adherence), Seedance 1.5 Pro (image-to-video cutscenes with audio sync).

---

## 3. World Visual Identity

### Setting Essence

A metropolitan subway network repurposed as humanity's last habitat after a global solar storm. Decades of adaptation have turned stations into city-states. The infrastructure was never meant for permanent habitation — it shows.

### Environmental Keywords

- Claustrophobic transit architecture
- Wet concrete, condensation, dripping pipes
- Emergency lighting (cyan, amber warning strips)
- Relay cabinets, cable runs, junction boxes
- Old transit signage repurposed as district markers
- Patched repairs over original tile and steel
- Fog, haze, volumetric light through ventilation shafts
- Geothermal heat vents, warm air distortion
- Makeshift human habitation layered onto industrial infrastructure

### What This Is NOT

- Clean sci-fi (no smooth white corridors, no holographic displays)
- Post-apocalyptic wasteland (this is lived-in infrastructure, not ruins)
- Cyberpunk neon (restrained accent color, not saturated neon everywhere)
- Fantasy underground (no crystals, no magic, no organic caves)
- Polished futuristic (no gleaming metal, no LED panels, no tech-forward surfaces)

---

## 4. Color Direction

### Primary Palette

| Role | Color | Usage |
|------|-------|-------|
| Dominant | Deep navy / near-black | Backgrounds, negative space, tunnels |
| Infrastructure | Cool concrete grey | Walls, floors, structural elements |
| Primary accent | Cyan / cold blue | Emergency lighting, AI interface elements, rim light |
| Secondary accent | Amber / warm orange | Warning indicators, human warmth, fire, old signage, bare bulbs |
| Danger accent | Dull red | Alarms, damaged sections, power warnings, EXIT signs |

### Lighting Rules

- Primary illumination: cold overhead fluorescent (intermittent, some flickering, some dead)
- Accent illumination: cyan emergency strips along walls/floors
- Warm pockets: human-modified areas have warmer light (jury-rigged lamps, bare bulbs, cooking fires)
- Rim lighting on characters: cool cyan from infrastructure, warm amber from human sources
- Deep shadows are the norm — most of the frame should be dark
- Wet floors reflect available light sources, adding depth

---

## 5. Asset Specifications

### Character Portraits

| Attribute | Specification |
|-----------|---------------|
| Framing | Chest-up, subtle 3/4 angle |
| Background | Neutral dark, slightly out-of-focus infrastructure suggestion |
| Lighting | Cool cyan rim light from one side, warm fill from the other |
| Clothing | Worn utilitarian — coveralls, tool belts, patched fabrics, repurposed transit uniforms |
| Skin detail | Realistic, grime-aware — not glamorized, not grotesque |
| Expression | Neutral to contextual — not posed, not action-shot |
| Aspect ratio | Portrait orientation, 3:4 |
| Count needed | 8-15 total (protagonist + 5-7 NPCs + AI interface representations) |

### Environment Backgrounds

| Attribute | Specification |
|-----------|---------------|
| Framing | Wide establishing shot, slight low angle preferred |
| Depth | Real space with depth layers (foreground detail, mid-ground subject, background fade) |
| Lighting | Motivated by in-world sources (overhead fluorescent, emergency strips, bare bulbs, vent glow) |
| Detail | Dense with infrastructure detail — cables, signage, panels, condensation, human clutter |
| Human presence | Evidence of habitation (makeshift furniture, hung laundry, stacked supplies, cooking setups) but no people in frame |
| Atmosphere | Haze, fog, volumetric light — air feels thick and damp |
| Aspect ratio | Landscape, 16:9 |
| Count needed | 6-10 locations |

### AI Interface / Abstract Elements

| Attribute | Specification |
|-----------|---------------|
| Purpose | Visual representation when AI "speaks" — not a character portrait, more of an interface state |
| Style | Technical readout aesthetic — data streams, status indicators, schematic overlays |
| Tone | Clinical, precise, slightly unsettling in its indifference |
| Count needed | 2-3 variants (normal operation, stressed/degraded, critical) |

### UI Elements

| Attribute | Specification |
|-----------|---------------|
| Style | HUD-overlay aesthetic, thin lines, monospace/technical fonts |
| Color | Cyan on dark, with amber for warnings |
| Transparency | Semi-transparent panels over background art |
| Detail | Primarily CSS/code-driven; visual reference from generation helps guide implementation |

---

## 6. Proven Background Prompts

All prompts tested and producing usable results in locked style direction. Concept drafts saved to `assets/concept-artwork/`.

### Scene 01 — Station Settlement

```
Abandoned subway station platform converted into a cramped underground settlement. Cracked concrete walls with old ceramic tile still partially intact. Cyan emergency lighting strips along the floor, some broken. Overhead fluorescent tube lights, half of them dead or flickering. Wet floor reflecting cold light. Exposed pipe runs and cable bundles along a low stained ceiling. Old faded transit route map still bolted to the wall. Between heavy concrete support columns, improvised living spaces with hung canvas tarps, stacked plastic crates, a small cooking fire with a blackened pot, drying clothes on a wire line. No people visible. Thick atmospheric haze, cold damp air. Muted colors, deep shadow, gritty worn surfaces. Not futuristic, not clean, not polished. Decades of wear and improvised human adaptation on industrial transit infrastructure. Digital painting, visual novel background art
```

### Scene 02 — Relay Workstation

```
Small underground utility room used as a relay technician workshop. Metal workbench covered in tools, wire strippers, multimeter, soldering iron, scattered cable ends. Open relay cabinet on the wall showing rows of circuit breakers and bundled wiring, some with handwritten paper labels taped on. A battered metal stool. Overhead single fluorescent tube, harsh white light. Concrete block walls with moisture stains. A clipboard with a maintenance checklist hangs from a nail. Coffee mug on the bench. Claustrophobic, cramped, functional. Not futuristic. Looks like a real electrical maintenance closet from the 1990s that someone has been working in for thirty years. Digital painting, visual novel background
```

### Scene 03 — Stripped Corridor

```
Underground concrete corridor where wall panels have been cleanly removed, exposing empty conduit channels and bare mounting brackets. Junction boxes are missing, leaving neat rectangular holes with severed wire ends hanging loose. Emergency cyan light strips along the floor still work but overhead lights are dead. The removals look surgical and organized, not vandalism or explosion damage. Dust on the floor is undisturbed except for scrape marks where panels were dragged. Cold, eerie, clinical emptiness. Something systematic did this. Dark shadows, minimal lighting. Digital painting, visual novel background
```

### Scene 04 — Tunnel Between Stations

```
Long dark subway tunnel stretching into blackness. Old rail tracks on the ground, some sections ripped up and replaced with wooden planking as a walkway. A single string of bare bulbs runs along the left wall providing dim warm light at intervals. Exposed rock and concrete tunnel walls with moisture dripping. Cable bundles overhead. A handmade wooden directional sign nailed to a support beam. Claustrophobic low ceiling. Cold breath visible in the air. Deep shadows between light pools. Worn, damp, oppressive. Digital painting, visual novel background
```

### Scene 05 — Council Chamber

```
Repurposed subway station manager office used as a governing council chamber. A long scratched metal table with mismatched chairs. Old transit operations maps pinned to the walls alongside hand-drawn district boundaries. A single overhead fluorescent panel casts harsh flat light. Stacks of paper ledgers, a dented thermos, and a hand-crank radio on the table. Concrete walls with faded safety posters. A heavy steel door with a mechanical lock. Austere, bureaucratic, claustrophobic. The room where rationing decisions get made. No people. Digital painting, visual novel background
```

### Scene 06 — AI Core Room

```
Small sealed underground room housing a station AI server rack. Floor-to-ceiling metal equipment cabinet with blinking status LEDs, thick power cables entering from conduits in the ceiling. A wall-mounted CRT terminal displays scrolling green text. The room hums. Ventilation grate in the ceiling pushes cold air down. Bare concrete floor swept clean, no clutter. Clinical and untouched compared to the rest of the station. One amber warning light pulses slowly near the top of the rack. Sterile, cold, machine-occupied. No people. Digital painting, visual novel background
```

### Scene 07 — Market / Trading Post

```
Underground subway platform repurposed as a cramped trading post. Wooden plank tables and upturned crates used as display surfaces, covered with salvaged goods: bundled copper wire, dented tin cans, patched clothing folded in stacks, old batteries, hand tools. Strings of mismatched bare light bulbs hang between concrete support columns on drooping wire. A small charcoal cooking grill smokes in the corner. Hand-painted cardboard price signs and barter notices nailed to columns. Stained tile walls, overhead pipes, low concrete ceiling. Warm amber light from the bulbs contrasts with cold fluorescent tubes further back. Cluttered, dense, improvised. No people visible. Not a real market, more like a permanent swap meet in a basement. Grimy, worn, functional. Digital painting, visual novel background
```

### Scene 08 — Sleeping Quarters

```
Narrow subway maintenance corridor converted into sleeping quarters. Bunk beds welded together from pipe and angle iron, stacked three high along both walls with hung curtains for privacy. Personal items on tiny shelves, a child's drawing taped to a support beam, a small battery-powered reading lamp clipped to a bunk frame. Worn blankets and rolled sleeping bags. A single overhead fluorescent tube at the far end, most of the corridor lit only by dim personal lamps behind curtains. Intimate, cramped, human. The private side of underground life. No people. Digital painting, visual novel background
```

### Scene 09 — Flooded Lower Level

```
Partially flooded subway sub-basement, ankle-deep dark water covering the floor. Rusted pipe infrastructure along the walls and ceiling, some pipes actively dripping. Emergency cyan light strips reflect off the still water surface creating an eerie mirror effect. Old electrical junction boxes mounted high on the walls above the waterline, some with visible corrosion. A metal staircase descends from above into the water. The air looks thick and humid. Abandoned, dangerous, forbidden. This area was sealed off for a reason. No people. Digital painting, visual novel background
```

### Scene 10 — Surface Access Stairwell

```
Underground concrete emergency stairwell leading upward into darkness. Faded radiation warning trefoil symbols stenciled on the walls. Old civil defense posters with peeling edges. The stairs are cracked with debris collected in corners. A single dying emergency lamp at the bottom casts long shadows upward. Thick dust on every step and handrail. At the top of the stairs, a massive riveted steel blast door with a manual wheel lock, completely sealed shut. No light comes from above. No light comes from outside. The air is dry and still. Everything above the underground is sealed off and has been for decades. Ominous, final, claustrophobic. No windows, no sunlight, no outside visible. No people. Digital painting, visual novel background
```

---

## 7. Character Portrait Prompts

### Protagonist Template

```
Portrait of a woman relay technician in her late 20s, chest up, subtle three-quarter angle. Dark hair pulled back, tired but focused expression. Wearing worn dark utility coveralls with visible patches and a heavy tool belt. Faded transit crew shoulder patch. Cool cyan rim light from the left side, warm amber fill light from the right. Dark background suggesting out-of-focus industrial infrastructure, pipes, and cable runs. Grime on hands and collar. Not glamorous, not post-apocalyptic ragged, just a working professional underground. Sci-fi visual novel character portrait
```

### NPC Template

```
Portrait of [CHARACTER DESCRIPTION — age, gender, build, distinguishing features], chest up, subtle three-quarter angle. [EXPRESSION]. Wearing [CLOTHING — faction-appropriate, worn, utilitarian]. Cool cyan rim light from the left side, warm amber fill light from the right. Dark background suggesting out-of-focus underground infrastructure. [ADDITIONAL DETAILS — scars, accessories, tools, insignia]. Sci-fi visual novel character portrait
```

### Portraits Still Needed

Characters must be defined before generation. See GDD §4 for role slots.

---

## 8. Upscale & Final Production Pipeline

### From NightCafe Draft to Final Asset

1. Generate drafts in NightCafe (DreamShaper XL Lightning, free tier, batches of 4 for variation)
2. Select strongest composition per location/character from the 4 quadrants
3. Upscale via NightCafe Clarify Upscaler (free tier) for initial quality boost
4. For final production: either use NightCafe Pro (Seedream 4.0, native 4K) or Nano Banana 2 (paid API, 4K) with locked reference
5. Alternatively: use FLUX.1 Kontext for targeted edits on strong drafts (fix specific details without regenerating)
6. For cutscenes: feed finished backgrounds to Seedance 1.5 Pro (image-to-video, 5-10 second atmospheric loops)

### Kontext Edit Prompt Pattern

When using Kontext to modify an existing asset:

```
[ACTION VERB] the [SPECIFIC ELEMENT] to [DESIRED CHANGE] while maintaining all other aspects of the original image unchanged. Keep the same lighting, color palette, and rendering style.
```

---

## 9. Consistency Checklist

Before approving any generated asset for use, verify:

- [ ] Rendering style matches locked direction (hyperreal digital painting, not photorealistic or cartoonish)
- [ ] Lighting uses in-world motivated sources (fluorescent, emergency strips, bare bulbs — not studio lighting)
- [ ] Color palette stays within defined range (no saturated neons, no clean whites, no bright colors)
- [ ] Infrastructure detail is present and plausible (real cables, real panels, not decorative greeble)
- [ ] Clothing follows utilitarian/repurposed language (no clean uniforms, no sci-fi armor, no fashion)
- [ ] Atmosphere is present (haze, moisture, depth, reflective wet surfaces)
- [ ] No contradictory technology (no holographic displays, no clean digital screens, no surface sunlight)
- [ ] Consistent rendering style with existing approved assets
- [ ] Correct aspect ratio for asset type (16:9 backgrounds, 3:4 portraits)
- [ ] No people in background images (characters are composited separately)

---

## 10. Asset Inventory

### Concept Art Drafts

All drafts saved to `assets/concept-artwork/scene01/` through `scene08/`. These are DreamShaper XL Lightning outputs at draft resolution, used for style validation and composition reference. Not final production assets.

| Scene | Directory | Status | Quality Notes |
|-------|-----------|--------|---------------|
| 01 — Station settlement | scene01/ | ✅ Draft complete | Strong, multiple good variants |
| 02 — Relay workstation | scene02/ | ✅ Draft complete | Excellent detail, 3D Game v2 preset |
| 03 — Stripped corridor | scene03/ | ✅ Draft complete | Nails the eerie clinical mood |
| 04 — Tunnel | scene04/ | ✅ Draft complete | Great warm/cold contrast, graffiti signage |
| 05 — Council chamber | scene05/ | ✅ Draft complete | Transit maps on walls, austere bureaucratic feel |
| 06 — AI core room | scene06/ | ✅ Draft complete | Green LED glow, server racks, clinical |
| 07 — Market/trading post | scene07/ | ✅ Draft complete | Amber warmth, swap-meet feel. Earlier version too cheery — redo fixed it |
| 08 — Sleeping quarters | scene08/ | ✅ Draft complete | Pipe bunks, curtains, personal items, intimate |
| 09 — Flooded lower level | (in scene dirs) | ✅ Draft complete | Cyan reflections on water, rusted pipes, ominous |
| 10 — Surface stairwell | (in scene dirs) | ✅ Draft complete | Blast door, warning signs, dust. Model fights no-sunlight — close enough for reference |

### Production Assets (Final)

| Location | File | Status | Notes |
|----------|------|--------|-------|
| All 10 locations | — | ⬜ Awaiting production sprint | Will use pro models (Seedream 4.0 or NB2) |

### Portraits

| Character | File | Status | Notes |
|-----------|------|--------|-------|
| Protagonist | — | ⬜ Not started | Prompt template ready |
| Authority figure | — | ⬜ Not started | Character not yet defined |
| Explorer ally | — | ⬜ Not started | Character not yet defined |
| Ideologue | — | ⬜ Not started | Character not yet defined |
| AI-linked figure | — | ⬜ Not started | Character not yet defined |
| Rival/contact | — | ⬜ Not started | Character not yet defined |

### AI Interfaces

| Variant | File | Status | Notes |
|---------|------|--------|-------|
| Normal operation | — | ⬜ Not started | — |
| Degraded | — | ⬜ Not started | — |
| Critical | — | ⬜ Not started | — |

### Video Cutscenes

| Scene | File | Status | Notes |
|-------|------|--------|-------|
| — | — | ⬜ Awaiting pro subscription | Seedance 1.5 Pro, image-to-video from finished backgrounds |

### Audio

| Track | File | Status | Notes |
|-------|------|--------|-------|
| Station ambient | — | ⬜ Not started | Gemini 3.1 |
| Tunnel travel | — | ⬜ Not started | — |
| Tension/discovery | — | ⬜ Not started | — |
| AI interaction | — | ⬜ Not started | — |
