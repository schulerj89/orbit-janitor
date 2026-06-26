import * as THREE from 'three/webgpu';
import {
  HAZARD_BASE_INTERVAL,
  HAZARD_FIRST_SPAWN_TIME,
  HAZARD_MIN_INTERVAL
} from '../constants';
import { PlanetPulseHazard } from '../entities/PlanetPulseHazard';
import {
  DebrisShowerHazard,
  DoubleLaneArcHazard,
  GateHazard,
  LaneArcHazard,
  PulseMineHazard,
  SweeperHazard,
  type HazardPattern,
  type HazardPatternType
} from './HazardTypes';

export interface HazardDirectorContext {
  score: number;
  runTime: number;
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
  completed: boolean;
}

export interface HazardDirectorDebugState {
  type: HazardPatternType | 'none';
  phase: string;
  laneIndex: number | null;
  laneIndices: number[];
  angle: number | null;
  nextSpawnIn: number;
}

export class HazardDirector {
  readonly group = new THREE.Group();

  private readonly hazards: HazardPattern[] = [
    new LaneArcHazard(),
    new DoubleLaneArcHazard(),
    new PulseMineHazard(),
    new SweeperHazard(),
    new GateHazard(),
    new DebrisShowerHazard()
  ];
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
        activeHazard.collidesWith(context.playerAngle, context.playerRadius),
        result.completed
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
    const hazardDebug = hazard?.getDebugState();

    return {
      type: hazard?.type ?? 'none',
      phase: hazard?.phase ?? 'idle',
      laneIndex: hazardDebug?.laneIndex ?? null,
      laneIndices: hazardDebug?.laneIndices ?? [],
      angle: hazardDebug?.angle ?? null,
      nextSpawnIn: this.spawnTimer
    };
  }

  private spawnHazard(context: HazardDirectorContext): void {
    const hazard = this.pickHazard(context);
    hazard.start(context);

    this.spawnTimer = this.getNextInterval(context.score);
  }

  private getNextInterval(score: number): number {
    return Math.max(
      HAZARD_MIN_INTERVAL,
      HAZARD_BASE_INTERVAL - Math.min(score / 12, 3.8)
    );
  }

  private getActiveHazard(): HazardPattern | undefined {
    return this.hazards.find((hazard) => hazard.phase !== 'idle');
  }

  private pickHazard(context: HazardDirectorContext): HazardPattern {
    const availableHazards = this.getAvailableHazards(context);
    const hazardIndex = Math.floor(Math.random() * availableHazards.length);

    return availableHazards[hazardIndex];
  }

  private getAvailableHazards(context: HazardDirectorContext): HazardPattern[] {
    const hazards = [this.getHazardByType('laneArc')];

    if (context.score >= 10 || context.runTime >= 30) {
      hazards.push(
        this.getHazardByType('doubleLaneArc'),
        this.getHazardByType('pulseMine')
      );
    }

    if (context.score >= 20 || context.runTime >= 55) {
      hazards.push(this.getHazardByType('sweeper'), this.getHazardByType('gate'));
    }

    if (context.score >= 30 || context.runTime >= 75) {
      hazards.push(this.getHazardByType('debrisShower'));
    }

    return hazards;
  }

  private getHazardByType(type: HazardPatternType): HazardPattern {
    const hazard = this.hazards.find((candidate) => candidate.type === type);

    if (!hazard) {
      throw new Error(`Missing hazard pattern: ${type}`);
    }

    return hazard;
  }

  private getCurrentResult(hit: boolean, completed = false): HazardDirectorResult {
    const hazard = this.getActiveHazard();

    return {
      hit,
      warning: hazard?.isWarning() ?? false,
      active: hazard?.isActive() ?? false,
      completed
    };
  }
}
