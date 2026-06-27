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
  const dailySeed = context.dailySeed ?? 'Daily Challenge';

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
    case 'officialTitleReveal':
      return [
        createShot({
          presetKey,
          title: 'Orbit Janitor',
          subtitle: 'Cleanup contract accepted',
          duration: 3.7,
          from: {
            position: [-9.4, 7.8, 13.6],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 6
          },
          to: {
            position: [3.8, 8.4, 10.8],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV - 0.5
          },
          easing: 'easeInOut',
          reducedMotionDuration: 0.85,
          reducedMotionPose: {
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
    case 'sectorWorldReveal':
      return [
        createShot({
          presetKey,
          title: sectorName,
          subtitle: objectiveText,
          duration: 2.4,
          from: {
            position: [8.6, 5.9, 8.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 2
          },
          to: {
            position: [-6.2, 7.7, 9.2],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 0.5
          },
          easing: 'easeInOut',
          reducedMotionDuration: 0.75
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
    case 'shipUnlockReveal':
      return [
        createShot({
          presetKey,
          title: 'Ship Unlocked',
          subtitle: context.unlockedShipName ?? 'New hull available in Shipyard',
          duration: 2.15,
          from: {
            position: offset(focus, [-1.2, 2.4, 4.2]),
            lookAt: focus,
            fov: CAMERA_FOV - 4
          },
          to: {
            position: offset(focus, [2.6, 2.0, 4.7]),
            lookAt: focus,
            fov: CAMERA_FOV - 2
          },
          easing: 'easeOut',
          reducedMotionDuration: 0.7,
          reducedMotionPose: {
            position: offset(focus, [0, 2.2, 4.6]),
            lookAt: focus,
            fov: CAMERA_FOV - 3
          }
        })
      ];
    case 'medalCeremony':
      return [
        createShot({
          presetKey,
          title: context.medalText ?? 'Medal Earned',
          subtitle: `${sectorName} performance logged`,
          duration: 2.05,
          from: {
            position: offset(focus, [1.6, 2.8, 4.1]),
            lookAt: focus,
            fov: CAMERA_FOV - 4.5
          },
          to: {
            position: offset(focus, [-1.8, 2.5, 4.6]),
            lookAt: focus,
            fov: CAMERA_FOV - 2.5
          },
          easing: 'easeOut',
          reducedMotionDuration: 0.7,
          reducedMotionPose: {
            position: offset(focus, [0, 2.7, 4.4]),
            lookAt: focus,
            fov: CAMERA_FOV - 3
          }
        })
      ];
    case 'dailyChallengeLaunch':
      return [
        createShot({
          presetKey,
          title: 'Daily Challenge',
          subtitle: `Seed ${dailySeed}`,
          duration: 2.45,
          from: {
            position: [-7.6, 6.8, 9.4],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 3
          },
          to: {
            position: [6.4, 7.4, 8.6],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV
          },
          easing: 'easeInOut',
          reducedMotionDuration: 0.75
        })
      ];
    case 'endlessWarning':
      return [
        createShot({
          presetKey,
          title: 'Endless Cleanup',
          subtitle: 'No finish line. Keep the lanes alive.',
          duration: 2.35,
          from: {
            position: [0, 10.2, 12.8],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 5
          },
          to: {
            position: [-4.8, 7.6, 10.2],
            lookAt: CORE_FOCUS,
            fov: CAMERA_FOV + 1
          },
          easing: 'easeInOut',
          reducedMotionDuration: 0.8
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

function offset(focus: VectorTuple, values: VectorTuple): VectorTuple {
  return [focus[0] + values[0], focus[1] + values[1], focus[2] + values[2]];
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
