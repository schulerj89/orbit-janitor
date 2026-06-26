import * as THREE from 'three/webgpu';
import type { SectorTheme } from '../../systems/SectorTheme';

export type WorldCoreType =
  | 'planet'
  | 'crackedPlanetoid'
  | 'solarReactor'
  | 'nightPlanet'
  | 'comet'
  | 'orbitalGate';

export interface WorldCoreUpdateContext {
  sectorId?: string;
}

export interface WorldCore {
  readonly group: THREE.Group;
  applyTheme(theme: SectorTheme): void;
  update(delta: number, context?: WorldCoreUpdateContext): void;
  dispose?(): void;
}

export const WORLD_CORE_LABELS: Record<WorldCoreType, string> = {
  planet: 'Planet Core',
  crackedPlanetoid: 'Cracked Planetoid Core',
  solarReactor: 'Solar Reactor Core',
  nightPlanet: 'Night Planet Core',
  comet: 'Comet Core',
  orbitalGate: 'Orbital Gate Core'
};

export function disposeWorldCoreGroup(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  group.traverse((object) => {
    const renderable = object as {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    if (renderable.geometry) {
      geometries.add(renderable.geometry);
    }

    if (Array.isArray(renderable.material)) {
      renderable.material.forEach((material) => materials.add(material));
    } else if (renderable.material) {
      materials.add(renderable.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function lighten(color: number, amount: number): number {
  return mixColor(color, 0xffffff, amount);
}

export function darken(color: number, amount: number): number {
  return mixColor(color, 0x000000, amount);
}

export function mixColor(color: number, target: number, amount: number): number {
  const sourceColor = new THREE.Color(color);
  const targetColor = new THREE.Color(target);

  sourceColor.lerp(targetColor, amount);
  return sourceColor.getHex();
}

export function sphericalNormal(latitude: number, longitude: number): THREE.Vector3 {
  const cosLatitude = Math.cos(latitude);

  return new THREE.Vector3(
    Math.cos(longitude) * cosLatitude,
    Math.sin(latitude),
    Math.sin(longitude) * cosLatitude
  ).normalize();
}

export function placeSurfaceDetail(
  mesh: THREE.Object3D,
  latitude: number,
  longitude: number,
  radius: number,
  localNormal = new THREE.Vector3(0, 0, 1)
): void {
  const normal = sphericalNormal(latitude, longitude);

  mesh.position.copy(normal).multiplyScalar(radius);
  mesh.quaternion.setFromUnitVectors(localNormal, normal);
}
