import { createNeutralInputState, type InputState } from '../input';
import type { GameState } from '../ui/Hud';
import type { TouchControlsMode } from '../systems/SettingsSystem';

export interface TouchControlsContext {
  state: GameState;
  overlaysOpen: boolean;
}

type TouchAction = 'left' | 'right' | 'boost' | 'laneUp' | 'laneDown' | 'start';

const AUTO_QUERY = '(width <= 760px), (pointer: coarse)';
const BLOCKED_GESTURE_EVENTS = ['contextmenu', 'selectstart', 'dragstart'] as const;

export class TouchControls {
  private readonly element: HTMLElement;
  private readonly mediaQuery = window.matchMedia(AUTO_QUERY);
  private readonly state: InputState = createNeutralInputState();
  private mode: TouchControlsMode = 'auto';
  private currentGameState: GameState = 'title';

  constructor(root: HTMLElement) {
    this.element = document.createElement('nav');
    this.element.className = 'touch-controls is-hidden';
    this.element.setAttribute('aria-label', 'Touch controls');
    this.element.innerHTML = `
      <div class="touch-controls-cluster touch-controls-rotate">
        <button type="button" data-touch-action="left" aria-label="Rotate left">Left</button>
        <button type="button" data-touch-action="right" aria-label="Rotate right">Right</button>
      </div>
      <div class="touch-controls-cluster touch-controls-lanes">
        <button type="button" data-touch-action="laneUp" aria-label="Switch lane up">Lane +</button>
        <button type="button" data-touch-action="laneDown" aria-label="Switch lane down">Lane -</button>
      </div>
      <button class="touch-control-boost" type="button" data-touch-action="boost" aria-label="Boost">Boost</button>
      <button class="touch-control-start" type="button" data-touch-action="start" aria-label="Start or restart">Start</button>
    `;
    root.append(this.element);

    for (const eventName of BLOCKED_GESTURE_EVENTS) {
      this.element.addEventListener(eventName, this.preventGesture);
    }
    this.element.addEventListener('touchstart', this.preventGesture, {
      passive: false
    });

    this.element
      .querySelectorAll<HTMLButtonElement>('[data-touch-action]')
      .forEach((button) => {
        const action = button.dataset.touchAction as TouchAction;

        button.addEventListener('pointerdown', (event) => {
          this.handlePointerDown(event, action);
        });
        button.addEventListener('pointerup', (event) => {
          this.handlePointerUp(event, action);
        });
        button.addEventListener('pointercancel', (event) => {
          this.handlePointerUp(event, action);
        });
        button.addEventListener('lostpointercapture', () => {
          this.releaseHold(action);
        });
      });
  }

  setMode(mode: TouchControlsMode): void {
    this.mode = mode;
  }

  update(context: TouchControlsContext): void {
    this.currentGameState = context.state;
    const canAutoShow = this.mediaQuery.matches;
    const enabled = this.mode === 'on' || (this.mode === 'auto' && canAutoShow);
    const canShowGameplay = context.state === 'playing' && !context.overlaysOpen;
    const canShowStart =
      context.state === 'title' ||
      context.state === 'sectorSelect' ||
      context.state === 'missionComplete' ||
      context.state === 'gameover';

    this.element.classList.toggle(
      'is-hidden',
      !enabled || (!canShowGameplay && !canShowStart)
    );
    this.element.classList.toggle('is-gameplay', canShowGameplay);
    this.element.classList.toggle('is-startable', canShowStart);
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
    this.state.restartPressed = false;
    this.state.cinematicSkipPressed = false;
    return frameState;
  }

  private handlePointerDown(event: PointerEvent, action: TouchAction): void {
    event.preventDefault();

    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId);
    }

    if (action === 'left') {
      this.state.left = true;
      this.state.leftPressed = true;
      return;
    }

    if (action === 'right') {
      this.state.right = true;
      this.state.rightPressed = true;
      return;
    }

    if (action === 'boost') {
      this.state.boost = true;
      return;
    }

    if (action === 'laneUp') {
      this.state.up = true;
      this.state.laneUpPressed = true;
      this.state.menuUpPressed = true;
      return;
    }

    if (action === 'laneDown') {
      this.state.down = true;
      this.state.laneDownPressed = true;
      this.state.menuDownPressed = true;
      return;
    }

    if (this.currentGameState === 'gameover') {
      this.state.restartPressed = true;
    } else {
      this.state.startPressed = true;
      this.state.menuSelectPressed = true;
    }

    this.state.cinematicSkipPressed = true;
  }

  private handlePointerUp(event: PointerEvent, action: TouchAction): void {
    event.preventDefault();
    this.releaseHold(action);
  }

  private readonly preventGesture = (event: Event): void => {
    event.preventDefault();
  };

  private releaseHold(action: TouchAction): void {
    if (action === 'left') {
      this.state.left = false;
    } else if (action === 'right') {
      this.state.right = false;
    } else if (action === 'boost') {
      this.state.boost = false;
    } else if (action === 'laneUp') {
      this.state.up = false;
    } else if (action === 'laneDown') {
      this.state.down = false;
    }
  }
}
