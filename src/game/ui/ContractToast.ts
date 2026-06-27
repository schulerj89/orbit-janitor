export class ContractToast {
  private readonly element: HTMLElement;
  private readonly nameValue: HTMLElement;
  private readonly rewardValue: HTMLElement;
  private timer = 0;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <div class="contract-toast is-hidden" data-contract-toast aria-live="polite">
          <span class="contract-toast-kicker">Contract Complete</span>
          <strong data-contract-toast-name>No Boost Cleanup</strong>
          <small data-contract-toast-reward>Reward claimed</small>
        </div>
      `
    );

    this.element = getElement(root, '[data-contract-toast]');
    this.nameValue = getElement(this.element, '[data-contract-toast-name]');
    this.rewardValue = getElement(this.element, '[data-contract-toast-reward]');
  }

  show(contractNames: readonly string[], rewardText: string): void {
    this.nameValue.textContent =
      contractNames.length === 1
        ? contractNames[0]
        : `${contractNames.length} contracts complete`;
    this.rewardValue.textContent = rewardText;
    this.timer = 3.2;
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
    throw new Error(`Missing contract toast element: ${selector}`);
  }

  return element;
}
