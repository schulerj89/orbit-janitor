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
  powerupSpawnIntervalMultiplier: number;
  modifierHint: string;
  junkLaneWeights: readonly [number, number, number];
  allowedHazardTypes: SectorConfig['allowedHazardTypes'];
  eventWaveTypes: SectorConfig['eventWaveTypes'];
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
    const sectorTimeScale = Math.min(
      0.55,
      ((stats?.runTime ?? 0) / 60) * modifiers.difficultyScalePerMinute
    );
    const totalScale = endlessScale + sectorTimeScale;

    return {
      startingObstacleCount: this.currentSector.startingObstacleCount,
      maxObstacleCount: this.currentSector.maxObstacleCount,
      hazardIntensity:
        this.currentSector.hazardIntensity *
        modifiers.hazardIntensityMultiplier *
        (1 + totalScale),
      hazardIntervalMultiplier: Math.max(
        0.55,
        modifiers.hazardIntervalMultiplier * (1 - totalScale * 0.28)
      ),
      hazardTelegraphMultiplier: modifiers.hazardTelegraphMultiplier,
      hazardActiveMultiplier: modifiers.hazardActiveMultiplier,
      hazardSpeedMultiplier: modifiers.hazardSpeedMultiplier * (1 + totalScale * 0.25),
      junkColorVariance: modifiers.junkColorVariance,
      powerupSpawnIntervalMultiplier: modifiers.powerupSpawnIntervalMultiplier,
      modifierHint: modifiers.hint,
      junkLaneWeights: this.currentSector.junkSpawnBias.laneWeights,
      allowedHazardTypes: this.currentSector.allowedHazardTypes,
      eventWaveTypes: this.currentSector.eventWaveTypes
    };
  }

  getMusicIntensityHint(): SectorMusicIntensityHint {
    return this.currentSector.musicIntensityHint;
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

  if (objective.type === 'comboAndScore') {
    const scoreProgress = Math.min(stats.score, objective.targetScore);
    const multiplierProgress = Math.min(
      stats.highestComboMultiplier,
      objective.targetMultiplier
    );
    const scoreRatio = scoreProgress / objective.targetScore;
    const comboRatio = multiplierProgress / objective.targetMultiplier;
    const isComplete =
      stats.score >= objective.targetScore &&
      stats.highestComboMultiplier >= objective.targetMultiplier;

    return {
      text: `Objective: ${objective.description}`,
      progressText: `${scoreProgress} / ${objective.targetScore} score + x${multiplierProgress} / x${objective.targetMultiplier}`,
      progress: Math.max(0, Math.min(1, Math.min(scoreRatio, comboRatio))),
      isComplete,
      isEndless: false
    };
  }

  if (objective.type === 'powerupsAndScore') {
    const scoreProgress = Math.min(stats.score, objective.targetScore);
    const powerupProgress = Math.min(stats.powerupsCollected, objective.targetPowerups);
    const scoreRatio = scoreProgress / objective.targetScore;
    const powerupRatio = powerupProgress / objective.targetPowerups;
    const isComplete =
      stats.score >= objective.targetScore &&
      stats.powerupsCollected >= objective.targetPowerups;

    return {
      text: `Objective: ${objective.description}`,
      progressText: `${powerupProgress} / ${objective.targetPowerups} powerups + ${scoreProgress} / ${objective.targetScore} score`,
      progress: Math.max(0, Math.min(1, Math.min(scoreRatio, powerupRatio))),
      isComplete,
      isEndless: false
    };
  }

  if (objective.type === 'eventWavesOrTime') {
    const eventProgress = Math.min(
      stats.eventWavesSurvived[objective.eventType] ?? 0,
      objective.eventTarget
    );
    const timeProgress = Math.min(Math.floor(stats.runTime), objective.timeTarget);
    const eventRatio = eventProgress / objective.eventTarget;
    const timeRatio = timeProgress / objective.timeTarget;
    const isComplete =
      eventProgress >= objective.eventTarget || timeProgress >= objective.timeTarget;

    return {
      text: `Objective: ${objective.description}`,
      progressText: `${eventProgress} / ${objective.eventTarget} waves or ${timeProgress} / ${objective.timeTarget}s`,
      progress: Math.max(0, Math.min(1, Math.max(eventRatio, timeRatio))),
      isComplete,
      isEndless: false
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
