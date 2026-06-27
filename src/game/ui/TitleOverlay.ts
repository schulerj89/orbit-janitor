import type { CinematicPresetKey } from '../cinematics/CinematicShot';
import { renderLogoTreatment } from './LogoTreatment';
import {
  MAIN_MENU_OPTIONS,
  getMainMenuOption,
  normalizeMainMenuIndex,
  renderMainMenuOverlay
} from './MainMenuOverlay';
import {
  getMenuPreviewContent,
  renderMenuPreviewPanel,
  type MenuPreviewSnapshot
} from './MenuPreviewPanel';
import type { GameState } from './Hud';

export interface TitleOverlaySnapshot extends Omit<
  MenuPreviewSnapshot,
  'selectedOptionId'
> {
  state: GameState;
  selectedMenuIndex: number;
  menuInteracted: boolean;
  upgradePanelOpen: boolean;
  contractBoardOpen: boolean;
  galleryOpen: boolean;
  shipyardOpen: boolean;
  settingsOpen: boolean;
  helpOpen: boolean;
  bestScore: number;
  titleBadgeLabel: string;
  lastUnlockedSectorName: string;
  cinematicPresetKey: CinematicPresetKey | null;
}

export class TitleOverlay {
  private readonly overlay: HTMLElement;
  private readonly menuRows: HTMLElement[];
  private readonly promptValue: HTMLElement;
  private readonly previewEyebrowValue: HTMLElement;
  private readonly previewTitleValue: HTMLElement;
  private readonly previewBodyValue: HTMLElement;
  private readonly previewMetaValue: HTMLElement;
  private readonly bestScoreValue: HTMLElement;
  private readonly dailyValue: HTMLElement;
  private readonly audioValue: HTMLElement;
  private readonly unlockedValue: HTMLElement;
  private readonly badgeValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="title-overlay" data-title-overlay aria-hidden="false">
          <div class="title-background-lines" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="title-hero-panel">
            ${renderLogoTreatment()}
            <p class="title-overlay-subtitle">Clean the lanes. Dodge the warnings. Keep the combo alive.</p>
            <p class="title-press-start" data-title-press-start>Press Enter / Space</p>
          </div>
          <div class="title-command-panel">
            <div class="title-menu-column">
              <span class="title-panel-label">Main Menu</span>
              ${renderMainMenuOverlay()}
            </div>
            <div class="title-info-column">
              ${renderMenuPreviewPanel()}
              <aside class="title-status-panel" aria-label="Pilot status">
                <div>
                  <span>Best</span>
                  <strong data-title-best-score>0</strong>
                </div>
                <div>
                  <span>Daily</span>
                  <strong data-title-daily>0000-00-00 / 0</strong>
                </div>
                <div>
                  <span>Audio</span>
                  <strong data-title-audio>Music On / SFX On</strong>
                </div>
                <div>
                  <span>Unlocked</span>
                  <strong data-title-unlocked>Low Orbit Cleanup</strong>
                </div>
                <div>
                  <span>Badge</span>
                  <strong data-title-badge>None</strong>
                </div>
              </aside>
            </div>
          </div>
          <p class="title-overlay-footer">
            Arrows/W/S select | Enter/Space activate | H help | B contracts | Y shipyard | G gallery | M/N audio | T/C/D/S/U/O shortcuts
          </p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-title-overlay]');
    this.menuRows = MAIN_MENU_OPTIONS.map((_, index) =>
      getElement(root, `[data-main-menu-option="${index}"]`)
    );
    this.promptValue = getElement(root, '[data-title-press-start]');
    this.previewEyebrowValue = getElement(root, '[data-menu-preview-eyebrow]');
    this.previewTitleValue = getElement(root, '[data-menu-preview-title]');
    this.previewBodyValue = getElement(root, '[data-menu-preview-body]');
    this.previewMetaValue = getElement(root, '[data-menu-preview-meta]');
    this.bestScoreValue = getElement(root, '[data-title-best-score]');
    this.dailyValue = getElement(root, '[data-title-daily]');
    this.audioValue = getElement(root, '[data-title-audio]');
    this.unlockedValue = getElement(root, '[data-title-unlocked]');
    this.badgeValue = getElement(root, '[data-title-badge]');
  }

  update(snapshot: TitleOverlaySnapshot): void {
    const selectedIndex = normalizeMainMenuIndex(snapshot.selectedMenuIndex);
    const selectedOption = getMainMenuOption(selectedIndex);
    const preview = getMenuPreviewContent({
      ...snapshot,
      selectedOptionId: selectedOption.id
    });

    this.menuRows.forEach((row, index) => {
      const option = getMainMenuOption(index);
      const isSelected = index === selectedIndex;

      row.classList.toggle('is-selected', isSelected);
      row.classList.toggle('is-disabled', Boolean(option.disabled));
      row.setAttribute('aria-selected', String(isSelected));
      row.setAttribute('aria-disabled', String(Boolean(option.disabled)));
    });

    this.promptValue.classList.toggle('is-hidden', snapshot.menuInteracted);
    this.previewEyebrowValue.textContent = preview.eyebrow;
    this.previewTitleValue.textContent = preview.title;
    this.previewBodyValue.textContent = preview.body;
    this.previewMetaValue.textContent = preview.meta;
    this.bestScoreValue.textContent = String(snapshot.bestScore);
    this.dailyValue.textContent = `${snapshot.dailySeed} / ${snapshot.dailyBestScore}`;
    this.audioValue.textContent = `Music ${snapshot.musicEnabled ? `${Math.round(snapshot.musicVolume * 100)}%` : 'Off'} / SFX ${snapshot.sfxEnabled ? 'On' : 'Off'}`;
    this.unlockedValue.textContent = snapshot.lastUnlockedSectorName;
    this.badgeValue.textContent = snapshot.titleBadgeLabel;

    this.setVisible(
      snapshot.state === 'title' &&
        !snapshot.upgradePanelOpen &&
        !snapshot.contractBoardOpen &&
        !snapshot.galleryOpen &&
        !snapshot.shipyardOpen &&
        !snapshot.settingsOpen &&
        !snapshot.helpOpen
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
    throw new Error(`Missing title overlay element: ${selector}`);
  }

  return element;
}
