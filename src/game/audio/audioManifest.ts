export const AUDIO_MANIFEST = {
  collect: { src: '/audio/sfx/collect-junk.mp3' },
  comboUp: { src: '/audio/sfx/combo-up.mp3' },
  laneSwitch: { src: '/audio/sfx/lane-switch.mp3' },
  boostStart: { src: '/audio/sfx/boost-start.mp3' },
  boostLoop: { src: '/audio/sfx/boost-loop.mp3', loop: true },
  boostEnd: { src: '/audio/sfx/boost-end.mp3' },
  hazardWarning: { src: '/audio/sfx/hazard-warning.mp3' },
  hazardActive: { src: '/audio/sfx/hazard-active.mp3' },
  shieldBreak: { src: '/audio/sfx/shield-break.mp3' },
  impact: { src: '/audio/sfx/impact.mp3' },
  objectiveComplete: { src: '/audio/sfx/objective-complete.mp3' },
  uiStart: { src: '/audio/sfx/ui-start.mp3' },
  uiSelect: { src: '/audio/sfx/ui-select.mp3' },
  musicMain: { src: '/audio/music/orbit-janitor-main-loop.mp3', loop: true }
} as const;

export type AudioAssetId = keyof typeof AUDIO_MANIFEST;
