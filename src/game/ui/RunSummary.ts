import type { RunStatsSnapshot } from '../systems/RunStats';
import type { UpgradeSnapshot } from '../systems/UpgradeSystem';
import type { GameState } from './Hud';

export interface RunSummarySnapshot {
  state: GameState;
  stats: RunStatsSnapshot;
  upgrades: UpgradeSnapshot;
  upgradePanelOpen: boolean;
}

export class RunSummary {
  private readonly overlay: HTMLElement;
  private readonly reasonValue: HTMLElement;
  private readonly finalScoreValue: HTMLElement;
  private readonly bestScoreValue: HTMLElement;
  private readonly timeValue: HTMLElement;
  private readonly junkValue: HTMLElement;
  private readonly comboValue: HTMLElement;
  private readonly multiplierValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;
  private readonly scrapEarnedValue: HTMLElement;
  private readonly totalScrapValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="run-summary is-hidden" data-run-summary aria-hidden="true">
          <h2 class="run-summary-title">Game Over</h2>
          <p class="run-summary-reason" data-summary-reason>Impact detected</p>
          <div class="run-summary-grid">
            <span>Final score</span>
            <strong data-summary-final-score>0</strong>
            <span>Best score</span>
            <strong data-summary-best-score>0</strong>
            <span>Time survived</span>
            <strong data-summary-time>0:00</strong>
            <span>Junk collected</span>
            <strong data-summary-junk>0</strong>
            <span>Longest combo</span>
            <strong data-summary-combo>0</strong>
            <span>Highest multiplier</span>
            <strong data-summary-multiplier>x1</strong>
            <span>Objective</span>
            <strong data-summary-objective>Objective failed</strong>
            <span>Scrap earned</span>
            <strong data-summary-scrap-earned>0</strong>
            <span>Total scrap</span>
            <strong data-summary-total-scrap>0</strong>
          </div>
          <p class="run-summary-restart">Press R to restart</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-run-summary]');
    this.reasonValue = getElement(root, '[data-summary-reason]');
    this.finalScoreValue = getElement(root, '[data-summary-final-score]');
    this.bestScoreValue = getElement(root, '[data-summary-best-score]');
    this.timeValue = getElement(root, '[data-summary-time]');
    this.junkValue = getElement(root, '[data-summary-junk]');
    this.comboValue = getElement(root, '[data-summary-combo]');
    this.multiplierValue = getElement(root, '[data-summary-multiplier]');
    this.objectiveValue = getElement(root, '[data-summary-objective]');
    this.scrapEarnedValue = getElement(root, '[data-summary-scrap-earned]');
    this.totalScrapValue = getElement(root, '[data-summary-total-scrap]');
  }

  update(snapshot: RunSummarySnapshot): void {
    const { stats } = snapshot;

    this.reasonValue.textContent = stats.gameOverReason;
    this.finalScoreValue.textContent = String(stats.finalScore);
    this.bestScoreValue.textContent = String(stats.bestScore);
    this.timeValue.textContent = formatRunTime(stats.runTime);
    this.junkValue.textContent = String(stats.junkCollected);
    this.comboValue.textContent = String(stats.longestCombo);
    this.multiplierValue.textContent = `x${stats.highestMultiplier}`;
    this.objectiveValue.textContent = stats.objectiveComplete
      ? 'Objective complete'
      : 'Objective failed';
    this.objectiveValue.classList.toggle('is-complete', stats.objectiveComplete);
    this.scrapEarnedValue.textContent = String(snapshot.upgrades.lastRunScrapEarned);
    this.totalScrapValue.textContent = String(snapshot.upgrades.totalScrap);
    this.setVisible(snapshot.state === 'gameover' && !snapshot.upgradePanelOpen);
  }

  private setVisible(isVisible: boolean): void {
    this.overlay.classList.toggle('is-hidden', !isVisible);
    this.overlay.setAttribute('aria-hidden', String(!isVisible));
  }
}

function formatRunTime(runTime: number): string {
  const totalSeconds = Math.max(0, Math.floor(runTime));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing run summary element: ${selector}`);
  }

  return element;
}
