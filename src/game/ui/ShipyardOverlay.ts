import type { ShipUnlockSnapshot } from '../systems/ShipUnlockSystem';

export interface ShipyardOverlaySnapshot {
  isOpen: boolean;
  canShow: boolean;
  ships: ShipUnlockSnapshot;
  selectedShipIndex: number;
}

export class ShipyardOverlay {
  private readonly overlay: HTMLElement;
  private readonly shipList: HTMLElement;
  private readonly detailTitle: HTMLElement;
  private readonly detailBody: HTMLElement;
  private readonly detailMeta: HTMLElement;
  private readonly unlockedValue: HTMLElement;
  private readonly equippedValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="shipyard-overlay is-hidden" data-shipyard-overlay aria-hidden="true">
          <div class="shipyard-header">
            <div>
              <span class="shipyard-kicker">Procedural hangar</span>
              <h2 class="shipyard-title">Shipyard</h2>
            </div>
            <div class="shipyard-badge">
              <span>Equipped</span>
              <strong data-shipyard-equipped>Scrapper</strong>
            </div>
          </div>
          <div class="shipyard-layout">
            <nav class="shipyard-list" data-shipyard-list aria-label="Ship models"></nav>
            <aside class="shipyard-detail" aria-live="polite">
              <span data-shipyard-unlocked>1 / 8 unlocked</span>
              <strong data-shipyard-detail-title>Scrapper</strong>
              <p data-shipyard-detail-body>Balanced cleanup ship with a practical utility profile.</p>
              <small data-shipyard-detail-meta>Equipped</small>
              <div class="shipyard-preview-note">Selected ship previews on the title scene.</div>
            </aside>
          </div>
          <p class="shipyard-help">Arrow keys choose | Enter equips | Y or Escape closes</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-shipyard-overlay]');
    this.shipList = getElement(root, '[data-shipyard-list]');
    this.detailTitle = getElement(root, '[data-shipyard-detail-title]');
    this.detailBody = getElement(root, '[data-shipyard-detail-body]');
    this.detailMeta = getElement(root, '[data-shipyard-detail-meta]');
    this.unlockedValue = getElement(root, '[data-shipyard-unlocked]');
    this.equippedValue = getElement(root, '[data-shipyard-equipped]');
  }

  update(snapshot: ShipyardOverlaySnapshot): void {
    const isVisible = snapshot.isOpen && snapshot.canShow;

    this.setVisible(isVisible);

    if (!isVisible) {
      return;
    }

    const selectedShip =
      snapshot.ships.ships[snapshot.selectedShipIndex] ?? snapshot.ships.ships[0];
    const equippedShip =
      snapshot.ships.ships.find((ship) => ship.isEquipped) ?? snapshot.ships.ships[0];
    const unlockedCount = snapshot.ships.ships.filter((ship) => ship.isUnlocked).length;

    this.equippedValue.textContent = equippedShip?.name ?? 'Scrapper';
    this.unlockedValue.textContent = `${unlockedCount} / ${snapshot.ships.ships.length} unlocked`;
    this.shipList.innerHTML = snapshot.ships.ships
      .map((ship, index) => {
        const stateLabel = ship.isEquipped
          ? 'Equipped'
          : ship.isUnlocked
            ? 'Unlocked'
            : 'Locked';

        return `
          <article class="shipyard-item${index === snapshot.selectedShipIndex ? ' is-selected' : ''}${ship.isUnlocked ? '' : ' is-locked'}${ship.isEquipped ? ' is-equipped' : ''}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>${escapeHtml(ship.name)}</strong>
              <small>${stateLabel}</small>
            </div>
          </article>
        `;
      })
      .join('');

    if (selectedShip) {
      this.detailTitle.textContent = selectedShip.name;
      this.detailBody.textContent = selectedShip.isUnlocked
        ? selectedShip.description
        : selectedShip.unlockHint;
      this.detailMeta.textContent = selectedShip.isEquipped
        ? 'Equipped'
        : selectedShip.isUnlocked
          ? 'Press Enter to equip'
          : selectedShip.unlockHint;
    }
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing shipyard overlay element: ${selector}`);
  }

  return element;
}
