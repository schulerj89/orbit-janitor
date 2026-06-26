import { getPowerupName, type PowerupType } from '../entities/Powerup';

export class PowerupToast {
  private readonly element: HTMLElement;
  private timer = 0;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <div class="powerup-toast is-hidden" data-powerup-toast aria-live="polite">
          <span class="powerup-toast-kicker">Powerup</span>
          <strong data-powerup-toast-name>Magnet Surge</strong>
        </div>
      `
    );

    this.element = getElement(root, '[data-powerup-toast]');
  }

  show(type: PowerupType): void {
    const nameValue = getElement(this.element, '[data-powerup-toast-name]');

    nameValue.textContent = getPowerupName(type);
    this.timer = 1.8;
    this.element.classList.remove('is-hidden');
  }

  update(delta: number): void {
    if (this.timer <= 0) {
      return;
    }

    this.timer = Math.max(0, this.timer - delta);

    if (this.timer <= 0) {
      this.element.classList.add('is-hidden');
    }
  }

  clear(): void {
    this.timer = 0;
    this.element.classList.add('is-hidden');
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing powerup toast element: ${selector}`);
  }

  return element;
}
