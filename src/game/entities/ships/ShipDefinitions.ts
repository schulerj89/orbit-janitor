export type ShipId =
  | 'scrapper'
  | 'needle'
  | 'tugboat'
  | 'manta'
  | 'comet-skiff'
  | 'solar-dart'
  | 'night-runner'
  | 'golden-janitor';

export interface ShipPalette {
  body: number;
  wing: number;
  accent: number;
  cockpit: number;
  engine: number;
}

export interface ShipDefinition {
  id: ShipId;
  name: string;
  description: string;
  unlockHint: string;
  palette: ShipPalette;
}

export const DEFAULT_SHIP_ID: ShipId = 'scrapper';

export const SHIP_DEFINITIONS: readonly ShipDefinition[] = [
  {
    id: 'scrapper',
    name: 'Scrapper',
    description: 'Balanced cleanup ship with a practical utility profile.',
    unlockHint: 'Default ship.',
    palette: {
      body: 0xf3f8fb,
      wing: 0x243648,
      accent: 0xffd86b,
      cockpit: 0x54e6ff,
      engine: 0x35f4ff
    }
  },
  {
    id: 'needle',
    name: 'Needle',
    description: 'Sharp interceptor silhouette with a long visible nose.',
    unlockHint: 'Complete Training Orbit.',
    palette: {
      body: 0xdffbff,
      wing: 0x1d5264,
      accent: 0x9fffee,
      cockpit: 0xaaf7ff,
      engine: 0x9fffee
    }
  },
  {
    id: 'tugboat',
    name: 'Tugboat',
    description: 'Chunky hauler frame built for salvage-lane grit.',
    unlockHint: 'Complete Debris Belt.',
    palette: {
      body: 0xffcf7a,
      wing: 0x3d2e24,
      accent: 0xff9d35,
      cockpit: 0xffc857,
      engine: 0xffc857
    }
  },
  {
    id: 'manta',
    name: 'Manta',
    description: 'Wide winged cleanup craft with a clear gliding profile.',
    unlockHint: 'Complete all non-endless sectors.',
    palette: {
      body: 0xcfefff,
      wing: 0x172b3c,
      accent: 0x9fffee,
      cockpit: 0x78e8ff,
      engine: 0x8fe8ff
    }
  },
  {
    id: 'comet-skiff',
    name: 'Comet Skiff',
    description: 'Icy skiff with shard fins and a cold trail style.',
    unlockHint: 'Complete Comet Wake.',
    palette: {
      body: 0xcfefff,
      wing: 0x1d4054,
      accent: 0xffffff,
      cockpit: 0xcfefff,
      engine: 0xcfefff
    }
  },
  {
    id: 'solar-dart',
    name: 'Solar Dart',
    description: 'Orange flare craft with hot fins and a fast dart profile.',
    unlockHint: 'Complete Solar Storm.',
    palette: {
      body: 0xffa15c,
      wing: 0x4a1e16,
      accent: 0xffe06b,
      cockpit: 0xff8e4f,
      engine: 0xff6a1f
    }
  },
  {
    id: 'night-runner',
    name: 'Night Runner',
    description: 'Dark violet low-light ship with quiet angular wings.',
    unlockHint: 'Complete Night Side.',
    palette: {
      body: 0x9b8cff,
      wing: 0x171a32,
      accent: 0xd9ceff,
      cockpit: 0xc7a6ff,
      engine: 0xb28cff
    }
  },
  {
    id: 'golden-janitor',
    name: 'Golden Janitor',
    description: 'Trophy-grade cleanup craft for elite endless routes.',
    unlockHint: 'Reach 150 score in Endless Cleanup.',
    palette: {
      body: 0xffe06b,
      wing: 0x5f4520,
      accent: 0xffffff,
      cockpit: 0xfff4b8,
      engine: 0xffd45f
    }
  }
];

export function getShipDefinition(shipId: string): ShipDefinition | null {
  return SHIP_DEFINITIONS.find((ship) => ship.id === shipId) ?? null;
}

export function isShipId(value: string): value is ShipId {
  return getShipDefinition(value) !== null;
}
