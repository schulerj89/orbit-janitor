import type { RadioCommsSnapshot } from '../systems/RadioComms';

export interface RadioOverlaySnapshot {
  radio: RadioCommsSnapshot;
  reducedMotion: boolean;
}

export class RadioOverlay {
  private readonly element: HTMLElement;
  private readonly speakerValue: HTMLElement;
  private readonly textValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="radio-overlay is-hidden" data-radio-overlay aria-live="polite" aria-hidden="true">
          <span class="radio-overlay-speaker" data-radio-speaker>DISPATCH</span>
          <p data-radio-text>Cleanup contract accepted.</p>
        </section>
      `
    );

    this.element = getElement(root, '[data-radio-overlay]');
    this.speakerValue = getElement(root, '[data-radio-speaker]');
    this.textValue = getElement(root, '[data-radio-text]');
  }

  update(snapshot: RadioOverlaySnapshot): void {
    this.speakerValue.textContent = snapshot.radio.speaker;
    this.textValue.textContent = snapshot.radio.text;
    this.element.classList.toggle('is-hidden', !snapshot.radio.isVisible);
    this.element.classList.toggle('is-reduced-motion', snapshot.reducedMotion);
    this.element.setAttribute('aria-hidden', String(!snapshot.radio.isVisible));
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing radio overlay element: ${selector}`);
  }

  return element;
}
