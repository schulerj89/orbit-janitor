import type { CosmeticSnapshot } from '../systems/CosmeticSystem';

export interface GalleryOverlaySnapshot {
  isOpen: boolean;
  canShow: boolean;
  cosmetics: CosmeticSnapshot;
  selectedCategoryIndex: number;
  selectedItemIndex: number;
}

export class GalleryOverlay {
  private readonly overlay: HTMLElement;
  private readonly categoryList: HTMLElement;
  private readonly itemList: HTMLElement;
  private readonly detailTitle: HTMLElement;
  private readonly detailBody: HTMLElement;
  private readonly detailMeta: HTMLElement;
  private readonly badgeValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="gallery-overlay is-hidden" data-gallery-overlay aria-hidden="true">
          <div class="gallery-header">
            <div>
              <span class="gallery-kicker">Non-gameplay progression</span>
              <h2 class="gallery-title">Cosmetic Gallery</h2>
            </div>
            <div class="gallery-badge">
              <span>Equipped Badge</span>
              <strong data-gallery-badge>None</strong>
            </div>
          </div>
          <div class="gallery-layout">
            <nav class="gallery-categories" data-gallery-categories aria-label="Cosmetic categories"></nav>
            <div class="gallery-items" data-gallery-items aria-label="Cosmetic items"></div>
            <aside class="gallery-detail" aria-live="polite">
              <span>Selected</span>
              <strong data-gallery-detail-title>Factory White</strong>
              <p data-gallery-detail-body>Clean white hull with dark utility wings.</p>
              <small data-gallery-detail-meta>Default kit.</small>
            </aside>
          </div>
          <p class="gallery-help">Arrow keys choose | Enter equips | G or Escape closes</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-gallery-overlay]');
    this.categoryList = getElement(root, '[data-gallery-categories]');
    this.itemList = getElement(root, '[data-gallery-items]');
    this.detailTitle = getElement(root, '[data-gallery-detail-title]');
    this.detailBody = getElement(root, '[data-gallery-detail-body]');
    this.detailMeta = getElement(root, '[data-gallery-detail-meta]');
    this.badgeValue = getElement(root, '[data-gallery-badge]');
  }

  update(snapshot: GalleryOverlaySnapshot): void {
    const isVisible = snapshot.isOpen && snapshot.canShow;

    this.setVisible(isVisible);

    if (!isVisible) {
      return;
    }

    const category =
      snapshot.cosmetics.categories[snapshot.selectedCategoryIndex] ??
      snapshot.cosmetics.categories[0];
    const item = category?.items[snapshot.selectedItemIndex] ?? category?.items[0];

    this.badgeValue.textContent = snapshot.cosmetics.visuals.titleBadgeLabel;
    this.categoryList.innerHTML = snapshot.cosmetics.categories
      .map(
        (candidate, index) => `
          <div class="gallery-category${index === snapshot.selectedCategoryIndex ? ' is-selected' : ''}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(candidate.label)}</strong>
          </div>
        `
      )
      .join('');
    this.itemList.innerHTML = category
      ? category.items
          .map((candidate, index) => {
            const swatch = candidate.swatchColor
              ? `<span class="gallery-swatch" style="--swatch-color: ${candidate.swatchColor}"></span>`
              : '<span class="gallery-swatch gallery-swatch-none"></span>';
            const stateLabel = candidate.isEquipped
              ? 'Equipped'
              : candidate.isUnlocked
                ? 'Unlocked'
                : 'Locked';

            return `
              <article class="gallery-item${index === snapshot.selectedItemIndex ? ' is-selected' : ''}${candidate.isUnlocked ? '' : ' is-locked'}${candidate.isEquipped ? ' is-equipped' : ''}">
                ${swatch}
                <div>
                  <strong>${escapeHtml(candidate.name)}</strong>
                  <small>${stateLabel}</small>
                </div>
              </article>
            `;
          })
          .join('')
      : '';

    if (item) {
      this.detailTitle.textContent = item.name;
      this.detailBody.textContent = item.isUnlocked ? item.description : item.unlockHint;
      this.detailMeta.textContent = item.isEquipped
        ? 'Equipped'
        : item.isUnlocked
          ? 'Press Enter to equip'
          : item.unlockHint;
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
    throw new Error(`Missing gallery overlay element: ${selector}`);
  }

  return element;
}
