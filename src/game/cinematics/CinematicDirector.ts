import * as THREE from 'three/webgpu';
import {
  type CinematicCameraOverride,
  type CinematicContext,
  type CinematicPresetKey,
  type CinematicShot,
  type CinematicSnapshot,
  type VectorTuple
} from './CinematicShot';
import { createCinematicShots } from './cinematicPresets';

interface CinematicPlayback {
  presetKey: CinematicPresetKey;
  context: CinematicContext;
  shots: CinematicShot[];
}

const EMPTY_SNAPSHOT: CinematicSnapshot = {
  isActive: false,
  presetKey: null,
  title: '',
  subtitle: '',
  progress: 0,
  skipLabel: '',
  reducedMotion: false
};

export class CinematicDirector {
  private readonly queue: CinematicPlayback[] = [];
  private readonly cameraPosition = new THREE.Vector3();
  private readonly cameraLookAt = new THREE.Vector3();
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromLookAt = new THREE.Vector3();
  private readonly toLookAt = new THREE.Vector3();
  private activePlayback: CinematicPlayback | null = null;
  private activeShot: CinematicShot | null = null;
  private shotIndex = 0;
  private elapsed = 0;
  private reducedMotion = false;

  play(presetKey: CinematicPresetKey, context: CinematicContext): void {
    this.queue.length = 0;
    this.startPlayback({
      presetKey,
      context,
      shots: createCinematicShots(presetKey, context)
    });
  }

  queuePreset(presetKey: CinematicPresetKey, context: CinematicContext): void {
    const playback = {
      presetKey,
      context,
      shots: createCinematicShots(presetKey, context)
    };

    if (!this.activeShot) {
      this.startPlayback(playback);
      return;
    }

    this.queue.push(playback);
  }

  skip(): void {
    this.queue.length = 0;
    this.activePlayback = null;
    this.activeShot = null;
    this.elapsed = 0;
    this.shotIndex = 0;
  }

  update(delta: number): void {
    if (!this.activeShot) {
      return;
    }

    this.elapsed += delta;

    if (this.elapsed >= this.getShotDuration(this.activeShot)) {
      this.advanceShot();
    }
  }

  isActive(): boolean {
    return this.activeShot !== null;
  }

  getCameraOverride(): CinematicCameraOverride | null {
    const shot = this.activeShot;

    if (!shot) {
      return null;
    }

    if (this.reducedMotion) {
      const pose = shot.reducedMotionPose ?? shot.to;
      setVector(this.cameraPosition, pose.position);
      setVector(this.cameraLookAt, pose.lookAt);

      return {
        position: this.cameraPosition,
        lookAt: this.cameraLookAt,
        fov: pose.fov
      };
    }

    const duration = this.getShotDuration(shot);
    const progress = duration > 0 ? Math.min(1, this.elapsed / duration) : 1;
    const easedProgress = ease(progress, shot.easing);

    this.cameraPosition.lerpVectors(this.fromPosition, this.toPosition, easedProgress);
    this.cameraLookAt.lerpVectors(this.fromLookAt, this.toLookAt, easedProgress);

    return {
      position: this.cameraPosition,
      lookAt: this.cameraLookAt,
      fov: lerp(shot.from.fov, shot.to.fov, easedProgress)
    };
  }

  getSnapshot(): CinematicSnapshot {
    const shot = this.activeShot;

    if (!shot) {
      return EMPTY_SNAPSHOT;
    }

    const duration = this.getShotDuration(shot);

    return {
      isActive: true,
      presetKey: shot.presetKey,
      title: shot.title,
      subtitle: shot.subtitle,
      progress: duration > 0 ? Math.min(1, this.elapsed / duration) : 1,
      skipLabel: 'Space / Enter / Esc skip',
      reducedMotion: this.reducedMotion
    };
  }

  private startPlayback(playback: CinematicPlayback): void {
    this.activePlayback = playback;
    this.shotIndex = 0;
    this.startShot(playback.shots[0] ?? null, playback.context);
  }

  private startShot(shot: CinematicShot | null, context: CinematicContext): void {
    this.activeShot = shot;
    this.elapsed = 0;
    this.reducedMotion = context.reducedMotion;

    if (!shot) {
      this.advancePlayback();
      return;
    }

    setVector(this.fromPosition, shot.from.position);
    setVector(this.toPosition, shot.to.position);
    setVector(this.fromLookAt, shot.from.lookAt);
    setVector(this.toLookAt, shot.to.lookAt);
  }

  private advanceShot(): void {
    const playback = this.activePlayback;

    if (!playback) {
      this.skip();
      return;
    }

    this.shotIndex += 1;
    const nextShot = playback.shots[this.shotIndex] ?? null;

    if (nextShot) {
      this.startShot(nextShot, playback.context);
      return;
    }

    this.advancePlayback();
  }

  private advancePlayback(): void {
    const nextPlayback = this.queue.shift();

    if (nextPlayback) {
      this.startPlayback(nextPlayback);
      return;
    }

    this.activePlayback = null;
    this.activeShot = null;
    this.elapsed = 0;
    this.shotIndex = 0;
  }

  private getShotDuration(shot: CinematicShot): number {
    return this.reducedMotion ? shot.reducedMotionDuration : shot.duration;
  }
}

function setVector(vector: THREE.Vector3, values: VectorTuple): void {
  vector.set(values[0], values[1], values[2]);
}

function ease(progress: number, easing: CinematicShot['easing']): number {
  if (easing === 'easeOut') {
    return 1 - Math.pow(1 - progress, 3);
  }

  if (easing === 'easeInOut') {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  return progress * progress * (3 - 2 * progress);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
