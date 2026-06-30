import { getMedalLabel, type MedalSnapshot } from '../systems/MedalSystem';
import type { SectorProgressItem } from '../systems/SectorProgress';
import type { GameState } from './Hud';

export interface SectorSelectOverlaySnapshot {
  state: GameState;
  sectors: SectorProgressItem[];
  selectedSectorId: string;
  medals: MedalSnapshot;
  upgradePanelOpen: boolean;
}

export class SectorSelectOverlay {
  private readonly overlay: HTMLElement;
  private readonly list: HTMLElement;
  private readonly description: HTMLElement;
  private lastSelectedSectorId: string | null = null;
  private wasVisible = false;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="sector-select-overlay is-hidden" data-sector-select-overlay aria-hidden="true">
          <h2 class="sector-select-title">Sector Select</h2>
          <div class="sector-select-list" data-sector-select-list aria-label="Sectors" role="listbox"></div>
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
    const isVisible = snapshot.state === 'sectorSelect' && !snapshot.upgradePanelOpen;
    const selectedSectorId = selectedSector?.id ?? null;
    const shouldScrollSelected =
      isVisible && (!this.wasVisible || selectedSectorId !== this.lastSelectedSectorId);

    this.list.replaceChildren(
      ...snapshot.sectors.map((sector) =>
        this.createSectorRow(sector, selectedSectorId, snapshot.medals)
      )
    );
    this.description.textContent = selectedSector
      ? getDescription(selectedSector)
      : 'No sectors available.';
    this.setVisible(isVisible);

    if (shouldScrollSelected) {
      this.scrollSelectedRowIntoView();
    }

    this.lastSelectedSectorId = selectedSectorId;
    this.wasVisible = isVisible;
  }

  private createSectorRow(
    sector: SectorProgressItem,
    selectedSectorId: string | null,
    medals: MedalSnapshot
  ): HTMLElement {
    const row = document.createElement('div');
    const medal = getMedalLabel(getSectorMedal(sector, medals));
    const isSelected = sector.id === selectedSectorId;
    const status = sector.isCompleted
      ? medal === 'None'
        ? 'Complete'
        : `${medal} Medal`
      : sector.isUnlocked
        ? sector.objective.description
        : `Locked: clear ${sector.unlocksAfterName}`;

    row.className = 'sector-select-row';
    row.dataset.sectorId = sector.id;
    row.dataset.sectorSelected = String(isSelected);
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(isSelected));
    row.setAttribute('aria-disabled', String(!sector.isUnlocked));
    row.classList.toggle('is-selected', isSelected);
    row.classList.toggle('is-locked', !sector.isUnlocked);
    row.classList.toggle('is-complete', sector.isCompleted);
    row.append(
      createTextElement('span', sector.name),
      createTextElement('strong', sector.subtitle),
      createTextElement('small', status)
    );

    return row;
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }

  private scrollSelectedRowIntoView(): void {
    this.list
      .querySelector<HTMLElement>('[data-sector-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }
}

function getSectorMedal(
  sector: SectorProgressItem,
  medals: MedalSnapshot
): import('../systems/MedalSystem').MedalTier {
  if (sector.isTutorial || sector.isEndless) {
    return 'none';
  }

  return medals.medalBySectorId[sector.id] ?? 'none';
}

function getDescription(sector: SectorProgressItem): string {
  if (sector.isUnlocked) {
    return sector.description;
  }

  return `Locked until ${sector.unlocksAfterName ?? 'another sector'} is complete.`;
}

function createTextElement(
  tagName: 'span' | 'strong' | 'small',
  text: string
): HTMLElement {
  const element = document.createElement(tagName);
  element.textContent = text;

  return element;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing sector select element: ${selector}`);
  }

  return element;
}
