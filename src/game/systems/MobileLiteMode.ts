import type { PowerupType } from '../entities/Powerup';
import type { MissionObjectiveSnapshot } from './MissionDirector';
import type { RunStatsSnapshot } from './RunStats';

export type GameExperienceMode = 'full' | 'mobileLite';

export interface MobileLiteSnapshot {
  isActive: boolean;
  bestScore: number;
  objective: MissionObjectiveSnapshot;
  guideVisible: boolean;
  guideStepIndex: number;
  guideText: string;
}

export interface MobileLiteDifficultyModifiers {
  hazardTelegraphMultiplier: number;
  hazardActiveMultiplier: number;
  obstacleCap: number;
  eventsEnabled: boolean;
  allowedPowerupTypes: readonly PowerupType[];
}

const MOBILE_LITE_BEST_STORAGE_KEY = 'orbit-janitor.mobileLiteBest';
export const MOBILE_LITE_TARGET_JUNK = 20;
export const MOBILE_LITE_TARGET_TIME_SECONDS = 75;
export const MOBILE_LITE_SCRAP_MULTIPLIER = 0.5;
export const MOBILE_LITE_MISSION_LABEL = 'Pocket Cleanup';

const GUIDE_STEPS = [
  'Tap Lane In/Out to dodge.',
  'Hold Boost to catch junk.',
  'Orange warns. Red hurts.'
] as const;
const GUIDE_VISIBLE_SECONDS = 13;

const DIFFICULTY_MODIFIERS: MobileLiteDifficultyModifiers = {
  hazardTelegraphMultiplier: 1.4,
  hazardActiveMultiplier: 0.9,
  obstacleCap: 2,
  eventsEnabled: false,
  allowedPowerupTypes: ['shieldPickup', 'magnetSurge', 'timeDilation']
};

export class MobileLiteMode {
  private isActive = false;
  private bestScore = readStoredBestScore();

  start(): void {
    this.isActive = true;
  }

  stop(): void {
    this.isActive = false;
  }

  completeRun(score: number): void {
    if (score <= this.bestScore) {
      return;
    }

    this.bestScore = Math.max(0, Math.floor(score));
    writeStoredBestScore(this.bestScore);
  }

  getDifficultyModifiers(): MobileLiteDifficultyModifiers {
    return DIFFICULTY_MODIFIERS;
  }

  getObjective(stats: RunStatsSnapshot): MissionObjectiveSnapshot {
    const junkProgress = Math.min(stats.junkCollected, MOBILE_LITE_TARGET_JUNK);
    const timeProgress = Math.min(
      Math.floor(stats.runTime),
      MOBILE_LITE_TARGET_TIME_SECONDS
    );
    const junkRatio = junkProgress / MOBILE_LITE_TARGET_JUNK;
    const timeRatio = timeProgress / MOBILE_LITE_TARGET_TIME_SECONDS;

    return {
      text: `Objective: Collect ${MOBILE_LITE_TARGET_JUNK} junk or survive ${MOBILE_LITE_TARGET_TIME_SECONDS}s`,
      progressText: `${junkProgress} / ${MOBILE_LITE_TARGET_JUNK} junk or ${timeProgress} / ${MOBILE_LITE_TARGET_TIME_SECONDS}s`,
      progress: Math.max(0, Math.min(1, Math.max(junkRatio, timeRatio))),
      isComplete:
        stats.junkCollected >= MOBILE_LITE_TARGET_JUNK ||
        stats.runTime >= MOBILE_LITE_TARGET_TIME_SECONDS,
      isEndless: false
    };
  }

  getSnapshot(stats: RunStatsSnapshot): MobileLiteSnapshot {
    const guideStepIndex = getGuideStepIndex(stats.runTime);

    return {
      isActive: this.isActive,
      bestScore: this.bestScore,
      objective: this.getObjective(stats),
      guideVisible: stats.runTime < GUIDE_VISIBLE_SECONDS,
      guideStepIndex,
      guideText: GUIDE_STEPS[guideStepIndex]
    };
  }
}

function getGuideStepIndex(runTime: number): number {
  if (runTime < 4) {
    return 0;
  }

  if (runTime < 8) {
    return 1;
  }

  return 2;
}

function readStoredBestScore(): number {
  try {
    const stored = window.localStorage.getItem(MOBILE_LITE_BEST_STORAGE_KEY);
    const parsed = stored === null ? 0 : Number(stored);

    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  } catch {
    return 0;
  }
}

function writeStoredBestScore(score: number): void {
  try {
    window.localStorage.setItem(MOBILE_LITE_BEST_STORAGE_KEY, String(score));
  } catch {
    // Mobile Lite best persistence should not block play.
  }
}
