import * as THREE from 'three/webgpu';
import {
  HAZARD_ACTIVE_DURATION,
  HAZARD_ARC_WIDTH_RADIANS,
  HAZARD_COLLISION_RADIUS,
  HAZARD_TELEGRAPH_DURATION,
  ORBIT_LANES
} from '../constants';
import { angularDistance, setOrbitPositionFromAngle, wrapAngle } from '../math';
import type { SectorTheme } from '../systems/SectorTheme';

export type HazardPhase = 'idle' | 'telegraph' | 'active';

export interface HazardConfig {
  laneIndex: number;
  angle: number;
  telegraphDurationMultiplier?: number;
  activeDurationMultiplier?: number;
}

export interface HazardUpdateResult {
  activated: boolean;
  completed: boolean;
}

const SEGMENT_COUNT = 17;

export class HazardTelegraph {
  readonly group = new THREE.Group();
  phase: HazardPhase = 'idle';
  laneIndex = 0;
  angle = 0;

  private readonly segments: THREE.Mesh[] = [];
  private readonly endCaps: THREE.Mesh[] = [];
  private readonly material = new THREE.MeshBasicMaterial({
    color: 0xffb13d,
    transparent: true,
    opacity: 0.85
  });
  private readonly capMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd45f,
    transparent: true,
    opacity: 0.8
  });
  private warningColor = 0xffb13d;
  private warningAccentColor = 0xffd45f;
  private activeColor = 0xff3b22;
  private activeAccentColor = 0xff7a1f;
  private telegraphDuration = HAZARD_TELEGRAPH_DURATION;
  private activeDuration = HAZARD_ACTIVE_DURATION;
  private elapsed = 0;

  constructor() {
    const geometry = new THREE.BoxGeometry(0.22, 0.045, 0.16);
    const capGeometry = new THREE.BoxGeometry(0.14, 0.1, 0.34);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = new THREE.Mesh(geometry, this.material);
      this.segments.push(segment);
      this.group.add(segment);
    }

    for (let index = 0; index < 2; index += 1) {
      const cap = new THREE.Mesh(capGeometry, this.capMaterial);
      this.endCaps.push(cap);
      this.group.add(cap);
    }

    this.group.visible = false;
  }

  start(config: HazardConfig): void {
    this.laneIndex = config.laneIndex;
    this.angle = wrapAngle(config.angle);
    this.telegraphDuration =
      HAZARD_TELEGRAPH_DURATION * (config.telegraphDurationMultiplier ?? 1);
    this.activeDuration = HAZARD_ACTIVE_DURATION * (config.activeDurationMultiplier ?? 1);
    this.phase = 'telegraph';
    this.elapsed = 0;
    this.group.visible = true;
    this.layoutSegments();
    this.applyPhaseVisuals(0);
  }

  applyTheme(theme: SectorTheme): void {
    this.warningColor = theme.hazardWarningColor;
    this.warningAccentColor = lighten(theme.hazardWarningColor, 0.18);
    this.activeColor = theme.hazardActiveColor;
    this.activeAccentColor = lighten(theme.hazardActiveColor, 0.16);
    this.applyPhaseVisuals(this.elapsed);
  }

  update(delta: number): HazardUpdateResult {
    if (this.phase === 'idle') {
      return { activated: false, completed: false };
    }

    this.elapsed += delta;
    let activated = false;

    if (this.phase === 'telegraph' && this.elapsed >= this.telegraphDuration) {
      this.phase = 'active';
      this.elapsed = 0;
      activated = true;
    } else if (this.phase === 'active' && this.elapsed >= this.activeDuration) {
      this.clear();
      return { activated: false, completed: true };
    }

    this.applyPhaseVisuals(this.elapsed);
    return { activated, completed: false };
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    if (this.phase !== 'active') {
      return false;
    }

    const laneRadius = ORBIT_LANES[this.laneIndex];
    const laneDistance = Math.abs(playerRadius - laneRadius);

    return (
      laneDistance <= HAZARD_COLLISION_RADIUS &&
      angularDistance(playerAngle, this.angle) <= HAZARD_ARC_WIDTH_RADIANS * 0.5
    );
  }

  isWarning(): boolean {
    return this.phase === 'telegraph';
  }

  isActive(): boolean {
    return this.phase === 'active';
  }

  clear(): void {
    this.phase = 'idle';
    this.elapsed = 0;
    this.group.visible = false;
  }

  private layoutSegments(): void {
    const radius = ORBIT_LANES[this.laneIndex];
    const firstAngle = this.angle - HAZARD_ARC_WIDTH_RADIANS * 0.5;
    const segmentStep = HAZARD_ARC_WIDTH_RADIANS / (SEGMENT_COUNT - 1);

    this.segments.forEach((segment, index) => {
      const segmentAngle = firstAngle + segmentStep * index;
      setOrbitPositionFromAngle(segment.position, segmentAngle, radius);
      segment.position.y = 0.18 + (index % 2) * 0.018;
      segment.rotation.set(0, -segmentAngle - Math.PI / 2, 0);
    });

    this.endCaps.forEach((cap, index) => {
      const capAngle = index === 0 ? firstAngle : firstAngle + HAZARD_ARC_WIDTH_RADIANS;
      setOrbitPositionFromAngle(cap.position, capAngle, radius);
      cap.position.y = 0.22;
      cap.rotation.set(0, -capAngle, 0);
    });
  }

  private applyPhaseVisuals(time: number): void {
    const pulse = 1 + Math.sin(time * 13) * 0.12;

    if (this.phase === 'active') {
      this.material.color.setHex(this.activeColor);
      this.material.opacity = 0.96;
      this.capMaterial.color.setHex(this.activeAccentColor);
      this.capMaterial.opacity = 0.98;
      this.segments.forEach((segment, index) => {
        segment.scale.set(1.12, index % 2 === 0 ? 1.35 : 1.75, 1.18);
      });
      this.endCaps.forEach((cap) => cap.scale.set(1.12, 1.25, 1.08));
      this.group.scale.setScalar(1.07 + Math.sin(time * 26) * 0.04);
      return;
    }

    this.material.color.setHex(this.warningColor);
    this.material.opacity = 0.78 + Math.sin(time * 12) * 0.16;
    this.capMaterial.color.setHex(this.warningAccentColor);
    this.capMaterial.opacity = 0.58 + Math.sin(time * 10) * 0.16;
    this.segments.forEach((segment) => segment.scale.set(1, 1, 1));
    this.endCaps.forEach((cap) => cap.scale.set(1, 1, 1));
    this.group.scale.setScalar(pulse);
  }
}

function lighten(color: number, amount: number): number {
  const mixedColor = new THREE.Color(color);

  mixedColor.lerp(new THREE.Color(0xffffff), amount);
  return mixedColor.getHex();
}
