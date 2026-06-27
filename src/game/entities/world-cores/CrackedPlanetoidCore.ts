import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  placeSurfaceDetail,
  type WorldCore,
  type WorldCoreUpdateContext
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
  private readonly crackGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8a32,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });
  private readonly debrisMaterial = new THREE.MeshStandardMaterial({
    color: 0xd5762c,
    roughness: 0.9,
    metalness: 0.04,
    flatShading: true
  });
  private readonly dustMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd45f,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });
  private readonly bodyGroup = new THREE.Group();
  private readonly debrisRing = new THREE.Group();
  private readonly crackMeshes: THREE.Mesh[] = [];
  private readonly debrisChunks: THREE.Mesh[] = [];
  private elapsedTime = 0;

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

    this.bodyGroup.add(body, darkCap);
    this.group.add(this.bodyGroup);
    this.addCracks();
    this.addDebris();
    this.addDustHalo();
    this.group.add(this.debrisRing);
  }

  applyTheme(theme: SectorTheme): void {
    this.bodyMaterial.color.setHex(lighten(theme.planetAccentColor, 0.04));
    this.shadowMaterial.color.setHex(darken(theme.planetAccentColor, 0.62));
    this.crackMaterial.color.setHex(theme.hazardWarningColor);
    this.crackGlowMaterial.color.setHex(lighten(theme.hazardActiveColor, 0.12));
    this.debrisMaterial.color.setHex(lighten(theme.planetAccentColor, 0.18));
    this.dustMaterial.color.setHex(lighten(theme.hazardWarningColor, 0.2));
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.group.rotation.y += delta * 0.035;
    this.debrisRing.rotation.y -= delta * 0.18;
    this.debrisRing.rotation.x += delta * 0.04;

    const eventPulse = Math.max(0, Math.min(1, context?.eventPulseIntensity ?? 0));
    const tremor = context?.reducedMotion
      ? 0
      : Math.sin(this.elapsedTime * 7.7) * (0.004 + eventPulse * 0.008);
    const crackPulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 4.3) * 0.5;

    this.bodyGroup.position.set(tremor, tremor * 0.55, -tremor * 0.35);
    this.crackMaterial.opacity = 0.7 + crackPulse * 0.18 + eventPulse * 0.12;
    this.crackGlowMaterial.opacity = 0.2 + crackPulse * 0.16 + eventPulse * 0.18;

    this.crackMeshes.forEach((crack, index) => {
      crack.scale.y = 0.86 + crackPulse * 0.24 + (index % 2) * 0.05;
    });

    this.debrisChunks.forEach((chunk, index) => {
      chunk.rotation.x += delta * (0.15 + index * 0.006);
      chunk.rotation.y -= delta * (0.1 + index * 0.004);
    });
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addCracks(): void {
    const crackGeometry = new THREE.BoxGeometry(1, 0.034, 0.03);
    const glowGeometry = new THREE.BoxGeometry(1, 0.075, 0.022);
    const cracks = [
      [0.22, 0.45, 1.25, 0.2],
      [0.04, 0.92, 0.9, -0.45],
      [-0.18, 1.35, 0.72, 0.38],
      [0.44, 2.74, 0.78, -0.3],
      [-0.42, 3.26, 1.05, 0.55],
      [0.1, 4.5, 0.82, -0.12],
      [-0.08, 5.08, 0.68, 0.48],
      [0.62, 5.6, 0.54, -0.6],
      [-0.56, 0.14, 0.48, 0.72]
    ] as const;

    for (const [latitude, longitude, length, rotation] of cracks) {
      const glow = new THREE.Mesh(glowGeometry, this.crackGlowMaterial);
      placeSurfaceDetail(glow, latitude, longitude, PLANET_RADIUS * 0.952);
      glow.scale.set(length, 1, 1);
      glow.rotation.z += rotation;

      const crack = new THREE.Mesh(crackGeometry, this.crackMaterial);
      placeSurfaceDetail(crack, latitude, longitude, PLANET_RADIUS * 0.958);
      crack.scale.set(length, 1, 1);
      crack.rotation.z += rotation;
      this.crackMeshes.push(crack);
      this.bodyGroup.add(glow, crack);

      if (length > 0.75) {
        const branch = new THREE.Mesh(crackGeometry, this.crackMaterial);
        placeSurfaceDetail(
          branch,
          latitude + 0.08,
          longitude + 0.08,
          PLANET_RADIUS * 0.961
        );
        branch.scale.set(length * 0.36, 0.72, 0.82);
        branch.rotation.z += rotation + 0.72;
        this.crackMeshes.push(branch);
        this.bodyGroup.add(branch);
      }
    }
  }

  private addDebris(): void {
    const debrisGeometry = new THREE.IcosahedronGeometry(0.12, 0);
    const shardGeometry = new THREE.TetrahedronGeometry(0.13, 0);
    const debrisCount = 21;

    for (let index = 0; index < debrisCount; index += 1) {
      const angle = (index / debrisCount) * Math.PI * 2;
      const radius = 2.34 + (index % 5) * 0.14;
      const geometry = index % 3 === 0 ? shardGeometry : debrisGeometry;
      const debris = new THREE.Mesh(geometry, this.debrisMaterial);
      debris.position.set(
        Math.cos(angle) * radius,
        ((index % 7) - 3) * 0.12,
        Math.sin(angle) * radius
      );
      debris.rotation.set(index * 0.7, index * 0.31, index * 0.19);
      debris.scale.setScalar(0.42 + (index % 5) * 0.1);
      this.debrisChunks.push(debris);
      this.debrisRing.add(debris);
    }
  }

  private addDustHalo(): void {
    const haloGeometry = new THREE.TorusGeometry(2.28, 0.008, 5, 128);
    const innerHalo = new THREE.Mesh(haloGeometry, this.dustMaterial);
    const tiltedHalo = new THREE.Mesh(haloGeometry, this.dustMaterial);

    innerHalo.rotation.x = Math.PI / 2;
    innerHalo.scale.set(1, 0.72, 1);
    tiltedHalo.rotation.set(Math.PI / 2.45, 0.18, 0.28);
    tiltedHalo.scale.set(0.78, 1, 1);
    this.debrisRing.add(innerHalo, tiltedHalo);
  }
}
