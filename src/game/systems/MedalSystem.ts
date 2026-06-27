import type { MissionObjectiveSnapshot } from './MissionDirector';
import type { RunStatsSnapshot } from './RunStats';
import type { SectorConfig } from './SectorConfig';

export type MedalTier = 'none' | 'bronze' | 'silver' | 'gold' | 'prime';

export interface MedalAwardResult {
  sectorId: string;
  previousTier: MedalTier;
  earnedTier: MedalTier;
  isNewBest: boolean;
}

export interface MedalSnapshotItem {
  sectorId: string;
  tier: MedalTier;
}

export interface MedalSnapshot {
  medals: MedalSnapshotItem[];
  medalBySectorId: Record<string, MedalTier>;
  goldOrBetterCount: number;
  primeCount: number;
}

const STORAGE_KEY = 'orbit-janitor.medals.bestBySector';
const MEDAL_RANK: Record<MedalTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  prime: 4
};

export class MedalSystem {
  private readonly medalBySectorId = readStoredMedals();

  evaluateRun(
    sector: SectorConfig,
    stats: RunStatsSnapshot,
    objective: MissionObjectiveSnapshot
  ): MedalAwardResult {
    const previousTier = this.getBestMedal(sector.id);
    const earnedTier = evaluateMedal(sector, stats, objective);
    const isNewBest = MEDAL_RANK[earnedTier] > MEDAL_RANK[previousTier];

    if (isNewBest) {
      this.medalBySectorId.set(sector.id, earnedTier);
      writeStoredMedals(this.medalBySectorId);
    }

    return {
      sectorId: sector.id,
      previousTier,
      earnedTier,
      isNewBest
    };
  }

  getBestMedal(sectorId: string): MedalTier {
    return this.medalBySectorId.get(sectorId) ?? 'none';
  }

  getSnapshot(): MedalSnapshot {
    const medals = [...this.medalBySectorId.entries()].map(([sectorId, tier]) => ({
      sectorId,
      tier
    }));

    return {
      medals,
      medalBySectorId: Object.fromEntries(this.medalBySectorId),
      goldOrBetterCount: medals.filter(
        (medal) => MEDAL_RANK[medal.tier] >= MEDAL_RANK.gold
      ).length,
      primeCount: medals.filter((medal) => medal.tier === 'prime').length
    };
  }
}

export function getMedalLabel(tier: MedalTier): string {
  switch (tier) {
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
    case 'prime':
      return 'Prime';
    case 'none':
      return 'None';
  }
}

export function isMedalBetter(nextTier: MedalTier, currentTier: MedalTier): boolean {
  return MEDAL_RANK[nextTier] > MEDAL_RANK[currentTier];
}

function evaluateMedal(
  sector: SectorConfig,
  stats: RunStatsSnapshot,
  objective: MissionObjectiveSnapshot
): MedalTier {
  if (sector.isTutorial || sector.isEndless || !objective.isComplete) {
    return 'none';
  }

  const performanceScore =
    stats.finalScore +
    stats.junkCollected * 2 +
    stats.highestComboMultiplier * 10 +
    stats.nearMisses * 7 +
    stats.hazardsSurvived * 4 +
    stats.totalEventWavesSurvived * 9 +
    stats.powerupsCollected * 5;
  const silver = meetsSilverThreshold(sector, stats, performanceScore);
  const gold = meetsGoldThreshold(sector, stats, performanceScore);
  const prime =
    gold &&
    !stats.shieldBroken &&
    stats.highestComboMultiplier >= 4 &&
    (stats.nearMisses >= 3 || stats.hazardsSurvived >= 5 || stats.powerupsCollected >= 4);

  if (prime) {
    return 'prime';
  }

  if (gold) {
    return 'gold';
  }

  if (silver) {
    return 'silver';
  }

  return 'bronze';
}

function meetsSilverThreshold(
  sector: SectorConfig,
  stats: RunStatsSnapshot,
  performanceScore: number
): boolean {
  if (sector.objective.type === 'score') {
    return stats.finalScore >= sector.objective.target * 1.2;
  }

  if (sector.objective.type === 'comboAndScore') {
    return (
      stats.finalScore >= sector.objective.targetScore + 15 &&
      stats.highestComboMultiplier >= sector.objective.targetMultiplier
    );
  }

  if (sector.objective.type === 'powerupsAndScore') {
    return (
      stats.finalScore >= sector.objective.targetScore + 10 &&
      stats.powerupsCollected >= sector.objective.targetPowerups
    );
  }

  if (sector.objective.type === 'eventWavesOrTime') {
    return (
      (stats.eventWavesSurvived[sector.objective.eventType] ?? 0) >=
        sector.objective.eventTarget || performanceScore >= 80
    );
  }

  return (
    stats.highestComboMultiplier >= 3 || stats.nearMisses >= 2 || performanceScore >= 70
  );
}

function meetsGoldThreshold(
  sector: SectorConfig,
  stats: RunStatsSnapshot,
  performanceScore: number
): boolean {
  if (sector.objective.type === 'score') {
    return stats.finalScore >= sector.objective.target * 1.5;
  }

  if (sector.objective.type === 'comboAndScore') {
    return (
      stats.finalScore >= sector.objective.targetScore + 35 &&
      stats.highestComboMultiplier >= sector.objective.targetMultiplier
    );
  }

  if (sector.objective.type === 'powerupsAndScore') {
    return (
      stats.finalScore >= sector.objective.targetScore + 25 &&
      stats.powerupsCollected >= sector.objective.targetPowerups
    );
  }

  if (sector.objective.type === 'eventWavesOrTime') {
    return (
      (stats.eventWavesSurvived[sector.objective.eventType] ?? 0) >=
        sector.objective.eventTarget &&
      (stats.highestComboMultiplier >= 3 || performanceScore >= 115)
    );
  }

  return (
    stats.highestComboMultiplier >= 4 || stats.nearMisses >= 4 || performanceScore >= 115
  );
}

function readStoredMedals(): Map<string, MedalTier> {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === null) {
      return new Map();
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return new Map();
    }

    return new Map(
      Object.entries(parsedValue).filter(
        (entry): entry is [string, MedalTier] =>
          typeof entry[0] === 'string' && isMedalTier(entry[1])
      )
    );
  } catch {
    return new Map();
  }
}

function writeStoredMedals(medalBySectorId: Map<string, MedalTier>): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(medalBySectorId))
    );
  } catch {
    // Medal persistence should not block gameplay when storage is unavailable.
  }
}

function isMedalTier(value: unknown): value is MedalTier {
  return (
    value === 'none' ||
    value === 'bronze' ||
    value === 'silver' ||
    value === 'gold' ||
    value === 'prime'
  );
}
