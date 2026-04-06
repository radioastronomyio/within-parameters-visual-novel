/**
 * Character and asset manifest type contracts.
 * CharacterManifest is loaded once from characters.json and drives dialogue portraits,
 * backgrounds, and audio throughout the engine.
 */

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

/** Full character manifest loaded from characters.json */
export interface CharacterManifest {
  characters: Character[];
  portraits: PortraitAsset[];
  backgrounds: BackgroundAsset[];
  audio: AudioAsset[];
}
