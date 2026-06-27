import type { CinematicSnapshot } from '../cinematics/CinematicShot';

export class CinematicLetterbox {
  private readonly element: HTMLElement;
  private readonly titleValue: HTMLElement;
  private readonly subtitleValue: HTMLElement;
  private readonly skipValue: HTMLElement;
  private readonly progressValue: HTMLElement;

  constructor(root: HTMLElement) {
    this.element = document.createElement('section');
    this.element.className = 'cinematic-letterbox is-hidden';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = `
      <div class="cinematic-bar cinematic-bar-top" aria-hidden="true"></div>
      <div class="cinematic-bar cinematic-bar-bottom" aria-hidden="true"></div>
      <div class="cinematic-caption">
        <span class="cinematic-kicker">Sequence</span>
        <strong data-cinematic-title></strong>
        <p data-cinematic-subtitle></p>
        <small data-cinematic-skip></small>
        <span class="cinematic-progress" aria-hidden="true">
          <span data-cinematic-progress></span>
        </span>
      </div>
    `;
    root.append(this.element);

    this.titleValue = getElement(this.element, '[data-cinematic-title]');
    this.subtitleValue = getElement(this.element, '[data-cinematic-subtitle]');
    this.skipValue = getElement(this.element, '[data-cinematic-skip]');
    this.progressValue = getElement(this.element, '[data-cinematic-progress]');
  }

  update(snapshot: CinematicSnapshot): void {
    this.element.classList.toggle('is-hidden', !snapshot.isActive);
    this.element.classList.toggle('is-reduced-motion', snapshot.reducedMotion);
    this.element.setAttribute('aria-hidden', String(!snapshot.isActive));
    this.element.dataset.preset = snapshot.presetKey ?? '';
    this.titleValue.textContent = snapshot.title;
    this.subtitleValue.textContent = snapshot.subtitle;
    this.skipValue.textContent = snapshot.skipLabel;
    this.progressValue.style.transform = `scaleX(${snapshot.progress})`;
  }
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing cinematic letterbox element: ${selector}`);
  }

  return element;
}
