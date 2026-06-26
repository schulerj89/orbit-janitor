import type { RunStatsSnapshot } from './RunStats';
import {
  DEFAULT_SECTOR_ID,
  getSectorById,
  type SectorConfig,
  type SectorObjective
} from './SectorConfig';
import {
  getSectorTheme,
  type SectorMusicIntensityHint,
  type SectorTheme
} from './SectorTheme';

export interface MissionObjectiveSnapshot {
  text: string;
  progressText: string;
  progress: number;
  isComplete: boolean;
  isEndless: boolean;
}

export interface MissionDifficulty {
  startingObstacleCount: number;
  maxObstacleCount: number;
  hazardIntensity: number;
  hazardIntervalMultiplier: number;
  hazardTelegraphMultiplier: number;
  hazardActiveMultiplier: number;
  hazardSpeedMultiplier: number;
  junkColorVariance: number;
  modifierHint: string;
  junkLaneWeights: readonly [number, number, number];
  allowedHazardTypes: SectorConfig['allowedHazardTypes'];
}

export class MissionDirector {
  private currentSector = getSectorById(DEFAULT_SECTOR_ID);

  setSector(sectorId: string): SectorConfig {
    this.currentSector = getSectorById(sectorId);
    return this.currentSector;
  }

  getCurrentSector(): SectorConfig {
    return this.currentSector;
  }

  getCurrentTheme(): SectorTheme {
    return getSectorTheme(this.currentSector.themeId);
  }

  getDifficulty(stats?: RunStatsSnapshot): MissionDifficulty {
    const theme = this.getCurrentTheme();
    const modifiers = theme.modifiers;
    const endlessScale = this.currentSector.isEndless
      ? Math.min(0.65, (stats?.runTime ?? 0) / 180)
      : 0;

    return {
      startingObstacleCount: this.currentSector.startingObstacleCount,
      maxObstacleCount: this.currentSector.maxObstacleCount,
      hazardIntensity:
        this.currentSector.hazardIntensity *
        modifiers.hazardIntensityMultiplier *
        (1 + endlessScale),
      hazardIntervalMultiplier: Math.max(
        0.55,
        modifiers.hazardIntervalMultiplier * (1 - endlessScale * 0.28)
      ),
      hazardTelegraphMultiplier: modifiers.hazardTelegraphMultiplier,
      hazardActiveMultiplier: modifiers.hazardActiveMultiplier,
      hazardSpeedMultiplier: modifiers.hazardSpeedMultiplier * (1 + endlessScale * 0.25),
      junkColorVariance: modifiers.junkColorVariance,
      modifierHint: modifiers.hint,
      junkLaneWeights: this.currentSector.junkSpawnBias.laneWeights,
      allowedHazardTypes: this.currentSector.allowedHazardTypes
    };
  }

  getMusicIntensityHint(): SectorMusicIntensityHint {
    return this.getCurrentTheme().musicIntensityHint;
  }

  getObjective(stats: RunStatsSnapshot): MissionObjectiveSnapshot {
    return getObjectiveSnapshot(this.currentSector.objective, stats);
  }
}

function getObjectiveSnapshot(
  objective: SectorObjective,
  stats: RunStatsSnapshot
): MissionObjectiveSnapshot {
  if (objective.type === 'endless') {
    return {
      text: objective.description,
      progressText: `Score ${stats.score}`,
      progress: 0,
      isComplete: false,
      isEndless: true
    };
  }

  const currentValue = getObjectiveCurrentValue(objective, stats);
  const progress = objective.target > 0 ? currentValue / objective.target : 1;
  const isComplete = currentValue >= objective.target;

  return {
    text: `Objective: ${objective.description}`,
    progressText: `${Math.min(currentValue, objective.target)} / ${objective.target}`,
    progress: Math.max(0, Math.min(1, progress)),
    isComplete,
    isEndless: false
  };
}

function getObjectiveCurrentValue(
  objective: Exclude<SectorObjective, { type: 'endless' }>,
  stats: RunStatsSnapshot
): number {
  if (objective.type === 'score') {
    return stats.score;
  }

  if (objective.type === 'surviveTime') {
    return Math.floor(stats.runTime);
  }

  if (objective.type === 'collectJunk') {
    return stats.junkCollected;
  }

  return stats.hazardsSurvived;
}
