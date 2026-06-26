import type { SettingsSnapshot } from '../systems/SettingsSystem';

export interface SettingsOverlaySnapshot {
  isOpen: boolean;
  settings: SettingsSnapshot;
  selectedIndex: number;
}

const SETTING_ROWS = [
  {
    label: 'Reduced motion',
    getValue: (settings: SettingsSnapshot) => (settings.reducedMotion ? 'On' : 'Off')
  },
  {
    label: 'Screen shake',
    getValue: (settings: SettingsSnapshot) => titleCase(settings.screenShakeIntensity)
  },
  {
    label: 'Music volume',
    getValue: (settings: SettingsSnapshot) => `${Math.round(settings.musicVolume * 100)}%`
  },
  {
    label: 'SFX volume',
    getValue: (settings: SettingsSnapshot) => `${Math.round(settings.sfxVolume * 100)}%`
  },
  {
    label: 'Hazard contrast',
    getValue: (settings: SettingsSnapshot) =>
      settings.highContrastHazards ? 'High' : 'Sector'
  },
  {
    label: 'Touch controls',
    getValue: (settings: SettingsSnapshot) => titleCase(settings.touchControlsMode)
  }
] as const;

export class SettingsOverlay {
  private readonly overlay: HTMLElement;
  private readonly list: HTMLElement;
  private readonly rows: HTMLElement[] = [];

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="settings-overlay is-hidden" data-settings-overlay aria-hidden="true">
          <h2 class="settings-overlay-title">Settings</h2>
          <p class="settings-overlay-context">Arrow/WASD to choose or adjust. Enter cycles selected setting.</p>
          <div class="settings-list" data-settings-list></div>
          <p class="settings-overlay-help">O close | Escape close | [ ] SFX volume</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-settings-overlay]');
    this.list = getElement(root, '[data-settings-list]');
    this.rows = SETTING_ROWS.map((row, index) => {
      const element = document.createElement('div');

      element.className = 'settings-row';
      element.innerHTML = `
        <span>${row.label}</span>
        <strong data-settings-value="${index}">${row.getValue(getFallbackSettings())}</strong>
      `;
      this.list.append(element);
      return element;
    });
  }

  update(snapshot: SettingsOverlaySnapshot): void {
    SETTING_ROWS.forEach((row, index) => {
      const value = getElement(this.rows[index], `[data-settings-value="${index}"]`);

      value.textContent = row.getValue(snapshot.settings);
      this.rows[index].classList.toggle(
        'is-selected',
        snapshot.isOpen && snapshot.selectedIndex === index
      );
    });

    this.overlay.classList.toggle('is-hidden', !snapshot.isOpen);
    this.overlay.setAttribute('aria-hidden', String(!snapshot.isOpen));
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing settings overlay element: ${selector}`);
  }

  return element;
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getFallbackSettings(): SettingsSnapshot {
  return {
    reducedMotion: false,
    screenShakeIntensity: 'normal',
    musicVolume: 1,
    sfxVolume: 1,
    highContrastHazards: false,
    touchControlsMode: 'auto'
  };
}
