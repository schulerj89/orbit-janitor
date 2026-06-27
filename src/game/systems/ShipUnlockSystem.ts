import {
  DEFAULT_SHIP_ID,
  SHIP_DEFINITIONS,
  getShipDefinition,
  isShipId,
  type ShipId
} from '../entities/ships/ShipDefinitions';
import { SECTOR_CONFIGS } from './SectorConfig';

export interface ShipSnapshotItem {
  id: ShipId;
  name: string;
  description: string;
  unlockHint: string;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface ShipUnlockSnapshot {
  ships: ShipSnapshotItem[];
  unlockedIds: ShipId[];
  equippedId: ShipId;
}

interface StoredShipState {
  unlockedIds?: unknown;
  equippedId?: unknown;
}

interface ParsedShipState {
  unlockedIds: ShipId[];
  equippedId: ShipId;
}

const STORAGE_KEY = 'orbit-janitor.ships';
const SECTOR_SHIP_UNLOCKS: Record<string, readonly ShipId[]> = {
  'training-orbit': ['needle'],
  'debris-belt': ['tugboat'],
  'solar-storm': ['solar-dart'],
  'night-side': ['night-runner'],
  'comet-wake': ['comet-skiff']
};
const ENDLESS_GOLD_SCORE = 150;
const ALL_NON_ENDLESS_SECTOR_IDS = SECTOR_CONFIGS.filter(
  (sector) => !sector.isEndless
).map((sector) => sector.id);

export class ShipUnlockSystem {
  private readonly unlockedIds: Set<ShipId>;
  private equippedId: ShipId;

  constructor() {
    const storedState = readStoredState();

    this.unlockedIds = new Set([DEFAULT_SHIP_ID, ...storedState.unlockedIds]);
    this.equippedId = this.unlockedIds.has(storedState.equippedId)
      ? storedState.equippedId
      : DEFAULT_SHIP_ID;
    this.persist();
  }

  syncCompletedSectors(sectorIds: readonly string[]): string[] {
    return this.unlockForCompletedSectors(sectorIds);
  }

  completeSector(sectorId: string, completedSectorIds: readonly string[]): string[] {
    return this.unlockForCompletedSectors([
      ...new Set([...completedSectorIds, sectorId])
    ]);
  }

  recordEndlessScore(score: number): string[] {
    if (score < ENDLESS_GOLD_SCORE) {
      return [];
    }

    return this.unlockShips(['golden-janitor']);
  }

  unlockContractShips(shipIds: readonly ShipId[]): string[] {
    return this.unlockShips(shipIds);
  }

  equip(shipId: string): boolean {
    if (!isShipId(shipId) || !this.unlockedIds.has(shipId)) {
      return false;
    }

    this.equippedId = shipId;
    this.persist();
    return true;
  }

  getEquippedShipId(): ShipId {
    return this.equippedId;
  }

  getSnapshot(): ShipUnlockSnapshot {
    return {
      ships: SHIP_DEFINITIONS.map((ship) => ({
        id: ship.id,
        name: ship.name,
        description: ship.description,
        unlockHint: ship.unlockHint,
        isUnlocked: this.unlockedIds.has(ship.id),
        isEquipped: this.equippedId === ship.id
      })),
      unlockedIds: [...this.unlockedIds],
      equippedId: this.equippedId
    };
  }

  private unlockForCompletedSectors(sectorIds: readonly string[]): string[] {
    const sectorIdSet = new Set(sectorIds);
    const shipIds = new Set<ShipId>();

    for (const sectorId of sectorIdSet) {
      (SECTOR_SHIP_UNLOCKS[sectorId] ?? []).forEach((shipId) => shipIds.add(shipId));
    }

    if (ALL_NON_ENDLESS_SECTOR_IDS.every((sectorId) => sectorIdSet.has(sectorId))) {
      shipIds.add('manta');
    }

    return this.unlockShips([...shipIds]);
  }

  private unlockShips(shipIds: readonly ShipId[]): string[] {
    const unlockedNames: string[] = [];

    for (const shipId of shipIds) {
      const definition = getShipDefinition(shipId);

      if (!definition || this.unlockedIds.has(shipId)) {
        continue;
      }

      this.unlockedIds.add(shipId);
      unlockedNames.push(definition.name);
    }

    if (unlockedNames.length > 0) {
      this.persist();
    }

    return unlockedNames;
  }

  private persist(): void {
    writeStoredState({
      unlockedIds: [...this.unlockedIds],
      equippedId: this.equippedId
    });
  }
}

function readStoredState(): ParsedShipState {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === null) {
      return createDefaultStoredState();
    }

    const parsedValue = JSON.parse(storedValue) as StoredShipState | null;

    if (parsedValue === null || typeof parsedValue !== 'object') {
      return createDefaultStoredState();
    }

    const unlockedIds = Array.isArray(parsedValue.unlockedIds)
      ? parsedValue.unlockedIds.filter(
          (shipId): shipId is ShipId => typeof shipId === 'string' && isShipId(shipId)
        )
      : [];
    const equippedId =
      typeof parsedValue.equippedId === 'string' && isShipId(parsedValue.equippedId)
        ? parsedValue.equippedId
        : DEFAULT_SHIP_ID;

    return {
      unlockedIds: [DEFAULT_SHIP_ID, ...unlockedIds],
      equippedId
    };
  } catch {
    return createDefaultStoredState();
  }
}

function createDefaultStoredState(): ParsedShipState {
  return {
    unlockedIds: [DEFAULT_SHIP_ID],
    equippedId: DEFAULT_SHIP_ID
  };
}

function writeStoredState(state: {
  unlockedIds: readonly ShipId[];
  equippedId: ShipId;
}): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ship unlock persistence should not block play when storage is unavailable.
  }
}

export function getEndlessGoldenShipScore(): number {
  return ENDLESS_GOLD_SCORE;
}
