import { AUDIO_MANIFEST, type AudioAssetId } from './audioManifest';

type OscillatorKind = OscillatorType;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  duration: number;
  type?: OscillatorKind;
  volume?: number;
}

const MUSIC_ENABLED_STORAGE_KEY = 'orbit-janitor.musicEnabled';
const SFX_ENABLED_STORAGE_KEY = 'orbit-janitor.sfxEnabled';

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private boostSource: AudioBufferSourceNode | null = null;
  private boostOscillator: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicFallbackOscillators: OscillatorNode[] = [];
  private musicFallbackGain: GainNode | null = null;
  private readonly buffers = new Map<AudioAssetId, AudioBuffer>();
  private assetLoadPromise: Promise<void> | null = null;
  private musicRequested = false;
  private started = false;
  private musicEnabled = readStoredBoolean(MUSIC_ENABLED_STORAGE_KEY, true);
  private sfxEnabled = readStoredBoolean(SFX_ENABLED_STORAGE_KEY, true);

  start(): void {
    this.unlock();
  }

  unlock(): void {
    if (this.started) {
      void this.context?.resume().catch(() => undefined);
      return;
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    try {
      this.context = new AudioContextCtor();
    } catch {
      this.context = null;
      return;
    }

    this.masterGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.musicGain = this.context.createGain();

    this.masterGain.gain.value = 0.18;
    this.sfxGain.gain.value = 1;
    this.musicGain.gain.value = 0.42;
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    this.started = true;

    void this.context.resume().catch(() => undefined);
    void this.loadAssets();
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    writeStoredBoolean(MUSIC_ENABLED_STORAGE_KEY, enabled);

    if (enabled) {
      if (this.musicRequested) {
        this.startMusic();
      }
      return;
    }

    this.stopMusic(false);
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    writeStoredBoolean(SFX_ENABLED_STORAGE_KEY, enabled);

    if (!enabled) {
      this.playBoostLoopStop();
    }
  }

  toggleMusic(): boolean {
    this.setMusicEnabled(!this.musicEnabled);
    return this.musicEnabled;
  }

  toggleSfx(): boolean {
    this.setSfxEnabled(!this.sfxEnabled);
    return this.sfxEnabled;
  }

  playCollect(): void {
    this.playSfx('collect', () => {
      this.playTone({
        frequency: 520,
        endFrequency: 880,
        duration: 0.12,
        type: 'triangle',
        volume: 0.16
      });
      this.playTone({
        frequency: 980,
        endFrequency: 1240,
        duration: 0.08,
        type: 'sine',
        volume: 0.08
      });
    });
  }

  playComboUp(multiplier: number): void {
    this.playSfx('comboUp', () => {
      const clampedMultiplier = Math.max(1, Math.min(multiplier, 5));
      const baseFrequency = 620 + clampedMultiplier * 80;

      this.playTone({
        frequency: baseFrequency,
        endFrequency: baseFrequency * 1.45,
        duration: 0.14,
        type: 'triangle',
        volume: 0.1
      });
      this.playTone({
        frequency: baseFrequency * 1.5,
        duration: 0.08,
        type: 'sine',
        volume: 0.06
      });
    });
  }

  playCombo(multiplier: number): void {
    this.playComboUp(multiplier);
  }

  playLaneSwitch(): void {
    this.playSfx('laneSwitch', () => {
      this.playTone({
        frequency: 320,
        endFrequency: 430,
        duration: 0.08,
        type: 'square',
        volume: 0.055
      });
    });
  }

  playBoostStart(): void {
    this.playSfx('boostStart', () => {
      this.playTone({
        frequency: 150,
        endFrequency: 270,
        duration: 0.1,
        type: 'sawtooth',
        volume: 0.08
      });
    });
  }

  playBoostLoopStart(): void {
    const context = this.getContext();
    const sfxGain = this.sfxGain;

    if (
      !context ||
      !sfxGain ||
      !this.sfxEnabled ||
      this.boostSource ||
      this.boostOscillator
    ) {
      return;
    }

    const buffer = this.buffers.get('boostLoop');

    if (buffer) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;

      source.buffer = buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      source.connect(gain);
      gain.connect(sfxGain);
      source.start(now);

      this.boostSource = source;
      this.boostGain = gain;
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(92, now);
    oscillator.frequency.linearRampToValueAtTime(118, now + 0.16);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.08);

    oscillator.connect(gain);
    gain.connect(sfxGain);
    oscillator.start(now);

    this.boostOscillator = oscillator;
    this.boostGain = gain;
  }

  playBoostLoopStop(): void {
    if (!this.context || !this.boostGain) {
      this.boostSource = null;
      this.boostOscillator = null;
      this.boostGain = null;
      return;
    }

    const source = this.boostSource;
    const oscillator = this.boostOscillator;
    const gain = this.boostGain;
    const now = this.context.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.08);

    try {
      source?.stop(now + 0.1);
      oscillator?.stop(now + 0.1);
    } catch {
      // A loop can already be stopped during rapid state changes.
    }

    this.boostSource = null;
    this.boostOscillator = null;
    this.boostGain = null;
  }

  playHazardWarning(): void {
    this.playSfx('hazardWarning', () => {
      this.playTone({
        frequency: 420,
        endFrequency: 350,
        duration: 0.18,
        type: 'square',
        volume: 0.075
      });
    });
  }

  playHazardActive(): void {
    this.playSfx('hazardActive', () => {
      this.playNoise(0.08, 0.05);
      this.playTone({
        frequency: 180,
        endFrequency: 230,
        duration: 0.14,
        type: 'sawtooth',
        volume: 0.09
      });
    });
  }

  playImpact(): void {
    this.playSfx('impact', () => {
      this.playNoise(0.22, 0.14);
      this.playTone({
        frequency: 190,
        endFrequency: 58,
        duration: 0.26,
        type: 'sawtooth',
        volume: 0.14
      });
    });
  }

  playHit(): void {
    this.playImpact();
  }

  playObjectiveComplete(): void {
    this.playSfx('objectiveComplete', () => {
      this.playTone({
        frequency: 540,
        endFrequency: 1080,
        duration: 0.18,
        type: 'triangle',
        volume: 0.11
      });
      this.playTone({
        frequency: 810,
        endFrequency: 1620,
        duration: 0.24,
        type: 'sine',
        volume: 0.08
      });
    });
  }

  playUiStart(): void {
    this.playSfx('uiStart', () => {
      this.playTone({
        frequency: 260,
        endFrequency: 520,
        duration: 0.16,
        type: 'triangle',
        volume: 0.08
      });
    });
  }

  playUiSelect(): void {
    this.playSfx('uiSelect', () => {
      this.playTone({
        frequency: 420,
        endFrequency: 560,
        duration: 0.07,
        type: 'sine',
        volume: 0.055
      });
    });
  }

  startMusic(): void {
    this.musicRequested = true;

    const context = this.getContext();
    const musicGain = this.musicGain;

    if (
      !context ||
      !musicGain ||
      !this.musicEnabled ||
      this.musicSource ||
      this.musicFallbackOscillators.length > 0
    ) {
      return;
    }

    const buffer = this.buffers.get('musicMain');

    if (buffer) {
      const source = context.createBufferSource();

      source.buffer = buffer;
      source.loop = true;
      source.connect(musicGain);
      source.start(context.currentTime);
      this.musicSource = source;
      return;
    }

    this.startFallbackMusic(context, musicGain);
  }

  stopMusic(clearRequest = true): void {
    if (clearRequest) {
      this.musicRequested = false;
    }

    try {
      this.musicSource?.stop();
      this.musicFallbackOscillators.forEach((oscillator) => oscillator.stop());
    } catch {
      // Sources can already be stopped when settings and state change together.
    }

    this.musicSource = null;
    this.musicFallbackOscillators = [];
    this.musicFallbackGain = null;
  }

  stopAll(): void {
    this.playBoostLoopStop();
  }

  dispose(): void {
    this.playBoostLoopStop();
    this.stopMusic();
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.started = false;
  }

  private async loadAssets(): Promise<void> {
    if (!this.context) {
      return;
    }

    if (this.assetLoadPromise) {
      return this.assetLoadPromise;
    }

    const context = this.context;

    this.assetLoadPromise = Promise.all(
      Object.entries(AUDIO_MANIFEST).map(async ([id, entry]) => {
        try {
          const response = await fetch(entry.src);

          if (!response.ok) {
            return;
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          this.buffers.set(id as AudioAssetId, audioBuffer);
        } catch {
          // Static audio files are optional; procedural fallbacks cover misses.
        }
      })
    ).then(() => undefined);

    return this.assetLoadPromise;
  }

  private playSfx(id: AudioAssetId, fallback: () => void): void {
    if (!this.sfxEnabled) {
      return;
    }

    const context = this.getContext();
    const sfxGain = this.sfxGain;

    if (!context || !sfxGain) {
      return;
    }

    const buffer = this.buffers.get(id);

    if (buffer) {
      this.playBuffer(buffer, sfxGain, 1);
      return;
    }

    fallback();
  }

  private playBuffer(
    buffer: AudioBuffer,
    output: AudioNode,
    volume: number
  ): AudioBufferSourceNode | null {
    const context = this.getContext();

    if (!context) {
      return null;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(output);
    source.start(context.currentTime);

    return source;
  }

  private startFallbackMusic(context: AudioContext, output: AudioNode): void {
    const gain = context.createGain();
    const lowOscillator = context.createOscillator();
    const highOscillator = context.createOscillator();
    const now = context.currentTime;

    gain.gain.setValueAtTime(0.018, now);
    lowOscillator.type = 'sine';
    lowOscillator.frequency.value = 62;
    highOscillator.type = 'triangle';
    highOscillator.frequency.value = 124;

    lowOscillator.connect(gain);
    highOscillator.connect(gain);
    gain.connect(output);
    lowOscillator.start(now);
    highOscillator.start(now);

    this.musicFallbackOscillators = [lowOscillator, highOscillator];
    this.musicFallbackGain = gain;
  }

  private playTone(options: ToneOptions): void {
    const context = this.getContext();
    const sfxGain = this.sfxGain;

    if (!context || !sfxGain || !this.sfxEnabled) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const volume = options.volume ?? 0.08;

    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, now);

    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.endFrequency),
        now + options.duration
      );
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

    oscillator.connect(gain);
    gain.connect(sfxGain);
    oscillator.start(now);
    oscillator.stop(now + options.duration + 0.02);
  }

  private playNoise(duration: number, volume: number): void {
    const context = this.getContext();
    const sfxGain = this.sfxGain;

    if (!context || !sfxGain || !this.sfxEnabled) {
      return;
    }

    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let index = 0; index < channelData.length; index += 1) {
      channelData[index] = (Math.random() * 2 - 1) * (1 - index / channelData.length);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const now = context.currentTime;

    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  private getContext(): AudioContext | null {
    if (!this.context || !this.masterGain) {
      return null;
    }

    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined);
    }

    return this.context;
  }
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (storedValue === 'true') {
      return true;
    }

    if (storedValue === 'false') {
      return false;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function writeStoredBoolean(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Preferences should not affect playability if storage is unavailable.
  }
}
