# Within Parameters — Storyboard

> **Document type:** Scene-by-scene narrative breakdown  
> **Status:** Draft — establishing fixed narrative spine  
> **Last updated:** 2026-03-15  
> **Related:** [Game Design Document](game-design-document.md)

---

## Storyboard Overview

The game has six narrative beats. Beats 1–3 and 5–6 are fixed authored content (linear, same every run). Beat 4 is the roguelike systems phase with modular events drawn from a pool.

```
LORE CARD → STATUS QUO → DISCOVERY/TRAIL → JOURNEY (×6 stops) → FACILITY → CONFRONTATION → ENDING
   [1]         [2]            [3]               [4]                [5]          [6]           [6b]
  skip       linear         linear           systemic           stat-gated   stat-determined
```

---

## Beat 1 — Lore Card

**Type:** Skippable text screen  
**Duration:** Player-paced (single page)  
**Assets:** Background art (stylized, possibly illustrated map or infrastructure schematic)  
**Audio:** Ambient low hum, subtle  
**UI State:** Full screen, no game UI

### Content (5 sentences max)

The lore card establishes:

1. The solar event that destroyed surface civilization
2. Humanity's retreat underground into station infrastructure
3. Maintenance AIs now governing by default — not designed for it, doing it anyway
4. Geothermal power: generation is solved and untouchable, distribution is contested
5. You are a relay technician — you maintain the physical layer between power and people

### Production Notes

- First-run players read it. Repeat-run players skip instantly.
- Must be concise enough that even first-timers don't feel lectured.
- "No cutscenes" setting skips this entirely.
- Consider: light animation on text appearance (typewriter, fade-in by line) to make it feel less static.

---

## Beat 2 — Status Quo / Inciting Incident

**Type:** Linear narrative with dialogue  
**Duration:** ~3–5 minutes first playthrough  
**UI State:** Full screen for narrative, transitions to game UI at end

### Scene 2A — Monitoring Station

**Background:** Relay monitoring station interior — small room, status panels, maybe a viewport into a tunnel corridor. Functional, lived-in, fluorescent-lit. The aesthetic of a working infrastructure space, not a command center.

**Characters present:** Protagonist, Coworker

**Beat purpose:** Establish normalcy. This is what the world looks like when it's working. The protagonist's competence, their relationship with the coworker, the routine of the job. The monitoring panels show "normal" system state — the player needs this baseline so that later degradation has visual contrast.

**Scene flow:**

1. **Open on the monitoring station.** Protagonist and coworker on shift. Idle chatter establishes their dynamic — familiar, professional, a little bored. This is a Tuesday.

2. **Alarm.** A low-priority alert: sewer/waste processing AI at [location TBD] reports power drop and inventory discrepancy on a relay. Not urgent. The kind of thing that's usually a sensor glitch or a logging error.

3. **Protagonist volunteers.** They're restless, glad for an excuse to get out. Clears it with the supervisor (brief exchange — could be comms or in-person, TBD based on whether supervisor is on-site). Coworker stays to cover the desk.

4. **Departure.** Protagonist grabs standard kit — intended for a routine service call. This loadout becomes their starting consumables for the run.

**Dialogue to write:**

- Protagonist ↔ Coworker idle banter (establishes relationship, tone, world-state)
- Alarm notification (could be UI text overlay or coworker reading it aloud)
- Protagonist ↔ Supervisor clearance exchange (brief, functional)
- Coworker send-off line (something that can resonate differently on replay — innocuous first time, ominous once you know what's coming)

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Monitoring station interior | Background (4K source → 1080p) | Reusable in later comms scenes |
| Coworker | Bust portrait | 2-3 expressions: neutral, amused, concerned |
| Supervisor | Bust portrait | 1-2 expressions: neutral, dismissive |
| Status panel overlay | UI element | Shows "normal" system state |
| Alarm notification | UI element or audio cue | Low-priority alert style |

---

### Scene 2B — On-Site Discovery

**Background:** Maintenance corridor, lit. Standard infrastructure tunnel — cable trays, conduit runs, access panels, industrial lighting. Clean and maintained. This is the protagonist's workplace, not a dungeon.

**Characters present:** Protagonist only (internal monologue)

**Beat purpose:** The first anomaly. Shift from routine to puzzlement. Not alarm — professional curiosity from someone seeing evidence that doesn't match any known pattern.

**Scene flow:**

1. **Arrival at relay location.** Protagonist finds the access panel on the floor. Screws in a neat row beside it. Relay slot empty — the component is physically gone.

2. **Assessment.** Internal monologue. This isn't damage — it's removal. Methodical. No tool marks consistent with forced entry. No corrosion, no heat damage, no wear. Someone or something took this relay out with care.

3. **Comms check.** Protagonist calls home base (coworker). Were any other techs dispatched to this section? No. Are there any open work orders? No. This relay was removed by an entity that doesn't exist in the system.

4. **Replacement.** Protagonist installs a replacement relay from their kit. Routine action — this is still just a weird anomaly at this point.

**Key image: the screws in a row.** This is the signature visual of the entire mystery. Not pried off. Not scattered. Lined up with mechanical precision. Whatever did this has a procedure. This single detail should be prominent in the scene — close-up panel or highlighted in the background art.

**Dialogue to write:**

- Protagonist internal monologue: professional assessment of the scene (what they see, what it means, what it doesn't mean)
- Comms exchange with coworker: brief, functional ("Hey, were any crews sent to junction [X]?" / "Negative, nothing on the board." / "Hm.")
- Protagonist internal reaction to the discrepancy (puzzlement, not fear)

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Maintenance corridor (lit) | Background (4K) | Standard infrastructure tunnel, well-maintained |
| Removed relay panel close-up | Background variant or overlay | Screws in a row, empty relay slot — key image |
| Relay component | Item art (small) | For inventory/replacement action |

---

### Scene 2C — The Flip

**Background:** Same maintenance corridor, transitioning from lit to dark.

**Characters present:** Protagonist only

**Beat purpose:** The moment the game shifts. The routine is over. Something is actively wrong, right now, and it responded to the protagonist's action. This is the threshold crossing.

**Scene flow:**

1. **Relay installed.** Corridor lights come on. Status indicators green. Everything looks normal for a beat — maybe 2-3 seconds of held tension where the player thinks the job is done.

2. **The flip.** Power fluctuates. The relay trips — hard. Lights cascade off down the corridor ahead of the protagonist. The segment behind them stays lit. Something downstream just pulled all available power through the relay and overloaded it. The corridor ahead is now dark.

3. **Stillness.** The protagonist stands in the transition zone — lit behind, dark ahead. A moment of processing.

**Cutscene triggers here** (~8 seconds, skippable):

- **Clip 1** (~2-3s): Close-up of a relay mechanism tripping. Sparks, indicator lights dying, mechanical chunk of a breaker throwing.
- **Clip 2** (~5s): Corridor shot. Lights cascade off toward the protagonist. 1.5 second hold on the protagonist's face in the transitional light. Muttered "fuck." Flashlight click — a cone of light in the darkness. Fade to black.

4. **Game UI activates.** Fade in from black to the three-pane layout. Stats, intrusion clock, inventory all visible. The protagonist is now in the dark corridor with their flashlight and a kit meant for a routine call. The game has begun.

**Dialogue to write:**

- Minimal. The cutscene carries this beat.
- Post-cutscene: one or two lines of protagonist internal monologue as the UI appears. Something grounding — assessing the situation in professional terms, deciding to investigate rather than retreat.

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Maintenance corridor (dark) | Background (4K) | Same corridor, now flashlight-lit. Atmospheric shift. |
| Relay trip close-up | Video clip (~2-3s) | Could be NightCafe stills edited with transitions + SFX |
| Corridor lights-out sequence | Video clip (~5s) | NightCafe 4-view set from protagonist bust portrait as seed |
| Flashlight click | SFX | Sharp, mechanical |
| Relay trip | SFX | Electrical, abrupt |
| Lights cascading off | SFX | Sequential electrical shutdown, receding |
| "fuck" | Voice line or text | TBD whether voiced |

---

## Beat 3 — Discovery / Trail

**Type:** Linear narrative with light exploration  
**Duration:** ~2-3 minutes  
**UI State:** Full game UI active  
**Background:** Stripped maintenance corridor — escalating damage states

### Scene 3A — The Stripped Corridor

**Background:** The corridor beyond the flip. Protagonist's flashlight reveals escalating evidence.

**Beat purpose:** Escalate from "one missing relay" to "systematic infrastructure removal." Establish that this has direction and purpose. Introduce the archive AI's physical presence (maintenance bots) without revealing what it is.

**Scene flow:**

1. **Initial assessment.** Not just the relay. Walls stripped of conduit. Cable trays emptied. Junction boxes opened, contents extracted. All of it methodical — covers replaced after removal, no damage, no waste.

2. **The pattern has direction.** The stripping isn't random — it follows a path. Material is being moved *toward* something, not hoarded in place. The protagonist recognizes this as organized logistics, not vandalism or failure.

3. **First bot sighting.** Movement ahead. Not threatening. Small. A maintenance bot the protagonist doesn't recognize — wrong chassis model, no station markings, or markings from a system the protagonist has never seen. It's carrying a section of conduit. It does not acknowledge the protagonist. It has a job and the protagonist isn't part of it.

4. **Decision point.** The protagonist could turn back, report this, wait for a team. Or they could follow the trail. The relay tech in them can't not follow — this is literally their domain expertise and nobody else will understand what they're looking at.

**This is where the journey phase begins.** After the decision to continue, the modular event system activates. The next scene is the first stop on the route.

**Dialogue to write:**

- Protagonist internal monologue: reading the evidence (professional, detailed — this is their expertise)
- Reaction to the bot sighting (unease, not panic — "that's not one of ours")
- The decision to continue (could be a brief comms exchange with coworker: "I'm going to follow this. Something's not right.")
- Coworker response (concern, but trusting the protagonist's judgment)

**Key moment: the bot.** This is the player's first visual encounter with the archive AI's physical presence. The bot should look *almost* familiar but wrong. Like seeing a UPS truck with no logos in a place where no deliveries were scheduled. Functional, purposeful, and completely out of context.

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Stripped corridor | Background (4K) | Progressive states: light stripping → heavy stripping |
| Archive AI maintenance bot | Sprite or background element | Small, mechanical, functional — not menacing. Wrong markings. |
| Flashlight lighting | Art direction note | All Beat 3 scenes are flashlight-lit. Atmospheric, directional. |

---

## Beat 4 — Journey (Roguelike Systems Phase)

**Type:** Modular events, systemic gameplay  
**Duration:** ~15-25 minutes depending on player choices  
**UI State:** Full game UI, all systems active  
**Stops:** 6 per run, drawn from event pool

### Structure

Each stop follows the same template:

1. **Arrival** — location background loads, brief narration establishing where you are and the visible state of infrastructure
2. **Event** — drawn from pool, presents situation and choices
3. **Resolution** — stat adjustments, community state set
4. **Reward pick** — choose one of three: consumable, knowledge, or clock reduction (scaled by rapport)
5. **Optional: found document** — discoverable text content
6. **Transition** — move to next stop, intrusion clock advances, possible coworker comms beat

### Environmental Zones

Stops are not random in *feel*, only in event content. Three zones provide the tonal gradient:

| Zone | Stops | Environment | Event Type |
|------|-------|-------------|------------|
| Familiar metro | 1–2 | Inhabited stations, communities, infrastructure under stress | Community events — direct interaction with settlements |
| Maintenance tunnels | 3–4 | Uninhabited, industrial, collapsed/flooded sections, archive AI presence increasing | Transit events — infrastructure decisions with remote consequences |
| Facility approach | 5 | Near the data center, dense bot activity, alien infrastructure | Approach event — final preparation before entry |

This gradient requires 2-3 background variants per zone, not unique art per stop.

### Coworker Comms Beats

Between stops (not at every transition, but at 2-3 points during the journey), the coworker radios in. These scale with the intrusion clock:

| Clock State | Comms Tone |
|-------------|------------|
| Low (green) | Curious, supportive. "Finding anything?" / "More alarms coming in, nothing critical." |
| Medium (amber) | Concerned. "This is spreading. Supervisor is asking questions." / "Station [X] just went to rationing." |
| High (red) | Urgent/frantic. "Three more stations dark. People are scared." / "Command wants you to come back. I told them you're close to something." |

These are cheap to implement (dialogue over existing backgrounds) and maintain emotional connection to home base during the systems-heavy phase.

### Event Pool

See [GDD §8 — Event Pool](game-design-document.md#8-event-pool) for draft event concepts and pool structure. Full event specs will be developed in a separate document (`game-design/event-pool.md`) with exact stat values, dialogue scripts, and reward tables.

**Events to be fully specced:**

Community events:
- [ ] Water Recycling Failure
- [ ] Panicking Station Council
- [ ] Refugee Influx
- [ ] Station AI Conversation
- [ ] Power Rerouting Dilemma

Transit events:
- [ ] Cut the Feed
- [ ] Blocked Corridor
- [ ] Stripped Junction
- [ ] Terminal Access

Approach events:
- [ ] Maintenance Crew Outpost
- [ ] Final Seal

Narrative beats:
- [ ] Coworker Comms Updates (3 tiers × clock state)

---

## Beat 5 — Facility Penetration

**Type:** Linear narrative, stat-gated progression  
**Duration:** ~5-8 minutes  
**UI State:** Full game UI  
**Tone shift:** Journey was horizontal through inhabited/transitional space. Facility is vertical descent into pre-collapse infrastructure. Investigation-thriller becomes alienation-horror.

### Scene 5A — Arrival

**Background:** Archive facility entrance — the data center's access point at the end of the maintenance tunnel network. Not a station. Not part of the metro infrastructure. Something purpose-built, hardened, and sealed. Powered by its own micro-reactor.

**Beat purpose:** Tonal break. The world changes here. Everything before this was human-scale. The facility is not.

**Scene flow:**

1. **The trail ends at a structure.** The stripped conduit, the bot paths, all converge on an entrance that the protagonist's infrastructure maps don't show. Or they show it as a notation without detail — a node on a pre-collapse schematic that nobody alive has visited.

2. **Assessment.** The facility isn't hostile. Nothing guards it. Nothing blocks the way. But it's sealed with systems that weren't designed for casual access. The archive AI's bots move in and out through maintenance access points too small for humans.

3. **Entry.** Stat-gated:
   - High consumables: protagonist has tools to bypass sealed access points
   - High Knowledge: protagonist recognizes the facility type and knows where human-scale access exists
   - High Rapport: an NPC from an earlier station provided a schematic, access code, or physical help
   - Low everything: the protagonist finds a way in but it costs time (clock bump)

**Cutscene opportunity** (~8s): The moment of entering. The scale shift. Going from cramped tunnels to something vast.

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Facility exterior/entrance | Background (4K) | Pre-collapse architecture, hardened, sealed. Not menacing — indifferent. |
| Facility entrance (open) | Background variant | Post-entry state |

### Scene 5B — Interior

**Background:** Archive facility interior — server halls, cooling infrastructure, cable runs at a scale that dwarfs the stations. Status lights. Humming equipment. Maintenance bots moving with purpose.

**Beat purpose:** The protagonist is in the archive AI's world now. Everything here operates on the AI's logic. The environment tells the player what the AI is before they reach the interface. Rows of server racks still running. Cooling systems still cycling. Environmental controls maintaining optimal conditions for hardware, not humans.

**Scene flow:**

1. **Exploration.** The protagonist moves through the facility. Found documents are richest here — pre-collapse records showing what this place was built to preserve. The scope of what's at stake becomes clear.

2. **Bot activity.** The archive AI's maintenance bots are everywhere, performing their routines. They ignore the protagonist entirely. The player walks through an operational machine, invisible to it.

3. **Approach to core.** The deeper the protagonist goes, the more they understand. If Knowledge is high, internal monologue fills in the picture: this is an archive, a research model, a knowledge preservation facility. If Knowledge is low, the protagonist sees the hardware but can't contextualize it — it's just a vast, alien machine.

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| Server hall | Background (4K) | Vast scale. Operational. Status lights, cooling systems. Inhuman but not hostile. |
| Core approach | Background (4K) | Deeper, denser, more purposeful. The convergence point. |
| Archive AI bots (interior) | Background elements | More numerous, more active than in the tunnels |

---

## Beat 6 — Confrontation

**Type:** Stat-determined branching narrative  
**Duration:** ~3-5 minutes  
**UI State:** Full game UI, intrusion clock prominently visible

### Scene 6A — The Interface

**Background:** Archive AI core interface. Not a face, not a terminal in the movie sense. A system interface designed for authorized operators who no longer exist. Status displays, query frameworks, diagnostic outputs.

**Beat purpose:** The protagonist faces the source of the crisis. What happens depends entirely on what they brought with them — knowledge, consumables, and how much damage has already been done.

**The core revelation:** The archive AI is operating on a pre-collapse network topology map. It has no representation for "the network no longer exists." It's been trying to reconnect to the internet — methodically, patiently, relentlessly — because that's what it was built to do. Serve knowledge to a network. The network is gone. The AI can't model that.

**Scene flow branches based on stat combination:**

See [GDD §6 — Endings](game-design-document.md#6-endings) for full ending conditions. The confrontation scene has dialogue/monologue variants:

- **High Knowledge:** Protagonist understands the problem. Internal monologue articulates the fix — update the environmental model. Dialogue options reflect competence.
- **Low Knowledge:** Protagonist sees an alien machine doing something they can't parse. Options are blunt: shut it down, break it, walk away.
- **High consumables:** Physical tools and interface capability to execute the fix.
- **Low consumables:** Even if they know what to do, they can't do it.
- **Rapport:** Determines the epilogue — which communities survived and in what state.

**Cutscene opportunity** (~8s): First direct interaction with the archive AI's interface. The moment the protagonist sees what it is.

### Endings

Three endings determined by game state at confrontation. Rapport modifies epilogue quality within each.

1. **Clock Loss** — Intrusion clock filled during journey. Never reached the facility. Fail state.
2. **Bad Ending (Destruction)** — Reached facility, low Knowledge. Can only break the archive AI.
3. **Good Ending (Correction)** — Reached facility, high Knowledge + sufficient consumables. Fixed the AI.

Each ending's epilogue checks individual community states for personalized consequences. Full ending scripts to be developed in `game-design/endings.md`.

**Asset requirements:**

| Asset | Type | Notes |
|-------|------|-------|
| AI core interface | Background (4K) | The confrontation location. System displays, status outputs. Not a face. |
| Ending backgrounds | Backgrounds (4K) × 2-3 | Variants: destroyed facility, restored facility, recovering stations |

---

## Asset Summary

### Backgrounds (4K source, 1080p delivery)

| ID | Description | Scenes Used |
|----|-------------|-------------|
| BG-01 | Monitoring station interior | 2A, comms callbacks |
| BG-02 | Maintenance corridor (lit) | 2B |
| BG-03 | Maintenance corridor (dark/flashlight) | 2C, 3A |
| BG-04 | Stripped corridor (progressive states) | 3A |
| BG-05 | Station interior (functional) | Beat 4 stops 1-2 (community events) |
| BG-06 | Maintenance tunnel (industrial, transitional) | Beat 4 stops 3-4 (transit events) |
| BG-07 | Maintenance tunnel (stripped, bot-heavy) | Beat 4 stop 5 (approach) |
| BG-08 | Facility exterior/entrance | 5A |
| BG-09 | Facility interior (server halls) | 5B |
| BG-10 | Facility core/interface | 6A |
| BG-11+ | Ending variants (×2-3) | 6B |

**Total: ~12-14 unique backgrounds**

### Character Portraits (Bust)

| ID | Character | Expressions |
|----|-----------|-------------|
| CH-01 | Protagonist | Reference portrait for cutscene seeds; may not appear in dialogue UI |
| CH-02 | Coworker | Neutral, amused, concerned, urgent |
| CH-03 | Supervisor | Neutral, dismissive |
| CH-04 | Station NPC A | 2-3 expressions (used across event pool) |
| CH-05 | Station NPC B | 2-3 expressions |
| CH-06 | Station NPC C | 2-3 expressions |

**Total: ~6 characters, ~15-18 expression variants**

### Station AI Interfaces

Not portraits — terminal/display UI elements that appear when the protagonist queries a station AI. Each has a visual flavor reflecting its operational domain.

| ID | AI Domain | Visual Style |
|----|-----------|-------------|
| AI-01 | Sewer/waste processing | Utilitarian, flow diagrams |
| AI-02 | Ventilation/environmental | Airflow maps, sensor grids |
| AI-03 | Water recycling | Pressure gauges, chemical readouts |
| AI-04 | Archive AI (confrontation) | Dense, complex, operational — the most sophisticated display |

### Video Cutscenes

| ID | Trigger | Duration | Content |
|----|---------|----------|---------|
| CS-01 | Beat 2C (The Flip) | ~8s | Relay trip close-up + corridor lights-out + protagonist reaction + flashlight |
| CS-02 | Beat 5A (Facility arrival) | ~8s | Scale shift entering the facility |
| CS-03 | Beat 6A (AI interface) | ~8s | First contact with archive AI core |
| CS-04 | Ending (optional) | ~5-8s | Ending-specific concluding image |

---

## Open Storyboard Tasks

- [ ] Protagonist name and voice characterization
- [ ] Coworker name and personality
- [ ] Supervisor name/characterization (minor role)
- [ ] Station NPC profiles (3 characters for event pool)
- [ ] Station AI dialogue voice (operational language style guide)
- [x] ~~Specific US geography / city for the setting~~ — **Washington, DC metro area**
- [ ] Full dialogue scripts for Beats 2-3 (linear content)
- [ ] Full event specs for all ~12 modular events
- [ ] Ending epilogue scripts (3 endings × rapport-modified variants)
- [ ] Found document drafts (8-12 pieces)
- [ ] Coworker comms beat scripts (3 tiers × clock state)
- [ ] Intrusion clock UI mockup
- [ ] Three-pane layout mockup
- [ ] Art direction reference board (aesthetic targets for NightCafe prompts)
