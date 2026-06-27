import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from '../constants';
import type { EventWaveType } from '../systems/EventWaveTypes';
import type { SectorTheme } from '../systems/SectorTheme';

type EventTelegraphPhase = 'warning' | 'active';

export class EventTelegraph {
  readonly group = new THREE.Group();

  private readonly laneMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly laneRings: THREE.Mesh[] = [];
  private readonly spokeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb13d,
    transparent: true,
    opacity: 0.64,
    depthWrite: false
  });
  private readonly spokes: THREE.Mesh[] = [];
  private warningColor = 0xffb13d;
  private activeColor = 0xff3b22;
  private safeColor = 0x9fffee;
  private age = 0;
  private phase: EventTelegraphPhase = 'warning';
  private type: EventWaveType = 'debrisStorm';
  private safeLaneIndex: number | null = null;

  constructor() {
    ORBIT_LANES.forEach((radius) => {
      const material = new THREE.MeshBasicMaterial({
        color: this.warningColor,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 8, 144),
        material
      );

      ring.rotation.x = Math.PI / 2;
      this.laneMaterials.push(material);
      this.laneRings.push(ring);
      this.group.add(ring);
    });

    const spokeGeometry = new THREE.BoxGeometry(0.075, 0.05, ORBIT_LANES[2] * 2 + 0.8);
    for (let index = 0; index < 4; index += 1) {
      const spoke = new THREE.Mesh(spokeGeometry, this.spokeMaterial);

      spoke.position.y = 0.18;
      spoke.rotation.y = (index / 4) * Math.PI * 2;
      this.spokes.push(spoke);
      this.group.add(spoke);
    }

    this.group.visible = false;
  }

  show(
    type: EventWaveType,
    phase: EventTelegraphPhase,
    safeLaneIndex: number | null
  ): void {
    this.type = type;
    this.phase = phase;
    this.safeLaneIndex = safeLaneIndex;
    this.age = 0;
    this.group.visible = true;
    this.update(0);
  }

  setPhase(phase: EventTelegraphPhase): void {
    this.phase = phase;
  }

  update(delta: number): void {
    if (!this.group.visible) {
      return;
    }

    this.age += delta;
    const pulse = 0.5 + Math.sin(this.age * (this.phase === 'active' ? 12 : 7)) * 0.5;
    const isCleanup = this.type === 'cleanupFrenzy';

    this.laneRings.forEach((ring, index) => {
      const isSafeLane = this.safeLaneIndex === index || isCleanup;
      const material = this.laneMaterials[index];
      const color = isSafeLane
        ? this.safeColor
        : this.phase === 'active'
          ? this.activeColor
          : this.warningColor;

      material.color.setHex(color);
      material.opacity = isSafeLane
        ? 0.18 + pulse * 0.18
        : this.phase === 'active'
          ? 0.32 + pulse * 0.22
          : 0.18 + pulse * 0.2;
      ring.scale.setScalar(isSafeLane ? 1.004 + pulse * 0.006 : 1.002 + pulse * 0.005);
    });

    this.spokes.forEach((spoke, index) => {
      spoke.visible = this.type !== 'cleanupFrenzy';
      spoke.rotation.y += delta * (0.24 + index * 0.025);
    });
    this.spokeMaterial.color.setHex(
      this.phase === 'active' ? this.activeColor : this.warningColor
    );
    this.spokeMaterial.opacity =
      this.phase === 'active' ? 0.44 + pulse * 0.2 : 0.18 + pulse * 0.2;
  }

  clear(): void {
    this.group.visible = false;
    this.age = 0;
  }

  applyTheme(theme: SectorTheme): void {
    this.warningColor = theme.hazardWarningColor;
    this.activeColor = theme.hazardActiveColor;
    this.safeColor = theme.activeLaneColor;
    this.update(0);
  }
}
