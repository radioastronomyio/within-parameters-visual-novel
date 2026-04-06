/**
 * Audio manager — BGM crossfades and one-shot SFX.
 * Two Audio elements (player A/B) enable smooth BGM transitions.
 * Mute state persists via PersistentData; autoplay unlock is deferred to
 * first user gesture (browser policy).
 *
 * @module audio/audio-manager
 */

import type { AudioAsset } from '../types/index';

// ─── State ────────────────────────────────────────────────────────────────────

let audioAssets: AudioAsset[] = [];
let muted = false;
let crossfadeDuration = 2000;

// Two audio elements for crossfade
let playerA: HTMLAudioElement | null = null;
let playerB: HTMLAudioElement | null = null;
let activePlayer: 'a' | 'b' = 'a';

let currentBgmKey: string | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function init(assets: AudioAsset[], isMuted: boolean, fadeDuration: number): void {
  audioAssets = assets;
  muted = isMuted;
  crossfadeDuration = fadeDuration;

  playerA = new Audio();
  playerB = new Audio();

  playerA.loop = true;
  playerB.loop = true;

  playerA.volume = muted ? 0 : 1;
  playerB.volume = muted ? 0 : 0;
}

// ─── BGM ──────────────────────────────────────────────────────────────────────

/** Crossfades to a new BGM track. No-ops if the requested key is already playing. Autoplay failures are caught and silently deferred — audio resumes on next user gesture. */
export function playBGM(assetKey: string, crossfade: boolean = true): void {
  if (assetKey === currentBgmKey) return;
  if (!playerA || !playerB) return;

  const asset = audioAssets.find((a) => a.key === assetKey);
  if (!asset) {
    console.warn(`[audio] BGM asset not found: ${assetKey}`);
    return;
  }

  const incoming = activePlayer === 'a' ? playerB : playerA;
  const outgoing = activePlayer === 'a' ? playerA : playerB;

  incoming.src = `/assets/${asset.path}`;
  incoming.loop = asset.loop;
  incoming.volume = 0;

  incoming.play().catch(() => {
    // Autoplay blocked — will play after first user gesture
    console.warn(`[audio] BGM autoplay blocked for: ${assetKey}`);
  });

  if (crossfade && !muted) {
    fadeCross(outgoing, incoming, asset.volume);
  } else {
    outgoing.pause();
    outgoing.currentTime = 0;
    if (!muted) {
      incoming.volume = asset.volume;
    }
  }

  activePlayer = activePlayer === 'a' ? 'b' : 'a';
  currentBgmKey = assetKey;
}

function fadeCross(
  outgoing: HTMLAudioElement,
  incoming: HTMLAudioElement,
  targetVolume: number
): void {
  if (muted) {
    outgoing.pause();
    return;
  }

  const steps = 30;
  const interval = crossfadeDuration / steps;
  const startVolumeOut = outgoing.volume;
  const step = targetVolume / steps;
  let tick = 0;

  const timer = setInterval(() => {
    tick++;
    outgoing.volume = Math.max(0, startVolumeOut - (startVolumeOut / steps) * tick);
    incoming.volume = Math.min(targetVolume, step * tick);

    if (tick >= steps) {
      clearInterval(timer);
      outgoing.pause();
      outgoing.currentTime = 0;
      incoming.volume = targetVolume;
    }
  }, interval);
}

export function stopBGM(fadeOut: boolean = true): void {
  const outgoing = activePlayer === 'a' ? playerA : playerB;
  if (!outgoing) return;

  if (fadeOut && !muted) {
    const startVolume = outgoing.volume;
    const steps = 20;
    const interval = 800 / steps;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      if (!outgoing) { clearInterval(timer); return; }
      outgoing.volume = Math.max(0, startVolume - (startVolume / steps) * tick);
      if (tick >= steps) {
        clearInterval(timer);
        outgoing.pause();
        outgoing.currentTime = 0;
      }
    }, interval);
  } else {
    outgoing.pause();
    outgoing.currentTime = 0;
  }

  currentBgmKey = null;
}

// ─── SFX ──────────────────────────────────────────────────────────────────────

export function playSFX(assetKey: string): void {
  if (muted) return;

  const asset = audioAssets.find((a) => a.key === assetKey);
  if (!asset) {
    console.warn(`[audio] SFX asset not found: ${assetKey}`);
    return;
  }

  const sfx = new Audio(`/assets/${asset.path}`);
  sfx.volume = asset.volume;
  sfx.play().catch(() => {
    // Silently ignore — SFX failure is non-critical
  });
}

// ─── Mute ─────────────────────────────────────────────────────────────────────

/**
 * AI NOTE: Only adjusts the active player volume — the inactive player remains at 0
 * and will stay muted through the next crossfade.
 */
export function setMuted(isMuted: boolean): void {
  muted = isMuted;

  const active = activePlayer === 'a' ? playerA : playerB;
  if (active) {
    active.volume = muted ? 0 : getActiveVolume();
  }
}

export function isMuted(): boolean {
  return muted;
}

function getActiveVolume(): number {
  if (!currentBgmKey) return 0;
  const asset = audioAssets.find((a) => a.key === currentBgmKey);
  return asset?.volume ?? 0.5;
}

// ─── Resume after user gesture ────────────────────────────────────────────────

/** Resumes the active player after the browser's autoplay policy blocks initial playback. Wire to the first click event on the page. */
export function resumeAfterGesture(): void {
  const active = activePlayer === 'a' ? playerA : playerB;
  if (active && active.paused && currentBgmKey) {
    active.play().catch(() => { /* still blocked */ });
  }
}
