import * as THREE from 'three/webgpu';
import { CometPass } from '../entities/CometPass';
import { EventTelegraph } from '../entities/EventTelegraph';
import { ORBIT_LANES } from '../constants';
import type { HazardPatternType } from './HazardTypes';
import type { HazardDirectorDebugState } from './HazardDirector';
import type { MissionObjectiveSnapshot } from './MissionDirector';
import type { RunStatsSnapshot } from './RunStats';
import type { SectorConfig } from './SectorConfig';
import type { SectorTheme } from './SectorTheme';
import type { SeededRandom } from './SeededRandom';

export type EventWaveType =
  | 'debrisStorm'
  | 'satelliteNet'
  | 'solarFlare'
  | 'cometPass'
  | 'cleanupFrenzy';

export type EventWavePhase = 'idle' | 'warning' | 'active';

export interface SatelliteNetEffect {
  safeLaneIndex: number;
  centerAngle: number;
}

export interface EventWaveEffects {
  regularHazardIntensityMultiplier: number;
  hazardIntervalMultiplier: number;
  hazardTelegraphMultiplier: number;
  hazardActiveMultiplier: number;
  hazardSpeedMultiplier: number;
  comboWindowBonus: number;
  cleanupFrenzy: boolean;
  satelliteNet: SatelliteNetEffect | null;
  dangerIntensity: number;
}

export interface EventWaveSnapshot {
  type: EventWaveType | 'none';
  phase: EventWavePhase;
  name: string;
  callout: string;
  countdown: number;
  timeRemaining: number;
}

export interface EventWaveDebugState extends EventWaveSnapshot {
  nextEventIn: number;
  safeLaneIndex: number | null;
}

export interface EventWaveDirectorContext {
  sector: SectorConfig;
  objective: MissionObjectiveSnapshot;
  stats: RunStatsSnapshot;
  playerAngle: number;
  playerRadius: number;
  rng: SeededRandom;
  hazard: HazardDirectorDebugState;
  canStart: boolean;
}

export interface EventWaveDirectorResult {
  started: boolean;
  activated: boolean;
  completed: boolean;
  forcedHazardType: HazardPatternType | null;
}

const EVENT_WARNING_SECONDS = 2;
const ENDLESS_EVENT_MIN_INTERVAL = 120;
const ENDLESS_EVENT_MAX_INTERVAL = 180;
const NON_TUTORIAL_EVENT_PROGRESS = 0.68;
const NON_TUTORIAL_EVENT_MIN_TIME = 12;

const EVENT_DURATIONS: Record<EventWaveType, number> = {
  debrisStorm: 14,
  satelliteNet: 13,
  solarFlare: 13,
  cometPass: 15,
  cleanupFrenzy: 14
};

const EVENT_NAMES: Record<EventWaveType, string> = {
  debrisStorm: 'Debris Storm',
  satelliteNet: 'Satellite Net',
  solarFlare: 'Solar Flare',
  cometPass: 'Comet Pass',
  cleanupFrenzy: 'Cleanup Frenzy'
};

const EVENT_CALLOUTS: Record<EventWaveType, string> = {
  debrisStorm: 'DEBRIS STORM',
  satelliteNet: 'SATELLITE NET',
  solarFlare: 'SOLAR FLARE INCOMING',
  cometPass: 'COMET WAKE',
  cleanupFrenzy: 'CLEANUP FRENZY'
};

export class EventWaveDirector {
  readonly group = new THREE.Group();

  private readonly telegraph = new EventTelegraph();
  private readonly comet = new CometPass();
  private phase: EventWavePhase = 'idle';
  private activeType: EventWaveType | null = null;
  private warningRemaining = 0;
  private activeRemaining = 0;
  private activeElapsed = 0;
  private hazardActionTimer = 0;
  private hazardStep = 0;
  private hasTriggeredRunEvent = false;
  private nextEndlessEventAt = ENDLESS_EVENT_MIN_INTERVAL;
  private lastRunTime = 0;
  private safeLaneIndex: number | null = null;
  private startAngle = 0;

  constructor() {
    this.group.add(this.telegraph.group, this.comet.group);
  }

  reset(rng?: SeededRandom): void {
    this.phase = 'idle';
    this.activeType = null;
    this.warningRemaining = 0;
    this.activeRemaining = 0;
    this.activeElapsed = 0;
    this.hazardActionTimer = 0;
    this.hazardStep = 0;
    this.hasTriggeredRunEvent = false;
    this.lastRunTime = 0;
    this.nextEndlessEventAt = rng
      ? rng.range(ENDLESS_EVENT_MIN_INTERVAL, ENDLESS_EVENT_MAX_INTERVAL)
      : ENDLESS_EVENT_MIN_INTERVAL;
    this.safeLaneIndex = null;
    this.startAngle = 0;
    this.telegraph.clear();
    this.comet.clear();
  }

  update(delta: number, context: EventWaveDirectorContext): EventWaveDirectorResult {
    this.telegraph.update(delta);
    this.comet.update(delta);
    this.lastRunTime = context.stats.runTime;

    if (this.phase === 'warning') {
      return this.updateWarning(delta);
    }

    if (this.phase === 'active') {
      return this.updateActive(delta, context);
    }

    if (this.shouldStartEvent(context)) {
      this.startEvent(this.pickEventType(context), context);
      return {
        started: true,
        activated: false,
        completed: false,
        forcedHazardType: null
      };
    }

    return {
      started: false,
      activated: false,
      completed: false,
      forcedHazardType: null
    };
  }

  getEffects(): EventWaveEffects {
    if (!this.activeType) {
      return createDefaultEffects();
    }

    if (this.phase === 'warning') {
      return {
        ...createDefaultEffects(),
        regularHazardIntensityMultiplier: 0,
        hazardIntervalMultiplier: 1.35,
        hazardTelegraphMultiplier: 1.35,
        dangerIntensity: 0.55
      };
    }

    if (this.activeType === 'cleanupFrenzy') {
      return {
        ...createDefaultEffects(),
        regularHazardIntensityMultiplier: 0.55,
        hazardIntervalMultiplier: 1.28,
        hazardTelegraphMultiplier: 1.2,
        comboWindowBonus: 1.6,
        cleanupFrenzy: true,
        dangerIntensity: 0.25
      };
    }

    if (this.activeType === 'satelliteNet') {
      return {
        ...createDefaultEffects(),
        regularHazardIntensityMultiplier: 0,
        hazardTelegraphMultiplier: 1.3,
        satelliteNet:
          this.safeLaneIndex === null
            ? null
            : {
                safeLaneIndex: this.safeLaneIndex,
                centerAngle: this.getFormationCenterAngle()
              },
        dangerIntensity: 0.72
      };
    }

    if (this.activeType === 'solarFlare') {
      return {
        ...createDefaultEffects(),
        regularHazardIntensityMultiplier: 0,
        hazardTelegraphMultiplier: 1.55,
        hazardActiveMultiplier: 0.95,
        dangerIntensity: 0.86
      };
    }

    return {
      ...createDefaultEffects(),
      regularHazardIntensityMultiplier: 0,
      hazardTelegraphMultiplier: 1.3,
      hazardSpeedMultiplier: this.activeType === 'cometPass' ? 1.12 : 1,
      dangerIntensity: this.activeType === 'cometPass' ? 0.9 : 0.78
    };
  }

  getSnapshot(): EventWaveSnapshot {
    if (!this.activeType) {
      return {
        type: 'none',
        phase: 'idle',
        name: '',
        callout: '',
        countdown: 0,
        timeRemaining: 0
      };
    }

    return {
      type: this.activeType,
      phase: this.phase,
      name: EVENT_NAMES[this.activeType],
      callout: getCallout(this.activeType, this.phase),
      countdown: this.phase === 'warning' ? this.warningRemaining : 0,
      timeRemaining:
        this.phase === 'active' ? this.activeRemaining : this.warningRemaining
    };
  }

  getDebugState(): EventWaveDebugState {
    return {
      ...this.getSnapshot(),
      nextEventIn: this.getNextEventIn(),
      safeLaneIndex: this.safeLaneIndex
    };
  }

  applyTheme(theme: SectorTheme): void {
    this.telegraph.applyTheme(theme);
    this.comet.applyTheme(theme);
  }

  private updateWarning(delta: number): EventWaveDirectorResult {
    this.warningRemaining = Math.max(0, this.warningRemaining - delta);

    if (this.warningRemaining > 0 || !this.activeType) {
      return {
        started: false,
        activated: false,
        completed: false,
        forcedHazardType: null
      };
    }

    this.phase = 'active';
    this.activeRemaining = EVENT_DURATIONS[this.activeType];
    this.activeElapsed = 0;
    this.hazardActionTimer = 0;
    this.hazardStep = 0;
    this.telegraph.setPhase('active');

    if (this.activeType === 'cometPass') {
      this.comet.start(this.activeRemaining);
    }

    return {
      started: false,
      activated: true,
      completed: false,
      forcedHazardType: null
    };
  }

  private updateActive(
    delta: number,
    context: EventWaveDirectorContext
  ): EventWaveDirectorResult {
    this.activeRemaining = Math.max(0, this.activeRemaining - delta);
    this.activeElapsed += delta;
    this.hazardActionTimer = Math.max(0, this.hazardActionTimer - delta);

    if (this.activeRemaining <= 0) {
      this.completeEvent(context);
      return {
        started: false,
        activated: false,
        completed: true,
        forcedHazardType: null
      };
    }

    return {
      started: false,
      activated: false,
      completed: false,
      forcedHazardType: this.getForcedHazardType(context)
    };
  }

  private shouldStartEvent(context: EventWaveDirectorContext): boolean {
    if (!context.canStart || context.sector.isTutorial || this.phase !== 'idle') {
      return false;
    }

    if (this.getAllowedEventTypes(context).length === 0) {
      return false;
    }

    if (context.sector.isEndless) {
      return context.stats.runTime >= this.nextEndlessEventAt;
    }

    return (
      !this.hasTriggeredRunEvent &&
      context.stats.runTime >= NON_TUTORIAL_EVENT_MIN_TIME &&
      context.objective.progress >= NON_TUTORIAL_EVENT_PROGRESS
    );
  }

  private startEvent(type: EventWaveType, context: EventWaveDirectorContext): void {
    this.phase = 'warning';
    this.activeType = type;
    this.warningRemaining = EVENT_WARNING_SECONDS;
    this.activeRemaining = 0;
    this.activeElapsed = 0;
    this.hazardActionTimer = 0;
    this.hazardStep = 0;
    this.hasTriggeredRunEvent = !context.sector.isEndless;
    this.safeLaneIndex =
      type === 'satelliteNet' || type === 'cleanupFrenzy'
        ? getNearestLaneIndex(context.playerRadius)
        : null;
    this.startAngle =
      type === 'satelliteNet'
        ? context.playerAngle + Math.PI * 0.82
        : context.rng.range(0, Math.PI * 2);
    this.telegraph.show(type, 'warning', this.safeLaneIndex);
  }

  private completeEvent(context: EventWaveDirectorContext): void {
    if (context.sector.isEndless) {
      this.nextEndlessEventAt =
        context.stats.runTime +
        context.rng.range(ENDLESS_EVENT_MIN_INTERVAL, ENDLESS_EVENT_MAX_INTERVAL);
    }

    this.phase = 'idle';
    this.activeType = null;
    this.warningRemaining = 0;
    this.activeRemaining = 0;
    this.activeElapsed = 0;
    this.hazardActionTimer = 0;
    this.safeLaneIndex = null;
    this.telegraph.clear();
    this.comet.clear();
  }

  private getForcedHazardType(
    context: EventWaveDirectorContext
  ): HazardPatternType | null {
    if (
      !this.activeType ||
      context.hazard.type !== 'none' ||
      this.hazardActionTimer > 0
    ) {
      return null;
    }

    if (this.activeType === 'debrisStorm') {
      this.hazardActionTimer = 2.65;
      return 'debrisShower';
    }

    if (this.activeType === 'solarFlare') {
      this.hazardActionTimer = 2.45;
      this.hazardStep += 1;
      return this.hazardStep % 2 === 0 ? 'doubleLaneArc' : 'laneArc';
    }

    if (this.activeType === 'cometPass') {
      this.hazardActionTimer = 3.15;
      return 'debrisShower';
    }

    return null;
  }

  private pickEventType(context: EventWaveDirectorContext): EventWaveType {
    return context.rng.pick([...this.getAllowedEventTypes(context)]);
  }

  private getAllowedEventTypes(
    context: EventWaveDirectorContext
  ): readonly EventWaveType[] {
    return context.sector.eventWaveTypes;
  }

  private getFormationCenterAngle(): number {
    return this.startAngle + this.activeElapsed * 0.38;
  }

  private getNextEventIn(): number {
    if (this.phase !== 'idle') {
      return 0;
    }

    return Math.max(0, this.nextEndlessEventAt - this.lastRunTime);
  }
}

function createDefaultEffects(): EventWaveEffects {
  return {
    regularHazardIntensityMultiplier: 1,
    hazardIntervalMultiplier: 1,
    hazardTelegraphMultiplier: 1,
    hazardActiveMultiplier: 1,
    hazardSpeedMultiplier: 1,
    comboWindowBonus: 0,
    cleanupFrenzy: false,
    satelliteNet: null,
    dangerIntensity: 0
  };
}

function getCallout(type: EventWaveType, phase: EventWavePhase): string {
  if (phase === 'warning') {
    return EVENT_CALLOUTS[type];
  }

  if (type === 'solarFlare') {
    return 'SOLAR FLARE';
  }

  if (type === 'cometPass') {
    return 'COMET WAKE';
  }

  return EVENT_CALLOUTS[type];
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
