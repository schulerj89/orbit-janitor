import type { ShipId } from '../entities/ships/ShipDefinitions';
import type { ChallengeRunMode } from './ChallengeMode';
import type { EventWaveType } from './EventWaveTypes';
import type { RunStatsSnapshot } from './RunStats';

export type ContractId =
  | 'no-boost-cleanup'
  | 'combo-courier'
  | 'clean-sweep'
  | 'shieldless'
  | 'near-miss-artist'
  | 'powerup-specialist'
  | 'hazard-reader'
  | 'daily-duty'
  | 'solar-janitor'
  | 'endless-apprentice'
  | 'endless-master'
  | 'scrap-miser'
  | 'graveyard-net-runner'
  | 'neon-streak'
  | 'relay-technician'
  | 'reactor-flare-reader'
  | 'junk-moon-hauler'
  | 'long-haul';

export interface ContractReward {
  scrap?: number;
  shipIds?: readonly ShipId[];
  cosmeticIds?: readonly string[];
}

export interface ContractEvaluationContext {
  stats: RunStatsSnapshot;
  sectorId: string;
  runMode: ChallengeRunMode;
  dailyDate: string | null;
}

export interface ContractProgress {
  current: number;
  target: number;
  isComplete: boolean;
  text: string;
}

export interface ContractDefinition {
  id: ContractId;
  name: string;
  description: string;
  reward: ContractReward;
  getProgress(context: ContractEvaluationContext): ContractProgress;
}

export const CONTRACT_DEFINITIONS: readonly ContractDefinition[] = [
  {
    id: 'no-boost-cleanup',
    name: 'No Boost Cleanup',
    description: 'Complete Low Orbit Cleanup without using boost.',
    reward: {
      scrap: 18
    },
    getProgress: (context) =>
      booleanProgress(
        context.sectorId === 'low-orbit-cleanup' &&
          context.stats.sectorCompleted &&
          !context.stats.boostUsed,
        context.sectorId !== 'low-orbit-cleanup'
          ? 'Low Orbit Cleanup only'
          : context.stats.boostUsed
            ? 'Boost used'
            : context.stats.sectorCompleted
              ? 'Complete'
              : 'No boost used'
      )
  },
  {
    id: 'combo-courier',
    name: 'Combo Courier',
    description: 'Reach combo multiplier 5x.',
    reward: {
      scrap: 12
    },
    getProgress: (context) =>
      numericProgress(context.stats.highestComboMultiplier, 5, 'x')
  },
  {
    id: 'clean-sweep',
    name: 'Clean Sweep',
    description: 'Collect 25 junk in a single run.',
    reward: {
      scrap: 20
    },
    getProgress: (context) => numericProgress(context.stats.junkCollected, 25)
  },
  {
    id: 'shieldless',
    name: 'Shieldless',
    description: 'Complete a sector without shield breaking.',
    reward: {
      scrap: 14
    },
    getProgress: (context) =>
      booleanProgress(
        context.stats.sectorCompleted && !context.stats.shieldBroken,
        context.stats.shieldBroken
          ? 'Shield broken'
          : context.stats.sectorCompleted
            ? 'Complete'
            : 'Finish a sector'
      )
  },
  {
    id: 'near-miss-artist',
    name: 'Near Miss Artist',
    description: 'Get 5 near misses in one run.',
    reward: {
      scrap: 16
    },
    getProgress: (context) => numericProgress(context.stats.nearMisses, 5)
  },
  {
    id: 'powerup-specialist',
    name: 'Powerup Specialist',
    description: 'Collect 3 powerups in one run.',
    reward: {
      scrap: 14
    },
    getProgress: (context) => numericProgress(context.stats.powerupsCollected, 3)
  },
  {
    id: 'hazard-reader',
    name: 'Hazard Reader',
    description: 'Survive 5 hazards in one run.',
    reward: {
      scrap: 18,
      cosmeticIds: ['badge-contractor']
    },
    getProgress: (context) => numericProgress(context.stats.hazardsSurvived, 5)
  },
  {
    id: 'daily-duty',
    name: 'Daily Duty',
    description: "Complete today's daily challenge.",
    reward: {
      scrap: 22,
      cosmeticIds: ['badge-daily']
    },
    getProgress: (context) =>
      booleanProgress(
        context.runMode === 'daily' && context.stats.sectorCompleted,
        context.runMode === 'daily'
          ? context.stats.sectorCompleted
            ? `Daily ${context.dailyDate ?? ''} complete`
            : 'Daily run active'
          : 'Start Daily Challenge'
      )
  },
  {
    id: 'solar-janitor',
    name: 'Solar Janitor',
    description: 'Complete Solar Storm with objective complete.',
    reward: {
      scrap: 24,
      shipIds: ['solar-dart']
    },
    getProgress: (context) =>
      booleanProgress(
        context.sectorId === 'solar-storm' && context.stats.sectorCompleted,
        context.sectorId === 'solar-storm' ? 'Survive the storm' : 'Solar Storm only'
      )
  },
  {
    id: 'endless-apprentice',
    name: 'Endless Apprentice',
    description: 'Reach 100 in Endless Cleanup.',
    reward: {
      scrap: 24
    },
    getProgress: (context) =>
      context.sectorId === 'endless-cleanup'
        ? numericProgress(context.stats.finalScore || context.stats.score, 100)
        : numericProgress(0, 100)
  },
  {
    id: 'endless-master',
    name: 'Endless Master',
    description: 'Reach 200 in Endless Cleanup.',
    reward: {
      scrap: 45,
      shipIds: ['golden-janitor'],
      cosmeticIds: ['badge-endless-master']
    },
    getProgress: (context) =>
      context.sectorId === 'endless-cleanup'
        ? numericProgress(context.stats.finalScore || context.stats.score, 200)
        : numericProgress(0, 200)
  },
  {
    id: 'scrap-miser',
    name: 'Scrap Miser',
    description: 'Complete a sector without buying new upgrades that session.',
    reward: {
      scrap: 20,
      cosmeticIds: ['badge-contractor']
    },
    getProgress: (context) =>
      booleanProgress(
        context.stats.sectorCompleted && !context.stats.upgradePurchasedThisSession,
        context.stats.upgradePurchasedThisSession
          ? 'Upgrade bought this session'
          : context.stats.sectorCompleted
            ? 'Complete'
            : 'Finish a sector'
      )
  },
  {
    id: 'graveyard-net-runner',
    name: 'Graveyard Net Runner',
    description: 'Survive 6 Satellite Net waves in one Graveyard Ring run.',
    reward: {
      scrap: 28,
      shipIds: ['night-runner']
    },
    getProgress: (context) =>
      context.sectorId === 'graveyard-ring'
        ? eventWaveProgress(context.stats, 'satelliteNet', 6)
        : numericProgress(0, 6)
  },
  {
    id: 'neon-streak',
    name: 'Neon Streak',
    description: 'Complete Neon Belt with the 5x combo objective.',
    reward: {
      scrap: 30,
      shipIds: ['manta']
    },
    getProgress: (context) =>
      booleanProgress(
        context.sectorId === 'neon-belt' && context.stats.sectorCompleted,
        context.sectorId === 'neon-belt'
          ? context.stats.sectorCompleted
            ? 'Complete'
            : `Score ${Math.min(context.stats.score, 90)} / 90 + x${Math.min(context.stats.highestComboMultiplier, 5)} / x5`
          : 'Neon Belt only'
      )
  },
  {
    id: 'relay-technician',
    name: 'Relay Technician',
    description: 'Collect 5 powerups in one Frozen Relay run.',
    reward: {
      scrap: 26,
      shipIds: ['comet-skiff']
    },
    getProgress: (context) =>
      context.sectorId === 'frozen-relay'
        ? numericProgress(context.stats.powerupsCollected, 5)
        : numericProgress(0, 5)
  },
  {
    id: 'reactor-flare-reader',
    name: 'Reactor Flare Reader',
    description: 'Survive 4 Solar Flare waves in Reactor Grave.',
    reward: {
      scrap: 34,
      shipIds: ['solar-dart']
    },
    getProgress: (context) =>
      context.sectorId === 'reactor-grave'
        ? eventWaveProgress(context.stats, 'solarFlare', 4)
        : numericProgress(0, 4)
  },
  {
    id: 'junk-moon-hauler',
    name: 'Junk Moon Hauler',
    description: 'Collect 40 junk in one Junk Moon run.',
    reward: {
      scrap: 32,
      shipIds: ['tugboat']
    },
    getProgress: (context) =>
      context.sectorId === 'junk-moon'
        ? numericProgress(context.stats.junkCollected, 40)
        : numericProgress(0, 40)
  },
  {
    id: 'long-haul',
    name: 'Long Haul',
    description: 'Complete Long Orbit.',
    reward: {
      scrap: 45,
      shipIds: ['golden-janitor'],
      cosmeticIds: ['badge-endless-master']
    },
    getProgress: (context) =>
      booleanProgress(
        context.sectorId === 'long-orbit' && context.stats.sectorCompleted,
        context.sectorId === 'long-orbit'
          ? `${Math.min(Math.floor(context.stats.runTime), 180)} / 180s`
          : 'Long Orbit only'
      )
  }
];

export function formatContractReward(reward: ContractReward): string {
  const parts: string[] = [];

  if (reward.scrap && reward.scrap > 0) {
    parts.push(`${reward.scrap} scrap`);
  }

  if (reward.shipIds && reward.shipIds.length > 0) {
    parts.push(`${reward.shipIds.length} ship unlock`);
  }

  if (reward.cosmeticIds && reward.cosmeticIds.length > 0) {
    parts.push(`${reward.cosmeticIds.length} badge unlock`);
  }

  return parts.length > 0 ? parts.join(' + ') : 'No reward';
}

function numericProgress(current: number, target: number, suffix = ''): ContractProgress {
  const clampedCurrent = Math.max(0, Math.min(target, Math.floor(current)));

  return {
    current: clampedCurrent,
    target,
    isComplete: clampedCurrent >= target,
    text: `${clampedCurrent}${suffix} / ${target}${suffix}`
  };
}

function booleanProgress(isComplete: boolean, text: string): ContractProgress {
  return {
    current: isComplete ? 1 : 0,
    target: 1,
    isComplete,
    text
  };
}

function eventWaveProgress(
  stats: RunStatsSnapshot,
  eventType: EventWaveType,
  target: number
): ContractProgress {
  return numericProgress(stats.eventWavesSurvived[eventType] ?? 0, target);
}
