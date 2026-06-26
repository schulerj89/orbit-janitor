export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
  laneUpPressed: boolean;
  laneDownPressed: boolean;
  restartPressed: boolean;
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
    restartPressed: false
  };

  constructor(target: Window = window) {
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('keyup', this.handleKeyUp);
  }

  consumeFrame(): InputState {
    const frameState = { ...this.state };
    this.state.laneUpPressed = false;
    this.state.laneDownPressed = false;
    this.state.restartPressed = false;
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
      event.preventDefault();
    }

    if (event.code === 'KeyR' && !event.repeat) {
      this.state.restartPressed = true;
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
