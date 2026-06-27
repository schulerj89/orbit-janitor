import type * as THREE from 'three/webgpu';

export type CinematicPresetKey =
  | 'titleFlyIn'
  | 'officialTitleReveal'
  | 'sectorIntro'
  | 'sectorWorldReveal'
  | 'missionCompleteFlyBy'
  | 'gameOverImpact'
  | 'sectorUnlockReveal'
  | 'eventWarningShot'
  | 'shipUnlockReveal'
  | 'medalCeremony'
  | 'dailyChallengeLaunch'
  | 'endlessWarning';

export type CinematicEasing = 'smooth' | 'easeOut' | 'easeInOut';

export type VectorTuple = readonly [number, number, number];

export interface CinematicCameraPose {
  position: VectorTuple;
  lookAt: VectorTuple;
  fov: number;
}

export interface CinematicShot {
  id: string;
  presetKey: CinematicPresetKey;
  title: string;
  subtitle: string;
  duration: number;
  from: CinematicCameraPose;
  to: CinematicCameraPose;
  easing: CinematicEasing;
  reducedMotionDuration: number;
  reducedMotionPose?: CinematicCameraPose;
}

export interface CinematicContext {
  reducedMotion: boolean;
  sectorName?: string;
  sectorSubtitle?: string;
  objectiveText?: string;
  unlockedSectorName?: string;
  unlockedShipName?: string;
  medalText?: string;
  dailySeed?: string;
  gameOverReason?: string;
  eventCallout?: string;
  focus?: VectorTuple;
}

export interface CinematicCameraOverride {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export interface CinematicSnapshot {
  isActive: boolean;
  presetKey: CinematicPresetKey | null;
  title: string;
  subtitle: string;
  progress: number;
  skipLabel: string;
  reducedMotion: boolean;
}
