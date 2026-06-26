import type { SectorProgressItem } from '../systems/SectorProgress';
import type { GameState } from './Hud';

export interface SectorSelectOverlaySnapshot {
  state: GameState;
  sectors: SectorProgressItem[];
  selectedSectorId: string;
  upgradePanelOpen: boolean;
}

export class SectorSelectOverlay {
  private readonly overlay: HTMLElement;
  private readonly list: HTMLElement;
  private readonly description: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="sector-select-overlay is-hidden" data-sector-select-overlay aria-hidden="true">
          <h2 class="sector-select-title">Sector Select</h2>
          <div class="sector-select-list" data-sector-select-list aria-label="Sectors"></div>
          <p class="sector-select-description" data-sector-select-description></p>
          <p class="sector-select-help">Up/Down select | Enter start | Escape title</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-sector-select-overlay]');
    this.list = getElement(root, '[data-sector-select-list]');
    this.description = getElement(root, '[data-sector-select-description]');
  }

  update(snapshot: SectorSelectOverlaySnapshot): void {
    const selectedSector =
      snapshot.sectors.find((sector) => sector.id === snapshot.selectedSectorId) ??
      snapshot.sectors[0];

    this.list.replaceChildren(
      ...snapshot.sectors.map((sector) => this.createSectorRow(sector, selectedSector.id))
    );
    this.description.textContent = selectedSector
      ? getDescription(selectedSector)
      : 'No sectors available.';
    this.setVisible(snapshot.state === 'sectorSelect' && !snapshot.upgradePanelOpen);
  }

  private createSectorRow(
    sector: SectorProgressItem,
    selectedSectorId: string
  ): HTMLElement {
    const row = document.createElement('div');
    const status = sector.isCompleted
      ? 'Complete'
      : sector.isUnlocked
        ? sector.objective.description
        : `Locked: clear ${sector.unlocksAfterName}`;

    row.className = 'sector-select-row';
    row.classList.toggle('is-selected', sector.id === selectedSectorId);
    row.classList.toggle('is-locked', !sector.isUnlocked);
    row.classList.toggle('is-complete', sector.isCompleted);
    row.innerHTML = `
      <span>${sector.name}</span>
      <strong>${sector.subtitle}</strong>
      <small>${status}</small>
    `;

    return row;
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function getDescription(sector: SectorProgressItem): string {
  if (sector.isUnlocked) {
    return sector.description;
  }

  return `Locked until ${sector.unlocksAfterName ?? 'another sector'} is complete.`;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing sector select element: ${selector}`);
  }

  return element;
}
