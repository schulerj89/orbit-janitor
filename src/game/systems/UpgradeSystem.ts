import {
  BOOST_FUEL_MAX,
  BOOST_FUEL_RECHARGE_PER_SECOND,
  COMBO_WINDOW,
  LANE_SWITCH_DURATION
} from '../constants';
import type { RunStatsSnapshot } from './RunStats';

export type UpgradeId =
  | 'magnetCoil'
  | 'fuelTank'
  | 'turboRegulator'
  | 'shieldCell'
  | 'laneThrusters'
  | 'comboStabilizer';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
}

export interface UpgradeItemSnapshot extends UpgradeDefinition {
  level: number;
  nextCost: number | null;
  canAfford: boolean;
  isMaxed: boolean;
}

export interface UpgradeSnapshot {
  totalScrap: number;
  lastRunScrapEarned: number;
  items: UpgradeItemSnapshot[];
}

export interface UpgradeRunEffects {
  junkPickupRadiusBonus: number;
  boostFuelMax: number;
  boostRechargePerSecond: number;
  shieldCharges: number;
  laneSwitchDuration: number;
  comboWindow: number;
}

type UpgradeLevels = Record<UpgradeId, number>;

const TOTAL_SCRAP_STORAGE_KEY = 'orbit-janitor.totalScrap';
const UPGRADE_LEVELS_STORAGE_KEY = 'orbit-janitor.upgrades';
const OBJECTIVE_SCRAP_BONUS = 10;
const UPGRADE_COSTS = [5, 10, 18, 30, 45] as const;

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'magnetCoil',
    name: 'Magnet Coil',
    description: 'Junk pickup radius +0.08 per level.',
    maxLevel: 5
  },
  {
    id: 'fuelTank',
    name: 'Fuel Tank',
    description: 'Boost fuel max +10% per level.',
    maxLevel: 4
  },
  {
    id: 'turboRegulator',
    name: 'Turbo Regulator',
    description: 'Boost recharge +8% per level.',
    maxLevel: 5
  },
  {
    id: 'shieldCell',
    name: 'Shield Cell',
    description: 'Level 1 blocks one crash per run.',
    maxLevel: 1
  },
  {
    id: 'laneThrusters',
    name: 'Lane Thrusters',
    description: 'Lane switch duration -8% per level.',
    maxLevel: 4
  },
  {
    id: 'comboStabilizer',
    name: 'Combo Stabilizer',
    description: 'Combo window +0.2s per level.',
    maxLevel: 5
  }
];

export class UpgradeSystem {
  private totalScrap = readStoredNumber(TOTAL_SCRAP_STORAGE_KEY, 0);
  private levels = readStoredLevels();
  private lastRunScrapEarned = 0;

  getSnapshot(): UpgradeSnapshot {
    return {
      totalScrap: this.totalScrap,
      lastRunScrapEarned: this.lastRunScrapEarned,
      items: UPGRADE_DEFINITIONS.map((definition) => {
        const level = this.levels[definition.id];
        const nextCost = getUpgradeCost(level, definition.maxLevel);

        return {
          ...definition,
          level,
          nextCost,
          canAfford: nextCost !== null && this.totalScrap >= nextCost,
          isMaxed: level >= definition.maxLevel
        };
      })
    };
  }

  getRunEffects(): UpgradeRunEffects {
    const magnetLevel = this.levels.magnetCoil;
    const fuelTankLevel = this.levels.fuelTank;
    const turboLevel = this.levels.turboRegulator;
    const shieldLevel = this.levels.shieldCell;
    const laneLevel = this.levels.laneThrusters;
    const comboLevel = this.levels.comboStabilizer;

    return {
      junkPickupRadiusBonus: magnetLevel * 0.08,
      boostFuelMax: BOOST_FUEL_MAX * (1 + fuelTankLevel * 0.1),
      boostRechargePerSecond: BOOST_FUEL_RECHARGE_PER_SECOND * (1 + turboLevel * 0.08),
      shieldCharges: shieldLevel > 0 ? 1 : 0,
      laneSwitchDuration: LANE_SWITCH_DURATION * (1 - laneLevel * 0.08),
      comboWindow: COMBO_WINDOW + comboLevel * 0.2
    };
  }

  buyUpgrade(index: number): boolean {
    const definition = UPGRADE_DEFINITIONS[index];

    if (!definition) {
      return false;
    }

    const level = this.levels[definition.id];
    const nextCost = getUpgradeCost(level, definition.maxLevel);

    if (nextCost === null || this.totalScrap < nextCost) {
      return false;
    }

    this.totalScrap -= nextCost;
    this.levels[definition.id] = level + 1;
    this.persist();
    return true;
  }

  addDebugScrap(amount: number): number {
    if (!import.meta.env.DEV) {
      return this.totalScrap;
    }

    const awarded = Math.max(0, Math.floor(amount));

    this.totalScrap += awarded;
    this.lastRunScrapEarned = awarded;
    this.persist();
    return this.totalScrap;
  }

  awardContractScrap(amount: number): number {
    const awarded = Math.max(0, Math.floor(amount));

    if (awarded <= 0) {
      return this.totalScrap;
    }

    this.totalScrap += awarded;
    this.lastRunScrapEarned += awarded;
    this.persist();
    return this.totalScrap;
  }

  awardRunScrap(stats: RunStatsSnapshot, bonusScrap = 0, multiplier = 1): number {
    const baseEarned =
      stats.junkCollected +
      Math.max(0, Math.floor(bonusScrap)) +
      (stats.objectiveComplete ? OBJECTIVE_SCRAP_BONUS : 0);
    const earned = Math.max(0, Math.floor(baseEarned * multiplier));

    this.lastRunScrapEarned = earned;
    this.totalScrap += earned;
    this.persist();
    return earned;
  }

  private persist(): void {
    writeStoredNumber(TOTAL_SCRAP_STORAGE_KEY, this.totalScrap);
    writeStoredJson(UPGRADE_LEVELS_STORAGE_KEY, this.levels);
  }
}

function getUpgradeCost(level: number, maxLevel: number): number | null {
  if (level >= maxLevel) {
    return null;
  }

  return UPGRADE_COSTS[level] ?? UPGRADE_COSTS[UPGRADE_COSTS.length - 1];
}

function createDefaultLevels(): UpgradeLevels {
  return UPGRADE_DEFINITIONS.reduce<UpgradeLevels>((levels, definition) => {
    levels[definition.id] = 0;
    return levels;
  }, {} as UpgradeLevels);
}

function readStoredLevels(): UpgradeLevels {
  const levels = createDefaultLevels();

  try {
    const storedValue = window.localStorage.getItem(UPGRADE_LEVELS_STORAGE_KEY);

    if (storedValue === null) {
      return levels;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<Record<UpgradeId, unknown>>;

    for (const definition of UPGRADE_DEFINITIONS) {
      const storedLevel = parsedValue[definition.id];

      if (typeof storedLevel === 'number' && Number.isFinite(storedLevel)) {
        levels[definition.id] = Math.max(
          0,
          Math.min(definition.maxLevel, Math.floor(storedLevel))
        );
      }
    }
  } catch {
    return levels;
  }

  return levels;
}

function readStoredNumber(key: string, fallback: number): number {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    const parsedValue = Number(storedValue);
    return Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // localStorage can be unavailable; upgrades should fail soft.
  }
}

function writeStoredJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable; upgrades should fail soft.
  }
}
