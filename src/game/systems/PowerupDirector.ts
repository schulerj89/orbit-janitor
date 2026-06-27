import {
  ORBIT_LANES,
  POWERUP_COLLISION_RADIUS,
  POWERUP_COMBO_LOCK_DURATION,
  POWERUP_LIFETIME_SECONDS,
  POWERUP_MAGNET_DURATION,
  POWERUP_OVERDRIVE_DURATION,
  POWERUP_SPAWN_MAX_SECONDS,
  POWERUP_SPAWN_MIN_SECONDS,
  POWERUP_TIME_DILATION_DURATION,
  POWERUP_TIME_DILATION_SCALE
} from '../constants';
import {
  Powerup,
  getPowerupName,
  getPowerupTypes,
  type PowerupType
} from '../entities/Powerup';
import { angularDistance, randomAngleAvoiding, type RandomSource } from '../math';
import type { LaneAngle } from '../entities/Junk';
import type { HazardDirectorDebugState } from './HazardDirector';
import type { SeededRandom } from './SeededRandom';

export interface PowerupDirectorContext {
  playerAngle: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  obstacles: LaneAngle[];
  hazard: HazardDirectorDebugState;
  rng: SeededRandom;
  canSpawn: boolean;
  spawnIntervalMultiplier?: number;
}

export interface ActivePowerupSnapshot {
  type: PowerupType;
  name: string;
  remaining: number;
}

export interface PowerupEffects {
  magnetSurge: boolean;
  timeDilationScale: number;
  overdrive: boolean;
  comboLock: boolean;
}

export interface PowerupDirectorResult {
  collected: PowerupType | null;
}

export interface PowerupDirectorDebugState {
  collectibleType: PowerupType | 'none';
  collectibleLaneIndex: number | null;
  collectibleAngle: number | null;
  collectibleLifetime: number;
  nextSpawnIn: number;
  activeEffects: ActivePowerupSnapshot[];
}

type TimedPowerupType = Exclude<PowerupType, 'shieldPickup' | 'scrapCache'>;

const TIMED_DURATIONS: Record<TimedPowerupType, number> = {
  magnetSurge: POWERUP_MAGNET_DURATION,
  timeDilation: POWERUP_TIME_DILATION_DURATION,
  overdrive: POWERUP_OVERDRIVE_DURATION,
  comboLock: POWERUP_COMBO_LOCK_DURATION
};

const POWERUP_SPAWN_MIN_SEPARATION = 1.0;

export class PowerupDirector {
  readonly powerup = new Powerup();
  readonly group = this.powerup.group;

  private spawnTimer = POWERUP_SPAWN_MIN_SECONDS;
  private collectibleLifetime = 0;
  private readonly activeTimers = new Map<TimedPowerupType, number>();

  update(delta: number, context: PowerupDirectorContext): PowerupDirectorResult {
    this.updateActiveTimers(delta);

    if (this.powerup.isVisible()) {
      this.powerup.update(delta);
      this.collectibleLifetime = Math.max(0, this.collectibleLifetime - delta);

      if (this.collidesWithPlayer(context)) {
        const collected = this.powerup.type;
        this.activate(collected);
        this.powerup.clear();
        this.collectibleLifetime = 0;
        this.spawnTimer = this.getNextSpawnTime(
          context.rng,
          context.spawnIntervalMultiplier
        );
        return { collected };
      }

      if (this.collectibleLifetime <= 0) {
        this.powerup.clear();
        this.spawnTimer = this.getNextSpawnTime(
          context.rng,
          context.spawnIntervalMultiplier
        );
      }

      return { collected: null };
    }

    if (!context.canSpawn) {
      return { collected: null };
    }

    this.spawnTimer = Math.max(
      0,
      this.spawnTimer - delta / Math.max(0.35, context.spawnIntervalMultiplier ?? 1)
    );

    if (this.spawnTimer <= 0) {
      this.spawn(context);
    }

    return { collected: null };
  }

  reset(rng?: RandomSource): void {
    this.powerup.clear();
    this.collectibleLifetime = 0;
    this.activeTimers.clear();
    this.spawnTimer = rng ? this.getNextSpawnTime(rng) : POWERUP_SPAWN_MIN_SECONDS;
  }

  forcePowerup(type: PowerupType, laneIndex: number, angle: number): void {
    this.powerup.spawn(type, laneIndex, angle);
    this.collectibleLifetime = POWERUP_LIFETIME_SECONDS;
    this.spawnTimer = POWERUP_SPAWN_MIN_SECONDS;
  }

  getEffects(): PowerupEffects {
    return {
      magnetSurge: this.isActive('magnetSurge'),
      timeDilationScale: this.isActive('timeDilation') ? POWERUP_TIME_DILATION_SCALE : 1,
      overdrive: this.isActive('overdrive'),
      comboLock: this.isActive('comboLock')
    };
  }

  getActivePowerups(): ActivePowerupSnapshot[] {
    return [...this.activeTimers.entries()].map(([type, remaining]) => ({
      type,
      name: getPowerupName(type),
      remaining
    }));
  }

  getDebugState(): PowerupDirectorDebugState {
    return {
      collectibleType: this.powerup.isVisible() ? this.powerup.type : 'none',
      collectibleLaneIndex: this.powerup.isVisible() ? this.powerup.laneIndex : null,
      collectibleAngle: this.powerup.isVisible() ? this.powerup.angle : null,
      collectibleLifetime: this.collectibleLifetime,
      nextSpawnIn: this.spawnTimer,
      activeEffects: this.getActivePowerups()
    };
  }

  private updateActiveTimers(delta: number): void {
    for (const [type, remaining] of this.activeTimers.entries()) {
      const nextRemaining = remaining - delta;

      if (nextRemaining <= 0) {
        this.activeTimers.delete(type);
      } else {
        this.activeTimers.set(type, nextRemaining);
      }
    }
  }

  private activate(type: PowerupType): void {
    if (type === 'shieldPickup' || type === 'scrapCache') {
      return;
    }

    this.activeTimers.set(type, TIMED_DURATIONS[type]);
  }

  private isActive(type: TimedPowerupType): boolean {
    return (this.activeTimers.get(type) ?? 0) > 0;
  }

  private spawn(context: PowerupDirectorContext): void {
    const type = context.rng.pick([...getPowerupTypes()]);
    const { laneIndex, angle } = this.pickSpawnLocation(context);

    this.powerup.spawn(type, laneIndex, angle);
    this.collectibleLifetime = POWERUP_LIFETIME_SECONDS;
  }

  private pickSpawnLocation(context: PowerupDirectorContext): LaneAngle {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const laneIndex = context.rng.int(0, ORBIT_LANES.length - 1);
      const angle = randomAngleAvoiding(
        getDisallowedAngles(context, laneIndex),
        POWERUP_SPAWN_MIN_SEPARATION,
        context.rng
      );

      if (isAwayFromPlayer(context, laneIndex, angle)) {
        return { laneIndex, angle };
      }
    }

    const laneIndex =
      (getNearestLaneIndex(context.playerRadius) + 1) % ORBIT_LANES.length;
    return {
      laneIndex,
      angle: randomAngleAvoiding(
        getDisallowedAngles(context, laneIndex),
        POWERUP_SPAWN_MIN_SEPARATION,
        context.rng
      )
    };
  }

  private collidesWithPlayer(context: PowerupDirectorContext): boolean {
    if (!this.powerup.isVisible()) {
      return false;
    }

    const laneRadius = ORBIT_LANES[this.powerup.laneIndex];
    const angularTolerance = POWERUP_COLLISION_RADIUS / laneRadius + 0.05;

    return (
      Math.abs(context.playerRadius - laneRadius) <= POWERUP_COLLISION_RADIUS &&
      angularDistance(context.playerAngle, this.powerup.angle) <= angularTolerance
    );
  }

  private getNextSpawnTime(rng: RandomSource, multiplier = 1): number {
    const safeMultiplier = Math.max(0.35, multiplier);

    return (
      (POWERUP_SPAWN_MIN_SECONDS +
        rng.next() * (POWERUP_SPAWN_MAX_SECONDS - POWERUP_SPAWN_MIN_SECONDS)) *
      safeMultiplier
    );
  }
}

function getNearestLaneIndex(radius: number): number {
  return ORBIT_LANES.reduce(
    (bestIndex, laneRadius, laneIndex) =>
      Math.abs(radius - laneRadius) < Math.abs(radius - ORBIT_LANES[bestIndex])
        ? laneIndex
        : bestIndex,
    0
  );
}

function getDisallowedAngles(
  context: PowerupDirectorContext,
  laneIndex: number
): number[] {
  const disallowedAngles: number[] = [];

  if (Math.abs(context.playerRadius - ORBIT_LANES[laneIndex]) <= 0.8) {
    disallowedAngles.push(context.playerAngle);
  }

  if (context.junkLaneIndex === laneIndex) {
    disallowedAngles.push(context.junkAngle);
  }

  for (const obstacle of context.obstacles) {
    if (obstacle.laneIndex === laneIndex) {
      disallowedAngles.push(obstacle.angle);
    }
  }

  if (context.hazard.angle !== null && context.hazard.laneIndices.includes(laneIndex)) {
    disallowedAngles.push(context.hazard.angle);
  }

  return disallowedAngles;
}

function isAwayFromPlayer(
  context: PowerupDirectorContext,
  laneIndex: number,
  angle: number
): boolean {
  if (Math.abs(context.playerRadius - ORBIT_LANES[laneIndex]) > 0.8) {
    return true;
  }

  return angularDistance(context.playerAngle, angle) >= POWERUP_SPAWN_MIN_SEPARATION;
}
