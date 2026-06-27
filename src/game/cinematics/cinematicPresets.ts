import { CAMERA_FOV } from '../constants';
import type {
  CinematicCameraPose,
  CinematicContext,
  CinematicPresetKey,
  CinematicShot,
  VectorTuple
} from './CinematicShot';

const GAMEPLAY_CAMERA: CinematicCameraPose = {
  position: [0, 8, 10],
  lookAt: [0, 0, 0],
  fov: CAMERA_FOV
};

const CORE_FOCUS: VectorTuple = [0, 0, 0];

export function createCinematicShots(
  presetKey: CinematicPresetKey,
  context: CinematicContext
): CinematicShot[] {
  const focus = context.focus ?? CORE_FOCUS;
  const sectorName = context.sectorName ?? 'Orbit Janitor';
  const objectiveText = context.objectiveText ?? 'Clean the lanes';

  switch (presetKey) {
    case 'titleFlyIn':
      return [
        createShot({
          presetKey,
          title: 'Orbit Janitor',
          subtitle: 'Clean the lanes. Dodge the warnings. Keep the combo alive.',
          duration: 3.2,
          from: {
            position: [0, 13.2, 18],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 5
          },
          to: {
            position: [0, 8.3, 10.6],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV
          }
        })
      ];
    case 'sectorIntro':
      return [
        createShot({
          presetKey,
          title: sectorName,
          subtitle: objectiveText,
          duration: 1.65,
          from: {
            position: [7.2, 6.2, 8.8],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 2
          },
          to: {
            position: [-5.8, 7.4, 9.6],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 0.5
          }
        })
      ];
    case 'missionCompleteFlyBy':
      return [
        createShot({
          presetKey,
          title: 'Mission Complete',
          subtitle: `${sectorName} cleared`,
          duration: 2.5,
          from: {
            position: [5.6, 6.7, 7.4],
            lookAt: focus,
            fov: CAMERA_FOV - 1
          },
          to: {
            position: [-6.4, 6.1, 9.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 1.5
          }
        })
      ];
    case 'gameOverImpact':
      return [
        createShot({
          presetKey,
          title: 'Impact',
          subtitle: context.gameOverReason ?? 'Ship integrity lost',
          duration: 1.6,
          from: {
            position: [0.8, 6.4, 8.2],
            lookAt: focus,
            fov: CAMERA_FOV - 2
          },
          to: {
            position: [0, 7.5, 10.8],
            lookAt: focus,
            fov: CAMERA_FOV + 3
          },
          reducedMotionDuration: 0.65
        })
      ];
    case 'sectorUnlockReveal':
      return [
        createShot({
          presetKey,
          title: 'Sector Unlocked',
          subtitle: context.unlockedSectorName ?? 'New route available',
          duration: 2.2,
          from: {
            position: [-6.2, 6.5, 9.2],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 2
          },
          to: {
            position: [6.4, 7.1, 8.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV
          }
        })
      ];
    case 'eventWarningShot':
      return [
        createShot({
          presetKey,
          title: context.eventCallout ?? 'Event Incoming',
          subtitle: 'Read the lanes. Move early.',
          duration: 1.15,
          from: {
            position: [3.6, 7.1, 8.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 1.5
          },
          to: {
            position: [-3.6, 7.1, 8.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 1.5
          },
          reducedMotionDuration: 0.55
        })
      ];
  }
}

function createShot(
  shot: Omit<
    CinematicShot,
    'id' | 'easing' | 'reducedMotionDuration' | 'reducedMotionPose'
  > &
    Partial<Pick<CinematicShot, 'easing' | 'reducedMotionDuration' | 'reducedMotionPose'>>
): CinematicShot {
  return {
    id: `${shot.presetKey}-${shot.title}`,
    easing: shot.easing ?? 'smooth',
    reducedMotionDuration: shot.reducedMotionDuration ?? 0.75,
    reducedMotionPose: shot.reducedMotionPose ?? GAMEPLAY_CAMERA,
    ...shot
  };
}
