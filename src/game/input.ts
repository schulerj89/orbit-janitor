export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  laneUpPressed: boolean;
  laneDownPressed: boolean;
  menuUpPressed: boolean;
  menuDownPressed: boolean;
  menuSelectPressed: boolean;
  startPressed: boolean;
  tutorialStartPressed: boolean;
  sectorSelectPressed: boolean;
  dailyStartPressed: boolean;
  seededStartPressed: boolean;
  restartPressed: boolean;
  escapePressed: boolean;
  cinematicSkipPressed: boolean;
  pausePressed: boolean;
  helpTogglePressed: boolean;
  tutorialSkipPressed: boolean;
  musicTogglePressed: boolean;
  musicVolumeDownPressed: boolean;
  musicVolumeUpPressed: boolean;
  sfxVolumeDownPressed: boolean;
  sfxVolumeUpPressed: boolean;
  sfxTogglePressed: boolean;
  upgradeTogglePressed: boolean;
  galleryTogglePressed: boolean;
  shipyardTogglePressed: boolean;
  settingsTogglePressed: boolean;
  debugPanelTogglePressed: boolean;
  debugCommandPressed: number | null;
  upgradeBuyPressed: number | null;
}

export class InputController {
  private readonly state: InputState = createNeutralInputState();

  constructor(target: Window = window) {
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
  }

  consumeFrame(): InputState {
    const frameState = { ...this.state };
    this.state.leftPressed = false;
    this.state.rightPressed = false;
    this.state.laneUpPressed = false;
    this.state.laneDownPressed = false;
    this.state.menuUpPressed = false;
    this.state.menuDownPressed = false;
    this.state.menuSelectPressed = false;
    this.state.startPressed = false;
    this.state.tutorialStartPressed = false;
    this.state.sectorSelectPressed = false;
    this.state.dailyStartPressed = false;
    this.state.seededStartPressed = false;
    this.state.restartPressed = false;
    this.state.escapePressed = false;
    this.state.cinematicSkipPressed = false;
    this.state.pausePressed = false;
    this.state.helpTogglePressed = false;
    this.state.tutorialSkipPressed = false;
    this.state.musicTogglePressed = false;
    this.state.musicVolumeDownPressed = false;
    this.state.musicVolumeUpPressed = false;
    this.state.sfxVolumeDownPressed = false;
    this.state.sfxVolumeUpPressed = false;
    this.state.sfxTogglePressed = false;
    this.state.upgradeTogglePressed = false;
    this.state.galleryTogglePressed = false;
    this.state.shipyardTogglePressed = false;
    this.state.settingsTogglePressed = false;
    this.state.debugPanelTogglePressed = false;
    this.state.debugCommandPressed = null;
    this.state.upgradeBuyPressed = null;
    return frameState;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.state.left = true;
      if (!event.repeat) {
        this.state.leftPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.state.right = true;
      if (event.code === 'KeyD' && !event.repeat) {
        this.state.dailyStartPressed = true;
      }
      if (!event.repeat) {
        this.state.rightPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.state.up = true;
      if (!event.repeat) {
        this.state.laneUpPressed = true;
        this.state.menuUpPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.state.down = true;
      if (!event.repeat) {
        this.state.laneDownPressed = true;
        this.state.menuDownPressed = true;
        if (event.code === 'KeyS') {
          this.state.seededStartPressed = true;
        }
      }
      event.preventDefault();
    }

    if (event.code === 'Space') {
      this.state.boost = true;
      if (!event.repeat) {
        this.state.startPressed = true;
        this.state.cinematicSkipPressed = true;
        this.state.menuSelectPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'Enter' && !event.repeat) {
      this.state.startPressed = true;
      this.state.cinematicSkipPressed = true;
      this.state.menuSelectPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyR' && !event.repeat) {
      this.state.restartPressed = true;
    }

    if (event.code === 'KeyT' && !event.repeat) {
      this.state.tutorialStartPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyC' && !event.repeat) {
      this.state.sectorSelectPressed = true;
      event.preventDefault();
    }

    if (event.code === 'Escape' && !event.repeat) {
      this.state.escapePressed = true;
      this.state.cinematicSkipPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyP' && !event.repeat) {
      this.state.pausePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyH' && !event.repeat) {
      this.state.helpTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyK' && !event.repeat) {
      this.state.tutorialSkipPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyM' && !event.repeat) {
      this.state.musicTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'Minus' && !event.repeat) {
      this.state.musicVolumeDownPressed = true;
      event.preventDefault();
    }

    if (event.code === 'Equal' && !event.repeat) {
      this.state.musicVolumeUpPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyN' && !event.repeat) {
      this.state.sfxTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'BracketLeft' && !event.repeat) {
      this.state.sfxVolumeDownPressed = true;
      event.preventDefault();
    }

    if (event.code === 'BracketRight' && !event.repeat) {
      this.state.sfxVolumeUpPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyU' && !event.repeat) {
      this.state.upgradeTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyG' && !event.repeat) {
      this.state.galleryTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyY' && !event.repeat) {
      this.state.shipyardTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyO' && !event.repeat) {
      this.state.settingsTogglePressed = true;
      event.preventDefault();
    }

    if (import.meta.env.DEV && !event.repeat) {
      if (event.code === 'F1') {
        this.state.debugPanelTogglePressed = true;
        event.preventDefault();
      }

      const debugCommand = getDebugCommandNumber(event.code);
      if (debugCommand !== null) {
        this.state.debugCommandPressed = debugCommand;
        event.preventDefault();
      }
    }

    const upgradeBuyIndex = getUpgradeBuyIndex(event.code);
    if (upgradeBuyIndex !== null && !event.repeat) {
      this.state.upgradeBuyPressed = upgradeBuyIndex;
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.state.left = false;
      event.preventDefault();
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.state.right = false;
      event.preventDefault();
    }

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.state.up = false;
      event.preventDefault();
    }

    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.state.down = false;
      event.preventDefault();
    }

    if (event.code === 'Space') {
      this.state.boost = false;
      event.preventDefault();
    }
  };
}

export function createNeutralInputState(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
    leftPressed: false,
    rightPressed: false,
    laneUpPressed: false,
    laneDownPressed: false,
    menuUpPressed: false,
    menuDownPressed: false,
    menuSelectPressed: false,
    startPressed: false,
    tutorialStartPressed: false,
    sectorSelectPressed: false,
    dailyStartPressed: false,
    seededStartPressed: false,
    restartPressed: false,
    escapePressed: false,
    cinematicSkipPressed: false,
    pausePressed: false,
    helpTogglePressed: false,
    tutorialSkipPressed: false,
    musicTogglePressed: false,
    musicVolumeDownPressed: false,
    musicVolumeUpPressed: false,
    sfxVolumeDownPressed: false,
    sfxVolumeUpPressed: false,
    sfxTogglePressed: false,
    upgradeTogglePressed: false,
    galleryTogglePressed: false,
    shipyardTogglePressed: false,
    settingsTogglePressed: false,
    debugPanelTogglePressed: false,
    debugCommandPressed: null,
    upgradeBuyPressed: null
  };
}

export function mergeInputStates(...states: InputState[]): InputState {
  const merged = createNeutralInputState();

  for (const state of states) {
    merged.left ||= state.left;
    merged.right ||= state.right;
    merged.up ||= state.up;
    merged.down ||= state.down;
    merged.boost ||= state.boost;
    merged.leftPressed ||= state.leftPressed;
    merged.rightPressed ||= state.rightPressed;
    merged.laneUpPressed ||= state.laneUpPressed;
    merged.laneDownPressed ||= state.laneDownPressed;
    merged.menuUpPressed ||= state.menuUpPressed;
    merged.menuDownPressed ||= state.menuDownPressed;
    merged.menuSelectPressed ||= state.menuSelectPressed;
    merged.startPressed ||= state.startPressed;
    merged.tutorialStartPressed ||= state.tutorialStartPressed;
    merged.sectorSelectPressed ||= state.sectorSelectPressed;
    merged.dailyStartPressed ||= state.dailyStartPressed;
    merged.seededStartPressed ||= state.seededStartPressed;
    merged.restartPressed ||= state.restartPressed;
    merged.escapePressed ||= state.escapePressed;
    merged.cinematicSkipPressed ||= state.cinematicSkipPressed;
    merged.pausePressed ||= state.pausePressed;
    merged.helpTogglePressed ||= state.helpTogglePressed;
    merged.tutorialSkipPressed ||= state.tutorialSkipPressed;
    merged.musicTogglePressed ||= state.musicTogglePressed;
    merged.musicVolumeDownPressed ||= state.musicVolumeDownPressed;
    merged.musicVolumeUpPressed ||= state.musicVolumeUpPressed;
    merged.sfxVolumeDownPressed ||= state.sfxVolumeDownPressed;
    merged.sfxVolumeUpPressed ||= state.sfxVolumeUpPressed;
    merged.sfxTogglePressed ||= state.sfxTogglePressed;
    merged.upgradeTogglePressed ||= state.upgradeTogglePressed;
    merged.galleryTogglePressed ||= state.galleryTogglePressed;
    merged.shipyardTogglePressed ||= state.shipyardTogglePressed;
    merged.settingsTogglePressed ||= state.settingsTogglePressed;
    merged.debugPanelTogglePressed ||= state.debugPanelTogglePressed;
    merged.debugCommandPressed ??= state.debugCommandPressed;
    merged.upgradeBuyPressed ??= state.upgradeBuyPressed;
  }

  return merged;
}

function getUpgradeBuyIndex(code: string): number | null {
  if (code.startsWith('Digit')) {
    const digit = Number(code.slice('Digit'.length));
    return digit >= 1 && digit <= 6 ? digit - 1 : null;
  }

  if (code.startsWith('Numpad')) {
    const digit = Number(code.slice('Numpad'.length));
    return digit >= 1 && digit <= 6 ? digit - 1 : null;
  }

  return null;
}

function getDebugCommandNumber(code: string): number | null {
  if (!code.startsWith('F')) {
    return null;
  }

  const functionKey = Number(code.slice(1));

  return functionKey >= 2 && functionKey <= 8 ? functionKey : null;
}
