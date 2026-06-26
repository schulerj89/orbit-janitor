import type { TutorialSnapshot } from '../systems/TutorialDirector';
import type { GameState } from './Hud';

export interface TutorialOverlaySnapshot {
  state: GameState;
  tutorial: TutorialSnapshot;
  upgradePanelOpen: boolean;
}

export class TutorialOverlay {
  private readonly element: HTMLElement;
  private readonly stepValue: HTMLElement;
  private readonly instructionValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="tutorial-overlay is-hidden" data-tutorial-overlay aria-hidden="true">
          <div class="tutorial-overlay-step" data-tutorial-step>Training 1/7</div>
          <p data-tutorial-instruction>Hold Left/A or Right/D to orbit the planet.</p>
          <small>Press K to skip tutorial</small>
        </section>
      `
    );

    this.element = getElement(root, '[data-tutorial-overlay]');
    this.stepValue = getElement(root, '[data-tutorial-step]');
    this.instructionValue = getElement(root, '[data-tutorial-instruction]');
  }

  update(snapshot: TutorialOverlaySnapshot): void {
    const step = snapshot.tutorial.currentStep;
    const canShow =
      snapshot.state === 'playing' &&
      snapshot.tutorial.isActive &&
      step !== null &&
      !snapshot.upgradePanelOpen;

    this.element.classList.toggle('is-hidden', !canShow);
    this.element.setAttribute('aria-hidden', String(!canShow));

    if (!step) {
      return;
    }

    this.stepValue.textContent = `Training ${snapshot.tutorial.stepIndex + 1}/${snapshot.tutorial.totalSteps}`;
    this.instructionValue.textContent = step.instruction;
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing tutorial overlay element: ${selector}`);
  }

  return element;
}
