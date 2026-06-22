/**
 * Seedable pseudo-random number generator.
 *
 * The replay harness needs deterministic runs that match the Python simulator
 * in spirit (the spec asks for aggregate parity, not byte-exact seed equality).
 * The engine's runtime clock tick also uses this — never `Math.random()` — so
 * the harness can drive the real `tickClock` against a known seed.
 *
 * Implementation: mulberry32, a 32-bit PRNG with a single Uint32 state. Chosen
 * for portability (no BigInt, easy to mirror), sufficient statistical quality
 * for balance work, and the same `[0, 1)` float semantics as Python's
 * `Random.random()`. Python's Mersenne Twister is a different stream; see
 * simulation/parity-notes.md for why aggregate parity, not exact-seed parity,
 * is the bar.
 *
 * @module engine/rng
 */

/** Functional RNG surface used by the engine and the replay harness. */
export interface Rng {
  /** Float in [0, 1). Mirrors Python's Random.random(). */
  next(): number;
  /** Integer in [0, n). Mirrors Python's Random.randbelow(n) / randrange(n). */
  intBelow(n: number): number;
  /**
   * In-place Fisher–Yates shuffle of a copy. Mirrors Python's
   * Random.sample(pool, k) for the k == pool.length case used by the engine.
   */
  shuffle<T>(arr: readonly T[]): T[];
  /** Pick k distinct elements (preserves draw order like Python's Random.sample). */
  sample<T>(arr: readonly T[], k: number): T[];
}

/** mulberry32 state container. */
export function createRng(seed: number): Rng {
  // Force into unsigned 32-bit; seed may be any integer.
  let state = seed >>> 0;

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const intBelow = (n: number): number => {
    if (n <= 0) throw new RangeError(`intBelow requires n > 0, got ${n}`);
    return Math.floor(next() * n);
  };

  const shuffle = <T>(arr: readonly T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = out[i]!;
      out[i] = out[j]!;
      out[j] = tmp;
    }
    return out;
  };

  const sample = <T>(arr: readonly T[], k: number): T[] => {
    if (k < 0 || k > arr.length) {
      throw new RangeError(`sample size ${k} out of range for pool ${arr.length}`);
    }
    // For small k relative to pool, a partial Fisher–Yates is fine and matches
    // Python's Random.sample semantics (ordered selection without replacement).
    const pool = [...arr];
    const out: T[] = [];
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(next() * (pool.length - i));
      out.push(pool[j]!);
      pool[j] = pool[i]!;
    }
    return out;
  };

  return { next, intBelow, shuffle, sample };
}

/**
 * Default RNG used by the live engine (when no seed is provided). Wraps
 * Math.random() so non-harness callers get the same Rng surface without
 * committing to a seed.
 */
export function defaultRng(): Rng {
  const next = (): number => Math.random();
  const intBelow = (n: number): number => Math.floor(Math.random() * n);
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]!;
      out[i] = out[j]!;
      out[j] = tmp;
    }
    return out;
  };
  const sample = <T>(arr: readonly T[], k: number): T[] => {
    const pool = [...arr];
    const out: T[] = [];
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      out.push(pool[j]!);
      pool[j] = pool[i]!;
    }
    return out;
  };
  return { next, intBelow, shuffle, sample };
}
