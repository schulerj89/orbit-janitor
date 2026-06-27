import type { DeviceProfileSnapshot } from '../systems/DeviceProfile';

export type DeviceGateOptionId = 'continueFullGame' | 'mobileLite' | 'remindLater';

export interface DeviceGateOverlaySnapshot {
  isOpen: boolean;
  profile: DeviceProfileSnapshot;
  selectedOptionIndex: number;
  dontShowAgain: boolean;
}

interface DeviceGateHandlers {
  onSelect: (optionId: DeviceGateOptionId) => void;
  onToggleDontShowAgain: () => void;
}

const OPTIONS: readonly {
  id: DeviceGateOptionId;
  label: string;
  note: string;
  disabled?: boolean;
}[] = [
  {
    id: 'continueFullGame',
    label: 'Continue Full Game',
    note: 'Keyboard, gamepad, and touch controls remain available.'
  },
  {
    id: 'mobileLite',
    label: 'Try Mobile Lite',
    note: 'Mobile Lite coming soon',
    disabled: true
  },
  {
    id: 'remindLater',
    label: 'Remind Me Later',
    note: 'Return to the title screen for this session.'
  }
];

export class DeviceGateOverlay {
  private readonly overlay: HTMLElement;
  private readonly options: HTMLButtonElement[];
  private readonly orientationHint: HTMLElement;
  private readonly profileValue: HTMLElement;
  private readonly dontShowButton: HTMLButtonElement;

  constructor(root: HTMLElement, handlers: DeviceGateHandlers) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="device-gate-overlay is-hidden" data-device-gate-overlay aria-hidden="true">
          <div class="device-gate-card" role="dialog" aria-modal="true" aria-labelledby="device-gate-title">
            <span class="device-gate-kicker">Device Experience</span>
            <h2 id="device-gate-title">Desktop Optimized</h2>
            <p>Orbit Janitor is optimized for desktop keyboard or gamepad.</p>
            <p>Mobile Lite is experimental and simplified.</p>
            <p>For the full sector, upgrade, shipyard, and challenge experience, play on desktop.</p>
            <p class="device-gate-orientation" data-device-gate-orientation>Landscape recommended.</p>
            <div class="device-gate-actions" data-device-gate-actions></div>
            <button class="device-gate-checkbox" type="button" data-device-gate-dismiss-toggle aria-pressed="false">
              <span aria-hidden="true"></span>
              Don't show again on this device
            </button>
            <div class="device-gate-footer">
              <span data-device-gate-profile>Phone profile</span>
              <strong>Up/Down choose | Enter select | D toggle</strong>
            </div>
          </div>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-device-gate-overlay]');
    const actionRoot = getElement(this.overlay, '[data-device-gate-actions]');
    this.orientationHint = getElement(this.overlay, '[data-device-gate-orientation]');
    this.profileValue = getElement(this.overlay, '[data-device-gate-profile]');
    this.dontShowButton = getElement(
      this.overlay,
      '[data-device-gate-dismiss-toggle]'
    ) as HTMLButtonElement;
    this.options = OPTIONS.map((option, index) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'device-gate-option';
      button.dataset.deviceGateOption = option.id;
      button.disabled = Boolean(option.disabled);
      button.innerHTML = `
        <strong>${option.label}</strong>
        <small>${option.note}</small>
      `;
      button.addEventListener('click', () => {
        handlers.onSelect(option.id);
      });
      actionRoot.append(button);
      return button;
    });

    this.dontShowButton.addEventListener('click', () => {
      handlers.onToggleDontShowAgain();
    });
  }

  update(snapshot: DeviceGateOverlaySnapshot): void {
    this.setVisible(snapshot.isOpen);
    this.orientationHint.classList.toggle(
      'is-hidden',
      !(snapshot.profile.recommendedExperience === 'phone' && snapshot.profile.isPortrait)
    );
    this.profileValue.textContent = `${titleCase(snapshot.profile.recommendedExperience)} profile`;
    this.dontShowButton.setAttribute('aria-pressed', String(snapshot.dontShowAgain));
    this.dontShowButton.classList.toggle('is-checked', snapshot.dontShowAgain);

    this.options.forEach((button, index) => {
      button.classList.toggle(
        'is-selected',
        snapshot.isOpen && index === snapshot.selectedOptionIndex
      );
      button.tabIndex = snapshot.isOpen && !button.disabled ? 0 : -1;
    });
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

export function getDeviceGateOption(index: number): DeviceGateOptionId {
  return OPTIONS[normalizeDeviceGateOptionIndex(index)].id;
}

export function normalizeDeviceGateOptionIndex(index: number): number {
  return (index + OPTIONS.length) % OPTIONS.length;
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing device gate element: ${selector}`);
  }

  return element;
}
