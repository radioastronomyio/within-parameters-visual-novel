# Engine Technical Specification — Within Parameters

**Status:** Approved for implementation  
**Last Updated:** 2026-03-15  
**Implements:** [Game Design Document](../game-design/game-design-document.md)  
**Visual Target:** `assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png`

---

## 1. Purpose

This document specifies the visual novel engine for Within Parameters — a roguelike VN hybrid deployed as a static web application. The engine is **scenario-agnostic**: all story content, event definitions, character data, and balance values live in external JSON files. The engine consumes typed data and renders the game.

This is v1. The engine and story content ship together in one deployment. The architecture supports a future v2 where scenarios are loadable, but v1 does not implement dynamic loading.

---

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript | Type interfaces encode the GDD's data contracts. Public repo doubles as teaching artifact. |
| Bundler | Vite | Zero-config TS compilation, hot reload, static output for Azure Static Web Apps. No framework runtime. |
| UI Framework | None (vanilla DOM) | A VN engine is a state machine rendering text and images. No component tree needed. Direct DOM manipulation is simpler and teaches fundamentals. |
| Styling | Single CSS file | Three-pane layout with CSS custom properties for theming. No preprocessor, no utility framework. |
| Data Format | JSON | Scene, event, character, community, and config data in typed JSON files consumed at startup. |
| Save System | localStorage | Autosave + 5 manual slots. Serializes full game state. |
| Audio | HTML5 Audio API | BGM with crossfade. No library needed. |
| Deployment | Azure Static Web Apps | `vite build` outputs static files. Also deployable to itch.io. |

---

## 3. Project Structure

```
within-parameters-visual-novel/
├── src/
│   ├── types/
│   │   ├── index.ts              # Barrel export
│   │   ├── scene.ts              # Scene, DialogueLine, Choice, BeatType
│   │   ├── event.ts              # EventDef, EventCategory, RewardType, CommunityState
│   │   ├── state.ts              # GameState, PlayerStats, IntrusionClock, SaveSlot, RunState
│   │   └── characters.ts         # Character, Portrait, Expression
│   ├── engine/
│   │   ├── game-state.ts         # State manager — stat mutations, clock tick, community tracking, reward application
│   │   ├── scene-runner.ts       # Scene progression — beat transitions, dialogue sequencing, choice branching, event cycle
│   │   ├── event-system.ts       # Event pool — zone-filtered draw, no-repeat enforcement, reward cycle
│   │   └── save-manager.ts       # localStorage — autosave, 5 manual slots, continue detection
│   ├── ui/
│   │   ├── layout.ts             # Three-pane DOM setup — viewport, sidebar, bottom bar
│   │   ├── dialogue.ts           # Typewriter text, skip-on-click, portrait display, choice buttons, narrator mode
│   │   ├── hud.ts                # Sidebar — stat bars, intrusion clock, location timeline, inventory grid
│   │   └── screens.ts            # Title screen, save/load modal, ending screen, lore card, settings
│   ├── audio/
│   │   └── audio-manager.ts      # BGM load/play/crossfade, SFX hookpoints, mute toggle, preference persistence
│   ├── styles.css                # Full UI styling — three-pane layout, HUD, dialogue, animations
│   └── main.ts                   # Bootstrap — load data, init engine, attach to DOM
├── data/
│   ├── scenes.json               # All narrative beat definitions (test scenario for v1)
│   ├── events.json               # Modular event pool definitions
│   ├── communities.json          # Community name pool for random assignment
│   ├── characters.json           # Character definitions + portrait/expression manifest
│   └── config.json               # Balance tuning — clock, jitter, thresholds, starting stats
├── assets/
│   ├── backgrounds/              # 16:9 scene art (placeholders for engine build)
│   ├── portraits/                # 3:4 character busts (placeholders for engine build)
│   ├── ui/                       # Interface elements
│   └── audio/                    # BGM tracks, SFX
├── public/
│   └── index.html                # Shell HTML — viewport meta, root div, font links
├── vite.config.ts                # Vite config — base path, asset handling
├── tsconfig.json                 # Strict mode, ES2022 target, DOM lib
└── package.json                  # Dependencies: vite, typescript (dev only)
```

### File Count: 22

All source files are in `src/`. All content is in `data/`. All assets are in `assets/`. The build output (`dist/`) is the deployment artifact.

---

## 4. Type Definitions

These are the data contracts. The GDD defines them in prose — these translate them to TypeScript interfaces. Everything else in the engine imports from these.

### 4.1 scene.ts

```typescript
/** Which narrative beat this scene belongs to */
export type BeatType =
  | 'lore'          // Beat 1 — skippable lore card
  | 'status-quo'    // Beat 2 — linear narrative, inciting incident
  | 'discovery'     // Beat 3 — trail investigation, event system activates
  | 'journey'       // Beat 4 — roguelike systems phase (6 modular stops)
  | 'facility'      // Beat 5 — facility penetration (stat-gated)
  | 'confrontation' // Beat 6 — ending determination
  | 'ending';       // Beat 6b — ending + epilogue

/** A single line of dialogue or narration */
export interface DialogueLine {
  /** Character ID speaking, or 'narrator' for narration */
  speaker: string;
  /** The text content */
  text: string;
  /** Optional expression override for the speaking character */
  expression?: string;
  /** Optional background change triggered by this line */
  background?: string;
  /** Optional BGM change triggered by this line */
  bgm?: string;
  /** Optional SFX triggered by this line */
  sfx?: string;
}

/** A player choice within a scene */
export interface Choice {
  /** Display text for the choice button */
  label: string;
  /** Scene ID to transition to when chosen */
  nextScene: string;
  /** Optional stat modifications applied when chosen */
  statChanges?: Partial<StatChanges>;
  /** Optional community state change */
  communityEffect?: 'helped' | 'harmed';
  /** Optional — only show this choice if a condition is met */
  condition?: ChoiceCondition;
}

/** Condition for a choice to be visible */
export interface ChoiceCondition {
  /** Stat to check */
  stat: 'knowledge' | 'consumables' | 'rapport';
  /** Minimum value required */
  min: number;
}

/** Stat changes applied by a choice or event consequence */
export interface StatChanges {
  knowledge: number;
  consumables: number;
  /** Direct rapport change (rare — usually derived from community state) */
  rapport: number;
  /** Intrusion clock change (positive = tick forward, negative = reduce) */
  clock: number;
}

/** A scene definition — the atomic unit of narrative content */
export interface Scene {
  /** Unique scene ID — referenced by choices and transitions */
  id: string;
  /** Which narrative beat this scene belongs to */
  beat: BeatType;
  /** Background image key (maps to asset manifest) */
  background: string;
  /** BGM track key (maps to asset manifest) — null to continue current */
  bgm?: string | null;
  /** Dialogue lines in sequence */
  dialogue: DialogueLine[];
  /** Player choices at end of dialogue (if any) — omit for auto-advance */
  choices?: Choice[];
  /** If no choices, the next scene ID to auto-advance to */
  next?: string;
  /** Special scene behaviors */
  flags?: SceneFlags;
}

/** Special behaviors for a scene */
export interface SceneFlags {
  /** This is a skippable scene (lore card, cutscene) */
  skippable?: boolean;
  /** Show the three-pane game UI (false = full-screen narrative) */
  showGameUI?: boolean;
  /** This scene triggers the event system (Beat 4 entry) */
  enterEventPhase?: boolean;
  /** This scene is an ending — show ending screen after */
  isEnding?: boolean;
  /** Ending type for ending scenes */
  endingType?: 'clock-failure' | 'destruction' | 'correction';
  /** Trigger autosave after this scene completes */
  autosave?: boolean;
  /** This scene triggers a coworker comms beat */
  commsInterrupt?: boolean;
}
```

### 4.2 event.ts

```typescript
import type { Scene, StatChanges } from './scene';

/** Event category determines which zone it can appear in */
export type EventCategory = 'community' | 'transit' | 'approach';

/** The three reward types available after each event */
export type RewardType = 'consumable' | 'knowledge' | 'clock-reduction';

/** Tracked state of a community the player encounters */
export type CommunityState = 'helped' | 'ignored' | 'harmed';

/** A reward option presented after an event resolves */
export interface RewardOption {
  type: RewardType;
  /** Display label */
  label: string;
  /** Description text */
  description: string;
  /** Base stat change — clock-reduction is modified by rapport at runtime */
  baseEffect: Partial<StatChanges>;
}

/** A modular event definition — drawn from the pool during Beat 4 */
export interface EventDef {
  /** Unique event ID */
  id: string;
  /** Event category — determines zone eligibility */
  category: EventCategory;
  /** Display name for the event */
  name: string;
  /** The scenes that make up this event (arrive → situation → choice → consequence) */
  scenes: Scene[];
  /** Entry scene ID (first scene of this event) */
  entryScene: string;
  /** The three reward options presented after the event resolves */
  rewards: [RewardOption, RewardOption, RewardOption];
  /** Scene ID for the reward selection screen */
  rewardScene: string;
}

/** A community from the name pool, assigned to a stop at runtime */
export interface Community {
  /** Unique community ID */
  id: string;
  /** Display name */
  name: string;
  /** Brief description for epilogue context */
  description: string;
}

/** Runtime state of a community during a run */
export interface CommunityRunState {
  community: Community;
  state: CommunityState;
  /** Which stop (1-6) this community was encountered at */
  stop: number;
}
```

### 4.3 state.ts

```typescript
import type { CommunityRunState } from './event';

/** Player stats tracked during a run */
export interface PlayerStats {
  /** Accumulator — determines options at confrontation. Never spent. */
  knowledge: number;
  /** Spendable resource — relay tech omni-component */
  consumables: number;
  /** Derived from community states — modifies clock reduction and epilogue */
  rapport: number;
}

/** The intrusion clock — background timer representing archive AI's salvage acceleration */
export interface IntrusionClock {
  /** Current value (0 to max) */
  current: number;
  /** Maximum before loss (from config) */
  max: number;
  /** Base tick per stop (from config) */
  baseTick: number;
  /** Jitter range — added randomly per stop (from config) */
  jitterMax: number;
}

/** Which phase of the event cycle the player is in at a journey stop */
export type EventPhase =
  | 'arriving'
  | 'situation'
  | 'choice'
  | 'consequence'
  | 'reward-pick'
  | 'transition';

/** Full game state — this is what gets serialized to a save slot */
export interface GameState {
  /** Current scene ID */
  currentScene: string;
  /** Current narrative beat (redundant with scene data but useful for quick checks) */
  currentBeat: string;
  /** Player stats */
  stats: PlayerStats;
  /** Intrusion clock state */
  clock: IntrusionClock;
  /** Current journey stop number (1-6, 0 if not in journey phase) */
  currentStop: number;
  /** IDs of events already drawn this run (for no-repeat) */
  usedEventIds: string[];
  /** Community states for this run */
  communities: CommunityRunState[];
  /** Accumulated flags (knowledge checks passed, items found, etc.) */
  flags: Record<string, boolean>;
  /** Scene history for back-reference (dialogue log) */
  sceneHistory: string[];
  /** Current event phase if in journey */
  eventPhase: EventPhase | null;
  /** Active event ID if in journey */
  activeEventId: string | null;
  /** Timestamp for save metadata */
  timestamp: number;
  /** Run number (for stats tracking) */
  runNumber: number;
}

/** A save slot */
export interface SaveSlot {
  /** Slot index (0-4 for manual, 'auto' for autosave) */
  id: number | 'auto';
  /** Display label */
  label: string;
  /** The saved game state */
  state: GameState;
  /** Save timestamp */
  savedAt: number;
  /** Current scene name for display in save/load UI */
  sceneLabel: string;
  /** Current beat for display */
  beatLabel: string;
}

/** Persistent data across runs (stored separately from saves) */
export interface PersistentData {
  /** Total runs started */
  runsStarted: number;
  /** Total runs completed (reached any ending) */
  runsCompleted: number;
  /** Endings seen (by type) */
  endingsSeen: string[];
  /** Audio muted preference */
  audioMuted: boolean;
  /** Cutscenes setting */
  cutscenesSetting: 'all' | 'none';
}

/** Balance configuration loaded from config.json */
export interface GameConfig {
  /** Starting consumable count */
  startingConsumables: number;
  /** Starting knowledge */
  startingKnowledge: number;
  /** Intrusion clock maximum (lose threshold) */
  clockMax: number;
  /** Base clock tick per stop */
  clockBaseTick: number;
  /** Maximum jitter added per stop (0 to this value, random) */
  clockJitterMax: number;
  /** Base clock reduction from reward (before rapport scaling) */
  clockReductionBase: number;
  /** Rapport scaling factor for clock reduction */
  rapportClockScale: number;
  /** Knowledge threshold for the good ending path */
  knowledgeGoodEndingThreshold: number;
  /** Consumables needed to execute the fix at the facility */
  consumableFixCost: number;
  /** Typewriter text speed (ms per character) */
  typewriterSpeed: number;
  /** BGM crossfade duration (ms) */
  bgmCrossfadeDuration: number;
  /** Number of journey stops */
  journeyStops: number;
  /** Zone assignment: which stops map to which event categories */
  zoneMap: Record<number, string>;
}
```

### 4.4 characters.ts

```typescript
/** A character definition */
export interface Character {
  /** Unique character ID — referenced by DialogueLine.speaker */
  id: string;
  /** Display name */
  name: string;
  /** Short role description */
  role: string;
  /** Default portrait expression key */
  defaultExpression: string;
  /** Available expressions mapped to portrait asset keys */
  expressions: Record<string, string>;
  /** Name color in dialogue (CSS color value) */
  nameColor: string;
}

/** Asset manifest entry for a portrait */
export interface PortraitAsset {
  /** Asset key (matches expression values in Character) */
  key: string;
  /** File path relative to assets/ */
  path: string;
  /** Fallback: CSS background color for placeholder rendering */
  placeholderColor: string;
}

/** Asset manifest entry for a background */
export interface BackgroundAsset {
  /** Asset key (matches Scene.background) */
  key: string;
  /** File path relative to assets/ */
  path: string;
  /** Fallback: CSS gradient or color for placeholder rendering */
  placeholderStyle: string;
  /** Display name for the location (shown in timeline) */
  locationName: string;
}

/** Asset manifest entry for an audio track */
export interface AudioAsset {
  /** Asset key (matches Scene.bgm or DialogueLine.bgm) */
  key: string;
  /** File path relative to assets/ */
  path: string;
  /** Whether this track loops */
  loop: boolean;
  /** Volume (0.0 - 1.0) */
  volume: number;
}
```

---

## 5. Engine Components

### 5.1 Game State Manager (`engine/game-state.ts`)

**Responsibility:** Owns the `GameState` object. All stat mutations go through this module. No other module modifies state directly.

**Key operations:**

- `initNewGame(config: GameConfig): GameState` — Create fresh state from config defaults
- `applyStatChanges(state: GameState, changes: Partial<StatChanges>): GameState` — Apply stat modifications (immutable update pattern)
- `tickClock(state: GameState, config: GameConfig): GameState` — Advance clock by baseTick + random jitter. Returns updated state. Check for clock-full (loss condition) after calling.
- `isClockFull(state: GameState): boolean` — Loss condition check
- `setCommunityState(state: GameState, stopIndex: number, communityState: CommunityState): GameState` — Track community outcome
- `deriveRapport(state: GameState): number` — Calculate rapport from community states (helped count − harmed count)
- `calculateClockReduction(state: GameState, config: GameConfig): number` — Compute effective clock reduction based on rapport
- `checkKnowledgeGate(state: GameState, threshold: number): boolean` — Knowledge check for gated choices
- `determineEnding(state: GameState, config: GameConfig): 'clock-failure' | 'destruction' | 'correction'` — Ending determination logic

**Design notes:**

- Immutable update pattern: every mutation returns a new `GameState` object. The state manager never mutates in place. This makes save snapshots trivial (just capture the current object).
- Rapport is always derived, never stored as a raw value. `state.stats.rapport` is recalculated from `state.communities` whenever accessed. The `rapport` field in `PlayerStats` exists for display convenience and is refreshed after every community state change.

### 5.2 Scene Runner (`engine/scene-runner.ts`)

**Responsibility:** Drives scene progression. Reads scene definitions from loaded data, sequences dialogue lines, presents choices, handles transitions, and coordinates with the event system during Beat 4.

**Key operations:**

- `loadScene(sceneId: string): Scene` — Retrieve scene definition from loaded data
- `startScene(scene: Scene)` — Initialize scene: set background, start BGM, begin dialogue sequence
- `advanceLine()` — Move to next dialogue line in current scene. If typewriter is mid-render, skip to completion. If at end of dialogue, present choices or auto-advance.
- `selectChoice(choiceIndex: number)` — Player selects a choice. Apply stat changes, set community state if applicable, transition to next scene.
- `handleAutoAdvance(scene: Scene)` — For scenes with no choices: wait for click, then transition to `scene.next`
- `enterEventPhase(state: GameState, config: GameConfig)` — Initialize the journey phase: draw events, assign communities, set up the stop sequence
- `processEventCycle(phase: EventPhase)` — Drive the event cycle (arrive → situation → choice → consequence → reward → transition)

**Scene transition flow:**

```
Scene loaded → Background/BGM set → Dialogue lines sequenced (typewriter)
  → Player clicks to advance each line
  → At end of dialogue:
     → If choices exist: render choice buttons, wait for selection
     → If no choices: wait for click, auto-advance to scene.next
  → Choice selected or auto-advance triggered:
     → Apply stat changes
     → Determine next scene ID
     → If next scene is in a different beat: handle beat transition
     → Load next scene (loop)
```

**Beat transitions:**

- Lore → Status Quo: Switch from full-screen to full-screen (no UI change yet)
- Status Quo → Discovery: Game UI activates (three-pane layout appears)
- Discovery → Journey: Event system takes over. Scene runner delegates to event cycle.
- Journey → Facility: Fixed scenes resume. Stat-gated options check Knowledge/Consumables.
- Facility → Confrontation: Ending determination runs. Branch to appropriate ending scene.
- Confrontation → Ending: Ending screen with epilogue text (community outcomes).

### 5.3 Event System (`engine/event-system.ts`)

**Responsibility:** Manages the modular event pool for Beat 4 (journey phase). Draws events without repeats, assigns communities, and runs the event cycle per stop.

**Key operations:**

- `initEventPool(events: EventDef[], config: GameConfig, communities: Community[]): EventPoolState` — Filter events by zone eligibility, shuffle, prepare draw queue. Randomly assign communities from pool.
- `drawEvent(pool: EventPoolState, stopIndex: number): { event: EventDef, community: Community }` — Draw next event for the given stop. Remove from pool. Assign community.
- `getRewardsForStop(event: EventDef, state: GameState, config: GameConfig): RewardOption[]` — Get the three reward options, with clock-reduction pre-calculated based on current rapport.
- `applyReward(reward: RewardOption, state: GameState, config: GameConfig): GameState` — Apply the selected reward to game state.
- `shouldTriggerComms(stopIndex: number, clock: IntrusionClock): boolean` — Determine if a coworker comms beat should fire between stops.

**Zone mapping (from config):**

```json
{
  "1": "community",
  "2": "community", 
  "3": "transit",
  "4": "transit",
  "5": "approach",
  "6": "approach"
}
```

**Event cycle per stop:**

```
1. Draw event from pool for current zone
2. Assign community from unused pool
3. Run event scenes (arrive → situation → choice → consequence)
4. Present three reward options
5. Apply selected reward
6. Tick intrusion clock (base + jitter)
7. Check loss condition
8. If not lost: check for coworker comms beat
9. Transition to next stop (or to Beat 5 if stop 6 complete)
```

### 5.4 Save Manager (`engine/save-manager.ts`)

**Responsibility:** Serialize and deserialize game state to/from localStorage. Manages autosave and 5 manual slots.

**Key operations:**

- `autosave(state: GameState, sceneLabel: string, beatLabel: string)` — Save to autosave slot. Called after scene flags indicate `autosave: true`.
- `saveToSlot(slotIndex: number, state: GameState, sceneLabel: string, beatLabel: string)` — Save to manual slot (0-4).
- `loadFromSlot(slotId: number | 'auto'): GameState | null` — Load state from a slot.
- `getSlotSummaries(): SaveSlot[]` — Get metadata for all slots (for save/load UI display).
- `hasAutosave(): boolean` — Check if continue is available (title screen).
- `clearSlot(slotId: number | 'auto')` — Delete a save.
- `savePersistentData(data: PersistentData)` — Save cross-run data.
- `loadPersistentData(): PersistentData` — Load cross-run data.

**localStorage keys:**

- `wp_save_auto` — Autosave slot
- `wp_save_0` through `wp_save_4` — Manual slots
- `wp_persistent` — Cross-run persistent data

---

## 6. UI Components

### 6.1 Layout Reference

Target layout from NB2 mockup (`assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png`):

```
┌──────────────────────────────┬──────────────────┐
│                              │                  │
│      Main Viewport           │    Sidebar       │
│      (scene background)      │                  │
│                              │  ┌────────────┐  │
│                              │  │ INTRUSION  │  │
│                              │  │ KNOWLEDGE  │  │
│                              │  │ RAPPORT    │  │
│                              │  │ RESOURCES  │  │
│                              │  └────────────┘  │
│                              │                  │
│                              │  ○ 1: LOCATION  │
│                              │  ◉ 2: CURRENT   │
│                              │  ○ 3: UPCOMING  │
│                              │  ○ 4: ...       │
│                              │                  │
│                              │  ┌──┬──┬──┐     │
│                              │  │  │  │  │     │
│                              │  ├──┼──┼──┤     │
│                              │  │  │  │  │     │
│                              │  └──┴──┴──┘     │
├──────────────────────────────┴──────────────────┤
│ ┌──────┐                                        │
│ │portrait│  [SPEAKER]: dialogue text here...     │
│ │      │                                        │
│ └──────┘  ┌─────────────────┐ ┌────────────────┐│
│           │ CHOICE A        │ │ CHOICE B       ││
│           └─────────────────┘ └────────────────┘│
└─────────────────────────────────────────────────┘
```

**Proportions (base 1920×1080):**

- Main viewport: ~65% width (1248px), full height minus bottom bar
- Sidebar: ~35% width (672px), full height minus bottom bar
- Bottom bar: full width, ~33% height (360px)

### 6.2 Layout Manager (`ui/layout.ts`)

**Responsibility:** Create and manage the three-pane DOM structure. Toggle between full-screen mode (Beats 1-2, endings) and game UI mode (Beats 3-6).

**Key operations:**

- `initLayout(rootElement: HTMLElement)` — Build the DOM skeleton (viewport, sidebar, bottom bar containers)
- `setFullScreen()` — Hide sidebar and bottom bar, viewport fills screen
- `setGameUI()` — Show three-pane layout
- `setBackground(assetKey: string)` — Update viewport background image (with crossfade transition)

### 6.3 Dialogue Renderer (`ui/dialogue.ts`)

**Responsibility:** Render dialogue lines with typewriter effect, display character portraits, present choice buttons.

**Key operations:**

- `renderLine(line: DialogueLine, character: Character | null)` — Display speaker name, start typewriter on text, show portrait
- `skipTypewriter()` — Complete current line instantly (on click during typewriter)
- `isTypewriterActive(): boolean` — Check if typewriter is mid-render
- `renderChoices(choices: Choice[], state: GameState)` — Display choice buttons, filtering by conditions. Bind click handlers.
- `clearDialogue()` — Clear bottom bar content (for scene transitions)

**Typewriter behavior:**

- Characters appear one at a time at configurable speed (from `config.typewriterSpeed`)
- Clicking during typewriter completes the line instantly
- Clicking after line is complete advances to next line (or triggers choices/auto-advance)
- This means a single click handler on the bottom bar handles both skip and advance

**Portrait display:**

- Portrait appears left-aligned in the bottom bar (see mockup)
- If character has a portrait: display the image for their current expression
- If no portrait (narrator): hide portrait area, text fills full width
- Portrait transitions: simple crossfade when speaker changes

### 6.4 HUD Renderer (`ui/hud.ts`)

**Responsibility:** Render and update the sidebar elements — stat bars, intrusion clock, location timeline, inventory/document grid.

**Key operations:**

- `initHUD(sidebarElement: HTMLElement)` — Build sidebar DOM structure
- `updateStats(stats: PlayerStats)` — Update stat bar fills and labels
- `updateClock(clock: IntrusionClock)` — Update clock bar fill and color (green → amber → red thresholds)
- `updateTimeline(currentStop: number, totalStops: number, communities: CommunityRunState[])` — Update location timeline dots and labels
- `updateInventory(state: GameState)` — Update inventory/document grid (visual representation of consumables and found documents)

**Clock color thresholds:**

- 0-40%: green (`#4CAF50` range)
- 40-70%: amber (`#FF9800` range)
- 70-100%: red (`#F44336` range)

**Stat bars from mockup:**

- INTRUSION — the clock (colored bar)
- KNOWLEDGE — accumulator (blue/cyan bar)
- RAPPORT — derived value (segmented, colored by positive/negative)
- RESOURCES — consumables (green segmented bar)

### 6.5 Screen Manager (`ui/screens.ts`)

**Responsibility:** Manage overlay screens that replace or overlay the game view — title screen, save/load modal, ending screen, settings.

**Key operations:**

- `showTitleScreen(hasContinue: boolean)` — Render title screen with New Game, Continue (if autosave exists), Load Game, Settings
- `showSaveLoadScreen(mode: 'save' | 'load', slots: SaveSlot[])` — Render save/load modal with slot summaries
- `showEndingScreen(endingType: string, epilogueParts: string[])` — Render ending with community-specific epilogue
- `showSettings(persistent: PersistentData)` — Audio toggle, cutscene toggle

---

## 7. Audio

### 7.1 Audio Manager (`audio/audio-manager.ts`)

**Responsibility:** BGM playback with crossfade transitions. SFX hookpoints. Mute state persistence.

**Key operations:**

- `init(muted: boolean)` — Initialize audio context
- `playBGM(assetKey: string, crossfade: boolean)` — Start a BGM track. If crossfade: fade out current, fade in new over `config.bgmCrossfadeDuration`ms. If not crossfade: hard cut.
- `stopBGM(fadeOut: boolean)` — Stop current BGM
- `playSFX(assetKey: string)` — Play a one-shot sound effect
- `setMuted(muted: boolean)` — Toggle mute. Persist to PersistentData.
- `isMuted(): boolean`

**Implementation notes:**

- Use two `HTMLAudioElement` instances for crossfade (one fading out, one fading in)
- BGM tracks loop by default (`audio.loop = true`)
- Respect browser autoplay policies: audio init must happen in response to a user gesture (first click on title screen)
- Graceful degradation: if audio files are missing (placeholder mode), log a warning and continue silently

---

## 8. Styling

### 8.1 Design Language

The visual target is the NB2 mockup — industrial HUD aesthetic with cyan/amber accents on dark backgrounds.

**CSS custom properties (theming):**

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0e14;
  --bg-panel: rgba(10, 14, 20, 0.85);
  --bg-panel-solid: #0d1117;
  
  /* Accent colors */
  --accent-cyan: #00d4ff;
  --accent-amber: #ff9800;
  --accent-red: #ff3b30;
  --accent-green: #4caf50;
  
  /* Text */
  --text-primary: #e0e6ed;
  --text-secondary: #8899aa;
  --text-label: #5c7080;
  
  /* Borders */
  --border-panel: rgba(0, 212, 255, 0.2);
  --border-active: rgba(0, 212, 255, 0.5);
  
  /* Typography */
  --font-body: 'IBM Plex Mono', 'Courier New', monospace;
  --font-display: 'IBM Plex Sans Condensed', 'Arial Narrow', sans-serif;
  
  /* Spacing */
  --bar-height: 22px;
  --panel-padding: 16px;
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
}
```

**Font loading:**

- IBM Plex Mono (body text, dialogue, stats) — Google Fonts
- IBM Plex Sans Condensed (labels, headings, UI elements) — Google Fonts

### 8.2 Key CSS Patterns

**Stat bars:** CSS-only animated bars using `width` transitions on an inner `div`. Background is `--bg-panel`, fill is the relevant accent color.

**Panel borders:** `1px solid var(--border-panel)` with subtle `box-shadow: 0 0 8px rgba(0, 212, 255, 0.05)` for glow.

**Typewriter cursor:** Blinking `|` character using CSS animation at the end of the rendered text, removed when line is complete.

**Choice buttons:** Horizontal layout in the bottom bar. Background `var(--bg-panel)`, border `var(--border-panel)`, hover state brightens border to `var(--border-active)` with subtle glow. Text is `var(--accent-cyan)`.

**Viewport background:** `background-size: cover; background-position: center;` with a CSS transition for crossfade (opacity swap between two layered divs).

**Scanline/vignette effects (optional):** Subtle CSS overlay on the viewport for atmosphere. Keeps the industrial HUD feel. Implemented as `::after` pseudo-elements so they don't interfere with content.

---

## 9. Data Files

### 9.1 scenes.json — Test Scenario

For the engine build, include a minimal test scenario that exercises all six beats and all engine mechanics. This is NOT the real Within Parameters story content — it's a functional test.

**Required test coverage:**

- Beat 1: One skippable lore card scene
- Beat 2: 3-4 linear dialogue scenes with speaker changes and background transitions
- Beat 3: 2-3 scenes that transition into the event system
- Beat 4: Entry handled by the event system (test events in events.json)
- Beat 5: 1-2 stat-gated scenes (show/hide options based on Knowledge and Consumables)
- Beat 6: Branching to all three endings based on state
- Beat 6b: Three ending scenes with epilogue text

The test scenario should use placeholder names and generic text. Something like "Test Station Alpha" and "This is test dialogue line 1" is fine. It just needs to prove every code path works.

### 9.2 events.json — Test Events

Include 4 test events — enough to exercise the draw system:

- 2 community events (stops 1-2)
- 1 transit event (stops 3-4)  
- 1 approach event (stops 5-6)

Each event needs:

- 2-3 scenes (arrive, situation/choice, consequence)
- A choice that modifies community state
- A knowledge-gated option on at least one event
- All three reward types in the reward options

### 9.3 communities.json

Include 8 test community names (enough for random assignment to 6 stops with some variety).

### 9.4 characters.json

Include test character definitions for:

- `protagonist` — narrator-style (no portrait in bottom bar, text fills width)
- `coworker` — dialogue partner for Beat 2 and comms beats
- `npc-1`, `npc-2` — generic NPCs for community events

Each with a `defaultExpression` and 1-2 expression variants. Portrait paths point to placeholder images.

### 9.5 config.json — Balance Defaults

```json
{
  "startingConsumables": 5,
  "startingKnowledge": 0,
  "clockMax": 10,
  "clockBaseTick": 1,
  "clockJitterMax": 1,
  "clockReductionBase": 1,
  "rapportClockScale": 0.5,
  "knowledgeGoodEndingThreshold": 8,
  "consumableFixCost": 2,
  "typewriterSpeed": 30,
  "bgmCrossfadeDuration": 2000,
  "journeyStops": 6,
  "zoneMap": {
    "1": "community",
    "2": "community",
    "3": "transit",
    "4": "transit",
    "5": "approach",
    "6": "approach"
  }
}
```

These are GDD placeholder values. Real balance comes from playtesting.

---

## 10. Placeholder Assets

The engine must render correctly with zero real art or audio. Placeholder strategy:

**Backgrounds:** Each `BackgroundAsset` in characters.json includes a `placeholderStyle` field — a CSS gradient string. The layout manager checks if the image file exists; if not, falls back to the gradient.

**Portraits:** Each expression has a `placeholderColor` field. The dialogue renderer draws a colored rounded rectangle with the character's initials centered in it.

**Audio:** If audio files are missing, the audio manager logs a warning and all playback calls become no-ops. No errors thrown.

This means the engine is fully functional and testable without any art or audio assets deployed.

---

## 11. Build & Deploy

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/data',
    },
  },
});
```

### Commands

- `npm run dev` — Vite dev server with hot reload
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally

### Azure Static Web Apps

The `dist/` directory is the deployment artifact. Standard SWA config with fallback to `index.html` for client-side routing (though this app doesn't use routing — it's a single page).

---

## 12. Implementation Order

Recommended build sequence for Claude Code (or any agent):

### Phase 1 — Scaffold
1. `package.json`, `tsconfig.json`, `vite.config.ts` — project setup
2. `public/index.html` — shell HTML
3. `src/types/*.ts` — all type definitions (copy from Section 4)
4. `src/main.ts` — minimal bootstrap (empty shell)

### Phase 2 — Data Layer
5. `data/config.json` — balance config
6. `data/characters.json` — test character definitions
7. `data/communities.json` — test community pool
8. `src/engine/game-state.ts` — state manager

### Phase 3 — Engine Core
9. `src/engine/save-manager.ts` — save/load system
10. `src/engine/event-system.ts` — event pool and draw
11. `src/engine/scene-runner.ts` — scene progression (the big one)

### Phase 4 — UI
12. `src/styles.css` — full styling
13. `src/ui/layout.ts` — three-pane DOM setup
14. `src/ui/dialogue.ts` — typewriter, portraits, choices
15. `src/ui/hud.ts` — sidebar stats, clock, timeline
16. `src/ui/screens.ts` — title, save/load, endings

### Phase 5 — Audio + Integration
17. `src/audio/audio-manager.ts` — BGM/SFX manager
18. Wire everything together in `src/main.ts`

### Phase 6 — Test Content
19. `data/scenes.json` — test scenario
20. `data/events.json` — test events
21. Placeholder asset generation (CSS gradients, colored rectangles)
22. End-to-end test: new game → all beats → all three endings

---

## 13. What Is NOT In Scope

- Real story content (that's a separate writing phase)
- Real art assets (that's the production art sprint)
- Real audio (that's the soundtrack phase)
- Mobile responsiveness (desktop primary, GDD §11)
- Accessibility beyond basic keyboard navigation
- Analytics or telemetry
- Multiplayer or networking
- Scenario loading from external URLs (v2)
- Itch.io-specific packaging (deployment phase)

---

## 14. Success Criteria

The engine is complete when:

1. **Title screen** renders with New Game / Continue / Load / Settings
2. **New Game** starts a fresh run with config defaults
3. **All six beats** are traversable using the test scenario
4. **Event system** draws from pool, assigns communities, runs the full event cycle, presents rewards
5. **Intrusion clock** ticks with jitter, displays color-coded, triggers loss ending when full
6. **Knowledge gates** show/hide choices based on accumulated knowledge
7. **Three endings** are reachable based on different stat states
8. **Epilogue** references specific community outcomes by name
9. **Save/load** works — autosave after marked scenes, manual save to 5 slots, load restores exact state
10. **Typewriter** effect with skip-on-click
11. **Placeholder rendering** works with zero real assets
12. **`vite build`** produces a static `dist/` directory that runs standalone
13. **No runtime errors** in browser console during a full test playthrough

---

## Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Game Design Document | [game-design/game-design-document.md](../game-design/game-design-document.md) | Authoritative design reference — all mechanics |
| Art Direction Bible | [game-design/art-direction-bible.md](../game-design/art-direction-bible.md) | Visual identity, color palette, asset specs |
| Storyboard | [game-design/storyboard.md](../game-design/storyboard.md) | Scene-by-scene narrative breakdown |
| NB2 UI Mockup | [assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png](../assets/concept-artwork/ui/ui-mockup-nano-banana-pro-2.png) | Visual target for the three-pane layout |
| Agent Instructions | [AGENTS.md](../AGENTS.md) | Project context for AI agents |
