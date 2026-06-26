import { createNeutralInputState, type InputState } from '../input';

const STICK_DEADZONE = 0.35;
const TRIGGER_DEADZONE = 0.35;

const GAMEPAD_BUTTONS = {
  cross: 0,
  circle: 1,
  square: 2,
  leftShoulder: 4,
  rightShoulder: 5,
  rightTrigger: 7,
  start: 9,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15
} as const;

export class GamepadInput {
  private readonly previousButtons = new Map<number, boolean>();
  private previousLeft = false;
  private previousRight = false;

  consumeFrame(): InputState {
    const state = createNeutralInputState();
    const gamepad = this.getPrimaryGamepad();

    if (!gamepad) {
      this.previousButtons.clear();
      this.previousLeft = false;
      this.previousRight = false;
      return state;
    }

    const leftAxis = gamepad.axes[0] ?? 0;
    const left =
      leftAxis < -STICK_DEADZONE || this.isButtonDown(gamepad, GAMEPAD_BUTTONS.dpadLeft);
    const right =
      leftAxis > STICK_DEADZONE || this.isButtonDown(gamepad, GAMEPAD_BUTTONS.dpadRight);

    state.left = left;
    state.right = right;
    state.leftPressed = left && !this.previousLeft;
    state.rightPressed = right && !this.previousRight;

    this.previousLeft = left;
    this.previousRight = right;

    const laneUp =
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.dpadUp) ||
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.rightShoulder);
    const laneDown =
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.dpadDown) ||
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.leftShoulder);

    state.up = laneUp;
    state.down = laneDown;
    state.laneUpPressed =
      this.wasPressed(gamepad, GAMEPAD_BUTTONS.dpadUp) ||
      this.wasPressed(gamepad, GAMEPAD_BUTTONS.rightShoulder);
    state.laneDownPressed =
      this.wasPressed(gamepad, GAMEPAD_BUTTONS.dpadDown) ||
      this.wasPressed(gamepad, GAMEPAD_BUTTONS.leftShoulder);
    state.startPressed = this.wasPressed(gamepad, GAMEPAD_BUTTONS.cross);
    state.escapePressed = this.wasPressed(gamepad, GAMEPAD_BUTTONS.circle);
    state.pausePressed = this.wasPressed(gamepad, GAMEPAD_BUTTONS.start);
    state.boost =
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.rightTrigger, TRIGGER_DEADZONE) ||
      this.isButtonDown(gamepad, GAMEPAD_BUTTONS.square);

    this.storeButtonStates(gamepad);
    return state;
  }

  private getPrimaryGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads?.() ?? [];
    return gamepads.find((gamepad) => gamepad?.connected) ?? null;
  }

  private wasPressed(gamepad: Gamepad, buttonIndex: number): boolean {
    const isDown = this.isButtonDown(gamepad, buttonIndex);
    const wasDown = this.previousButtons.get(buttonIndex) ?? false;

    return isDown && !wasDown;
  }

  private isButtonDown(gamepad: Gamepad, buttonIndex: number, threshold = 0.5): boolean {
    const button = gamepad.buttons[buttonIndex];

    return Boolean(button?.pressed || (button?.value ?? 0) > threshold);
  }

  private storeButtonStates(gamepad: Gamepad): void {
    gamepad.buttons.forEach((button, index) => {
      this.previousButtons.set(index, button.pressed || button.value > 0.5);
    });
  }
}
