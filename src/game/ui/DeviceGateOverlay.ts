import type { DeviceProfileSnapshot } from '../systems/DeviceProfile';

export type DeviceGateOptionId = 'mobileLite';

export interface DeviceGateOverlaySnapshot {
  isOpen: boolean;
  profile: DeviceProfileSnapshot;
  selectedOptionIndex: number;
}

interface DeviceGateHandlers {
  onSelect: (optionId: DeviceGateOptionId) => void;
}

const OPTIONS: readonly {
  id: DeviceGateOptionId;
  label: string;
  note: string;
  disabled?: boolean;
}[] = [
  {
    id: 'mobileLite',
    label: 'Start Mobile Lite',
    note: 'Short sector route with big touch controls.'
  }
];

export class DeviceGateOverlay {
  private readonly overlay: HTMLElement;
  private readonly options: HTMLButtonElement[];
  private readonly orientationHint: HTMLElement;

  constructor(root: HTMLElement, handlers: DeviceGateHandlers) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="device-gate-overlay is-hidden" data-device-gate-overlay aria-hidden="true">
          <div class="device-gate-card" role="dialog" aria-modal="true" aria-labelledby="device-gate-title">
            <span class="device-gate-kicker">Mobile Experience</span>
            <h2 id="device-gate-title">Mobile Lite</h2>
            <p>Orbit Janitor's full campaign is optimized for desktop keyboard or gamepad.</p>
            <p>This phone route starts a streamlined Mobile Lite version with simplified missions and big touch controls.</p>
            <p>Use desktop for the full sector, upgrade, shipyard, and challenge experience.</p>
            <p class="device-gate-orientation" data-device-gate-orientation>Landscape recommended.</p>
            <div class="device-gate-actions" data-device-gate-actions></div>
          </div>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-device-gate-overlay]');
    const actionRoot = getElement(this.overlay, '[data-device-gate-actions]');
    this.orientationHint = getElement(this.overlay, '[data-device-gate-orientation]');
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
  }

  update(snapshot: DeviceGateOverlaySnapshot): void {
    this.setVisible(snapshot.isOpen);
    this.orientationHint.classList.toggle(
      'is-hidden',
      !(snapshot.profile.recommendedExperience === 'phone' && snapshot.profile.isPortrait)
    );

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

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing device gate element: ${selector}`);
  }

  return element;
}
