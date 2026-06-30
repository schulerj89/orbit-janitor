import { SECTOR_STORAGE_PREFIX } from '../constants';
import {
  DEFAULT_SECTOR_ID,
  ENDLESS_SECTOR_ID,
  SECTOR_CONFIGS,
  TRAINING_SECTOR_ID,
  getNextSectorId,
  getSectorById,
  type SectorConfig
} from './SectorConfig';

export interface SectorProgressItem extends SectorConfig {
  isUnlocked: boolean;
  isCompleted: boolean;
  unlocksAfterName: string | null;
}

export interface SectorProgressSnapshot {
  sectors: SectorProgressItem[];
  unlockedSectorIds: string[];
  completedSectorIds: string[];
}

const UNLOCKED_STORAGE_KEY = `${SECTOR_STORAGE_PREFIX}.unlocked`;
const COMPLETED_STORAGE_KEY = `${SECTOR_STORAGE_PREFIX}.completed`;
const STARTING_UNLOCKED_SECTORS = [
  TRAINING_SECTOR_ID,
  DEFAULT_SECTOR_ID,
  ENDLESS_SECTOR_ID
] as const;
const CAMPAIGN_SECTORS = SECTOR_CONFIGS.filter(
  (sector) => !sector.isTutorial && !sector.isEndless
);

export class SectorProgress {
  private unlockedSectorIds = readStoredIds(
    UNLOCKED_STORAGE_KEY,
    STARTING_UNLOCKED_SECTORS
  );
  private completedSectorIds = readStoredIds(COMPLETED_STORAGE_KEY, []);

  constructor() {
    this.ensureStartingUnlocks();
    this.ensureUnlocksFromCompletedSectors();
  }

  completeSector(sectorId: string): string | null {
    const sector = getSectorById(sectorId);

    if (sector.isEndless) {
      return null;
    }

    const completedBefore = this.completedSectorIds.has(sectorId);
    this.completedSectorIds.add(sectorId);

    let newlyUnlockedSectorId: string | null = null;
    const unlockCandidates = [
      getNextSectorId(sectorId),
      ...SECTOR_CONFIGS.filter(
        (candidate) => candidate.unlockRequirement.completedSectorId === sectorId
      ).map((candidate) => candidate.id)
    ].filter((candidate): candidate is string => candidate !== null);

    for (const candidateId of new Set(unlockCandidates)) {
      if (this.unlockedSectorIds.has(candidateId)) {
        continue;
      }

      this.unlockedSectorIds.add(candidateId);
      newlyUnlockedSectorId ??= candidateId;
    }

    if (!completedBefore || newlyUnlockedSectorId !== null) {
      this.persist();
    }

    return newlyUnlockedSectorId;
  }

  isUnlocked(sectorId: string): boolean {
    return this.unlockedSectorIds.has(sectorId);
  }

  isCompleted(sectorId: string): boolean {
    return this.completedSectorIds.has(sectorId);
  }

  getDefaultSectorId(): string {
    const nextIncompleteSector = CAMPAIGN_SECTORS.find(
      (sector) => this.isUnlocked(sector.id) && !this.isCompleted(sector.id)
    );

    if (nextIncompleteSector) {
      return nextIncompleteSector.id;
    }

    return this.isUnlocked(ENDLESS_SECTOR_ID) ? ENDLESS_SECTOR_ID : DEFAULT_SECTOR_ID;
  }

  getNextPlayableSectorId(currentSectorId: string): string {
    const nextCampaignSector =
      this.getNextUnlockedIncompleteCampaignSector(currentSectorId);

    if (nextCampaignSector) {
      return nextCampaignSector.id;
    }

    const nextSectorId = getNextSectorId(currentSectorId);

    if (nextSectorId && this.isUnlocked(nextSectorId)) {
      return nextSectorId;
    }

    return this.getDefaultSectorId();
  }

  getSnapshot(): SectorProgressSnapshot {
    return {
      sectors: SECTOR_CONFIGS.map((sector) => ({
        ...sector,
        isUnlocked: this.isUnlocked(sector.id),
        isCompleted: this.isCompleted(sector.id),
        unlocksAfterName:
          sector.unlockRequirement.completedSectorId === null
            ? null
            : getSectorById(sector.unlockRequirement.completedSectorId).name
      })),
      unlockedSectorIds: [...this.unlockedSectorIds],
      completedSectorIds: [...this.completedSectorIds]
    };
  }

  private ensureStartingUnlocks(): void {
    let changed = false;

    for (const sectorId of STARTING_UNLOCKED_SECTORS) {
      if (!this.unlockedSectorIds.has(sectorId)) {
        this.unlockedSectorIds.add(sectorId);
        changed = true;
      }
    }

    if (changed) {
      this.persist();
    }
  }

  private ensureUnlocksFromCompletedSectors(): void {
    let changed = false;
    let unlockedSectorThisPass = true;

    while (unlockedSectorThisPass) {
      unlockedSectorThisPass = false;

      for (const sector of SECTOR_CONFIGS) {
        if (this.unlockedSectorIds.has(sector.id)) {
          continue;
        }

        const requiredSectorId = sector.unlockRequirement.completedSectorId;

        if (requiredSectorId === null || this.completedSectorIds.has(requiredSectorId)) {
          this.unlockedSectorIds.add(sector.id);
          unlockedSectorThisPass = true;
          changed = true;
        }
      }
    }

    if (changed) {
      this.persist();
    }
  }

  private persist(): void {
    writeStoredIds(UNLOCKED_STORAGE_KEY, this.unlockedSectorIds);
    writeStoredIds(COMPLETED_STORAGE_KEY, this.completedSectorIds);
  }

  private getNextUnlockedIncompleteCampaignSector(
    currentSectorId: string
  ): SectorConfig | null {
    const currentSectorIndex = CAMPAIGN_SECTORS.findIndex(
      (sector) => sector.id === currentSectorId
    );

    if (currentSectorIndex < 0) {
      return null;
    }

    for (let offset = 1; offset <= CAMPAIGN_SECTORS.length; offset += 1) {
      const candidate =
        CAMPAIGN_SECTORS[(currentSectorIndex + offset) % CAMPAIGN_SECTORS.length];

      if (this.isUnlocked(candidate.id) && !this.isCompleted(candidate.id)) {
        return candidate;
      }
    }

    return null;
  }
}

function readStoredIds(key: string, fallback: readonly string[]): Set<string> {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return new Set(fallback);
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set(fallback);
    }

    return new Set(
      parsedValue.filter(
        (sectorId): sectorId is string =>
          typeof sectorId === 'string' &&
          SECTOR_CONFIGS.some((sector) => sector.id === sectorId)
      )
    );
  } catch {
    return new Set(fallback);
  }
}

function writeStoredIds(key: string, sectorIds: Set<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify([...sectorIds]));
  } catch {
    // Sector progression should not block local play when storage is unavailable.
  }
}
