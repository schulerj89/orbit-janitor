import type { GameState } from './Hud';

export interface TitleOverlaySnapshot {
  state: GameState;
  upgradePanelOpen: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export class TitleOverlay {
  private readonly overlay: HTMLElement;
  private readonly musicValue: HTMLElement;
  private readonly sfxValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="title-overlay" data-title-overlay aria-hidden="false">
          <h2 class="title-overlay-title">Orbit Janitor</h2>
          <p class="title-overlay-subtitle">Clean the lanes. Dodge the warnings. Keep the combo alive.</p>
          <div class="title-controls" aria-label="Controls">
            <span>Rotate</span>
            <strong>Left/A and Right/D</strong>
            <span>Lanes</span>
            <strong>Up/W and Down/S</strong>
            <span>Boost</span>
            <strong>Space</strong>
            <span>Restart</span>
            <strong>R after crash</strong>
            <span>Upgrades</span>
            <strong>U, then 1-6 to buy</strong>
          </div>
          <p class="title-overlay-start">Press Enter or Space to start</p>
          <p class="title-overlay-footer">
            Audio starts after first input | M toggles music (<span data-title-music>On</span>) | N toggles SFX (<span data-title-sfx>On</span>)
          </p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-title-overlay]');
    this.musicValue = getElement(root, '[data-title-music]');
    this.sfxValue = getElement(root, '[data-title-sfx]');
  }

  update(snapshot: TitleOverlaySnapshot): void {
    this.musicValue.textContent = snapshot.musicEnabled ? 'On' : 'Off';
    this.sfxValue.textContent = snapshot.sfxEnabled ? 'On' : 'Off';
    this.setVisible(snapshot.state === 'title' && !snapshot.upgradePanelOpen);
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
