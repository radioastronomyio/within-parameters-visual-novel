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
