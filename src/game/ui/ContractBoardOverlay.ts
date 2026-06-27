import type { ContractSnapshot } from '../systems/ContractSystem';

export interface ContractBoardOverlaySnapshot {
  isOpen: boolean;
  canShow: boolean;
  contracts: ContractSnapshot;
  selectedContractIndex: number;
}

export class ContractBoardOverlay {
  private readonly overlay: HTMLElement;
  private readonly contractList: HTMLElement;
  private readonly detailTitle: HTMLElement;
  private readonly detailBody: HTMLElement;
  private readonly detailReward: HTMLElement;
  private readonly detailProgress: HTMLElement;
  private readonly completedValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="contract-board-overlay is-hidden" data-contract-board-overlay aria-hidden="true">
          <div class="contract-board-header">
            <div>
              <span class="contract-board-kicker">Optional replay contracts</span>
              <h2 class="contract-board-title">Contract Board</h2>
            </div>
            <div class="contract-board-badge">
              <span>Cleared</span>
              <strong data-contract-board-completed>0 / 12</strong>
            </div>
          </div>
          <div class="contract-board-layout">
            <nav class="contract-board-list" data-contract-board-list aria-label="Challenge contracts"></nav>
            <aside class="contract-board-detail" aria-live="polite">
              <span data-contract-board-progress>0 / 1</span>
              <strong data-contract-board-detail-title>No Boost Cleanup</strong>
              <p data-contract-board-detail-body>Complete Low Orbit Cleanup without using boost.</p>
              <small data-contract-board-detail-reward>Reward: 18 scrap</small>
            </aside>
          </div>
          <p class="contract-board-help">Arrow keys choose | B or Escape closes</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-contract-board-overlay]');
    this.contractList = getElement(root, '[data-contract-board-list]');
    this.detailTitle = getElement(root, '[data-contract-board-detail-title]');
    this.detailBody = getElement(root, '[data-contract-board-detail-body]');
    this.detailReward = getElement(root, '[data-contract-board-detail-reward]');
    this.detailProgress = getElement(root, '[data-contract-board-progress]');
    this.completedValue = getElement(root, '[data-contract-board-completed]');
  }

  update(snapshot: ContractBoardOverlaySnapshot): void {
    const isVisible = snapshot.isOpen && snapshot.canShow;

    this.setVisible(isVisible);

    if (!isVisible) {
      return;
    }

    const selectedContract =
      snapshot.contracts.contracts[snapshot.selectedContractIndex] ??
      snapshot.contracts.contracts[0];

    this.completedValue.textContent = `${snapshot.contracts.completedCount} / ${snapshot.contracts.totalCount}`;
    this.contractList.innerHTML = snapshot.contracts.contracts
      .map(
        (contract, index) => `
          <article class="contract-board-item${index === snapshot.selectedContractIndex ? ' is-selected' : ''}${contract.isCompleted ? ' is-completed' : ''}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>${escapeHtml(contract.name)}</strong>
              <small>${contract.isCompleted ? 'Complete' : escapeHtml(contract.progress.text)}</small>
            </div>
          </article>
        `
      )
      .join('');

    if (selectedContract) {
      this.detailTitle.textContent = selectedContract.name;
      this.detailBody.textContent = selectedContract.description;
      this.detailProgress.textContent = selectedContract.isCompleted
        ? 'Complete'
        : selectedContract.progress.text;
      this.detailReward.textContent = `Reward: ${selectedContract.rewardText}`;
    }
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing contract board element: ${selector}`);
  }

  return element;
}
