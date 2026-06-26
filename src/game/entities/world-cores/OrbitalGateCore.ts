import * as THREE from 'three/webgpu';
import type { SectorTheme } from '../../systems/SectorTheme';
import { darken, disposeWorldCoreGroup, lighten, type WorldCore } from './WorldCore';

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
  private readonly outerRing = new THREE.Group();
  private readonly innerRings = new THREE.Group();
  private readonly spokes = new THREE.Group();
  private elapsedTime = 0;

  constructor() {
    this.group.add(this.outerRing, this.innerRings, this.spokes);
    this.addRings();
    this.addSpokes();
  }

  applyTheme(theme: SectorTheme): void {
    this.frameMaterial.color.setHex(lighten(theme.laneColor, 0.18));
    this.energyMaterial.color.setHex(theme.activeLaneColor);
    this.spokeMaterial.color.setHex(lighten(theme.planetAccentColor, 0.08));
    this.frameMaterial.emissive?.setHex(darken(theme.activeLaneColor, 0.65));
  }

  update(delta: number): void {
    this.elapsedTime += delta;
    this.outerRing.rotation.z += delta * 0.08;
    this.innerRings.rotation.z -= delta * 0.28;
    this.innerRings.rotation.y = Math.sin(this.elapsedTime * 0.5) * 0.14;
    this.spokes.rotation.z += delta * 0.045;
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
    const stabilizer = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.026, 8, 112),
      this.frameMaterial
    );

    tilted.rotation.x = Math.PI / 2.7;
    stabilizer.rotation.x = Math.PI / 2;
    this.outerRing.add(outer, stabilizer);
    this.innerRings.add(inner, tilted);
  }

  private addSpokes(): void {
    const spokeGeometry = new THREE.BoxGeometry(0.1, 0.72, 0.08);
    const antennaGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.62, 7);

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeometry, this.spokeMaterial);
      spoke.position.set(Math.cos(angle) * 1.68, Math.sin(angle) * 1.68, 0);
      spoke.rotation.z = angle;
      this.spokes.add(spoke);

      if (index % 2 === 0) {
        const antenna = new THREE.Mesh(antennaGeometry, this.frameMaterial);
        antenna.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0);
        antenna.rotation.z = angle + Math.PI / 2;
        this.spokes.add(antenna);
      }
    }
  }
}
