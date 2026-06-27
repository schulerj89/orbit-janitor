import type { EventWaveType } from './EventWaveTypes';
import type { HazardPatternType } from './HazardTypes';
import type { SectorThemeId } from './SectorTheme';
import type { WorldCoreType } from '../entities/world-cores/WorldCore';

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
      type: 'comboAndScore';
      description: string;
      targetMultiplier: number;
      targetScore: number;
    }
  | {
      type: 'powerupsAndScore';
      description: string;
      targetPowerups: number;
      targetScore: number;
    }
  | {
      type: 'eventWavesOrTime';
      description: string;
      eventType: EventWaveType;
      eventTarget: number;
      timeTarget: number;
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

export interface SectorRadioConfig {
  intro: string;
  complete: string;
}

export interface SectorConfig {
  id: string;
  themeId: SectorThemeId;
  worldCoreType: WorldCoreType;
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
  eventWaveCadenceSeconds?: number;
  planetPalette: SectorPalette;
  lanePalette: SectorPalette;
  unlockRequirement: SectorUnlockRequirement;
  musicIntensityHint: 'calm' | 'steady' | 'tense' | 'endless';
  radio: SectorRadioConfig;
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
    worldCoreType: 'planet',
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
    radio: {
      intro: 'Training Orbit is quiet. We left the expensive hazards unplugged.',
      complete: 'Flight check stamped. Cleanup Ops may even trust you with sharp corners.'
    },
    isTutorial: true,
    isEndless: false
  },
  {
    id: DEFAULT_SECTOR_ID,
    themeId: 'low-orbit-cleanup',
    worldCoreType: 'planet',
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
    radio: {
      intro: 'Low Orbit is open. The planet thanks you. Legally, it cannot tip.',
      complete: 'Low Orbit reads clean enough for marketing. Nobody tell legal.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'debris-belt',
    themeId: 'debris-belt',
    worldCoreType: 'crackedPlanetoid',
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
    radio: {
      intro: 'Debris Belt is crowded. If it sparkles, clean it. If it blinks, dodge it.',
      complete: 'Debris Belt is breathing again. Nice sweep through the ugly lane.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'solar-storm',
    themeId: 'solar-storm',
    worldCoreType: 'solarReactor',
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
    radio: {
      intro: 'Solar Storm is charging. Orange means move soon. Red means move now.',
      complete: 'Storm window cleared. The reactor is still dramatic, but quieter.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'night-side',
    themeId: 'night-side',
    worldCoreType: 'nightPlanet',
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
    radio: {
      intro: 'Night Side runs dark. Trust the telegraphs, not the scenery.',
      complete:
        'Night Side lanes are clean. The city lights can stop holding their breath.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'comet-wake',
    themeId: 'comet-wake',
    worldCoreType: 'comet',
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
    radio: {
      intro: 'Comet Wake is moving fast. Keep your route loose and your boost ready.',
      complete: 'Comet Wake survived your paperwork. That counts as a miracle.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'graveyard-ring',
    themeId: 'graveyard-ring',
    worldCoreType: 'crackedPlanetoid',
    name: 'Graveyard Ring',
    subtitle: 'Dead satellite halo',
    description:
      'A cold orbital graveyard where satellite-net formations patrol broken service lanes.',
    objective: {
      type: 'eventWavesOrTime',
      description: 'Survive 6 satellite nets or 100 seconds',
      eventType: 'satelliteNet',
      eventTarget: 6,
      timeTarget: 100
    },
    targetScore: 0,
    targetTimeSeconds: 100,
    startingObstacleCount: 4,
    maxObstacleCount: 6,
    hazardIntensity: 1.35,
    junkSpawnBias: {
      laneWeights: [0.8, 1.25, 1.15]
    },
    allowedHazardTypes: ['gate', 'debrisShower', 'doubleLaneArc'],
    eventWaveTypes: ['satelliteNet'],
    eventWaveCadenceSeconds: 14,
    planetPalette: {
      primary: 0x2d3a45,
      secondary: 0x5d7286,
      accent: 0x8fe8ff
    },
    lanePalette: {
      primary: 0x8fb5d2,
      secondary: 0x34414d,
      accent: 0xffd45f
    },
    unlockRequirement: {
      completedSectorId: 'comet-wake'
    },
    musicIntensityHint: 'tense',
    radio: {
      intro: 'Graveyard Ring is full of retired satellites that forgot the retired part.',
      complete:
        'Satellite net survived. Cleanup Ops has upgraded you to cautiously useful.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'neon-belt',
    themeId: 'neon-belt',
    worldCoreType: 'orbitalGate',
    name: 'Neon Belt',
    subtitle: 'Arcade signal lane',
    description:
      'Bright signal lanes reward aggressive combo routing through sweepers and paired arcs.',
    objective: {
      type: 'comboAndScore',
      description: 'Reach 5x combo and 90 score',
      targetMultiplier: 5,
      targetScore: 90
    },
    targetScore: 90,
    targetTimeSeconds: 0,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.48,
    junkSpawnBias: {
      laneWeights: [1.25, 0.95, 1.25]
    },
    allowedHazardTypes: ['sweeper', 'doubleLaneArc', 'laneArc'],
    eventWaveTypes: ['cleanupFrenzy', 'solarFlare'],
    planetPalette: {
      primary: 0x16324c,
      secondary: 0x00d9ff,
      accent: 0xff4fd8
    },
    lanePalette: {
      primary: 0x00e5ff,
      secondary: 0x49245c,
      accent: 0xff4fd8
    },
    unlockRequirement: {
      completedSectorId: 'graveyard-ring'
    },
    musicIntensityHint: 'tense',
    radio: {
      intro: 'Neon Belt is loud enough to see from accounting. Keep the combo alive.',
      complete: 'Neon Belt cleared. The signs are brighter and somehow less judgmental.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'frozen-relay',
    themeId: 'frozen-relay',
    worldCoreType: 'comet',
    name: 'Frozen Relay',
    subtitle: 'Icy powerup route',
    description:
      'A cold relay lane with frequent powerup pings and sharp ice-white telegraphs.',
    objective: {
      type: 'powerupsAndScore',
      description: 'Collect 5 powerups and reach 70 score',
      targetPowerups: 5,
      targetScore: 70
    },
    targetScore: 70,
    targetTimeSeconds: 0,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.28,
    junkSpawnBias: {
      laneWeights: [1, 1.3, 1]
    },
    allowedHazardTypes: ['pulseMine', 'sweeper', 'debrisShower'],
    eventWaveTypes: ['cometPass', 'cleanupFrenzy'],
    planetPalette: {
      primary: 0x1d4054,
      secondary: 0x9fdfff,
      accent: 0xffffff
    },
    lanePalette: {
      primary: 0xcfefff,
      secondary: 0x35566d,
      accent: 0x9fffee
    },
    unlockRequirement: {
      completedSectorId: 'neon-belt'
    },
    musicIntensityHint: 'steady',
    radio: {
      intro: 'Frozen Relay is handing out powerups. Suspicious generosity, but useful.',
      complete: 'Relay warmed up. The ice filed a complaint and we ignored it.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'reactor-grave',
    themeId: 'reactor-grave',
    worldCoreType: 'solarReactor',
    name: 'Reactor Grave',
    subtitle: 'Burned-out flare core',
    description:
      'A dark reactor shell throws short, frequent danger pulses through the lanes.',
    objective: {
      type: 'eventWavesOrTime',
      description: 'Survive 4 solar flares or 120 seconds',
      eventType: 'solarFlare',
      eventTarget: 4,
      timeTarget: 120
    },
    targetScore: 0,
    targetTimeSeconds: 120,
    startingObstacleCount: 3,
    maxObstacleCount: 5,
    hazardIntensity: 1.7,
    junkSpawnBias: {
      laneWeights: [0.95, 1.15, 0.95]
    },
    allowedHazardTypes: ['laneArc', 'doubleLaneArc', 'sweeper', 'gate'],
    eventWaveTypes: ['solarFlare'],
    eventWaveCadenceSeconds: 18,
    planetPalette: {
      primary: 0x3b1010,
      secondary: 0xff6a1f,
      accent: 0xffc857
    },
    lanePalette: {
      primary: 0xff8e4f,
      secondary: 0x4a1e16,
      accent: 0xffe06b
    },
    unlockRequirement: {
      completedSectorId: 'frozen-relay'
    },
    musicIntensityHint: 'tense',
    radio: {
      intro: 'Reactor Grave still has opinions. They are mostly flares and bad manners.',
      complete: 'Reactor flare cycle survived. Nobody breathe on the warning lights.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'junk-moon',
    themeId: 'junk-moon',
    worldCoreType: 'crackedPlanetoid',
    name: 'Junk Moon',
    subtitle: 'Scrap-rich orbit',
    description:
      'A dense amber scrap field with heavy junk routing and debris-shower pressure.',
    objective: {
      type: 'collectJunk',
      description: 'Collect 40 junk',
      target: 40
    },
    targetScore: 0,
    targetTimeSeconds: 0,
    startingObstacleCount: 4,
    maxObstacleCount: 6,
    hazardIntensity: 1.55,
    junkSpawnBias: {
      laneWeights: [1.4, 0.8, 1.4]
    },
    allowedHazardTypes: ['debrisShower', 'gate', 'pulseMine', 'doubleLaneArc'],
    eventWaveTypes: ['debrisStorm', 'cleanupFrenzy'],
    planetPalette: {
      primary: 0x4f3320,
      secondary: 0x9c6234,
      accent: 0xffc857
    },
    lanePalette: {
      primary: 0xffc857,
      secondary: 0x5a4330,
      accent: 0x9fffee
    },
    unlockRequirement: {
      completedSectorId: 'reactor-grave'
    },
    musicIntensityHint: 'steady',
    radio: {
      intro: 'Junk Moon is mostly junk and technically moon. Collect first, argue later.',
      complete: 'Junk Moon looks less like a drawer full of bad decisions. Good haul.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: 'long-orbit',
    themeId: 'long-orbit',
    worldCoreType: 'orbitalGate',
    name: 'Long Orbit',
    subtitle: 'Endurance sweep',
    description:
      'A deep-space endurance route where pressure climbs slowly and steadily.',
    objective: {
      type: 'surviveTime',
      description: 'Survive 180 seconds',
      target: 180
    },
    targetScore: 0,
    targetTimeSeconds: 180,
    startingObstacleCount: 2,
    maxObstacleCount: 6,
    hazardIntensity: 1.18,
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
    eventWaveTypes: ['satelliteNet', 'cometPass', 'solarFlare', 'cleanupFrenzy'],
    planetPalette: {
      primary: 0x101829,
      secondary: 0x243a5a,
      accent: 0x8fe8ff
    },
    lanePalette: {
      primary: 0x8fe8ff,
      secondary: 0x27364b,
      accent: 0xffd45f
    },
    unlockRequirement: {
      completedSectorId: 'junk-moon'
    },
    musicIntensityHint: 'endless',
    radio: {
      intro: 'Long Orbit is an endurance sweep. Settle in; the route gets ideas later.',
      complete:
        'Long Orbit survived. Cleanup Ops is legally required to call that heroic.'
    },
    isTutorial: false,
    isEndless: false
  },
  {
    id: ENDLESS_SECTOR_ID,
    themeId: 'endless-cleanup',
    worldCoreType: 'orbitalGate',
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
    radio: {
      intro: 'Endless Cleanup is all meter, no mercy. Clock in and make a mess smaller.',
      complete: 'Endless route logged. High-score clerks are pretending not to cheer.'
    },
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
