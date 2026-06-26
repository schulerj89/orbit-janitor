import type { EventWaveType } from './EventWaveDirector';
import type { HazardPatternType } from './HazardTypes';
import type { SectorThemeId } from './SectorTheme';

export type SectorObjective =
  | {
      type: 'score';
      description: string;
      target: number;
    }
  | {
      type: 'surviveTime';
      description: string;
      target: number;
    }
  | {
      type: 'collectJunk';
      description: string;
      target: number;
    }
  | {
      type: 'surviveHazards';
      description: string;
      target: number;
    }
  | {
      type: 'endless';
      description: string;
    };

export interface SectorPalette {
  primary: number;
  secondary: number;
  accent: number;
}

export interface JunkSpawnBias {
  laneWeights: readonly [number, number, number];
}

export interface SectorUnlockRequirement {
  completedSectorId: string | null;
}

export interface SectorConfig {
  id: string;
  themeId: SectorThemeId;
  name: string;
  subtitle: string;
  description: string;
  objective: SectorObjective;
  targetScore: number;
  targetTimeSeconds: number;
  startingObstacleCount: number;
  maxObstacleCount: number;
  hazardIntensity: number;
  junkSpawnBias: JunkSpawnBias;
  allowedHazardTypes: readonly HazardPatternType[];
  eventWaveTypes: readonly EventWaveType[];
  planetPalette: SectorPalette;
  lanePalette: SectorPalette;
  unlockRequirement: SectorUnlockRequirement;
  musicIntensityHint: 'calm' | 'steady' | 'tense' | 'endless';
  isTutorial: boolean;
  isEndless: boolean;
}

export const TRAINING_SECTOR_ID = 'training-orbit';
export const DEFAULT_SECTOR_ID = 'low-orbit-cleanup';
export const ENDLESS_SECTOR_ID = 'endless-cleanup';

export const SECTOR_CONFIGS: readonly SectorConfig[] = [
  {
    id: TRAINING_SECTOR_ID,
    themeId: 'training-orbit',
    name: 'Training Orbit',
    subtitle: 'Flight check',
    description: 'A quiet orbit for practicing lane switches, pickups, and boost timing.',
    objective: {
      type: 'collectJunk',
      description: 'Complete 3 training pickups',
      target: 3
    },
    targetScore: 0,
    targetTimeSeconds: 0,
    startingObstacleCount: 0,
    maxObstacleCount: 1,
    hazardIntensity: 0,
    junkSpawnBias: {
      laneWeights: [1.15, 1, 1.15]
    },
    allowedHazardTypes: [],
    eventWaveTypes: [],
    planetPalette: {
      primary: 0x0f6f8f,
      secondary: 0x2aa4a8,
      accent: 0x83a85a
    },
    lanePalette: {
      primary: 0x8fe8ff,
      secondary: 0x526c7c,
      accent: 0xffe06b
    },
    unlockRequirement: {
      completedSectorId: null
    },
    musicIntensityHint: 'calm',
    isTutorial: true,
    isEndless: false
  },
  {
    id: DEFAULT_SECTOR_ID,
    themeId: 'low-orbit-cleanup',
    name: 'Low Orbit Cleanup',
    subtitle: 'Standard route',
    description: 'Clean the core lanes while basic warning arcs test your timing.',
    objective: {
      type: 'score',
      description: 'Reach 50 cleanup points',
      target: 50
    },
    targetScore: 50,
    targetTimeSeconds: 0,
    startingObstacleCount: 2,
    maxObstacleCount: 4,
    hazardIntensity: 0.95,
    junkSpawnBias: {
      laneWeights: [1, 1, 1]
    },
    allowedHazardTypes: ['laneArc', 'doubleLaneArc', 'pulseMine'],
    eventWaveTypes: ['solarFlare', 'cleanupFrenzy'],
    planetPalette: {
      primary: 0x0f6f8f,
      secondary: 0x0a4d6e,
      accent: 0x3f8d58
    },
    lanePalette: {
      primary: 0x8fe8ff,
      secondary: 0x526c7c,
      accent: 0xffb13d
    },
    unlockRequirement: {
      completedSectorId: null
    },
    musicIntensityHint: 'steady',
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'debris-belt',
    themeId: 'debris-belt',
    name: 'Debris Belt',
    subtitle: 'Dense salvage band',
    description: 'A busier orbit with heavier lane variation and more satellite traffic.',
    objective: {
      type: 'collectJunk',
      description: 'Collect 25 junk',
      target: 25
    },
    targetScore: 0,
    targetTimeSeconds: 0,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.05,
    junkSpawnBias: {
      laneWeights: [1.35, 0.75, 1.35]
    },
    allowedHazardTypes: ['laneArc', 'doubleLaneArc', 'pulseMine'],
    eventWaveTypes: ['debrisStorm', 'satelliteNet', 'cleanupFrenzy'],
    planetPalette: {
      primary: 0x3d7895,
      secondary: 0x8f4a32,
      accent: 0xd5762c
    },
    lanePalette: {
      primary: 0xffc857,
      secondary: 0x526c7c,
      accent: 0x9fffee
    },
    unlockRequirement: {
      completedSectorId: DEFAULT_SECTOR_ID
    },
    musicIntensityHint: 'steady',
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'solar-storm',
    themeId: 'solar-storm',
    name: 'Solar Storm',
    subtitle: 'Charged warning lanes',
    description: 'Survive a long storm cycle as lane hazards arrive more often.',
    objective: {
      type: 'surviveTime',
      description: 'Survive 90 seconds',
      target: 90
    },
    targetScore: 0,
    targetTimeSeconds: 90,
    startingObstacleCount: 2,
    maxObstacleCount: 4,
    hazardIntensity: 1.35,
    junkSpawnBias: {
      laneWeights: [1, 1.2, 1]
    },
    allowedHazardTypes: ['laneArc', 'doubleLaneArc', 'pulseMine', 'sweeper'],
    eventWaveTypes: ['solarFlare', 'debrisStorm'],
    planetPalette: {
      primary: 0x5d7fb8,
      secondary: 0xffb13d,
      accent: 0xff6a1f
    },
    lanePalette: {
      primary: 0xffe06b,
      secondary: 0x6c6f7c,
      accent: 0xff6a1f
    },
    unlockRequirement: {
      completedSectorId: 'debris-belt'
    },
    musicIntensityHint: 'tense',
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'night-side',
    themeId: 'night-side',
    name: 'Night Side',
    subtitle: 'Low light cleanup',
    description: 'Darker orbital work with clear telegraphs and faster hazard cadence.',
    objective: {
      type: 'score',
      description: 'Reach 80 cleanup points',
      target: 80
    },
    targetScore: 80,
    targetTimeSeconds: 0,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.45,
    junkSpawnBias: {
      laneWeights: [0.9, 1.25, 0.9]
    },
    allowedHazardTypes: ['laneArc', 'doubleLaneArc', 'pulseMine', 'sweeper', 'gate'],
    eventWaveTypes: ['satelliteNet', 'solarFlare'],
    planetPalette: {
      primary: 0x18305a,
      secondary: 0x243b6c,
      accent: 0x78e8ff
    },
    lanePalette: {
      primary: 0x9fffee,
      secondary: 0x364254,
      accent: 0xffb13d
    },
    unlockRequirement: {
      completedSectorId: 'solar-storm'
    },
    musicIntensityHint: 'tense',
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'comet-wake',
    themeId: 'comet-wake',
    name: 'Comet Wake',
    subtitle: 'Volatile trail',
    description: 'Survive late-pattern telegraphs in a fast-moving comet debris wake.',
    objective: {
      type: 'surviveHazards',
      description: 'Survive 8 hazards',
      target: 8
    },
    targetScore: 0,
    targetTimeSeconds: 0,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.65,
    junkSpawnBias: {
      laneWeights: [1.15, 0.9, 1.15]
    },
    allowedHazardTypes: ['sweeper', 'gate', 'pulseMine', 'debrisShower'],
    eventWaveTypes: ['cometPass', 'debrisStorm', 'solarFlare'],
    planetPalette: {
      primary: 0x234f5c,
      secondary: 0x6d6f7e,
      accent: 0xcfefff
    },
    lanePalette: {
      primary: 0xcfefff,
      secondary: 0x526c7c,
      accent: 0xff6a1f
    },
    unlockRequirement: {
      completedSectorId: 'night-side'
    },
    musicIntensityHint: 'tense',
    isTutorial: false,
    isEndless: false
  },
  {
    id: ENDLESS_SECTOR_ID,
    themeId: 'endless-cleanup',
    name: 'Endless Cleanup',
    subtitle: 'Open route',
    description: 'A high-score route that keeps escalating as long as the ship survives.',
    objective: {
      type: 'endless',
      description: 'Endless high-score mode'
    },
    targetScore: 0,
    targetTimeSeconds: 0,
    startingObstacleCount: 2,
    maxObstacleCount: 5,
    hazardIntensity: 1.15,
    junkSpawnBias: {
      laneWeights: [1, 1, 1]
    },
    allowedHazardTypes: [
      'laneArc',
      'doubleLaneArc',
      'pulseMine',
      'sweeper',
      'gate',
      'debrisShower'
    ],
    eventWaveTypes: [
      'debrisStorm',
      'satelliteNet',
      'solarFlare',
      'cometPass',
      'cleanupFrenzy'
    ],
    planetPalette: {
      primary: 0x0f6f8f,
      secondary: 0x18305a,
      accent: 0xffc857
    },
    lanePalette: {
      primary: 0x8fe8ff,
      secondary: 0x526c7c,
      accent: 0xffb13d
    },
    unlockRequirement: {
      completedSectorId: DEFAULT_SECTOR_ID
    },
    musicIntensityHint: 'endless',
    isTutorial: false,
    isEndless: true
  }
];

export function getSectorById(sectorId: string): SectorConfig {
  const sector = SECTOR_CONFIGS.find((candidate) => candidate.id === sectorId);

  if (!sector) {
    throw new Error(`Unknown sector: ${sectorId}`);
  }

  return sector;
}

export function getNextSectorId(sectorId: string): string | null {
  const sectorIndex = SECTOR_CONFIGS.findIndex((sector) => sector.id === sectorId);

  if (sectorIndex < 0) {
    return null;
  }

  const nextSector = SECTOR_CONFIGS.slice(sectorIndex + 1).find(
    (sector) => !sector.isEndless
  );

  return nextSector?.id ?? null;
}
