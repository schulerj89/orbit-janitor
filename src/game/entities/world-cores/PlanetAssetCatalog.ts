export type PlanetAssetId =
  | 'quaternius-planet-01'
  | 'quaternius-planet-02'
  | 'quaternius-planet-03'
  | 'quaternius-planet-04'
  | 'quaternius-planet-05'
  | 'quaternius-planet-06'
  | 'quaternius-planet-07'
  | 'quaternius-planet-08'
  | 'quaternius-planet-09'
  | 'quaternius-planet-10'
  | 'quaternius-planet-11'
  | 'quaternius-planet-01-long-orbit'
  | 'quaternius-planet-02-endless';

export interface PlanetAssetDefinition {
  id: PlanetAssetId;
  label: string;
  path: string;
  rotationSpeed: number;
  scale: number;
  tilt: number;
  tintStrength: number;
}

const planetPath = (fileName: string): string =>
  `${import.meta.env.BASE_URL}models/planets/quaternius/${fileName}`;

export const PLANET_ASSETS: Record<PlanetAssetId, PlanetAssetDefinition> = {
  'quaternius-planet-01': {
    id: 'quaternius-planet-01',
    label: 'Quaternius Planet 01',
    path: planetPath('planet-01.glb'),
    rotationSpeed: 0.055,
    scale: 1,
    tilt: -0.12,
    tintStrength: 0.06
  },
  'quaternius-planet-02': {
    id: 'quaternius-planet-02',
    label: 'Quaternius Planet 02',
    path: planetPath('planet-02.glb'),
    rotationSpeed: 0.05,
    scale: 1.02,
    tilt: 0.08,
    tintStrength: 0.06
  },
  'quaternius-planet-03': {
    id: 'quaternius-planet-03',
    label: 'Quaternius Planet 03',
    path: planetPath('planet-03.glb'),
    rotationSpeed: 0.044,
    scale: 1.04,
    tilt: 0.18,
    tintStrength: 0.08
  },
  'quaternius-planet-04': {
    id: 'quaternius-planet-04',
    label: 'Quaternius Planet 04',
    path: planetPath('planet-04.glb'),
    rotationSpeed: 0.063,
    scale: 0.98,
    tilt: -0.2,
    tintStrength: 0.1
  },
  'quaternius-planet-05': {
    id: 'quaternius-planet-05',
    label: 'Quaternius Planet 05',
    path: planetPath('planet-05.glb'),
    rotationSpeed: 0.04,
    scale: 1.04,
    tilt: 0.26,
    tintStrength: 0.1
  },
  'quaternius-planet-06': {
    id: 'quaternius-planet-06',
    label: 'Quaternius Planet 06',
    path: planetPath('planet-06.glb'),
    rotationSpeed: 0.058,
    scale: 0.96,
    tilt: -0.28,
    tintStrength: 0.08
  },
  'quaternius-planet-07': {
    id: 'quaternius-planet-07',
    label: 'Quaternius Planet 07',
    path: planetPath('planet-07.glb'),
    rotationSpeed: 0.052,
    scale: 1.03,
    tilt: 0.14,
    tintStrength: 0.08
  },
  'quaternius-planet-08': {
    id: 'quaternius-planet-08',
    label: 'Quaternius Planet 08',
    path: planetPath('planet-08.glb'),
    rotationSpeed: 0.068,
    scale: 1,
    tilt: -0.18,
    tintStrength: 0.12
  },
  'quaternius-planet-09': {
    id: 'quaternius-planet-09',
    label: 'Quaternius Planet 09',
    path: planetPath('planet-09.glb'),
    rotationSpeed: 0.046,
    scale: 1.05,
    tilt: 0.22,
    tintStrength: 0.08
  },
  'quaternius-planet-10': {
    id: 'quaternius-planet-10',
    label: 'Quaternius Planet 10',
    path: planetPath('planet-10.glb'),
    rotationSpeed: 0.06,
    scale: 1,
    tilt: -0.24,
    tintStrength: 0.11
  },
  'quaternius-planet-11': {
    id: 'quaternius-planet-11',
    label: 'Quaternius Planet 11',
    path: planetPath('planet-11.glb'),
    rotationSpeed: 0.049,
    scale: 1.02,
    tilt: 0.16,
    tintStrength: 0.08
  },
  'quaternius-planet-01-long-orbit': {
    id: 'quaternius-planet-01-long-orbit',
    label: 'Quaternius Planet 01 Long Orbit Variant',
    path: planetPath('planet-01.glb'),
    rotationSpeed: 0.032,
    scale: 1.08,
    tilt: 0.32,
    tintStrength: 0.14
  },
  'quaternius-planet-02-endless': {
    id: 'quaternius-planet-02-endless',
    label: 'Quaternius Planet 02 Endless Variant',
    path: planetPath('planet-02.glb'),
    rotationSpeed: 0.07,
    scale: 1,
    tilt: -0.34,
    tintStrength: 0.16
  }
};

export function getPlanetAsset(assetId: PlanetAssetId): PlanetAssetDefinition {
  return PLANET_ASSETS[assetId];
}
