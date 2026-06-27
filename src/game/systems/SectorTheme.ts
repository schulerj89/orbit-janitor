export type SectorThemeId =
  | 'training-orbit'
  | 'low-orbit-cleanup'
  | 'debris-belt'
  | 'solar-storm'
  | 'night-side'
  | 'comet-wake'
  | 'graveyard-ring'
  | 'neon-belt'
  | 'frozen-relay'
  | 'reactor-grave'
  | 'junk-moon'
  | 'long-orbit'
  | 'endless-cleanup';

export type SectorMusicIntensityHint = 'calm' | 'steady' | 'tense' | 'endless';

export interface SectorGameplayModifiers {
  hint: string;
  hazardIntensityMultiplier: number;
  hazardIntervalMultiplier: number;
  hazardTelegraphMultiplier: number;
  hazardActiveMultiplier: number;
  hazardSpeedMultiplier: number;
  junkColorVariance: number;
  powerupSpawnIntervalMultiplier: number;
  difficultyScalePerMinute: number;
}

export interface SectorTheme {
  id: SectorThemeId;
  planetBaseColor: number;
  planetAccentColor: number;
  atmosphereColor: number;
  laneColor: number;
  activeLaneColor: number;
  starColor: number;
  junkPalette: readonly number[];
  hazardWarningColor: number;
  hazardActiveColor: number;
  ambientLightColor: number;
  directionalLightColor: number;
  backgroundColor: number;
  musicIntensityHint: SectorMusicIntensityHint;
  modifiers: SectorGameplayModifiers;
}

const baselineModifiers: SectorGameplayModifiers = {
  hint: 'Baseline cleanup route',
  hazardIntensityMultiplier: 1,
  hazardIntervalMultiplier: 1,
  hazardTelegraphMultiplier: 1,
  hazardActiveMultiplier: 1,
  hazardSpeedMultiplier: 1,
  junkColorVariance: 0.2,
  powerupSpawnIntervalMultiplier: 1,
  difficultyScalePerMinute: 0
};

export const SECTOR_THEMES: Record<SectorThemeId, SectorTheme> = {
  'training-orbit': {
    id: 'training-orbit',
    planetBaseColor: 0x0f6f8f,
    planetAccentColor: 0x83a85a,
    atmosphereColor: 0x8fe8ff,
    laneColor: 0x526c7c,
    activeLaneColor: 0x9fffee,
    starColor: 0xdff7ff,
    junkPalette: [0xffc857, 0x83a85a, 0x7ee7ff, 0xd5762c],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff5a32,
    ambientLightColor: 0xbdd7e8,
    directionalLightColor: 0xffffff,
    backgroundColor: 0x03111d,
    musicIntensityHint: 'calm',
    modifiers: {
      ...baselineModifiers,
      hint: 'Forgiving hazard timing',
      hazardIntensityMultiplier: 0.75,
      hazardIntervalMultiplier: 1.4,
      hazardTelegraphMultiplier: 1.55,
      hazardActiveMultiplier: 0.85,
      hazardSpeedMultiplier: 0.82,
      junkColorVariance: 0.15
    }
  },
  'low-orbit-cleanup': {
    id: 'low-orbit-cleanup',
    planetBaseColor: 0x0f6f8f,
    planetAccentColor: 0x3f8d58,
    atmosphereColor: 0x78e8ff,
    laneColor: 0x526c7c,
    activeLaneColor: 0x8fe8ff,
    starColor: 0xdff7ff,
    junkPalette: [0xffbf3f, 0x8f4a32, 0xd5762c, 0x3d7895],
    hazardWarningColor: 0xffb13d,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0xbdd7e8,
    directionalLightColor: 0xffffff,
    backgroundColor: 0x02050f,
    musicIntensityHint: 'steady',
    modifiers: baselineModifiers
  },
  'debris-belt': {
    id: 'debris-belt',
    planetBaseColor: 0x3d7895,
    planetAccentColor: 0xd5762c,
    atmosphereColor: 0xffc857,
    laneColor: 0x6b5d52,
    activeLaneColor: 0xffc857,
    starColor: 0xffe2a8,
    junkPalette: [0xffc857, 0xd5762c, 0x9fffee, 0x8f4a32, 0x6d6f7e, 0xcfefff],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff4b2f,
    ambientLightColor: 0xffd9a6,
    directionalLightColor: 0xfff2cf,
    backgroundColor: 0x120b09,
    musicIntensityHint: 'steady',
    modifiers: {
      ...baselineModifiers,
      hint: 'More junk color variation',
      junkColorVariance: 1
    }
  },
  'solar-storm': {
    id: 'solar-storm',
    planetBaseColor: 0x5d7fb8,
    planetAccentColor: 0xff6a1f,
    atmosphereColor: 0xffe06b,
    laneColor: 0x6c6f7c,
    activeLaneColor: 0xffe06b,
    starColor: 0xfff0c6,
    junkPalette: [0xffe06b, 0xff6a1f, 0xcfefff, 0xffb13d],
    hazardWarningColor: 0xffe06b,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0xffc98f,
    directionalLightColor: 0xfff3b0,
    backgroundColor: 0x10070d,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Shorter hazard interval',
      hazardIntervalMultiplier: 0.82,
      hazardIntensityMultiplier: 1.05,
      junkColorVariance: 0.35
    }
  },
  'night-side': {
    id: 'night-side',
    planetBaseColor: 0x18305a,
    planetAccentColor: 0x78e8ff,
    atmosphereColor: 0x9fffee,
    laneColor: 0x364254,
    activeLaneColor: 0x9fffee,
    starColor: 0xb7d8ff,
    junkPalette: [0x9fffee, 0x78e8ff, 0xffb13d, 0x6d6f7e],
    hazardWarningColor: 0xfff08a,
    hazardActiveColor: 0xff5538,
    ambientLightColor: 0x7398c8,
    directionalLightColor: 0xd8fbff,
    backgroundColor: 0x01030a,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Dark sector, brighter telegraphs',
      hazardTelegraphMultiplier: 1.08,
      junkColorVariance: 0.45
    }
  },
  'comet-wake': {
    id: 'comet-wake',
    planetBaseColor: 0x234f5c,
    planetAccentColor: 0xcfefff,
    atmosphereColor: 0xcfefff,
    laneColor: 0x526c7c,
    activeLaneColor: 0xcfefff,
    starColor: 0xe8fbff,
    junkPalette: [0xcfefff, 0x6d6f7e, 0xff6a1f, 0x9fffee, 0xffc857],
    hazardWarningColor: 0xffc857,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0xb5f0ff,
    directionalLightColor: 0xffffff,
    backgroundColor: 0x020812,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Faster sweepers and debris',
      hazardSpeedMultiplier: 1.35,
      hazardActiveMultiplier: 1.05,
      junkColorVariance: 0.55
    }
  },
  'graveyard-ring': {
    id: 'graveyard-ring',
    planetBaseColor: 0x2d3a45,
    planetAccentColor: 0x8fe8ff,
    atmosphereColor: 0x9dbbd2,
    laneColor: 0x34414d,
    activeLaneColor: 0x8fb5d2,
    starColor: 0xdcecff,
    junkPalette: [0x7d8fa1, 0x9dbbd2, 0x5d7286, 0xffd45f, 0xcfefff],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0x9db5c8,
    directionalLightColor: 0xe8f4ff,
    backgroundColor: 0x020714,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Satellite net endurance route',
      hazardIntensityMultiplier: 1.05,
      hazardIntervalMultiplier: 0.92,
      hazardTelegraphMultiplier: 1.12,
      hazardSpeedMultiplier: 1.05,
      junkColorVariance: 0.5
    }
  },
  'neon-belt': {
    id: 'neon-belt',
    planetBaseColor: 0x16324c,
    planetAccentColor: 0xff4fd8,
    atmosphereColor: 0x00e5ff,
    laneColor: 0x49245c,
    activeLaneColor: 0x00e5ff,
    starColor: 0xf1e8ff,
    junkPalette: [0x00e5ff, 0xff4fd8, 0xffe06b, 0x9fffee, 0xd36bff],
    hazardWarningColor: 0xffe06b,
    hazardActiveColor: 0xff2f6d,
    ambientLightColor: 0xa5d8ff,
    directionalLightColor: 0xffd6fb,
    backgroundColor: 0x070019,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Combo route with paired arcs',
      hazardIntensityMultiplier: 1.08,
      hazardIntervalMultiplier: 0.9,
      hazardSpeedMultiplier: 1.12,
      junkColorVariance: 0.8
    }
  },
  'frozen-relay': {
    id: 'frozen-relay',
    planetBaseColor: 0x1d4054,
    planetAccentColor: 0xffffff,
    atmosphereColor: 0xcfefff,
    laneColor: 0x35566d,
    activeLaneColor: 0xcfefff,
    starColor: 0xf1fbff,
    junkPalette: [0xcfefff, 0xffffff, 0x9fffee, 0x7aa9ff, 0xffc857],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff5538,
    ambientLightColor: 0xbdefff,
    directionalLightColor: 0xffffff,
    backgroundColor: 0x020817,
    musicIntensityHint: 'steady',
    modifiers: {
      ...baselineModifiers,
      hint: 'Powerups spawn more often',
      hazardIntensityMultiplier: 0.96,
      hazardTelegraphMultiplier: 1.12,
      junkColorVariance: 0.62,
      powerupSpawnIntervalMultiplier: 0.72
    }
  },
  'reactor-grave': {
    id: 'reactor-grave',
    planetBaseColor: 0x3b1010,
    planetAccentColor: 0xff6a1f,
    atmosphereColor: 0xff8e4f,
    laneColor: 0x4a1e16,
    activeLaneColor: 0xff8e4f,
    starColor: 0xffd0a0,
    junkPalette: [0xff8e4f, 0xffc857, 0x8a2f20, 0xcfefff],
    hazardWarningColor: 0xffe06b,
    hazardActiveColor: 0xff2c18,
    ambientLightColor: 0xff9a72,
    directionalLightColor: 0xffc98f,
    backgroundColor: 0x090006,
    musicIntensityHint: 'tense',
    modifiers: {
      ...baselineModifiers,
      hint: 'Short active hazards, higher cadence',
      hazardIntensityMultiplier: 1.15,
      hazardIntervalMultiplier: 0.72,
      hazardTelegraphMultiplier: 1.08,
      hazardActiveMultiplier: 0.72,
      hazardSpeedMultiplier: 1.08,
      junkColorVariance: 0.38
    }
  },
  'junk-moon': {
    id: 'junk-moon',
    planetBaseColor: 0x4f3320,
    planetAccentColor: 0xffc857,
    atmosphereColor: 0xd89b56,
    laneColor: 0x5a4330,
    activeLaneColor: 0xffc857,
    starColor: 0xffe2a8,
    junkPalette: [0xffc857, 0xd5762c, 0x8f4a32, 0x6d6f7e, 0x9fffee, 0x5f4520],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff4b2f,
    ambientLightColor: 0xffc98f,
    directionalLightColor: 0xffe2a8,
    backgroundColor: 0x120904,
    musicIntensityHint: 'steady',
    modifiers: {
      ...baselineModifiers,
      hint: 'More junk variation and debris',
      hazardIntensityMultiplier: 1.06,
      hazardIntervalMultiplier: 0.88,
      hazardSpeedMultiplier: 1.05,
      junkColorVariance: 1
    }
  },
  'long-orbit': {
    id: 'long-orbit',
    planetBaseColor: 0x101829,
    planetAccentColor: 0x8fe8ff,
    atmosphereColor: 0x526c7c,
    laneColor: 0x27364b,
    activeLaneColor: 0x8fe8ff,
    starColor: 0xe8fbff,
    junkPalette: [0x8fe8ff, 0xcfefff, 0xffd45f, 0x7d8fa1, 0x9fffee],
    hazardWarningColor: 0xffd45f,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0x7994bb,
    directionalLightColor: 0xdff7ff,
    backgroundColor: 0x01030b,
    musicIntensityHint: 'endless',
    modifiers: {
      ...baselineModifiers,
      hint: 'Slow steady endurance scaling',
      hazardIntervalMultiplier: 1.08,
      hazardSpeedMultiplier: 0.95,
      junkColorVariance: 0.55,
      difficultyScalePerMinute: 0.08
    }
  },
  'endless-cleanup': {
    id: 'endless-cleanup',
    planetBaseColor: 0x0f6f8f,
    planetAccentColor: 0xffc857,
    atmosphereColor: 0x8fe8ff,
    laneColor: 0x526c7c,
    activeLaneColor: 0xffd45f,
    starColor: 0xe8fbff,
    junkPalette: [0x8fe8ff, 0xffc857, 0xff6a1f, 0x83a85a, 0xcfefff],
    hazardWarningColor: 0xffb13d,
    hazardActiveColor: 0xff3b22,
    ambientLightColor: 0xbdd7e8,
    directionalLightColor: 0xffffff,
    backgroundColor: 0x030714,
    musicIntensityHint: 'endless',
    modifiers: {
      ...baselineModifiers,
      hint: 'Hazards scale over time',
      hazardIntervalMultiplier: 0.96,
      hazardSpeedMultiplier: 1.05,
      junkColorVariance: 0.65
    }
  }
};

export function getSectorTheme(themeId: SectorThemeId): SectorTheme {
  return SECTOR_THEMES[themeId];
}
