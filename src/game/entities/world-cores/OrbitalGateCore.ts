import * as THREE from 'three/webgpu';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  type WorldCore,
  type WorldCoreUpdateContext
} from './WorldCore';

export class OrbitalGateCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x526c7c,
    roughness: 0.48,
    metalness: 0.42,
    flatShading: true
  });
  private readonly energyMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  private readonly spokeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc857,
    roughness: 0.58,
    metalness: 0.28,
    flatShading: true
  });
  private readonly portalMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  private readonly dockingLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd45f,
    transparent: true,
    opacity: 0.86,
    depthWrite: false
  });
  private readonly portalDisc: THREE.Mesh;
  private readonly outerRing = new THREE.Group();
  private readonly innerRings = new THREE.Group();
  private readonly spokes = new THREE.Group();
  private readonly dockingLights = new THREE.Group();
  private readonly dockingLightMeshes: THREE.Mesh[] = [];
  private elapsedTime = 0;

  constructor() {
    this.portalDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 48),
      this.portalMaterial
    );

    this.group.add(
      this.portalDisc,
      this.outerRing,
      this.innerRings,
      this.spokes,
      this.dockingLights
    );
    this.addRings();
    this.addSpokes();
    this.addDockingLights();
  }

  applyTheme(theme: SectorTheme): void {
    this.frameMaterial.color.setHex(lighten(theme.laneColor, 0.18));
    this.energyMaterial.color.setHex(theme.activeLaneColor);
    this.spokeMaterial.color.setHex(lighten(theme.planetAccentColor, 0.08));
    this.portalMaterial.color.setHex(theme.activeLaneColor);
    this.dockingLightMaterial.color.setHex(lighten(theme.hazardWarningColor, 0.18));
    this.frameMaterial.emissive?.setHex(darken(theme.activeLaneColor, 0.65));
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.outerRing.rotation.z += delta * 0.08;
    this.innerRings.rotation.z -= delta * 0.28;
    this.innerRings.rotation.y = Math.sin(this.elapsedTime * 0.5) * 0.14;
    this.spokes.rotation.z += delta * 0.045;
    this.dockingLights.rotation.z -= delta * 0.035;

    const eventPulse = Math.max(0, Math.min(1, context?.eventPulseIntensity ?? 0));
    const pulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 2.8) * 0.5;

    this.portalDisc.rotation.z -= delta * 0.18;
    this.portalDisc.scale.setScalar(1 + pulse * 0.045 + eventPulse * 0.06);
    this.portalMaterial.opacity = 0.16 + pulse * 0.14 + eventPulse * 0.12;
    this.energyMaterial.opacity = 0.42 + pulse * 0.2 + eventPulse * 0.14;
    this.dockingLightMaterial.opacity = 0.58 + pulse * 0.28;

    this.dockingLightMeshes.forEach((light, index) => {
      const lightPulse = context?.reducedMotion
        ? 0.5
        : 0.5 + Math.sin(this.elapsedTime * 4.1 + index * 0.82) * 0.5;
      light.scale.setScalar(0.8 + lightPulse * 0.42);
    });
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addRings(): void {
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.12, 10, 104),
      this.frameMaterial
    );
    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.035, 8, 92),
      this.energyMaterial
    );
    const tilted = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.028, 8, 72),
      this.energyMaterial
    );
    const innerFine = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.018, 6, 64),
      this.energyMaterial
    );
    const counterTilted = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.02, 6, 76),
      this.energyMaterial
    );
    const stabilizer = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.026, 8, 112),
      this.frameMaterial
    );

    tilted.rotation.x = Math.PI / 2.7;
    counterTilted.rotation.x = -Math.PI / 2.85;
    counterTilted.rotation.y = 0.38;
    stabilizer.rotation.x = Math.PI / 2;
    this.outerRing.add(outer, stabilizer);
    this.innerRings.add(inner, tilted, innerFine, counterTilted);
  }

  private addSpokes(): void {
    const spokeGeometry = new THREE.BoxGeometry(0.1, 0.72, 0.08);
    const armGeometry = new THREE.BoxGeometry(0.08, 1.12, 0.06);
    const antennaGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.62, 7);

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeometry, this.spokeMaterial);
      spoke.position.set(Math.cos(angle) * 1.68, Math.sin(angle) * 1.68, 0);
      spoke.rotation.z = angle;
      this.spokes.add(spoke);

      if (index % 2 === 1) {
        const arm = new THREE.Mesh(armGeometry, this.frameMaterial);
        arm.position.set(Math.cos(angle) * 1.25, Math.sin(angle) * 1.25, 0);
        arm.rotation.z = angle;
        this.spokes.add(arm);
      }

      if (index % 2 === 0) {
        const antenna = new THREE.Mesh(antennaGeometry, this.frameMaterial);
        antenna.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0);
        antenna.rotation.z = angle + Math.PI / 2;
        this.spokes.add(antenna);
      }
    }
  }

  private addDockingLights(): void {
    const lightGeometry = new THREE.SphereGeometry(0.035, 8, 6);
    const lightCount = 16;

    for (let index = 0; index < lightCount; index += 1) {
      const angle = (index / lightCount) * Math.PI * 2;
      const radius = index % 2 === 0 ? 1.76 : 2.08;
      const light = new THREE.Mesh(lightGeometry, this.dockingLightMaterial);

      light.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.055);
      this.dockingLightMeshes.push(light);
      this.dockingLights.add(light);
    }
  }
}
