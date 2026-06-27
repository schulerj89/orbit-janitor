import type { AchievementSnapshot } from '../systems/AchievementSystem';

export interface AchievementsOverlaySnapshot {
  isOpen: boolean;
  canShow: boolean;
  achievements: AchievementSnapshot;
  selectedAchievementIndex: number;
}

export class AchievementsOverlay {
  private readonly overlay: HTMLElement;
  private readonly achievementList: HTMLElement;
  private readonly detailTitle: HTMLElement;
  private readonly detailBody: HTMLElement;
  private readonly detailProgress: HTMLElement;
  private readonly completedValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <section class="achievements-overlay is-hidden" data-achievements-overlay aria-hidden="true">
          <div class="achievements-header">
            <div>
              <span class="achievements-kicker">Replay progression</span>
              <h2 class="achievements-title">Achievements</h2>
            </div>
            <div class="achievements-badge">
              <span>Unlocked</span>
              <strong data-achievements-completed>0 / 10</strong>
            </div>
          </div>
          <div class="achievements-layout">
            <nav class="achievements-list" data-achievements-list aria-label="Achievements"></nav>
            <aside class="achievements-detail" aria-live="polite">
              <span data-achievements-progress>0 / 1</span>
              <strong data-achievements-detail-title>First Cleanup</strong>
              <p data-achievements-detail-body>Complete any sector.</p>
            </aside>
          </div>
          <p class="achievements-help">Arrow keys choose | A or Escape closes</p>
        </section>
      `
    );

    this.overlay = getElement(root, '[data-achievements-overlay]');
    this.achievementList = getElement(root, '[data-achievements-list]');
    this.detailTitle = getElement(root, '[data-achievements-detail-title]');
    this.detailBody = getElement(root, '[data-achievements-detail-body]');
    this.detailProgress = getElement(root, '[data-achievements-progress]');
    this.completedValue = getElement(root, '[data-achievements-completed]');
  }

  update(snapshot: AchievementsOverlaySnapshot): void {
    const isVisible = snapshot.isOpen && snapshot.canShow;

    this.setVisible(isVisible);

    if (!isVisible) {
      return;
    }

    const selectedAchievement =
      snapshot.achievements.achievements[snapshot.selectedAchievementIndex] ??
      snapshot.achievements.achievements[0];

    this.completedValue.textContent = `${snapshot.achievements.unlockedCount} / ${snapshot.achievements.totalCount}`;
    this.achievementList.innerHTML = snapshot.achievements.achievements
      .map(
        (achievement, index) => `
          <article class="achievements-item${index === snapshot.selectedAchievementIndex ? ' is-selected' : ''}${achievement.isUnlocked ? ' is-unlocked' : ''}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>${escapeHtml(achievement.name)}</strong>
              <small>${achievement.isUnlocked ? 'Unlocked' : escapeHtml(achievement.progress.text)}</small>
            </div>
          </article>
        `
      )
      .join('');

    if (selectedAchievement) {
      this.detailTitle.textContent = selectedAchievement.name;
      this.detailBody.textContent = selectedAchievement.description;
      this.detailProgress.textContent = selectedAchievement.isUnlocked
        ? 'Unlocked'
        : selectedAchievement.progress.text;
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
    throw new Error(`Missing achievements overlay element: ${selector}`);
  }

  return element;
}
