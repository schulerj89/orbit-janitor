export type ScreenShakeIntensity = 'off' | 'low' | 'normal';
export type TouchControlsMode = 'auto' | 'on' | 'off';
export type DeviceExperienceMode = 'auto' | 'full' | 'mobileLite';

export interface SettingsSnapshot {
  reducedMotion: boolean;
  screenShakeIntensity: ScreenShakeIntensity;
  musicVolume: number;
  sfxVolume: number;
  highContrastHazards: boolean;
  touchControlsMode: TouchControlsMode;
  deviceExperienceMode: DeviceExperienceMode;
}

const SETTINGS_STORAGE_KEY = 'orbit-janitor.settings';
const LEGACY_MUSIC_VOLUME_STORAGE_KEY = 'orbit-janitor.musicVolume';
const LEGACY_SFX_VOLUME_STORAGE_KEY = 'orbit-janitor.sfxVolume';
const DEFAULT_VOLUME = 1;
const MIN_VOLUME = 0;
const MAX_VOLUME = 1.25;

export class SettingsSystem {
  private snapshot: SettingsSnapshot;

  constructor() {
    this.snapshot = this.readSettings();
  }

  getSnapshot(): SettingsSnapshot {
    return { ...this.snapshot };
  }

  update(partial: Partial<SettingsSnapshot>): SettingsSnapshot {
    this.snapshot = normalizeSettings({
      ...this.snapshot,
      ...partial
    });
    writeStoredSettings(this.snapshot);
    return this.getSnapshot();
  }

  toggleReducedMotion(): SettingsSnapshot {
    return this.update({ reducedMotion: !this.snapshot.reducedMotion });
  }

  toggleHighContrastHazards(): SettingsSnapshot {
    return this.update({
      highContrastHazards: !this.snapshot.highContrastHazards
    });
  }

  cycleScreenShake(direction = 1): SettingsSnapshot {
    const values: ScreenShakeIntensity[] = ['off', 'low', 'normal'];
    const currentIndex = values.indexOf(this.snapshot.screenShakeIntensity);
    const nextIndex = (currentIndex + direction + values.length) % values.length;

    return this.update({ screenShakeIntensity: values[nextIndex] });
  }

  cycleTouchControlsMode(direction = 1): SettingsSnapshot {
    const values: TouchControlsMode[] = ['auto', 'on', 'off'];
    const currentIndex = values.indexOf(this.snapshot.touchControlsMode);
    const nextIndex = (currentIndex + direction + values.length) % values.length;

    return this.update({ touchControlsMode: values[nextIndex] });
  }

  cycleDeviceExperienceMode(direction = 1): SettingsSnapshot {
    const values: DeviceExperienceMode[] = ['auto', 'full', 'mobileLite'];
    const currentIndex = values.indexOf(this.snapshot.deviceExperienceMode);
    const nextIndex = (currentIndex + direction + values.length) % values.length;

    return this.update({ deviceExperienceMode: values[nextIndex] });
  }

  adjustMusicVolume(delta: number): SettingsSnapshot {
    return this.update({ musicVolume: this.snapshot.musicVolume + delta });
  }

  adjustSfxVolume(delta: number): SettingsSnapshot {
    return this.update({ sfxVolume: this.snapshot.sfxVolume + delta });
  }

  private readSettings(): SettingsSnapshot {
    const defaults = getDefaultSettings();

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

      if (!stored) {
        return normalizeSettings({
          ...defaults,
          musicVolume: readLegacyVolume(
            LEGACY_MUSIC_VOLUME_STORAGE_KEY,
            defaults.musicVolume
          ),
          sfxVolume: readLegacyVolume(LEGACY_SFX_VOLUME_STORAGE_KEY, defaults.sfxVolume)
        });
      }

      const parsed = JSON.parse(stored) as Partial<SettingsSnapshot>;
      return normalizeSettings({
        ...defaults,
        ...parsed
      });
    } catch {
      return defaults;
    }
  }
}

function getDefaultSettings(): SettingsSnapshot {
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  return {
    reducedMotion: prefersReducedMotion,
    screenShakeIntensity: prefersReducedMotion ? 'off' : 'normal',
    musicVolume: DEFAULT_VOLUME,
    sfxVolume: DEFAULT_VOLUME,
    highContrastHazards: false,
    touchControlsMode: 'auto',
    deviceExperienceMode: 'auto'
  };
}

function normalizeSettings(settings: SettingsSnapshot): SettingsSnapshot {
  return {
    reducedMotion: Boolean(settings.reducedMotion),
    screenShakeIntensity: isScreenShakeIntensity(settings.screenShakeIntensity)
      ? settings.screenShakeIntensity
      : 'normal',
    musicVolume: clampVolume(settings.musicVolume),
    sfxVolume: clampVolume(settings.sfxVolume),
    highContrastHazards: Boolean(settings.highContrastHazards),
    touchControlsMode: isTouchControlsMode(settings.touchControlsMode)
      ? settings.touchControlsMode
      : 'auto',
    deviceExperienceMode: isDeviceExperienceMode(settings.deviceExperienceMode)
      ? settings.deviceExperienceMode
      : 'auto'
  };
}

function writeStoredSettings(settings: SettingsSnapshot): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

function readLegacyVolume(key: string, fallback: number): number {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : clampVolume(Number(stored));
  } catch {
    return fallback;
  }
}

function clampVolume(volume: number): number {
  return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, Number.isFinite(volume) ? volume : 1));
}

function isScreenShakeIntensity(value: unknown): value is ScreenShakeIntensity {
  return value === 'off' || value === 'low' || value === 'normal';
}

function isTouchControlsMode(value: unknown): value is TouchControlsMode {
  return value === 'auto' || value === 'on' || value === 'off';
}

function isDeviceExperienceMode(value: unknown): value is DeviceExperienceMode {
  return value === 'auto' || value === 'full' || value === 'mobileLite';
}
