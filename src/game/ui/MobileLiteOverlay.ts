import type { MobileLiteSnapshot } from '../systems/MobileLiteMode';
import type { GameState } from './Hud';

export interface MobileLiteOverlaySnapshot {
  state: GameState;
  mobileLite: MobileLiteSnapshot;
  isPaused: boolean;
  overlaysOpen: boolean;
}

export class MobileLiteOverlay {
  private readonly overlay: HTMLElement;
  private readonly titleValue: HTMLElement;
  private readonly bodyValue: HTMLElement;
  private readonly stepValues: HTMLElement[];

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="mobile-lite-overlay is-hidden" data-mobile-lite-overlay aria-hidden="true">
          <span class="mobile-lite-overlay-kicker">Mobile Lite</span>
          <strong data-mobile-lite-title>Pocket Cleanup</strong>
          <p data-mobile-lite-body>Collect 20 junk or survive 75 seconds.</p>
          <ol class="mobile-lite-guide">
            <li data-mobile-lite-step="0">Tap Lane In/Out to dodge.</li>
            <li data-mobile-lite-step="1">Hold Boost to catch junk.</li>
            <li data-mobile-lite-step="2">Orange warns. Red hurts.</li>
          </ol>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-mobile-lite-overlay]');
    this.titleValue = getElement(root, '[data-mobile-lite-title]');
    this.bodyValue = getElement(root, '[data-mobile-lite-body]');
    this.stepValues = [0, 1, 2].map((index) =>
      getElement(root, `[data-mobile-lite-step="${index}"]`)
    );
  }

  update(snapshot: MobileLiteOverlaySnapshot): void {
    const isVisible =
      snapshot.mobileLite.isActive &&
      !snapshot.isPaused &&
      !snapshot.overlaysOpen &&
      (snapshot.state === 'title' ||
        (snapshot.state === 'playing' && snapshot.mobileLite.guideVisible));

    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.classList.toggle('is-title', snapshot.state === 'title');
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
    this.titleValue.textContent =
      snapshot.state === 'title' ? 'Pocket Cleanup' : snapshot.mobileLite.guideText;
    this.bodyValue.textContent =
      snapshot.state === 'title'
        ? 'A short phone-friendly run with auto-orbit and big touch controls.'
        : snapshot.mobileLite.objective.progressText;
    this.stepValues.forEach((step, index) => {
      step.classList.toggle(
        'is-active',
        snapshot.state === 'playing' && index === snapshot.mobileLite.guideStepIndex
      );
    });
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing Mobile Lite overlay element: ${selector}`);
  }

  return element;
}
