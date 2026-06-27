export type EventWaveType =
  | 'debrisStorm'
  | 'satelliteNet'
  | 'solarFlare'
  | 'cometPass'
  | 'cleanupFrenzy';

export type EventWavePhase = 'idle' | 'warning' | 'active';

export interface EventWaveDefinition {
  type: EventWaveType;
  name: string;
  warningCallout: string;
  activeCallout: string;
  instruction: string;
  durationSeconds: number;
}

export const EVENT_WAVE_WARNING_SECONDS = 2;
export const ENDLESS_EVENT_MIN_INTERVAL = 120;
export const ENDLESS_EVENT_MAX_INTERVAL = 180;
export const NON_TUTORIAL_EVENT_PROGRESS = 0.68;
export const NON_TUTORIAL_EVENT_MIN_TIME = 12;

export const EVENT_WAVE_DEFINITIONS: Record<EventWaveType, EventWaveDefinition> = {
  debrisStorm: {
    type: 'debrisStorm',
    name: 'Debris Storm',
    warningCallout: 'DEBRIS STORM',
    activeCallout: 'DEBRIS STORM',
    instruction: 'Debris crossing',
    durationSeconds: 14
  },
  satelliteNet: {
    type: 'satelliteNet',
    name: 'Satellite Net',
    warningCallout: 'SATELLITE NET',
    activeCallout: 'SATELLITE NET',
    instruction: 'Find the safe lane',
    durationSeconds: 13
  },
  solarFlare: {
    type: 'solarFlare',
    name: 'Solar Flare',
    warningCallout: 'SOLAR FLARE INCOMING',
    activeCallout: 'SOLAR FLARE',
    instruction: 'Time the pulses',
    durationSeconds: 13
  },
  cometPass: {
    type: 'cometPass',
    name: 'Comet Pass',
    warningCallout: 'COMET WAKE',
    activeCallout: 'COMET WAKE',
    instruction: 'Debris crossing',
    durationSeconds: 15
  },
  cleanupFrenzy: {
    type: 'cleanupFrenzy',
    name: 'Cleanup Frenzy',
    warningCallout: 'CLEANUP FRENZY',
    activeCallout: 'CLEANUP FRENZY',
    instruction: 'Cleanup frenzy',
    durationSeconds: 14
  }
};

export function getEventWaveDefinition(type: EventWaveType): EventWaveDefinition {
  return EVENT_WAVE_DEFINITIONS[type];
}

export function getEventWaveCallout(type: EventWaveType, phase: EventWavePhase): string {
  const definition = getEventWaveDefinition(type);

  return phase === 'warning' ? definition.warningCallout : definition.activeCallout;
}
