import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  disposeWorldCoreGroup,
  lighten,
  mixColor,
  type WorldCore,
  type WorldCoreUpdateContext
} from './WorldCore';

export class SolarReactorCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb13d,
    emissive: 0xff6a1f,
    emissiveIntensity: 0.85,
    roughness: 0.38,
    metalness: 0.08,
    flatShading: true
  });
  private readonly glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe06b,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });
  private readonly ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe06b,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });
  private readonly outerRingMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d7fb8,
    emissive: 0xff6a1f,
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.36,
    flatShading: true
  });
  private readonly rotatingRings = new THREE.Group();
  private readonly energyBands = new THREE.Group();
  private readonly pointLight = new THREE.PointLight(0xffb13d, 0.45, 9);
  private elapsedTime = 0;

  constructor() {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.72, 2),
      this.coreMaterial
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.0, 28, 18),
      this.glowMaterial
    );

    this.group.add(glow, core, this.rotatingRings, this.energyBands, this.pointLight);
    this.addRings();
    this.addEnergyBands();
  }

  applyTheme(theme: SectorTheme): void {
    const hotColor = mixColor(theme.hazardWarningColor, 0xfff1a6, 0.28);
    const coreColor = mixColor(theme.planetAccentColor, theme.hazardWarningColor, 0.7);

    this.coreMaterial.color.setHex(coreColor);
    this.coreMaterial.emissive.setHex(theme.hazardActiveColor);
    this.glowMaterial.color.setHex(hotColor);
    this.ringMaterial.color.setHex(lighten(theme.hazardWarningColor, 0.12));
    this.outerRingMaterial.color.setHex(theme.planetBaseColor);
    this.outerRingMaterial.emissive.setHex(theme.hazardWarningColor);
    this.pointLight.color.setHex(theme.hazardWarningColor);
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.group.rotation.y += delta * 0.04;
    this.rotatingRings.rotation.y += delta * 0.42;
    this.rotatingRings.rotation.x -= delta * 0.18;
    this.energyBands.rotation.z -= delta * 0.5;

    const eventPulse = Math.max(0, Math.min(1, context?.eventPulseIntensity ?? 0));
    const wave = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 7.2) * 0.5;

    this.coreMaterial.emissiveIntensity = 0.85 + eventPulse * (0.35 + wave * 0.3);
    this.glowMaterial.opacity = 0.2 + eventPulse * (0.12 + wave * 0.08);
    this.ringMaterial.opacity = 0.7 + eventPulse * (0.1 + wave * 0.08);
    this.pointLight.intensity = 0.45 + eventPulse * (0.48 + wave * 0.24);
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addRings(): void {
    const ringConfigs = [
      [1.34, 0.04, 0, 0],
      [1.72, 0.035, Math.PI / 2.8, 0.32],
      [2.12, 0.03, Math.PI / 2, -0.25]
    ] as const;

    for (const [radius, tube, rotationX, rotationY] of ringConfigs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 8, 96),
        this.outerRingMaterial
      );
      ring.rotation.set(rotationX, rotationY, 0);
      this.rotatingRings.add(ring);
    }
  }

  private addEnergyBands(): void {
    const bandGeometry = new THREE.TorusGeometry(PLANET_RADIUS * 0.9, 0.016, 6, 96);

    for (let index = 0; index < 4; index += 1) {
      const band = new THREE.Mesh(bandGeometry, this.ringMaterial);
      band.rotation.x = Math.PI / 2 + index * 0.34;
      band.rotation.y = index * 0.82;
      band.scale.setScalar(0.78 + index * 0.08);
      this.energyBands.add(band);
    }
  }
}
