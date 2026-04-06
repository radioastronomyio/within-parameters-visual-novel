/**
 * Type barrel — re-exports all public type contracts for the Within Parameters engine.
 * Import from here rather than from individual type modules.
 */
export type { BeatType, DialogueLine, Choice, ChoiceCondition, StatChanges, Scene, SceneFlags } from './scene';
export type { EventCategory, RewardType, CommunityState, RewardOption, EventDef, Community, CommunityRunState } from './event';
export type { PlayerStats, IntrusionClock, EventPhase, GameState, SaveSlot, PersistentData, GameConfig } from './state';
export type { Character, PortraitAsset, BackgroundAsset, AudioAsset, CharacterManifest } from './characters';
