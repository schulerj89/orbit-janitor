import type { UpgradeSnapshot } from '../systems/UpgradeSystem';

export interface UpgradePanelSnapshot {
  isOpen: boolean;
  canShow: boolean;
  upgrades: UpgradeSnapshot;
}

export class UpgradePanel {
  private readonly overlay: HTMLElement;
  private readonly scrapValue: HTMLElement;
  private readonly lastRunScrapValue: HTMLElement;
  private readonly list: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="upgrade-panel is-hidden" data-upgrade-panel aria-hidden="true">
          <div class="upgrade-panel-header">
            <h2 class="upgrade-panel-title">Ship Upgrades</h2>
            <div class="upgrade-panel-scrap">
              <span>Total scrap</span>
              <strong data-upgrade-scrap>0</strong>
            </div>
          </div>
          <p class="upgrade-panel-last-run">Last run earned <strong data-upgrade-last-run>0</strong> scrap</p>
          <div class="upgrade-list" data-upgrade-list></div>
          <p class="upgrade-panel-help">Press 1-6 to buy | Press U to close</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-upgrade-panel]');
    this.scrapValue = getElement(root, '[data-upgrade-scrap]');
    this.lastRunScrapValue = getElement(root, '[data-upgrade-last-run]');
    this.list = getElement(root, '[data-upgrade-list]');
  }

  update(snapshot: UpgradePanelSnapshot): void {
    this.scrapValue.textContent = String(snapshot.upgrades.totalScrap);
    this.lastRunScrapValue.textContent = String(snapshot.upgrades.lastRunScrapEarned);
    this.list.innerHTML = snapshot.upgrades.items
      .map((item, index) => {
        const costLabel = item.isMaxed ? 'Maxed' : `${item.nextCost} scrap`;
        const stateClass = item.isMaxed
          ? 'is-maxed'
          : item.canAfford
            ? 'is-affordable'
            : 'is-locked';

        return `
          <article class="upgrade-item ${stateClass}">
            <div class="upgrade-item-key">${index + 1}</div>
            <div class="upgrade-item-body">
              <div class="upgrade-item-title">
                <strong>${item.name}</strong>
                <span>Level ${item.level}/${item.maxLevel}</span>
              </div>
              <p>${item.description}</p>
            </div>
            <div class="upgrade-item-cost">${costLabel}</div>
          </article>
        `;
      })
      .join('');
    this.setVisible(snapshot.isOpen && snapshot.canShow);
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing upgrade panel element: ${selector}`);
  }

  return element;
}
