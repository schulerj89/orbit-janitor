import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from './constants';

const TAU = Math.PI * 2;
const LANE_NAMES = ['Inner', 'Middle', 'Outer'] as const;

export function wrapAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

export function angleToOrbitPosition(angle: number, radius: number): THREE.Vector3 {
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

export function setOrbitPositionFromAngle(
  target: THREE.Vector3,
  angle: number,
  radius: number
): void {
  target.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

export function angularDistance(a: number, b: number): number {
  const difference = Math.abs(wrapAngle(a) - wrapAngle(b));
  return Math.min(difference, TAU - difference);
}

export function randomAngleAvoiding(
  disallowedAngles: number[],
  minSeparation: number
): number {
  let bestAngle = Math.random() * TAU;
  let bestDistance = 0;

  for (let attempt = 0; attempt < 64; attempt += 1) {
    const candidate = Math.random() * TAU;
    const nearestDistance = getNearestAngularDistance(candidate, disallowedAngles);

    if (nearestDistance >= minSeparation) {
      return candidate;
    }

    if (nearestDistance > bestDistance) {
      bestAngle = candidate;
      bestDistance = nearestDistance;
    }
  }

  return bestAngle;
}

export function isAngleSafe(
  candidateAngle: number,
  disallowedAngles: number[],
  minSeparation: number
): boolean {
  return disallowedAngles.every(
    (disallowedAngle) => angularDistance(candidateAngle, disallowedAngle) >= minSeparation
  );
}

export function laneName(laneIndex: number): (typeof LANE_NAMES)[number] {
  return LANE_NAMES[clampLaneIndex(laneIndex)];
}

export function clampLaneIndex(laneIndex: number): number {
  return Math.min(Math.max(Math.round(laneIndex), 0), ORBIT_LANES.length - 1);
}

function getNearestAngularDistance(angle: number, disallowedAngles: number[]): number {
  if (disallowedAngles.length === 0) {
    return Infinity;
  }

  return disallowedAngles.reduce(
    (nearest, disallowedAngle) => Math.min(nearest, angularDistance(angle, disallowedAngle)),
    Infinity
  );
}
