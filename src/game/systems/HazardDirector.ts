import * as THREE from 'three/webgpu';
import {
  HAZARD_ARC_WIDTH_RADIANS,
  HAZARD_BASE_INTERVAL,
  HAZARD_FIRST_SPAWN_TIME,
  HAZARD_MIN_INTERVAL,
  ORBIT_LANES
} from '../constants';
import { PlanetPulseHazard } from '../entities/PlanetPulseHazard';
import { HazardTelegraph } from '../entities/HazardTelegraph';
import { randomAngleAvoiding } from '../math';

export interface HazardDirectorContext {
  score: number;
  playerAngle: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  isGameOver: boolean;
}

export interface HazardDirectorResult {
  hit: boolean;
  warning: boolean;
  active: boolean;
}

export interface HazardDirectorDebugState {
  phase: string;
  laneIndex: number | null;
  angle: number | null;
  nextSpawnIn: number;
}

const HAZARD_SPAWN_MIN_SEPARATION = HAZARD_ARC_WIDTH_RADIANS + 0.45;

export class HazardDirector {
  readonly group = new THREE.Group();

  private readonly hazards: HazardTelegraph[] = [new HazardTelegraph()];
  private readonly pulse = new PlanetPulseHazard();
  private spawnTimer = HAZARD_FIRST_SPAWN_TIME;

  constructor() {
    this.hazards.forEach((hazard) => this.group.add(hazard.group));
    this.group.add(this.pulse.group);
  }

  update(delta: number, context: HazardDirectorContext): HazardDirectorResult {
    this.pulse.update(delta);

    if (context.isGameOver) {
      return this.getCurrentResult(false);
    }

    const activeHazard = this.getActiveHazard();

    if (activeHazard) {
      const result = activeHazard.update(delta);

      if (result.activated) {
        this.pulse.emit();
      }

      return this.getCurrentResult(
        activeHazard.collidesWith(context.playerAngle, context.playerRadius)
      );
    }

    this.spawnTimer -= delta;

    if (this.spawnTimer <= 0) {
      this.spawnHazard(context);
    }

    return this.getCurrentResult(false);
  }

  reset(): void {
    this.spawnTimer = HAZARD_FIRST_SPAWN_TIME;
    this.pulse.clear();

    for (const hazard of this.hazards) {
      hazard.clear();
    }
  }

  getDebugState(): HazardDirectorDebugState {
    const hazard = this.getActiveHazard();

    return {
      phase: hazard?.phase ?? 'idle',
      laneIndex: hazard ? hazard.laneIndex : null,
      angle: hazard ? hazard.angle : null,
      nextSpawnIn: this.spawnTimer
    };
  }

  private spawnHazard(context: HazardDirectorContext): void {
    const hazard = this.hazards[0];
    const laneIndex = Math.floor(Math.random() * ORBIT_LANES.length);
    const disallowedAngles: number[] = [];

    if (Math.abs(context.playerRadius - ORBIT_LANES[laneIndex]) <= 0.8) {
      disallowedAngles.push(context.playerAngle);
    }

    if (context.junkLaneIndex === laneIndex) {
      disallowedAngles.push(context.junkAngle);
    }

    hazard.start({
      laneIndex,
      angle: randomAngleAvoiding(disallowedAngles, HAZARD_SPAWN_MIN_SEPARATION)
    });

    this.spawnTimer = this.getNextInterval(context.score);
  }

  private getNextInterval(score: number): number {
    return Math.max(
      HAZARD_MIN_INTERVAL,
      HAZARD_BASE_INTERVAL - Math.min(score / 12, 3.8)
    );
  }

  private getActiveHazard(): HazardTelegraph | undefined {
    return this.hazards.find((hazard) => hazard.phase !== 'idle');
  }

  private getCurrentResult(hit: boolean): HazardDirectorResult {
    const hazard = this.getActiveHazard();

    return {
      hit,
      warning: hazard?.isWarning() ?? false,
      active: hazard?.isActive() ?? false
    };
  }
}
