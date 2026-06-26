export type GameState = 'playing' | 'gameover';

export interface HudSnapshot {
  score: number;
  state: GameState;
  comboMultiplier: number;
  comboTimer: number;
  comboWindow: number;
  laneName: string;
  boostFuel: number;
  boostEmpty: boolean;
  runTime: number;
  objectiveTargetScore: number;
  objectiveComplete: boolean;
  hazardWarning: boolean;
  gameOverReason: string;
}

export class Hud {
  private readonly scoreValue: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly laneValue: HTMLElement;
  private readonly timerValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;
  private readonly comboRow: HTMLElement;
  private readonly comboValue: HTMLElement;
  private readonly comboTimerFill: HTMLElement;
  private readonly boostFill: HTMLElement;
  private readonly boostValue: HTMLElement;
  private readonly gameOver: HTMLElement;
  private readonly finalScore: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <section class="hud-panel hud-main" aria-live="polite">
        <h1 class="hud-title">Orbit Janitor</h1>
        <div class="hud-row">
          <span class="hud-label">Score</span>
          <span class="hud-value" data-hud-score>0</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Lane</span>
          <span class="hud-value" data-hud-lane>Middle</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Time</span>
          <span class="hud-value" data-hud-timer>0:00</span>
        </div>
        <div class="hud-objective" data-hud-objective>Objective: Reach 50 cleanup points</div>
        <div class="hud-row" data-hud-combo-row>
          <span class="hud-label">Combo</span>
          <span class="hud-value" data-hud-combo>x1</span>
        </div>
        <div class="hud-meter hud-meter-combo" aria-hidden="true">
          <span data-hud-combo-fill></span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Boost</span>
          <span class="hud-value" data-hud-boost-value>100%</span>
        </div>
        <div class="hud-meter hud-meter-boost" aria-hidden="true">
          <span data-hud-boost-fill></span>
        </div>
        <div class="hud-row hud-status">
          <span class="hud-label">Status</span>
          <span class="hud-value" data-hud-status>Cleaning orbit</span>
        </div>
      </section>
      <section class="hud-panel hud-controls">
        Rotate: Left/A Right/D | Lanes: Up/W Down/S | Boost: Space | Restart: R
      </section>
      <section class="game-over" data-hud-game-over hidden>
        <h2 class="game-over-title">Game Over</h2>
        <p class="game-over-score" data-hud-final-score>Final score: 0</p>
        <p class="game-over-restart">Press R to restart</p>
      </section>
    `;

    this.scoreValue = getElement(root, '[data-hud-score]');
    this.statusValue = getElement(root, '[data-hud-status]');
    this.laneValue = getElement(root, '[data-hud-lane]');
    this.timerValue = getElement(root, '[data-hud-timer]');
    this.objectiveValue = getElement(root, '[data-hud-objective]');
    this.comboRow = getElement(root, '[data-hud-combo-row]');
    this.comboValue = getElement(root, '[data-hud-combo]');
    this.comboTimerFill = getElement(root, '[data-hud-combo-fill]');
    this.boostFill = getElement(root, '[data-hud-boost-fill]');
    this.boostValue = getElement(root, '[data-hud-boost-value]');
    this.gameOver = getElement(root, '[data-hud-game-over]');
    this.finalScore = getElement(root, '[data-hud-final-score]');
  }

  update(snapshot: HudSnapshot): void {
    const comboPercent = snapshot.comboWindow > 0
      ? Math.max(0, Math.min(1, snapshot.comboTimer / snapshot.comboWindow))
      : 0;
    const boostPercent = Math.max(0, Math.min(1, snapshot.boostFuel));

    this.scoreValue.textContent = String(snapshot.score);
    this.laneValue.textContent = snapshot.laneName;
    this.timerValue.textContent = formatRunTime(snapshot.runTime);
    this.objectiveValue.textContent = snapshot.objectiveComplete
      ? 'Objective Complete'
      : `Objective: Reach ${snapshot.objectiveTargetScore} cleanup points`;
    this.objectiveValue.classList.toggle('is-complete', snapshot.objectiveComplete);
    this.comboValue.textContent = `x${snapshot.comboMultiplier}`;
    this.comboRow.classList.toggle('is-hot', snapshot.comboMultiplier > 1);
    this.comboTimerFill.style.transform = `scaleX(${comboPercent})`;
    this.boostFill.style.transform = `scaleX(${boostPercent})`;
    this.boostValue.textContent = `${Math.round(boostPercent * 100)}%`;
    this.boostValue.classList.toggle('is-empty', snapshot.boostEmpty);

    if (snapshot.state === 'gameover') {
      this.statusValue.textContent = snapshot.gameOverReason;
    } else if (snapshot.hazardWarning) {
      this.statusValue.textContent = 'WARNING: Lane hazard incoming';
    } else if (snapshot.boostEmpty) {
      this.statusValue.textContent = 'BOOST EMPTY';
    } else if (snapshot.objectiveComplete) {
      this.statusValue.textContent = 'Objective Complete';
    } else if (snapshot.comboMultiplier > 1) {
      this.statusValue.textContent = 'Combo active';
    } else {
      this.statusValue.textContent = 'Cleaning orbit';
    }

    this.finalScore.textContent = `Final score: ${snapshot.score}`;
    this.gameOver.hidden = snapshot.state !== 'gameover';
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
    throw new Error(`Missing HUD element: ${selector}`);
  }

  return element;
}
