import type { MissionObjectiveSnapshot } from '../systems/MissionDirector';
import type { RunStatsSnapshot } from '../systems/RunStats';
import type { SectorConfig } from '../systems/SectorConfig';
import type { UpgradeSnapshot } from '../systems/UpgradeSystem';
import type { GameState } from './Hud';

export interface MissionCompleteOverlaySnapshot {
  state: GameState;
  sector: SectorConfig;
  objective: MissionObjectiveSnapshot;
  stats: RunStatsSnapshot;
  upgrades: UpgradeSnapshot;
  newlyUnlockedSectorName: string | null;
  upgradePanelOpen: boolean;
  cinematicActive: boolean;
}

export class MissionCompleteOverlay {
  private readonly overlay: HTMLElement;
  private readonly sectorValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly timeValue: HTMLElement;
  private readonly junkValue: HTMLElement;
  private readonly hazardsValue: HTMLElement;
  private readonly scrapValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;
  private readonly unlockValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="mission-complete-overlay is-hidden" data-mission-complete-overlay aria-hidden="true">
          <h2 class="mission-complete-title">Mission Complete</h2>
          <p class="mission-complete-sector" data-mission-sector>Low Orbit Cleanup</p>
          <div class="mission-complete-grid">
            <span>Objective</span>
            <strong data-mission-objective>Complete</strong>
            <span>Score</span>
            <strong data-mission-score>0</strong>
            <span>Time</span>
            <strong data-mission-time>0:00</strong>
            <span>Junk</span>
            <strong data-mission-junk>0</strong>
            <span>Hazards</span>
            <strong data-mission-hazards>0</strong>
            <span>Scrap earned</span>
            <strong data-mission-scrap>0</strong>
            <span>Unlocked</span>
            <strong data-mission-unlock>None</strong>
          </div>
          <p class="mission-complete-help">Enter next sector | R replay | Escape title</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-mission-complete-overlay]');
    this.sectorValue = getElement(root, '[data-mission-sector]');
    this.scoreValue = getElement(root, '[data-mission-score]');
    this.timeValue = getElement(root, '[data-mission-time]');
    this.junkValue = getElement(root, '[data-mission-junk]');
    this.hazardsValue = getElement(root, '[data-mission-hazards]');
    this.scrapValue = getElement(root, '[data-mission-scrap]');
    this.objectiveValue = getElement(root, '[data-mission-objective]');
    this.unlockValue = getElement(root, '[data-mission-unlock]');
  }

  update(snapshot: MissionCompleteOverlaySnapshot): void {
    this.sectorValue.textContent = snapshot.sector.name;
    this.objectiveValue.textContent = snapshot.objective.text.replace('Objective: ', '');
    this.scoreValue.textContent = String(snapshot.stats.finalScore);
    this.timeValue.textContent = formatRunTime(snapshot.stats.runTime);
    this.junkValue.textContent = String(snapshot.stats.junkCollected);
    this.hazardsValue.textContent = String(snapshot.stats.hazardsSurvived);
    this.scrapValue.textContent = String(snapshot.upgrades.lastRunScrapEarned);
    this.unlockValue.textContent = snapshot.newlyUnlockedSectorName ?? 'None';
    this.unlockValue.classList.toggle(
      'is-complete',
      snapshot.newlyUnlockedSectorName !== null
    );
    this.setVisible(
      snapshot.state === 'missionComplete' &&
        !snapshot.upgradePanelOpen &&
        !snapshot.cinematicActive
    );
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
    throw new Error(`Missing mission complete element: ${selector}`);
  }

  return element;
}
