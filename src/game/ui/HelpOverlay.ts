import type { GameState } from './Hud';

export interface HelpOverlaySnapshot {
  state: GameState;
  isOpen: boolean;
  sectorName: string;
  objectiveText: string;
  objectiveProgressText: string;
}

export class HelpOverlay {
  private readonly overlay: HTMLElement;
  private readonly sectorValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="help-overlay is-hidden" data-help-overlay aria-hidden="true">
          <h2 class="help-overlay-title">Instructions</h2>
          <p class="help-overlay-context">
            <strong data-help-sector>Orbit Janitor</strong>
            <span data-help-objective>Choose a sector, daily challenge, or seeded run.</span>
          </p>
          <div class="help-overlay-grid">
            <span>Objective</span>
            <strong>Clear the current mission target, then keep improving routes and upgrades.</strong>
            <span>Controls</span>
            <strong>Left/A and Right/D orbit. Up/W and Down/S switch lanes. Space boosts.</strong>
            <span>Orbit lanes</span>
            <strong>Three lanes wrap around the planet. Read lane position before switching.</strong>
            <span>Junk</span>
            <strong>Collect junk for score. Fast pickups extend combo and raise multiplier.</strong>
            <span>Boost fuel</span>
            <strong>Boost drains fuel while held and recharges when released.</strong>
            <span>Hazards</span>
            <strong>Orange is warning. Red is active danger. Move before red touches your lane.</strong>
            <span>Satellites</span>
            <strong>Satellites are solid obstacles. Avoid their lane or time the orbit.</strong>
            <span>Upgrades</span>
            <strong>Earn scrap after runs. Open upgrades with U on title or summary screens.</strong>
            <span>Challenges</span>
            <strong>Daily and seeded runs use fixed spawn sequences for repeatable routes.</strong>
            <span>Audio</span>
            <strong>M toggles music, - and = adjust music volume, N toggles SFX.</strong>
          </div>
          <p class="help-overlay-footer">H close | Escape close</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-help-overlay]');
    this.sectorValue = getElement(root, '[data-help-sector]');
    this.objectiveValue = getElement(root, '[data-help-objective]');
  }

  update(snapshot: HelpOverlaySnapshot): void {
    this.sectorValue.textContent =
      snapshot.state === 'title' ? 'Orbit Janitor' : snapshot.sectorName;
    this.objectiveValue.textContent =
      snapshot.state === 'title'
        ? 'Choose a sector, daily challenge, or seeded run.'
        : `${snapshot.objectiveText} (${snapshot.objectiveProgressText})`;
    this.setVisible(snapshot.isOpen);
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing help overlay element: ${selector}`);
  }

  return element;
}
