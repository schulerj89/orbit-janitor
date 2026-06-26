export interface MissionIntroSnapshot {
  isVisible: boolean;
  sectorName: string;
  objectiveText: string;
  countdownLabel: string;
}

export class MissionIntroOverlay {
  private readonly element: HTMLElement;
  private readonly sectorValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;
  private readonly countdownValue: HTMLElement;

  constructor(root: HTMLElement) {
    this.element = document.createElement('section');
    this.element.className = 'mission-intro-overlay is-hidden';
    this.element.innerHTML = `
      <div class="mission-intro-card">
        <span class="mission-intro-kicker">Sector Start</span>
        <h2 data-mission-intro-sector>Low Orbit Cleanup</h2>
        <p data-mission-intro-objective>Objective: Reach 50 cleanup points</p>
        <strong data-mission-intro-countdown>3</strong>
      </div>
    `;
    root.append(this.element);

    this.sectorValue = getElement(this.element, '[data-mission-intro-sector]');
    this.objectiveValue = getElement(this.element, '[data-mission-intro-objective]');
    this.countdownValue = getElement(this.element, '[data-mission-intro-countdown]');
  }

  update(snapshot: MissionIntroSnapshot): void {
    this.element.classList.toggle('is-hidden', !snapshot.isVisible);
    this.sectorValue.textContent = snapshot.sectorName;
    this.objectiveValue.textContent = snapshot.objectiveText;
    this.countdownValue.textContent = snapshot.countdownLabel;
    this.countdownValue.classList.toggle('is-clean', snapshot.countdownLabel === 'CLEAN');
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing mission intro element: ${selector}`);
  }

  return element;
}
