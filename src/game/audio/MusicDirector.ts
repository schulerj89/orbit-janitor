import { AudioManager } from './AudioManager';
import type { AudioAssetId } from './audioManifest';

export type MusicIntensityHint = 'calm' | 'steady' | 'tense' | 'endless';

type BaseMusicRequest =
  | {
      type: 'title';
    }
  | {
      type: 'sector';
      sectorId: string;
      intensityHint: MusicIntensityHint;
    };

type FallbackLoopKind = 'title' | 'sector' | 'danger';

interface LoopHandle {
  assetId: AudioAssetId | null;
  requestKey: string;
  source: AudioBufferSourceNode | null;
  oscillators: OscillatorNode[];
  gain: GainNode;
  stopTimer: number | null;
}

const BASE_FADE_SECONDS = 0.9;
const DANGER_FADE_SECONDS = 0.28;
const TITLE_VOLUME = 0.55;
const SECTOR_VOLUME = 0.72;
const DANGER_VOLUME = 0.56;
const STINGER_VOLUME = 0.78;

export class MusicDirector {
  private baseRequest: BaseMusicRequest | null = null;
  private baseLoop: LoopHandle | null = null;
  private dangerLoop: LoopHandle | null = null;
  private stingerSource: AudioBufferSourceNode | null = null;
  private stingerOscillators: OscillatorNode[] = [];
  private dangerIntensity = 0;
  private assetRefreshQueued = false;

  constructor(private readonly audio: AudioManager) {}

  unlock(): void {
    this.audio.unlock();
    this.queueAssetRefresh();
    this.ensureBaseLoop();
    this.ensureDangerLoop();
  }

  startTitleMusic(): void {
    this.baseRequest = { type: 'title' };
    this.stopStingers();
    this.queueAssetRefresh();
    this.ensureBaseLoop();
  }

  startSectorMusic(sectorId: string, intensityHint: MusicIntensityHint): void {
    this.baseRequest = {
      type: 'sector',
      sectorId,
      intensityHint
    };
    this.stopStingers();
    this.queueAssetRefresh();
    this.ensureBaseLoop();
  }

  setDangerIntensity(value: number): void {
    this.dangerIntensity = Math.max(0, Math.min(1, value));
    this.ensureDangerLoop();
    this.fadeDangerLayer();
  }

  playMissionComplete(): void {
    this.baseRequest = null;
    this.dangerIntensity = 0;
    this.stopRuntimeLoops(false);
    this.playStinger('missionComplete', 'missionComplete');
  }

  playGameOver(): void {
    this.baseRequest = null;
    this.dangerIntensity = 0;
    this.stopRuntimeLoops(false);
    this.playStinger('gameOver', 'gameOver');
  }

  stopAll(): void {
    this.baseRequest = null;
    this.dangerIntensity = 0;
    this.stopRuntimeLoops(true);
    this.stopStingers();
  }

  setMusicEnabled(enabled: boolean): void {
    this.audio.setMusicEnabled(enabled);

    if (!enabled) {
      this.stopRuntimeLoops(false);
      this.stopStingers();
      return;
    }

    this.ensureBaseLoop();
    this.ensureDangerLoop();
    this.queueAssetRefresh();
  }

  isMusicEnabled(): boolean {
    return this.audio.isMusicEnabled();
  }

  getMusicVolume(): number {
    return this.audio.getMusicVolume();
  }

  adjustMusicVolume(delta: number): number {
    return this.audio.adjustMusicVolume(delta);
  }

  getDangerIntensity(): number {
    return this.dangerIntensity;
  }

  private ensureBaseLoop(): void {
    if (!this.baseRequest || !this.audio.isMusicEnabled()) {
      return;
    }

    const context = this.audio.getAudioContext();
    const output = this.audio.getMusicOutput();

    if (!context || !output) {
      return;
    }

    const nextConfig = this.getBaseLoopConfig(this.baseRequest);

    if (
      this.baseLoop &&
      this.baseLoop.requestKey === nextConfig.requestKey &&
      this.baseLoop.assetId === nextConfig.assetId
    ) {
      return;
    }

    const previousLoop = this.baseLoop;
    const nextLoop = this.createLoop(
      context,
      output,
      nextConfig.assetId,
      nextConfig.fallbackKind,
      nextConfig.requestKey
    );

    if (!nextLoop) {
      return;
    }

    this.baseLoop = nextLoop;
    this.fadeLoop(nextLoop, nextConfig.volume, BASE_FADE_SECONDS);

    if (previousLoop) {
      this.fadeOutAndStop(previousLoop, BASE_FADE_SECONDS);
    }
  }

  private ensureDangerLoop(): void {
    if (!this.audio.isMusicEnabled() || this.dangerIntensity <= 0.01) {
      return;
    }

    const context = this.audio.getAudioContext();
    const output = this.audio.getMusicOutput();

    if (!context || !output) {
      return;
    }

    const assetId = this.audio.getAudioBuffer('dangerLayer') ? 'dangerLayer' : null;

    if (this.dangerLoop && this.dangerLoop.assetId === assetId) {
      return;
    }

    const previousLoop = this.dangerLoop;
    const nextLoop = this.createLoop(context, output, assetId, 'danger', 'danger');

    if (!nextLoop) {
      return;
    }

    this.dangerLoop = nextLoop;
    this.fadeDangerLayer();

    if (previousLoop) {
      this.fadeOutAndStop(previousLoop, DANGER_FADE_SECONDS);
    }
  }

  private fadeDangerLayer(): void {
    if (!this.dangerLoop) {
      return;
    }

    const targetVolume = this.audio.isMusicEnabled()
      ? this.dangerIntensity * DANGER_VOLUME
      : 0;

    this.fadeLoop(this.dangerLoop, targetVolume, DANGER_FADE_SECONDS);
  }

  private getBaseLoopConfig(request: BaseMusicRequest): {
    assetId: AudioAssetId | null;
    fallbackKind: FallbackLoopKind;
    requestKey: string;
    volume: number;
  } {
    if (request.type === 'title') {
      return {
        assetId: this.pickLoadedAsset(['titleAmbient', 'musicMain']),
        fallbackKind: 'title',
        requestKey: 'title',
        volume: TITLE_VOLUME
      };
    }

    return {
      assetId: this.pickLoadedAsset(['sectorDrive', 'musicMain']),
      fallbackKind: 'sector',
      requestKey: `sector:${request.sectorId}:${request.intensityHint}`,
      volume: this.getSectorVolume(request.intensityHint)
    };
  }

  private getSectorVolume(intensityHint: MusicIntensityHint): number {
    if (intensityHint === 'calm') {
      return SECTOR_VOLUME * 0.72;
    }

    if (intensityHint === 'tense' || intensityHint === 'endless') {
      return SECTOR_VOLUME * 1.08;
    }

    return SECTOR_VOLUME;
  }

  private pickLoadedAsset(candidates: AudioAssetId[]): AudioAssetId | null {
    return candidates.find((assetId) => this.audio.getAudioBuffer(assetId)) ?? null;
  }

  private createLoop(
    context: AudioContext,
    output: AudioNode,
    assetId: AudioAssetId | null,
    fallbackKind: FallbackLoopKind,
    requestKey: string
  ): LoopHandle | null {
    const gain = context.createGain();
    const now = context.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.connect(output);

    if (assetId) {
      const buffer = this.audio.getAudioBuffer(assetId);

      if (buffer) {
        const source = context.createBufferSource();

        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start(now);

        return {
          assetId,
          requestKey,
          source,
          oscillators: [],
          gain,
          stopTimer: null
        };
      }
    }

    return this.createFallbackLoop(context, gain, fallbackKind, requestKey);
  }

  private createFallbackLoop(
    context: AudioContext,
    gain: GainNode,
    fallbackKind: FallbackLoopKind,
    requestKey: string
  ): LoopHandle {
    const now = context.currentTime;
    const lowOscillator = context.createOscillator();
    const highOscillator = context.createOscillator();
    const shimmerOscillator =
      fallbackKind === 'danger' ? null : context.createOscillator();
    const frequencies = getFallbackFrequencies(fallbackKind);

    lowOscillator.type = fallbackKind === 'danger' ? 'sawtooth' : 'sine';
    lowOscillator.frequency.setValueAtTime(frequencies.low, now);
    highOscillator.type = fallbackKind === 'title' ? 'triangle' : 'sawtooth';
    highOscillator.frequency.setValueAtTime(frequencies.high, now);
    lowOscillator.connect(gain);
    highOscillator.connect(gain);
    lowOscillator.start(now);
    highOscillator.start(now);

    const oscillators = [lowOscillator, highOscillator];

    if (shimmerOscillator) {
      shimmerOscillator.type = 'triangle';
      shimmerOscillator.frequency.setValueAtTime(frequencies.shimmer, now);
      shimmerOscillator.connect(gain);
      shimmerOscillator.start(now);
      oscillators.push(shimmerOscillator);
    }

    return {
      assetId: null,
      requestKey,
      source: null,
      oscillators,
      gain,
      stopTimer: null
    };
  }

  private playStinger(assetId: 'missionComplete' | 'gameOver', kind: string): void {
    if (!this.audio.isMusicEnabled()) {
      return;
    }

    const context = this.audio.getAudioContext();
    const output = this.audio.getMusicOutput();

    if (!context || !output) {
      return;
    }

    this.stopStingers();

    const buffer = this.audio.getAudioBuffer(assetId);

    if (buffer) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;

      source.buffer = buffer;
      gain.gain.setValueAtTime(STINGER_VOLUME, now);
      source.connect(gain);
      gain.connect(output);
      source.start(now);
      this.stingerSource = source;
      return;
    }

    this.playFallbackStinger(context, output, kind);
  }

  private playFallbackStinger(
    context: AudioContext,
    output: AudioNode,
    kind: string
  ): void {
    const complete = kind === 'missionComplete';
    const now = context.currentTime;
    const frequencies = complete ? [440, 660, 990] : [220, 147, 92];

    this.stingerOscillators = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startTime = now + index * 0.11;
      const duration = complete ? 0.38 : 0.5;

      oscillator.type = complete ? 'triangle' : 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(STINGER_VOLUME * 0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.03);
      return oscillator;
    });
  }

  private fadeLoop(loop: LoopHandle, targetVolume: number, duration: number): void {
    const context = this.audio.getAudioContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;

    if (loop.stopTimer !== null) {
      window.clearTimeout(loop.stopTimer);
      loop.stopTimer = null;
    }

    loop.gain.gain.cancelScheduledValues(now);
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
    loop.gain.gain.linearRampToValueAtTime(targetVolume, now + duration);
  }

  private fadeOutAndStop(loop: LoopHandle, duration: number): void {
    this.fadeLoop(loop, 0, duration);
    loop.stopTimer = window.setTimeout(
      () => {
        this.stopLoop(loop);
      },
      duration * 1000 + 80
    );
  }

  private stopRuntimeLoops(fade: boolean): void {
    const fadeSeconds = fade ? BASE_FADE_SECONDS : 0.16;

    if (this.baseLoop) {
      this.fadeOutAndStop(this.baseLoop, fadeSeconds);
      this.baseLoop = null;
    }

    if (this.dangerLoop) {
      this.fadeOutAndStop(this.dangerLoop, DANGER_FADE_SECONDS);
      this.dangerLoop = null;
    }
  }

  private stopLoop(loop: LoopHandle): void {
    if (loop.stopTimer !== null) {
      window.clearTimeout(loop.stopTimer);
      loop.stopTimer = null;
    }

    try {
      loop.source?.stop();
      loop.oscillators.forEach((oscillator) => oscillator.stop());
    } catch {
      // Rapid state changes can stop the same loop twice.
    }

    loop.gain.disconnect();
  }

  private stopStingers(): void {
    try {
      this.stingerSource?.stop();
      this.stingerOscillators.forEach((oscillator) => oscillator.stop());
    } catch {
      // One-shot sources may have already completed.
    }

    this.stingerSource = null;
    this.stingerOscillators = [];
  }

  private queueAssetRefresh(): void {
    if (this.assetRefreshQueued) {
      return;
    }

    this.assetRefreshQueued = true;
    void this.audio.whenAssetsLoaded().then(() => {
      this.assetRefreshQueued = false;
      this.ensureBaseLoop();

      if (this.dangerIntensity > 0.01) {
        this.ensureDangerLoop();
      }
    });
  }
}

function getFallbackFrequencies(kind: FallbackLoopKind): {
  low: number;
  high: number;
  shimmer: number;
} {
  if (kind === 'danger') {
    return {
      low: 92,
      high: 184,
      shimmer: 0
    };
  }

  if (kind === 'sector') {
    return {
      low: 74,
      high: 148,
      shimmer: 296
    };
  }

  return {
    low: 55,
    high: 110,
    shimmer: 220
  };
}
