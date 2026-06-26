import * as THREE from 'three/webgpu';
import {
  HAZARD_ACTIVE_DURATION,
  HAZARD_ARC_WIDTH_RADIANS,
  HAZARD_COLLISION_RADIUS,
  HAZARD_TELEGRAPH_DURATION,
  ORBIT_LANES
} from '../constants';
import { angularDistance, setOrbitPositionFromAngle, wrapAngle } from '../math';

export type HazardPhase = 'idle' | 'telegraph' | 'active';

export interface HazardConfig {
  laneIndex: number;
  angle: number;
}

export interface HazardUpdateResult {
  activated: boolean;
  completed: boolean;
}

const SEGMENT_COUNT = 13;

export class HazardTelegraph {
  readonly group = new THREE.Group();
  phase: HazardPhase = 'idle';
  laneIndex = 0;
  angle = 0;

  private readonly segments: THREE.Mesh[] = [];
  private readonly material = new THREE.MeshBasicMaterial({
    color: 0xffb13d,
    transparent: true,
    opacity: 0.85
  });
  private elapsed = 0;

  constructor() {
    const geometry = new THREE.BoxGeometry(0.24, 0.035, 0.11);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = new THREE.Mesh(geometry, this.material);
      this.segments.push(segment);
      this.group.add(segment);
    }

    this.group.visible = false;
  }

  start(config: HazardConfig): void {
    this.laneIndex = config.laneIndex;
    this.angle = wrapAngle(config.angle);
    this.phase = 'telegraph';
    this.elapsed = 0;
    this.group.visible = true;
    this.layoutSegments();
    this.applyPhaseVisuals(0);
  }

  update(delta: number): HazardUpdateResult {
    if (this.phase === 'idle') {
      return { activated: false, completed: false };
    }

    this.elapsed += delta;
    let activated = false;

    if (this.phase === 'telegraph' && this.elapsed >= HAZARD_TELEGRAPH_DURATION) {
      this.phase = 'active';
      this.elapsed = 0;
      activated = true;
    } else if (this.phase === 'active' && this.elapsed >= HAZARD_ACTIVE_DURATION) {
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
      segment.position.y = 0.16;
      segment.rotation.set(0, -segmentAngle - Math.PI / 2, 0);
    });
  }

  private applyPhaseVisuals(time: number): void {
    const pulse = 1 + Math.sin(time * 13) * 0.12;

    if (this.phase === 'active') {
      this.material.color.setHex(0xff3b22);
      this.material.opacity = 0.96;
      this.group.scale.setScalar(1.06 + Math.sin(time * 26) * 0.04);
      return;
    }

    this.material.color.setHex(0xffb13d);
    this.material.opacity = 0.72 + Math.sin(time * 12) * 0.18;
    this.group.scale.setScalar(pulse);
  }
}
