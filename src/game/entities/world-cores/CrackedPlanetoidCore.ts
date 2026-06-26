import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  placeSurfaceDetail,
  type WorldCore
} from './WorldCore';

export class CrackedPlanetoidCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f4a32,
    roughness: 0.94,
    metalness: 0.02,
    flatShading: true
  });
  private readonly shadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b261d,
    roughness: 0.98,
    metalness: 0.01,
    flatShading: true
  });
  private readonly crackMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd45f,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });
  private readonly debrisMaterial = new THREE.MeshStandardMaterial({
    color: 0xd5762c,
    roughness: 0.9,
    metalness: 0.04,
    flatShading: true
  });
  private readonly debrisRing = new THREE.Group();

  constructor() {
    const body = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.92, 2),
      this.bodyMaterial
    );
    body.scale.set(1.05, 0.92, 1.0);

    const darkCap = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.935, 1),
      this.shadowMaterial
    );
    darkCap.scale.set(0.78, 0.38, 0.86);
    darkCap.position.set(-0.34, -0.82, 0.18);

    this.group.add(body, darkCap);
    this.addCracks();
    this.addDebris();
    this.group.add(this.debrisRing);
  }

  applyTheme(theme: SectorTheme): void {
    this.bodyMaterial.color.setHex(lighten(theme.planetAccentColor, 0.04));
    this.shadowMaterial.color.setHex(darken(theme.planetAccentColor, 0.62));
    this.crackMaterial.color.setHex(theme.hazardWarningColor);
    this.debrisMaterial.color.setHex(lighten(theme.planetAccentColor, 0.18));
  }

  update(delta: number): void {
    this.group.rotation.y += delta * 0.035;
    this.debrisRing.rotation.y -= delta * 0.18;
    this.debrisRing.rotation.x += delta * 0.04;
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addCracks(): void {
    const crackGeometry = new THREE.BoxGeometry(1, 0.034, 0.03);
    const cracks = [
      [0.22, 0.45, 1.25, 0.2],
      [0.04, 0.92, 0.9, -0.45],
      [-0.18, 1.35, 0.72, 0.38],
      [0.44, 2.74, 0.78, -0.3],
      [-0.42, 3.26, 1.05, 0.55],
      [0.1, 4.5, 0.82, -0.12],
      [-0.08, 5.08, 0.68, 0.48]
    ] as const;

    for (const [latitude, longitude, length, rotation] of cracks) {
      const crack = new THREE.Mesh(crackGeometry, this.crackMaterial);
      placeSurfaceDetail(crack, latitude, longitude, PLANET_RADIUS * 0.95);
      crack.scale.set(length, 1, 1);
      crack.rotation.z += rotation;
      this.group.add(crack);
    }
  }

  private addDebris(): void {
    const debrisGeometry = new THREE.IcosahedronGeometry(0.12, 0);
    const debrisCount = 13;

    for (let index = 0; index < debrisCount; index += 1) {
      const angle = (index / debrisCount) * Math.PI * 2;
      const radius = 2.58 + (index % 3) * 0.16;
      const debris = new THREE.Mesh(debrisGeometry, this.debrisMaterial);
      debris.position.set(
        Math.cos(angle) * radius,
        ((index % 4) - 1.5) * 0.16,
        Math.sin(angle) * radius
      );
      debris.rotation.set(index * 0.7, index * 0.31, index * 0.19);
      debris.scale.setScalar(0.65 + (index % 4) * 0.13);
      this.debrisRing.add(debris);
    }
  }
}
