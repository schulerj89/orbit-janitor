import { getMedalLabel, type MedalTier } from '../systems/MedalSystem';

export class RewardToast {
  private readonly element: HTMLElement;
  private readonly titleValue: HTMLElement;
  private readonly detailValue: HTMLElement;
  private timer = 0;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <div class="reward-toast is-hidden" data-reward-toast aria-live="polite">
          <span class="reward-toast-kicker">Reward</span>
          <strong data-reward-toast-title>Gold Medal</strong>
          <small data-reward-toast-detail>Achievement unlocked</small>
        </div>
      `
    );

    this.element = getElement(root, '[data-reward-toast]');
    this.titleValue = getElement(this.element, '[data-reward-toast-title]');
    this.detailValue = getElement(this.element, '[data-reward-toast-detail]');
  }

  show(options: {
    medalTier?: MedalTier;
    medalImproved?: boolean;
    achievementNames?: readonly string[];
  }): void {
    const achievementNames = options.achievementNames ?? [];
    const medalTitle =
      options.medalTier && options.medalTier !== 'none' && options.medalImproved
        ? `${getMedalLabel(options.medalTier)} Medal`
        : null;

    if (!medalTitle && achievementNames.length === 0) {
      return;
    }

    this.titleValue.textContent =
      medalTitle ??
      (achievementNames.length === 1
        ? achievementNames[0]
        : `${achievementNames.length} achievements`);
    this.detailValue.textContent =
      medalTitle && achievementNames.length > 0
        ? `Unlocked: ${achievementNames.join(', ')}`
        : achievementNames.length > 0
          ? 'Achievement unlocked'
          : 'Sector medal upgraded';
    this.timer = 3.4;
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
    throw new Error(`Missing reward toast element: ${selector}`);
  }

  return element;
}
