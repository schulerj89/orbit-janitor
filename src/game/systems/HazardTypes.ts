import * as THREE from 'three/webgpu';
import {
  HAZARD_ACTIVE_DURATION,
  HAZARD_ARC_WIDTH_RADIANS,
  HAZARD_COLLISION_RADIUS,
  HAZARD_TELEGRAPH_DURATION,
  ORBIT_LANES
} from '../constants';
import {
  HazardTelegraph,
  type HazardPhase,
  type HazardUpdateResult
} from '../entities/HazardTelegraph';
import {
  type RandomSource,
  angularDistance,
  randomAngleAvoiding,
  setOrbitPositionFromAngle,
  wrapAngle
} from '../math';
import type { SeededRandom } from './SeededRandom';

export type HazardPatternType =
  | 'laneArc'
  | 'doubleLaneArc'
  | 'sweeper'
  | 'gate'
  | 'pulseMine'
  | 'debrisShower';

export interface HazardPatternStartContext {
  score: number;
  runTime: number;
  playerAngle: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  rng: SeededRandom;
}

export interface HazardPatternDebugState {
  type: HazardPatternType;
  phase: HazardPhase;
  laneIndex: number | null;
  laneIndices: number[];
  angle: number | null;
}

export interface HazardPattern {
  readonly group: THREE.Group;
  readonly type: HazardPatternType;
  readonly phase: HazardPhase;
  start(context: HazardPatternStartContext): void;
  update(delta: number): HazardUpdateResult;
  clear(): void;
  collidesWith(playerAngle: number, playerRadius: number): boolean;
  isWarning(): boolean;
  isActive(): boolean;
  getDebugState(): HazardPatternDebugState;
}

const TAU = Math.PI * 2;
const WARNING_COLOR = 0xffb13d;
const ACTIVE_COLOR = 0xff3b22;
const ACTIVE_ALT_COLOR = 0xff6a1f;
const HAZARD_SPAWN_MIN_SEPARATION = HAZARD_ARC_WIDTH_RADIANS + 0.45;
const DOUBLE_LANE_COUNT = 2;
const SWEEPER_ACTIVE_DURATION = 1.25;
const SWEEPER_ANGULAR_SPEED = 0.78;
const GATE_ACTIVE_DURATION = 0.85;
const GATE_SAFE_GAP_WIDTH = 1.08;
const PULSE_MINE_ACTIVE_DURATION = 0.82;
const PULSE_MINE_ANGULAR_RADIUS = 0.36;
const DEBRIS_SHOWER_ACTIVE_DURATION = 1.18;
const DEBRIS_SHOWER_ARC_WIDTH = 1.15;
const DEBRIS_SHARD_COUNT = 5;

export class LaneArcHazard implements HazardPattern {
  readonly type = 'laneArc';
  readonly visual = new HazardTelegraph();
  readonly group = this.visual.group;

  get phase(): HazardPhase {
    return this.visual.phase;
  }

  start(context: HazardPatternStartContext): void {
    const laneIndex = randomLaneIndex(context.rng);

    this.visual.start({
      laneIndex,
      angle: randomAngleAvoiding(
        getDisallowedAnglesForLane(context, laneIndex),
        HAZARD_SPAWN_MIN_SEPARATION,
        context.rng
      )
    });
  }

  update(delta: number): HazardUpdateResult {
    return this.visual.update(delta);
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    return this.visual.collidesWith(playerAngle, playerRadius);
  }

  isWarning(): boolean {
    return this.visual.isWarning();
  }

  isActive(): boolean {
    return this.visual.isActive();
  }

  clear(): void {
    this.visual.clear();
  }

  getDebugState(): HazardPatternDebugState {
    return {
      type: this.type,
      phase: this.phase,
      laneIndex: this.visual.laneIndex,
      laneIndices: [this.visual.laneIndex],
      angle: this.visual.angle
    };
  }
}

export class DoubleLaneArcHazard implements HazardPattern {
  readonly type = 'doubleLaneArc';
  readonly group = new THREE.Group();

  private readonly arcs = [new HazardTelegraph(), new HazardTelegraph()];
  private laneIndices: number[] = [];
  private angle = 0;

  constructor() {
    this.arcs.forEach((arc) => this.group.add(arc.group));
  }

  get phase(): HazardPhase {
    if (this.arcs.some((arc) => arc.phase === 'active')) {
      return 'active';
    }

    if (this.arcs.some((arc) => arc.phase === 'telegraph')) {
      return 'telegraph';
    }

    return 'idle';
  }

  start(context: HazardPatternStartContext): void {
    this.laneIndices = pickLaneSet(DOUBLE_LANE_COUNT, context.rng);
    const disallowedAngles = this.laneIndices.flatMap((laneIndex) =>
      getDisallowedAnglesForLane(context, laneIndex)
    );
    this.angle = randomAngleAvoiding(
      disallowedAngles,
      HAZARD_SPAWN_MIN_SEPARATION,
      context.rng
    );

    this.arcs.forEach((arc, index) => {
      arc.start({
        laneIndex: this.laneIndices[index],
        angle: this.angle
      });
    });
  }

  update(delta: number): HazardUpdateResult {
    const results = this.arcs.map((arc) => arc.update(delta));

    return {
      activated: results.some((result) => result.activated),
      completed:
        results.some((result) => result.completed) &&
        this.arcs.every((arc) => arc.phase === 'idle')
    };
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    return this.arcs.some((arc) => arc.collidesWith(playerAngle, playerRadius));
  }

  isWarning(): boolean {
    return this.phase === 'telegraph';
  }

  isActive(): boolean {
    return this.phase === 'active';
  }

  clear(): void {
    this.arcs.forEach((arc) => arc.clear());
  }

  getDebugState(): HazardPatternDebugState {
    return {
      type: this.type,
      phase: this.phase,
      laneIndex: this.laneIndices[0] ?? null,
      laneIndices: [...this.laneIndices],
      angle: this.angle
    };
  }
}

abstract class TimedHazardPattern implements HazardPattern {
  readonly group = new THREE.Group();
  phase: HazardPhase = 'idle';

  protected elapsed = 0;
  protected debugLaneIndex: number | null = null;
  protected debugLaneIndices: number[] = [];
  protected debugAngle: number | null = null;

  protected constructor(
    readonly type: HazardPatternType,
    private readonly activeDuration = HAZARD_ACTIVE_DURATION,
    private readonly telegraphDuration = HAZARD_TELEGRAPH_DURATION
  ) {
    this.group.visible = false;
  }

  abstract start(context: HazardPatternStartContext): void;

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
      this.onActivated();
    } else if (this.phase === 'active' && this.elapsed >= this.activeDuration) {
      this.clear();
      return { activated: false, completed: true };
    }

    this.updateVisuals(delta);
    return { activated, completed: false };
  }

  abstract collidesWith(playerAngle: number, playerRadius: number): boolean;

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
    this.onCleared();
  }

  getDebugState(): HazardPatternDebugState {
    return {
      type: this.type,
      phase: this.phase,
      laneIndex: this.debugLaneIndex,
      laneIndices: [...this.debugLaneIndices],
      angle: this.debugAngle
    };
  }

  protected beginTelegraph(): void {
    this.phase = 'telegraph';
    this.elapsed = 0;
    this.group.visible = true;
    this.updateVisuals(0);
  }

  protected onActivated(): void {}

  protected onCleared(): void {}

  protected abstract updateVisuals(delta: number): void;
}

class ArcSegmentStrip {
  readonly group = new THREE.Group();

  private readonly material: THREE.MeshBasicMaterial;
  private readonly segments: THREE.Mesh[] = [];

  constructor(segmentCount: number, geometry = new THREE.BoxGeometry(0.24, 0.035, 0.11)) {
    this.material = new THREE.MeshBasicMaterial({
      color: WARNING_COLOR,
      transparent: true,
      opacity: 0.82
    });

    for (let index = 0; index < segmentCount; index += 1) {
      const segment = new THREE.Mesh(geometry, this.material);
      this.segments.push(segment);
      this.group.add(segment);
    }
  }

  layout(laneIndex: number, centerAngle: number, arcWidth: number, yOffset = 0.16): void {
    const radius = ORBIT_LANES[laneIndex];
    const firstAngle = centerAngle - arcWidth * 0.5;
    const segmentStep =
      this.segments.length > 1 ? arcWidth / (this.segments.length - 1) : 0;

    this.segments.forEach((segment, index) => {
      const segmentAngle = firstAngle + segmentStep * index;
      setOrbitPositionFromAngle(segment.position, segmentAngle, radius);
      segment.position.y = yOffset;
      segment.rotation.set(0, -segmentAngle - Math.PI / 2, 0);
    });
  }

  applyVisuals(phase: HazardPhase, time: number, scaleMultiplier = 1): void {
    if (phase === 'active') {
      this.material.color.setHex(ACTIVE_COLOR);
      this.material.opacity = 0.95;
      this.group.scale.setScalar(scaleMultiplier * (1.05 + Math.sin(time * 25) * 0.035));
      return;
    }

    this.material.color.setHex(WARNING_COLOR);
    this.material.opacity = 0.68 + Math.sin(time * 12) * 0.17;
    this.group.scale.setScalar(scaleMultiplier * (1 + Math.sin(time * 12) * 0.1));
  }

  setVisible(isVisible: boolean): void {
    this.group.visible = isVisible;
  }
}

export class SweeperHazard extends TimedHazardPattern {
  private readonly strip = new ArcSegmentStrip(13);
  private readonly markerMaterial = new THREE.MeshBasicMaterial({
    color: WARNING_COLOR,
    transparent: true,
    opacity: 0.88
  });
  private readonly directionMarkers: THREE.Mesh[] = [];
  private laneIndex = 0;
  private startAngle = 0;
  private angle = 0;
  private direction = 1;

  constructor() {
    super('sweeper', SWEEPER_ACTIVE_DURATION);
    this.group.add(this.strip.group);

    const markerGeometry = new THREE.BoxGeometry(0.16, 0.05, 0.08);
    for (let index = 0; index < 3; index += 1) {
      const marker = new THREE.Mesh(markerGeometry, this.markerMaterial);
      this.directionMarkers.push(marker);
      this.group.add(marker);
    }
  }

  start(context: HazardPatternStartContext): void {
    this.laneIndex = randomLaneIndex(context.rng);
    this.startAngle = randomAngleAvoiding(
      getDisallowedAnglesForLane(context, this.laneIndex),
      HAZARD_SPAWN_MIN_SEPARATION,
      context.rng
    );
    this.angle = this.startAngle;
    this.direction = context.rng.next() < 0.5 ? -1 : 1;
    this.debugLaneIndex = this.laneIndex;
    this.debugLaneIndices = [this.laneIndex];
    this.debugAngle = this.angle;
    this.beginTelegraph();
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    if (this.phase !== 'active') {
      return false;
    }

    return (
      isNearLane(playerRadius, this.laneIndex, HAZARD_COLLISION_RADIUS) &&
      angularDistance(playerAngle, this.angle) <= HAZARD_ARC_WIDTH_RADIANS * 0.5
    );
  }

  protected updateVisuals(): void {
    if (this.phase === 'active') {
      this.angle = wrapAngle(
        this.startAngle + this.direction * SWEEPER_ANGULAR_SPEED * this.elapsed
      );
    } else {
      this.angle = this.startAngle;
    }

    this.debugAngle = this.angle;
    this.strip.layout(this.laneIndex, this.angle, HAZARD_ARC_WIDTH_RADIANS, 0.2);
    this.strip.applyVisuals(this.phase, this.elapsed);
    this.layoutDirectionMarkers();

    this.markerMaterial.color.setHex(
      this.phase === 'active' ? ACTIVE_ALT_COLOR : WARNING_COLOR
    );
    this.markerMaterial.opacity =
      this.phase === 'active' ? 0.7 : 0.56 + Math.sin(this.elapsed * 12) * 0.22;
  }

  private layoutDirectionMarkers(): void {
    this.directionMarkers.forEach((marker, index) => {
      const markerAngle =
        this.angle +
        this.direction * (HAZARD_ARC_WIDTH_RADIANS * 0.5 + 0.15 + index * 0.13);
      setOrbitPositionFromAngle(
        marker.position,
        markerAngle,
        ORBIT_LANES[this.laneIndex]
      );
      marker.position.y = 0.3 + index * 0.015;
      marker.rotation.set(0, -markerAngle - Math.PI / 2, 0);
      marker.scale.setScalar(1 + index * 0.12);
    });
  }
}

export class GateHazard extends TimedHazardPattern {
  private readonly dangerArcs = [
    new ArcSegmentStrip(24, new THREE.BoxGeometry(0.21, 0.035, 0.11)),
    new ArcSegmentStrip(24, new THREE.BoxGeometry(0.21, 0.035, 0.11))
  ];
  private readonly boundaryMaterial = new THREE.MeshBasicMaterial({
    color: WARNING_COLOR,
    transparent: true,
    opacity: 0.82
  });
  private readonly boundaries: THREE.Mesh[] = [];
  private laneIndex = 0;
  private gapAngle = 0;

  constructor() {
    super('gate', GATE_ACTIVE_DURATION);
    this.dangerArcs.forEach((arc) => this.group.add(arc.group));

    const boundaryGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.32);
    for (let index = 0; index < 2; index += 1) {
      const boundary = new THREE.Mesh(boundaryGeometry, this.boundaryMaterial);
      this.boundaries.push(boundary);
      this.group.add(boundary);
    }
  }

  start(context: HazardPatternStartContext): void {
    this.laneIndex = randomLaneIndex(context.rng);
    this.gapAngle = isNearLane(context.playerRadius, this.laneIndex, 0.8)
      ? wrapAngle(context.playerAngle + context.rng.range(-0.12, 0.12))
      : randomAngleAvoiding(
          getDisallowedAnglesForLane(context, this.laneIndex),
          GATE_SAFE_GAP_WIDTH,
          context.rng
        );
    this.debugLaneIndex = this.laneIndex;
    this.debugLaneIndices = [this.laneIndex];
    this.debugAngle = this.gapAngle;
    this.beginTelegraph();
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    if (this.phase !== 'active') {
      return false;
    }

    return (
      isNearLane(playerRadius, this.laneIndex, HAZARD_COLLISION_RADIUS) &&
      angularDistance(playerAngle, this.gapAngle) > GATE_SAFE_GAP_WIDTH * 0.5
    );
  }

  protected updateVisuals(): void {
    const dangerWidth = (TAU - GATE_SAFE_GAP_WIDTH) * 0.5 - 0.08;
    const forwardArcCenter =
      this.gapAngle + GATE_SAFE_GAP_WIDTH * 0.5 + dangerWidth * 0.5;
    const backwardArcCenter =
      this.gapAngle - GATE_SAFE_GAP_WIDTH * 0.5 - dangerWidth * 0.5;

    this.dangerArcs[0].layout(this.laneIndex, forwardArcCenter, dangerWidth, 0.18);
    this.dangerArcs[1].layout(this.laneIndex, backwardArcCenter, dangerWidth, 0.18);
    this.dangerArcs.forEach((arc) => arc.applyVisuals(this.phase, this.elapsed, 1.02));
    this.layoutBoundaries();

    this.boundaryMaterial.color.setHex(
      this.phase === 'active' ? ACTIVE_ALT_COLOR : WARNING_COLOR
    );
    this.boundaryMaterial.opacity =
      this.phase === 'active' ? 0.9 : 0.58 + Math.sin(this.elapsed * 10) * 0.18;
  }

  private layoutBoundaries(): void {
    this.boundaries.forEach((boundary, index) => {
      const side = index === 0 ? -1 : 1;
      const boundaryAngle = this.gapAngle + side * GATE_SAFE_GAP_WIDTH * 0.5;
      setOrbitPositionFromAngle(
        boundary.position,
        boundaryAngle,
        ORBIT_LANES[this.laneIndex]
      );
      boundary.position.y = 0.29;
      boundary.rotation.set(0, -boundaryAngle, 0);
    });
  }
}

export class PulseMineHazard extends TimedHazardPattern {
  private readonly mineMaterial = new THREE.MeshBasicMaterial({
    color: WARNING_COLOR,
    transparent: true,
    opacity: 0.9
  });
  private readonly ringMaterial = new THREE.MeshBasicMaterial({
    color: WARNING_COLOR,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  private readonly mine: THREE.Mesh;
  private readonly ring: THREE.Mesh;
  private laneIndex = 0;
  private angle = 0;

  constructor() {
    super('pulseMine', PULSE_MINE_ACTIVE_DURATION);
    this.mine = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), this.mineMaterial);
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.018, 8, 48),
      this.ringMaterial
    );
    this.ring.rotation.x = Math.PI / 2;
    this.group.add(this.ring, this.mine);
  }

  start(context: HazardPatternStartContext): void {
    this.laneIndex = randomLaneIndex(context.rng);
    this.angle = randomAngleAvoiding(
      getDisallowedAnglesForLane(context, this.laneIndex),
      HAZARD_SPAWN_MIN_SEPARATION,
      context.rng
    );
    this.debugLaneIndex = this.laneIndex;
    this.debugLaneIndices = [this.laneIndex];
    this.debugAngle = this.angle;
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.position.y = 0.24;
    this.beginTelegraph();
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    if (this.phase !== 'active') {
      return false;
    }

    return (
      isNearLane(playerRadius, this.laneIndex, HAZARD_COLLISION_RADIUS + 0.08) &&
      angularDistance(playerAngle, this.angle) <= PULSE_MINE_ANGULAR_RADIUS
    );
  }

  protected updateVisuals(): void {
    const pulse = 1 + Math.sin(this.elapsed * 14) * 0.14;

    if (this.phase === 'active') {
      const progress = Math.min(1, this.elapsed / PULSE_MINE_ACTIVE_DURATION);
      this.mineMaterial.color.setHex(ACTIVE_COLOR);
      this.mineMaterial.opacity = 0.95;
      this.ringMaterial.color.setHex(ACTIVE_ALT_COLOR);
      this.ringMaterial.opacity = 0.76 * (1 - progress);
      this.ring.scale.setScalar(1.1 + progress * 2.3);
      this.mine.scale.setScalar(1.18 + Math.sin(this.elapsed * 28) * 0.08);
      return;
    }

    this.mineMaterial.color.setHex(WARNING_COLOR);
    this.mineMaterial.opacity = 0.72 + Math.sin(this.elapsed * 12) * 0.16;
    this.ringMaterial.color.setHex(WARNING_COLOR);
    this.ringMaterial.opacity = 0.3 + Math.sin(this.elapsed * 11) * 0.16;
    this.ring.scale.setScalar(pulse);
    this.mine.scale.setScalar(0.86 + pulse * 0.12);
  }
}

export class DebrisShowerHazard extends TimedHazardPattern {
  private readonly warningLine = new ArcSegmentStrip(
    11,
    new THREE.BoxGeometry(0.18, 0.028, 0.08)
  );
  private readonly shardMaterial = new THREE.MeshBasicMaterial({
    color: ACTIVE_COLOR,
    transparent: true,
    opacity: 0.92
  });
  private readonly shards: THREE.Mesh[] = [];
  private laneIndex = 0;
  private centerAngle = 0;
  private radialDirection = 1;
  private shardAngles: number[] = [];
  private shardRadii: number[] = [];

  constructor() {
    super('debrisShower', DEBRIS_SHOWER_ACTIVE_DURATION);
    this.group.add(this.warningLine.group);

    for (let index = 0; index < DEBRIS_SHARD_COUNT; index += 1) {
      const shard = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.17, 0),
        this.shardMaterial
      );
      this.shards.push(shard);
      this.group.add(shard);
    }
  }

  start(context: HazardPatternStartContext): void {
    this.laneIndex = randomLaneIndex(context.rng);
    this.centerAngle = randomAngleAvoiding(
      getDisallowedAnglesForLane(context, this.laneIndex),
      DEBRIS_SHOWER_ARC_WIDTH,
      context.rng
    );
    this.radialDirection = context.rng.next() < 0.5 ? -1 : 1;
    this.shardAngles = this.createShardAngles(context.rng);
    this.shardRadii = new Array(DEBRIS_SHARD_COUNT).fill(ORBIT_LANES[this.laneIndex]);
    this.debugLaneIndex = this.laneIndex;
    this.debugLaneIndices = [this.laneIndex];
    this.debugAngle = this.centerAngle;
    this.beginTelegraph();
  }

  collidesWith(playerAngle: number, playerRadius: number): boolean {
    if (this.phase !== 'active') {
      return false;
    }

    return this.shardAngles.some(
      (angle, index) =>
        angularDistance(playerAngle, angle) <= 0.16 &&
        Math.abs(playerRadius - this.shardRadii[index]) <= 0.32
    );
  }

  protected updateVisuals(): void {
    this.warningLine.layout(
      this.laneIndex,
      this.centerAngle,
      DEBRIS_SHOWER_ARC_WIDTH,
      0.22
    );
    this.warningLine.applyVisuals(this.phase, this.elapsed);

    if (this.phase === 'active') {
      this.warningLine.setVisible(false);
      this.layoutShards();
      this.shardMaterial.opacity = 0.92;
      this.shardMaterial.color.setHex(ACTIVE_COLOR);
      return;
    }

    this.warningLine.setVisible(true);
    this.shards.forEach((shard) => {
      shard.visible = false;
    });
  }

  protected onCleared(): void {
    this.warningLine.setVisible(false);
    this.shards.forEach((shard) => {
      shard.visible = false;
    });
  }

  private layoutShards(): void {
    const progress = Math.min(1, this.elapsed / DEBRIS_SHOWER_ACTIVE_DURATION);
    const startOffset = this.radialDirection > 0 ? -0.88 : 0.88;
    const endOffset = -startOffset;

    this.shards.forEach((shard, index) => {
      const stagger = (index / (DEBRIS_SHARD_COUNT - 1) - 0.5) * 0.18;
      const shardProgress = Math.max(0, Math.min(1, progress + stagger));
      const radius =
        ORBIT_LANES[this.laneIndex] +
        startOffset +
        (endOffset - startOffset) * shardProgress;

      this.shardRadii[index] = radius;
      shard.visible = true;
      setOrbitPositionFromAngle(shard.position, this.shardAngles[index], radius);
      shard.position.y = 0.26 + index * 0.018;
      shard.rotation.x += 0.12 + index * 0.02;
      shard.rotation.y += 0.16 + index * 0.025;
      shard.scale.setScalar(1 + Math.sin(this.elapsed * 16 + index) * 0.08);
    });
  }

  private createShardAngles(rng: RandomSource): number[] {
    const step = DEBRIS_SHOWER_ARC_WIDTH / (DEBRIS_SHARD_COUNT + 1);
    const firstAngle = this.centerAngle - DEBRIS_SHOWER_ARC_WIDTH * 0.5 + step;

    return Array.from({ length: DEBRIS_SHARD_COUNT }, (_, index) =>
      wrapAngle(firstAngle + step * index + (rng.next() - 0.5) * 0.08)
    );
  }
}

function randomLaneIndex(rng: RandomSource): number {
  return Math.floor(rng.next() * ORBIT_LANES.length);
}

function pickLaneSet(count: number, rng: RandomSource): number[] {
  const lanes = ORBIT_LANES.map((_, index) => index);

  for (let index = lanes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng.next() * (index + 1));
    [lanes[index], lanes[swapIndex]] = [lanes[swapIndex], lanes[index]];
  }

  return lanes.slice(0, Math.min(count, ORBIT_LANES.length - 1));
}

function getDisallowedAnglesForLane(
  context: HazardPatternStartContext,
  laneIndex: number
): number[] {
  const disallowedAngles: number[] = [];

  if (isNearLane(context.playerRadius, laneIndex, 0.8)) {
    disallowedAngles.push(context.playerAngle);
  }

  if (context.junkLaneIndex === laneIndex) {
    disallowedAngles.push(context.junkAngle);
  }

  return disallowedAngles;
}

function isNearLane(playerRadius: number, laneIndex: number, tolerance: number): boolean {
  return Math.abs(playerRadius - ORBIT_LANES[laneIndex]) <= tolerance;
}
