import type { GameState } from './Hud';

export interface PauseOverlaySnapshot {
  state: GameState;
  isPaused: boolean;
  helpOpen: boolean;
  sectorName: string;
  objectiveText: string;
  objectiveProgressText: string;
}

export class PauseOverlay {
  private readonly overlay: HTMLElement;
  private readonly sectorValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="pause-overlay is-hidden" data-pause-overlay aria-hidden="true">
          <h2 class="pause-overlay-title">Paused</h2>
          <p class="pause-overlay-sector" data-pause-sector>Low Orbit Cleanup</p>
          <p class="pause-overlay-objective" data-pause-objective>Objective: Reach cleanup target</p>
          <div class="pause-overlay-grid">
            <span>Resume</span>
            <strong>P or Escape</strong>
            <span>Help</span>
            <strong>H</strong>
            <span>Audio</span>
            <strong>M music / N SFX</strong>
          </div>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-pause-overlay]');
    this.sectorValue = getElement(root, '[data-pause-sector]');
    this.objectiveValue = getElement(root, '[data-pause-objective]');
  }

  update(snapshot: PauseOverlaySnapshot): void {
    this.sectorValue.textContent = snapshot.sectorName;
    this.objectiveValue.textContent = `${snapshot.objectiveText} (${snapshot.objectiveProgressText})`;
    this.setVisible(
      snapshot.state === 'playing' && snapshot.isPaused && !snapshot.helpOpen
    );
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing pause overlay element: ${selector}`);
  }

  return element;
}
