import { createNeutralInputState, type InputState } from '../input';
import type { GameState } from '../ui/Hud';
import type { GameExperienceMode } from '../systems/MobileLiteMode';

export interface MobileLiteTouchControlsContext {
  experienceMode: GameExperienceMode;
  state: GameState;
  overlaysOpen: boolean;
}

type MobileLiteTouchAction =
  | 'laneIn'
  | 'laneOut'
  | 'boost'
  | 'start'
  | 'previous'
  | 'next'
  | 'restart'
  | 'title';
const BLOCKED_GESTURE_EVENTS = ['contextmenu', 'selectstart', 'dragstart'] as const;

export class MobileLiteTouchControls {
  private readonly element: HTMLElement;
  private readonly state: InputState = createNeutralInputState();
  private currentGameState: GameState = 'title';

  constructor(root: HTMLElement) {
    this.element = document.createElement('nav');
    this.element.className = 'mobile-lite-touch-controls is-hidden';
    this.element.setAttribute('aria-label', 'Mobile Lite controls');
    this.element.innerHTML = `
      <div class="mobile-lite-touch-lanes">
        <button type="button" data-mobile-lite-action="laneIn" aria-label="Lane in">Lane In</button>
        <button type="button" data-mobile-lite-action="laneOut" aria-label="Lane out">Lane Out</button>
      </div>
      <button class="mobile-lite-touch-boost" type="button" data-mobile-lite-action="boost" aria-label="Boost">Boost</button>
      <button class="mobile-lite-touch-start" type="button" data-mobile-lite-action="start" aria-label="Start or restart">Start</button>
      <div class="mobile-lite-touch-end-actions">
        <button type="button" data-mobile-lite-action="previous" aria-label="Previous Mobile Lite sector">Back</button>
        <button type="button" data-mobile-lite-action="next" aria-label="Next Mobile Lite sector">Next</button>
        <button type="button" data-mobile-lite-action="restart" aria-label="Replay Mobile Lite">Replay</button>
        <button type="button" data-mobile-lite-action="title" aria-label="Return to title">Title</button>
      </div>
    `;
    root.append(this.element);

    for (const eventName of BLOCKED_GESTURE_EVENTS) {
      this.element.addEventListener(eventName, this.preventGesture);
    }
    this.element.addEventListener('touchstart', this.preventGesture, {
      passive: false
    });

    this.element
      .querySelectorAll<HTMLButtonElement>('[data-mobile-lite-action]')
      .forEach((button) => {
        const action = button.dataset.mobileLiteAction as MobileLiteTouchAction;

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

  update(context: MobileLiteTouchControlsContext): void {
    this.currentGameState = context.state;
    const isMobileLite = context.experienceMode === 'mobileLite';
    const canShowGameplay = context.state === 'playing' && !context.overlaysOpen;
    const canShowStart = context.state === 'title' && !context.overlaysOpen;
    const canShowEnd =
      context.state === 'missionComplete' || context.state === 'gameover';

    this.element.classList.toggle(
      'is-hidden',
      !isMobileLite || (!canShowGameplay && !canShowStart && !canShowEnd)
    );
    this.element.classList.toggle('is-gameplay', canShowGameplay);
    this.element.classList.toggle('is-startable', canShowStart);
    this.element.classList.toggle('is-endstate', canShowEnd);
    this.element.classList.toggle(
      'is-mission-complete',
      context.state === 'missionComplete'
    );
  }

  consumeFrame(): InputState {
    const frameState = { ...this.state };

    this.state.laneUpPressed = false;
    this.state.laneDownPressed = false;
    this.state.menuUpPressed = false;
    this.state.menuDownPressed = false;
    this.state.startPressed = false;
    this.state.restartPressed = false;
    this.state.sectorSelectPressed = false;
    this.state.escapePressed = false;
    this.state.cinematicSkipPressed = false;
    this.state.menuSelectPressed = false;
    return frameState;
  }

  private handlePointerDown(event: PointerEvent, action: MobileLiteTouchAction): void {
    event.preventDefault();

    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
      target.setPointerCapture(event.pointerId);
    }

    if (action === 'laneIn') {
      this.state.down = true;
      this.state.laneDownPressed = true;
      this.state.menuDownPressed = true;
      return;
    }

    if (action === 'laneOut') {
      this.state.up = true;
      this.state.laneUpPressed = true;
      this.state.menuUpPressed = true;
      return;
    }

    if (action === 'boost') {
      this.state.boost = true;
      return;
    }

    if (action === 'next') {
      this.state.startPressed = true;
      this.state.menuSelectPressed = true;
      this.state.cinematicSkipPressed = true;
      return;
    }

    if (action === 'previous') {
      this.state.sectorSelectPressed = true;
      this.state.cinematicSkipPressed = true;
      return;
    }

    if (action === 'restart') {
      this.state.restartPressed = true;
      this.state.cinematicSkipPressed = true;
      return;
    }

    if (action === 'title') {
      this.state.escapePressed = true;
      this.state.cinematicSkipPressed = true;
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

  private handlePointerUp(event: PointerEvent, action: MobileLiteTouchAction): void {
    event.preventDefault();
    this.releaseHold(action);
  }

  private readonly preventGesture = (event: Event): void => {
    event.preventDefault();
  };

  private releaseHold(action: MobileLiteTouchAction): void {
    if (action === 'laneIn') {
      this.state.down = false;
    } else if (action === 'laneOut') {
      this.state.up = false;
    } else if (action === 'boost') {
      this.state.boost = false;
    }
  }
}
