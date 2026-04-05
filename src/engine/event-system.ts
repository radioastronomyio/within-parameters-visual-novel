import type {
  EventDef,
  Community,
  CommunityRunState,
  RewardOption,
  GameState,
  GameConfig,
  IntrusionClock,
} from '../types/index';
import { calculateClockReduction, applyStatChanges } from './game-state';

export interface EventPoolState {
  /** Events grouped by zone category */
  byZone: {
    community: EventDef[];
    transit: EventDef[];
    approach: EventDef[];
  };
  /** Unused communities available for assignment */
  availableCommunities: Community[];
  /** Events already drawn this run (IDs) */
  usedEventIds: Set<string>;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // biome-ignore lint — deliberate swap
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function initEventPool(
  events: EventDef[],
  _config: GameConfig,
  communities: Community[]
): EventPoolState {
  const byZone: EventPoolState['byZone'] = {
    community: shuffle(events.filter((e) => e.category === 'community')),
    transit: shuffle(events.filter((e) => e.category === 'transit')),
    approach: shuffle(events.filter((e) => e.category === 'approach')),
  };

  return {
    byZone,
    availableCommunities: shuffle(communities),
    usedEventIds: new Set(),
  };
}

export function drawEvent(
  pool: EventPoolState,
  stopIndex: number,
  config: GameConfig
): { event: EventDef; community: Community; pool: EventPoolState } {
  const zoneKey = (config.zoneMap[stopIndex] ?? 'community') as keyof EventPoolState['byZone'];
  const zonePool = pool.byZone[zoneKey];

  const eligible = zonePool.filter((e) => !pool.usedEventIds.has(e.id));

  if (eligible.length === 0) {
    // Fallback: any unused event
    const fallback = [
      ...pool.byZone.community,
      ...pool.byZone.transit,
      ...pool.byZone.approach,
    ].find((e) => !pool.usedEventIds.has(e.id));

    if (!fallback) {
      throw new Error(`[event-system] No eligible events for stop ${stopIndex}`);
    }
    return drawEventResult(fallback, pool, config, stopIndex);
  }

  const event = eligible[0]!;
  return drawEventResult(event, pool, config, stopIndex);
}

function drawEventResult(
  event: EventDef,
  pool: EventPoolState,
  _config: GameConfig,
  _stopIndex: number
): { event: EventDef; community: Community; pool: EventPoolState } {
  const community = pool.availableCommunities[0] ?? {
    id: 'community-unknown',
    name: 'Unknown Settlement',
    description: 'an unrecorded community',
  };

  const newUsed = new Set(pool.usedEventIds);
  newUsed.add(event.id);

  const newPool: EventPoolState = {
    byZone: {
      community: pool.byZone.community.filter((e) => e.id !== event.id),
      transit: pool.byZone.transit.filter((e) => e.id !== event.id),
      approach: pool.byZone.approach.filter((e) => e.id !== event.id),
    },
    availableCommunities: pool.availableCommunities.slice(1),
    usedEventIds: newUsed,
  };

  return { event, community, pool: newPool };
}

export function getRewardsForStop(
  event: EventDef,
  state: GameState,
  config: GameConfig
): RewardOption[] {
  return event.rewards.map((reward) => {
    if (reward.type === 'clock-reduction') {
      const reduction = calculateClockReduction(state, config);
      return {
        ...reward,
        baseEffect: { ...reward.baseEffect, clock: -reduction },
        description: reward.description.replace(
          '{amount}',
          String(reduction)
        ),
      };
    }
    return reward;
  });
}

export function applyReward(
  reward: RewardOption,
  state: GameState,
  config: GameConfig
): GameState {
  if (reward.type === 'clock-reduction') {
    const reduction = calculateClockReduction(state, config);
    return applyStatChanges(state, { clock: -reduction });
  }

  return applyStatChanges(state, reward.baseEffect);
}

export function shouldTriggerComms(stopIndex: number, clock: IntrusionClock): boolean {
  // Trigger a coworker comms beat after stop 3 if clock is above 50%
  if (stopIndex === 3 && clock.current / clock.max > 0.5) {
    return true;
  }
  return false;
}

export function buildCommunityRunState(
  community: Community,
  stop: number
): CommunityRunState {
  return {
    community,
    state: 'ignored',
    stop,
  };
}
