import { getPowerupTypes, type PowerupType } from '../entities/Powerup';
import type { ChallengeRunMode } from './ChallengeMode';
import type { MedalSnapshot } from './MedalSystem';
import type { RunStatsSnapshot } from './RunStats';
import { SECTOR_CONFIGS } from './SectorConfig';
import type { SectorProgressSnapshot } from './SectorProgress';

export type AchievementId =
  | 'first-cleanup'
  | 'training-certified'
  | 'combo-technician'
  | 'hazard-whisperer'
  | 'near-miss-artist'
  | 'powerup-collector'
  | 'daily-regular'
  | 'all-sectors-clean'
  | 'golden-orbit'
  | 'janitor-prime';

export interface AchievementProgress {
  current: number;
  target: number;
  isComplete: boolean;
  text: string;
}

export interface AchievementSnapshotItem {
  id: AchievementId;
  name: string;
  description: string;
  progress: AchievementProgress;
  isUnlocked: boolean;
}

export interface AchievementSnapshot {
  achievements: AchievementSnapshotItem[];
  unlockedIds: AchievementId[];
  unlockedCount: number;
  totalCount: number;
  lifetimeHazardsSurvived: number;
  dailyCompletionCount: number;
  powerupTypesCollected: PowerupType[];
}

export interface AchievementEvaluationContext {
  stats: RunStatsSnapshot;
  sectorId: string;
  runMode: ChallengeRunMode;
  dailyDate: string | null;
  sectorProgress: SectorProgressSnapshot;
  medals: MedalSnapshot;
}

export interface AchievementUnlock {
  id: AchievementId;
  name: string;
}

interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  getProgress(
    context: AchievementEvaluationContext,
    state: AchievementState
  ): AchievementProgress;
}

interface StoredAchievementState {
  unlockedIds?: unknown;
  lifetimeHazardsSurvived?: unknown;
  powerupTypesCollected?: unknown;
  dailyCompletionDates?: unknown;
}

interface AchievementState {
  unlockedIds: Set<AchievementId>;
  lifetimeHazardsSurvived: number;
  powerupTypesCollected: Set<PowerupType>;
  dailyCompletionDates: Set<string>;
}

const STORAGE_KEY = 'orbit-janitor.achievements';
const ALL_POWERUP_TYPES = getPowerupTypes();
const COMPLETABLE_SECTOR_IDS = SECTOR_CONFIGS.filter((sector) => !sector.isEndless).map(
  (sector) => sector.id
);

const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: 'first-cleanup',
    name: 'First Cleanup',
    description: 'Complete any sector.',
    getProgress: (context) =>
      booleanProgress(
        context.sectorProgress.completedSectorIds.length > 0,
        'Complete a cleanup sector'
      )
  },
  {
    id: 'training-certified',
    name: 'Training Certified',
    description: 'Finish Training Orbit.',
    getProgress: (context) =>
      booleanProgress(
        context.sectorProgress.completedSectorIds.includes('training-orbit'),
        'Finish Training Orbit'
      )
  },
  {
    id: 'combo-technician',
    name: 'Combo Technician',
    description: 'Reach a 5x combo multiplier.',
    getProgress: (context) =>
      numericProgress(context.stats.highestComboMultiplier, 5, 'x')
  },
  {
    id: 'hazard-whisperer',
    name: 'Hazard Whisperer',
    description: 'Survive 10 hazards lifetime.',
    getProgress: (_context, state) => numericProgress(state.lifetimeHazardsSurvived, 10)
  },
  {
    id: 'near-miss-artist',
    name: 'Near Miss Artist',
    description: 'Get 5 near misses in one run.',
    getProgress: (context) => numericProgress(context.stats.nearMisses, 5)
  },
  {
    id: 'powerup-collector',
    name: 'Powerup Collector',
    description: 'Collect every powerup type.',
    getProgress: (_context, state) =>
      numericProgress(state.powerupTypesCollected.size, ALL_POWERUP_TYPES.length)
  },
  {
    id: 'daily-regular',
    name: 'Daily Regular',
    description: 'Complete 3 daily challenges.',
    getProgress: (_context, state) => numericProgress(state.dailyCompletionDates.size, 3)
  },
  {
    id: 'all-sectors-clean',
    name: 'All Sectors Clean',
    description: 'Complete every non-endless sector.',
    getProgress: (context) => {
      const completedCount = COMPLETABLE_SECTOR_IDS.filter((sectorId) =>
        context.sectorProgress.completedSectorIds.includes(sectorId)
      ).length;

      return numericProgress(completedCount, COMPLETABLE_SECTOR_IDS.length);
    }
  },
  {
    id: 'golden-orbit',
    name: 'Golden Orbit',
    description: 'Earn 5 Gold or Prime medals.',
    getProgress: (context) => numericProgress(context.medals.goldOrBetterCount, 5)
  },
  {
    id: 'janitor-prime',
    name: 'Janitor Prime',
    description: 'Earn one Prime medal.',
    getProgress: (context) => numericProgress(context.medals.primeCount, 1)
  }
];

export class AchievementSystem {
  private readonly state = readStoredState();

  evaluateRun(context: AchievementEvaluationContext): AchievementUnlock[] {
    this.recordLifetimeRunStats(context);
    const unlocks: AchievementUnlock[] = [];

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      if (this.state.unlockedIds.has(achievement.id)) {
        continue;
      }

      if (!achievement.getProgress(context, this.state).isComplete) {
        continue;
      }

      this.state.unlockedIds.add(achievement.id);
      unlocks.push({
        id: achievement.id,
        name: achievement.name
      });
    }

    if (unlocks.length > 0) {
      writeStoredState(this.state);
    }

    return unlocks;
  }

  getSnapshot(context: AchievementEvaluationContext): AchievementSnapshot {
    return {
      achievements: ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        progress: achievement.getProgress(context, this.state),
        isUnlocked: this.state.unlockedIds.has(achievement.id)
      })),
      unlockedIds: [...this.state.unlockedIds],
      unlockedCount: this.state.unlockedIds.size,
      totalCount: ACHIEVEMENT_DEFINITIONS.length,
      lifetimeHazardsSurvived: this.state.lifetimeHazardsSurvived,
      dailyCompletionCount: this.state.dailyCompletionDates.size,
      powerupTypesCollected: [...this.state.powerupTypesCollected]
    };
  }

  private recordLifetimeRunStats(context: AchievementEvaluationContext): void {
    let changed = false;

    if (context.stats.hazardsSurvived > 0) {
      this.state.lifetimeHazardsSurvived += context.stats.hazardsSurvived;
      changed = true;
    }

    for (const powerupType of context.stats.powerupTypesCollected) {
      if (this.state.powerupTypesCollected.has(powerupType)) {
        continue;
      }

      this.state.powerupTypesCollected.add(powerupType);
      changed = true;
    }

    if (
      context.runMode === 'daily' &&
      context.dailyDate !== null &&
      context.stats.sectorCompleted &&
      !this.state.dailyCompletionDates.has(context.dailyDate)
    ) {
      this.state.dailyCompletionDates.add(context.dailyDate);
      changed = true;
    }

    if (changed) {
      writeStoredState(this.state);
    }
  }
}

function readStoredState(): AchievementState {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === null) {
      return createDefaultState();
    }

    const parsedValue = JSON.parse(storedValue) as StoredAchievementState | null;

    if (parsedValue === null || typeof parsedValue !== 'object') {
      return createDefaultState();
    }

    const unlockedIds = Array.isArray(parsedValue.unlockedIds)
      ? parsedValue.unlockedIds.filter(isAchievementId)
      : [];
    const powerupTypesCollected = Array.isArray(parsedValue.powerupTypesCollected)
      ? parsedValue.powerupTypesCollected.filter(isPowerupType)
      : [];
    const dailyCompletionDates = Array.isArray(parsedValue.dailyCompletionDates)
      ? parsedValue.dailyCompletionDates.filter(
          (dailyDate): dailyDate is string => typeof dailyDate === 'string'
        )
      : [];
    const lifetimeHazardsSurvived =
      typeof parsedValue.lifetimeHazardsSurvived === 'number' &&
      Number.isFinite(parsedValue.lifetimeHazardsSurvived)
        ? Math.max(0, Math.floor(parsedValue.lifetimeHazardsSurvived))
        : 0;

    return {
      unlockedIds: new Set(unlockedIds),
      lifetimeHazardsSurvived,
      powerupTypesCollected: new Set(powerupTypesCollected),
      dailyCompletionDates: new Set(dailyCompletionDates)
    };
  } catch {
    return createDefaultState();
  }
}

function writeStoredState(state: AchievementState): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unlockedIds: [...state.unlockedIds],
        lifetimeHazardsSurvived: state.lifetimeHazardsSurvived,
        powerupTypesCollected: [...state.powerupTypesCollected],
        dailyCompletionDates: [...state.dailyCompletionDates]
      })
    );
  } catch {
    // Achievement persistence should not block gameplay when storage is unavailable.
  }
}

function createDefaultState(): AchievementState {
  return {
    unlockedIds: new Set(),
    lifetimeHazardsSurvived: 0,
    powerupTypesCollected: new Set(),
    dailyCompletionDates: new Set()
  };
}

function numericProgress(
  current: number,
  target: number,
  suffix = ''
): AchievementProgress {
  const clampedCurrent = Math.max(0, Math.min(target, Math.floor(current)));

  return {
    current: clampedCurrent,
    target,
    isComplete: clampedCurrent >= target,
    text: `${clampedCurrent}${suffix} / ${target}${suffix}`
  };
}

function booleanProgress(isComplete: boolean, text: string): AchievementProgress {
  return {
    current: isComplete ? 1 : 0,
    target: 1,
    isComplete,
    text
  };
}

function isAchievementId(value: unknown): value is AchievementId {
  return (
    typeof value === 'string' &&
    ACHIEVEMENT_DEFINITIONS.some((achievement) => achievement.id === value)
  );
}

function isPowerupType(value: unknown): value is PowerupType {
  return (
    typeof value === 'string' &&
    ALL_POWERUP_TYPES.some((powerupType) => powerupType === value)
  );
}
