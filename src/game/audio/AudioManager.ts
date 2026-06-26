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

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private boostOscillator: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private started = false;

  start(): void {
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
    this.masterGain.gain.value = 0.18;
    this.masterGain.connect(this.context.destination);
    this.started = true;

    void this.context.resume().catch(() => undefined);
  }

  playCollect(): void {
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
  }

  playBoostStart(): void {
    this.playTone({
      frequency: 150,
      endFrequency: 270,
      duration: 0.1,
      type: 'sawtooth',
      volume: 0.08
    });
  }

  playBoostLoopStart(): void {
    const context = this.getContext();
    const masterGain = this.masterGain;

    if (!context || !masterGain || this.boostOscillator) {
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
    gain.connect(masterGain);
    oscillator.start(now);

    this.boostOscillator = oscillator;
    this.boostGain = gain;
  }

  playBoostLoopStop(): void {
    if (!this.context || !this.boostOscillator || !this.boostGain) {
      return;
    }

    const oscillator = this.boostOscillator;
    const gain = this.boostGain;
    const now = this.context.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.08);
    oscillator.stop(now + 0.1);

    this.boostOscillator = null;
    this.boostGain = null;
  }

  playHit(): void {
    this.playNoise(0.22, 0.14);
    this.playTone({
      frequency: 190,
      endFrequency: 58,
      duration: 0.26,
      type: 'sawtooth',
      volume: 0.14
    });
  }

  playLaneSwitch(): void {
    this.playTone({
      frequency: 320,
      endFrequency: 430,
      duration: 0.08,
      type: 'square',
      volume: 0.055
    });
  }

  playCombo(multiplier: number): void {
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
  }

  stopAll(): void {
    this.playBoostLoopStop();
  }

  private playTone(options: ToneOptions): void {
    const context = this.getContext();
    const masterGain = this.masterGain;

    if (!context || !masterGain) {
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
    gain.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + options.duration + 0.02);
  }

  private playNoise(duration: number, volume: number): void {
    const context = this.getContext();
    const masterGain = this.masterGain;

    if (!context || !masterGain) {
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
    gain.connect(masterGain);
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
