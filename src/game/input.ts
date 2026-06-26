export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
  laneUpPressed: boolean;
  laneDownPressed: boolean;
  startPressed: boolean;
  restartPressed: boolean;
  musicTogglePressed: boolean;
  sfxTogglePressed: boolean;
  upgradeTogglePressed: boolean;
  upgradeBuyPressed: number | null;
}

export class InputController {
  private readonly state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
    laneUpPressed: false,
    laneDownPressed: false,
    startPressed: false,
    restartPressed: false,
    musicTogglePressed: false,
    sfxTogglePressed: false,
    upgradeTogglePressed: false,
    upgradeBuyPressed: null
  };

  constructor(target: Window = window) {
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
  }

  consumeFrame(): InputState {
    const frameState = { ...this.state };
    this.state.laneUpPressed = false;
    this.state.laneDownPressed = false;
    this.state.startPressed = false;
    this.state.restartPressed = false;
    this.state.musicTogglePressed = false;
    this.state.sfxTogglePressed = false;
    this.state.upgradeTogglePressed = false;
    this.state.upgradeBuyPressed = null;
    return frameState;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.state.left = true;
      event.preventDefault();
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.state.right = true;
      event.preventDefault();
    }

    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.state.up = true;
      if (!event.repeat) {
        this.state.laneUpPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      this.state.down = true;
      if (!event.repeat) {
        this.state.laneDownPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'Space') {
      this.state.boost = true;
      if (!event.repeat) {
        this.state.startPressed = true;
      }
      event.preventDefault();
    }

    if (event.code === 'Enter' && !event.repeat) {
      this.state.startPressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyR' && !event.repeat) {
      this.state.restartPressed = true;
    }

    if (event.code === 'KeyM' && !event.repeat) {
      this.state.musicTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyN' && !event.repeat) {
      this.state.sfxTogglePressed = true;
      event.preventDefault();
    }

    if (event.code === 'KeyU' && !event.repeat) {
      this.state.upgradeTogglePressed = true;
      event.preventDefault();
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
