import type { DeviceExperienceMode } from './SettingsSystem';

export type RecommendedExperience = 'desktop' | 'tablet' | 'phone';

export interface DeviceProfileSnapshot {
  isSmallViewport: boolean;
  isPortrait: boolean;
  isCoarsePointer: boolean;
  hasFinePointer: boolean;
  hasTouch: boolean;
  recommendedExperience: RecommendedExperience;
  shouldShowDeviceGate: boolean;
  isDismissed: boolean;
  isSkipRequested: boolean;
}

const DEVICE_GATE_DISMISSED_KEY = 'orbit-janitor.deviceGateDismissed';
const SMALL_VIEWPORT_WIDTH = 760;
const SMALL_VIEWPORT_MIN_EDGE = 540;
const PHONE_MAX_EDGE = 900;

export class DeviceProfile {
  getSnapshot(deviceExperienceMode: DeviceExperienceMode): DeviceProfileSnapshot {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const minEdge = Math.min(width, height);
    const maxEdge = Math.max(width, height);
    const isSmallViewport =
      width <= SMALL_VIEWPORT_WIDTH || minEdge <= SMALL_VIEWPORT_MIN_EDGE;
    const isPortrait = height > width;
    const isCoarsePointer = matchesMedia('(pointer: coarse)');
    const hasPrimaryFinePointer = matchesMedia('(pointer: fine)');
    const hasAnyFinePointer = matchesMedia('(any-pointer: fine)');
    const hasFinePointer = hasPrimaryFinePointer || hasAnyFinePointer;
    const hasTouch =
      isCoarsePointer ||
      matchesMedia('(hover: none)') ||
      navigator.maxTouchPoints > 0 ||
      'ontouchstart' in window;
    const recommendedExperience = getRecommendedExperience({
      isSmallViewport,
      isPortrait,
      isCoarsePointer,
      hasFinePointer,
      hasTouch,
      minEdge,
      maxEdge
    });
    const isDismissed = readDismissed();
    const isSkipRequested = readSkipQuery();
    const shouldShowDeviceGate =
      deviceExperienceMode === 'auto' &&
      !isDismissed &&
      !isSkipRequested &&
      recommendedExperience !== 'desktop';

    return {
      isSmallViewport,
      isPortrait,
      isCoarsePointer,
      hasFinePointer,
      hasTouch,
      recommendedExperience,
      shouldShowDeviceGate,
      isDismissed,
      isSkipRequested
    };
  }

  dismissPermanently(): void {
    try {
      window.localStorage.setItem(DEVICE_GATE_DISMISSED_KEY, 'true');
    } catch {
      // Device gate dismissal should never block title entry.
    }
  }
}

function getRecommendedExperience(context: {
  isSmallViewport: boolean;
  isPortrait: boolean;
  isCoarsePointer: boolean;
  hasFinePointer: boolean;
  hasTouch: boolean;
  minEdge: number;
  maxEdge: number;
}): RecommendedExperience {
  if (
    (context.isSmallViewport && context.isPortrait) ||
    (context.hasTouch && !context.hasFinePointer && context.maxEdge <= PHONE_MAX_EDGE) ||
    (context.isCoarsePointer &&
      !context.hasFinePointer &&
      context.minEdge <= SMALL_VIEWPORT_MIN_EDGE)
  ) {
    return 'phone';
  }

  if (
    (context.isCoarsePointer || context.hasTouch || context.isSmallViewport) &&
    !context.hasFinePointer
  ) {
    return 'tablet';
  }

  return 'desktop';
}

function matchesMedia(query: string): boolean {
  return window.matchMedia?.(query).matches ?? false;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DEVICE_GATE_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function readSkipQuery(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('skipDeviceGate');

    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}
