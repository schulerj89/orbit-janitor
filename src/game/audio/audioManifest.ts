const audioPath = (path: string): string => `${import.meta.env.BASE_URL}audio/${path}`;

export const AUDIO_MANIFEST = {
  collect: { src: audioPath('sfx/collect-junk.mp3') },
  comboUp: { src: audioPath('sfx/combo-up.mp3') },
  laneSwitch: { src: audioPath('sfx/lane-switch.mp3') },
  boostStart: { src: audioPath('sfx/boost-start.mp3') },
  boostLoop: { src: audioPath('sfx/boost-loop.mp3'), loop: true },
  boostEnd: { src: audioPath('sfx/boost-end.mp3') },
  hazardWarning: { src: audioPath('sfx/hazard-warning.mp3') },
  hazardActive: { src: audioPath('sfx/hazard-active.mp3') },
  shieldBreak: { src: audioPath('sfx/shield-break.mp3') },
  impact: { src: audioPath('sfx/impact.mp3') },
  objectiveComplete: { src: audioPath('sfx/objective-complete.mp3') },
  uiStart: { src: audioPath('sfx/ui-start.mp3') },
  uiSelect: { src: audioPath('sfx/ui-select.mp3') },
  musicMain: { src: audioPath('music/orbit-janitor-main-loop.mp3'), loop: true },
  sectorDrive: { src: audioPath('music/sector-drive-loop.mp3'), loop: true },
  dangerLayer: { src: audioPath('music/danger-layer-loop.mp3'), loop: true },
  missionComplete: { src: audioPath('music/mission-complete-stinger.mp3') },
  gameOver: { src: audioPath('music/game-over-stinger.mp3') }
} as const;

export type AudioAssetId = keyof typeof AUDIO_MANIFEST;
