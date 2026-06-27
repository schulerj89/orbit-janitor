import type { ActivePowerupSnapshot } from '../systems/PowerupDirector';
import type { EventWavePhase } from '../systems/EventWaveTypes';
import type { CinematicPresetKey } from '../cinematics/CinematicShot';

export type GameState =
  | 'title'
  | 'sectorSelect'
  | 'playing'
  | 'missionComplete'
  | 'gameover';

export interface HudSnapshot {
  score: number;
  state: GameState;
  runLabel: string;
  runSeed: string;
  dailyBestScore: number;
  sectorName: string;
  sectorSubtitle: string;
  sectorModifierHint: string;
  showSectorHint: boolean;
  objectiveText: string;
  objectiveProgressText: string;
  comboMultiplier: number;
  comboTimer: number;
  comboWindow: number;
  laneName: string;
  boostFuel: number;
  boostEmpty: boolean;
  runTime: number;
  objectiveComplete: boolean;
  hazardWarning: boolean;
  hazardActive: boolean;
  eventName: string;
  eventCallout: string;
  eventInstruction: string;
  eventCountdown: number;
  eventTimeRemaining: number;
  eventPhase: EventWavePhase;
  activePowerups: ActivePowerupSnapshot[];
  tutorialActive: boolean;
  tutorialStepLabel: string | null;
  isPaused: boolean;
  cinematicActive: boolean;
  cinematicPresetKey: CinematicPresetKey | null;
  shieldCharges: number;
  shieldBroken: boolean;
  gameOverReason: string;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  sfxEnabled: boolean;
  settingsOpen: boolean;
  cosmeticBadgeLabel: string;
  highContrastHazards: boolean;
}

export class Hud {
  private readonly mainPanel: HTMLElement;
  private readonly controlsPanel: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly runValue: HTMLElement;
  private readonly seedValue: HTMLElement;
  private readonly sectorValue: HTMLElement;
  private readonly sectorHintValue: HTMLElement;
  private readonly laneValue: HTMLElement;
  private readonly timerValue: HTMLElement;
  private readonly objectiveValue: HTMLElement;
  private readonly eventValue: HTMLElement;
  private readonly eventCountdownValue: HTMLElement;
  private readonly comboRow: HTMLElement;
  private readonly comboValue: HTMLElement;
  private readonly comboTimerFill: HTMLElement;
  private readonly boostFill: HTMLElement;
  private readonly boostValue: HTMLElement;
  private readonly powerupsValue: HTMLElement;
  private readonly audioStateValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <section class="hud-panel hud-main" aria-live="polite">
        <h1 class="hud-title">Orbit Janitor</h1>
        <div class="hud-row">
          <span class="hud-label">Score</span>
          <span class="hud-value" data-hud-score>0</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Current Lane</span>
          <span class="hud-value" data-hud-lane>Middle</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Time</span>
          <span class="hud-value" data-hud-timer>0:00</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Run</span>
          <span class="hud-value" data-hud-run>Normal Run</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Sector</span>
          <span class="hud-value hud-sector-value" data-hud-sector>Low Orbit Cleanup</span>
        </div>
        <div class="hud-sector-hint is-hidden" data-hud-sector-hint>Standard route: Baseline cleanup route</div>
        <div class="hud-row">
          <span class="hud-label">Seed</span>
          <span class="hud-value hud-seed-value" data-hud-seed>OJ-0000000</span>
        </div>
        <div class="hud-objective" data-hud-objective>Objective: Reach 50 cleanup points</div>
        <div class="hud-event is-hidden" data-hud-event>
          <span data-hud-event-callout>DEBRIS STORM</span>
          <strong data-hud-event-countdown>2s</strong>
          <small data-hud-event-instruction>Debris crossing</small>
        </div>
        <div class="hud-row" data-hud-combo-row>
          <span class="hud-label">Combo</span>
          <span class="hud-value" data-hud-combo>x1</span>
        </div>
        <div class="hud-meter hud-meter-combo" aria-hidden="true">
          <span data-hud-combo-fill></span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Boost Fuel</span>
          <span class="hud-value" data-hud-boost-value>100%</span>
        </div>
        <div class="hud-meter hud-meter-boost" aria-hidden="true">
          <span data-hud-boost-fill></span>
        </div>
        <div class="hud-powerups is-hidden" data-hud-powerups aria-label="Active powerups"></div>
        <div class="hud-row hud-status">
          <span class="hud-label">Status</span>
          <span class="hud-value" data-hud-status>Cleaning orbit</span>
        </div>
      </section>
      <section class="hud-panel hud-controls">
        <div class="hud-audio-note" data-hud-audio-state>Music On | SFX On</div>
        <div class="hud-control-grid" aria-label="Controls">
          <span>Rotate</span>
          <strong>Left/A Right/D</strong>
          <span>Start</span>
          <strong>Enter sector / T training / C select</strong>
          <span>Lanes</span>
          <strong>Up/W Down/S</strong>
          <span>Boost</span>
          <strong>Space</strong>
          <span>Help</span>
          <strong>H Help | P Pause | O Settings</strong>
          <span>Training</span>
          <strong>K skip tutorial</strong>
          <span>Restart</span>
          <strong>R</strong>
          <span>Audio</span>
          <strong>M music / - = music / [ ] SFX / N mute</strong>
          <span>Upgrades</span>
          <strong>U on title / game over | B contracts</strong>
          <span>Gallery</span>
          <strong>Y shipyard / G gallery</strong>
        </div>
      </section>
    `;

    this.mainPanel = getElement(root, '.hud-main');
    this.controlsPanel = getElement(root, '.hud-controls');
    this.scoreValue = getElement(root, '[data-hud-score]');
    this.statusValue = getElement(root, '[data-hud-status]');
    this.runValue = getElement(root, '[data-hud-run]');
    this.seedValue = getElement(root, '[data-hud-seed]');
    this.sectorValue = getElement(root, '[data-hud-sector]');
    this.sectorHintValue = getElement(root, '[data-hud-sector-hint]');
    this.laneValue = getElement(root, '[data-hud-lane]');
    this.timerValue = getElement(root, '[data-hud-timer]');
    this.objectiveValue = getElement(root, '[data-hud-objective]');
    this.eventValue = getElement(root, '[data-hud-event]');
    this.eventCountdownValue = getElement(root, '[data-hud-event-countdown]');
    this.comboRow = getElement(root, '[data-hud-combo-row]');
    this.comboValue = getElement(root, '[data-hud-combo]');
    this.comboTimerFill = getElement(root, '[data-hud-combo-fill]');
    this.boostFill = getElement(root, '[data-hud-boost-fill]');
    this.boostValue = getElement(root, '[data-hud-boost-value]');
    this.powerupsValue = getElement(root, '[data-hud-powerups]');
    this.audioStateValue = getElement(root, '[data-hud-audio-state]');
  }

  update(snapshot: HudSnapshot): void {
    const comboPercent =
      snapshot.comboWindow > 0
        ? Math.max(0, Math.min(1, snapshot.comboTimer / snapshot.comboWindow))
        : 0;
    const boostPercent = Math.max(0, Math.min(1, snapshot.boostFuel));
    const hideGameplayHud = snapshot.state !== 'playing' || snapshot.cinematicActive;

    this.mainPanel.classList.toggle('is-cinematic-hidden', hideGameplayHud);
    this.controlsPanel.classList.toggle('is-cinematic-hidden', hideGameplayHud);
    this.scoreValue.textContent = String(snapshot.score);
    this.runValue.textContent =
      snapshot.state === 'title' ? 'Choose Run' : snapshot.runLabel;
    this.sectorValue.textContent =
      snapshot.state === 'title' ? 'Choose Sector' : snapshot.sectorName;
    this.sectorValue.title = snapshot.sectorName;
    this.sectorHintValue.textContent = `${snapshot.sectorSubtitle}: ${snapshot.sectorModifierHint}`;
    this.sectorHintValue.classList.toggle('is-hidden', !snapshot.showSectorHint);
    this.seedValue.textContent =
      snapshot.state === 'title'
        ? `Daily best ${snapshot.dailyBestScore}`
        : snapshot.runSeed;
    this.seedValue.title =
      snapshot.state === 'title'
        ? `Daily best score: ${snapshot.dailyBestScore}`
        : `Seed: ${snapshot.runSeed}`;
    this.laneValue.textContent = snapshot.laneName;
    this.timerValue.textContent = formatRunTime(snapshot.runTime);
    this.objectiveValue.textContent = snapshot.objectiveComplete
      ? `Mission Complete: ${snapshot.objectiveProgressText}`
      : `${snapshot.objectiveText} (${snapshot.objectiveProgressText})`;
    this.objectiveValue.classList.toggle('is-complete', snapshot.objectiveComplete);
    this.updateEvent(snapshot);
    this.comboValue.textContent = `x${snapshot.comboMultiplier}`;
    this.comboRow.classList.toggle('is-hot', snapshot.comboMultiplier > 1);
    this.comboTimerFill.style.transform = `scaleX(${comboPercent})`;
    this.boostFill.style.transform = `scaleX(${boostPercent})`;
    this.boostValue.textContent = `${Math.round(boostPercent * 100)}%`;
    this.boostValue.classList.toggle('is-empty', snapshot.boostEmpty);
    this.updatePowerups(snapshot.activePowerups);
    this.audioStateValue.textContent = `Music ${snapshot.musicEnabled ? `${Math.round(snapshot.musicVolume * 100)}%` : 'Off'} | SFX ${snapshot.sfxEnabled ? `${Math.round(snapshot.sfxVolume * 100)}%` : 'Off'}${snapshot.cosmeticBadgeLabel !== 'None' ? ` | Badge ${snapshot.cosmeticBadgeLabel}` : ''}${snapshot.highContrastHazards ? ' | HC Hazards' : ''}`;
    this.audioStateValue.classList.toggle(
      'is-muted',
      !snapshot.musicEnabled || !snapshot.sfxEnabled
    );

    if (snapshot.state === 'title') {
      this.statusValue.textContent = 'Awaiting launch';
    } else if (snapshot.state === 'sectorSelect') {
      this.statusValue.textContent = 'Choose sector';
    } else if (snapshot.cinematicActive) {
      this.statusValue.textContent = 'Cinematic sequence';
    } else if (snapshot.settingsOpen) {
      this.statusValue.textContent = 'Settings open';
    } else if (snapshot.isPaused) {
      this.statusValue.textContent = 'Paused';
    } else if (snapshot.state === 'missionComplete') {
      this.statusValue.textContent = 'Mission Complete';
    } else if (snapshot.state === 'gameover') {
      this.statusValue.textContent = snapshot.gameOverReason;
    } else if (snapshot.shieldBroken) {
      this.statusValue.textContent = 'SHIELD BROKEN';
    } else if (snapshot.hazardActive) {
      this.statusValue.textContent = 'DANGER: Lane hazard active';
    } else if (snapshot.hazardWarning) {
      this.statusValue.textContent = 'WARNING: Lane hazard incoming';
    } else if (snapshot.eventCallout) {
      this.statusValue.textContent =
        snapshot.eventPhase === 'warning'
          ? `${snapshot.eventCallout} in ${Math.ceil(snapshot.eventCountdown)}`
          : snapshot.eventInstruction || snapshot.eventCallout;
    } else if (snapshot.tutorialActive && snapshot.tutorialStepLabel) {
      this.statusValue.textContent = `Training: ${snapshot.tutorialStepLabel}`;
    } else if (snapshot.shieldCharges > 0) {
      this.statusValue.textContent = 'Shield ready';
    } else if (snapshot.activePowerups.length > 0) {
      this.statusValue.textContent = snapshot.activePowerups
        .map((powerup) => powerup.name)
        .join(' + ');
    } else if (snapshot.boostEmpty) {
      this.statusValue.textContent = 'BOOST EMPTY';
    } else if (snapshot.objectiveComplete) {
      this.statusValue.textContent = 'Objective Complete';
    } else if (snapshot.comboMultiplier > 1) {
      this.statusValue.textContent = 'Combo active';
    } else {
      this.statusValue.textContent = 'Cleaning orbit';
    }
  }

  private updateEvent(snapshot: HudSnapshot): void {
    const isVisible = snapshot.eventCallout.length > 0;
    const callout = getElement(this.eventValue, '[data-hud-event-callout]');
    const instruction = getElement(this.eventValue, '[data-hud-event-instruction]');

    callout.textContent = snapshot.eventCallout;
    instruction.textContent = snapshot.eventInstruction;
    this.eventValue.title = snapshot.eventInstruction
      ? `${snapshot.eventName}: ${snapshot.eventInstruction}`
      : snapshot.eventName;
    this.eventCountdownValue.textContent =
      snapshot.eventPhase === 'warning'
        ? `${Math.ceil(snapshot.eventCountdown)}s`
        : `${Math.ceil(snapshot.eventTimeRemaining)}s`;
    this.eventValue.classList.toggle('is-hidden', !isVisible);
    this.eventValue.classList.toggle('is-active', snapshot.eventPhase === 'active');
  }

  private updatePowerups(activePowerups: ActivePowerupSnapshot[]): void {
    this.powerupsValue.replaceChildren(
      ...activePowerups.map((powerup) => {
        const pill = document.createElement('span');

        pill.className = 'hud-powerup-pill';
        pill.textContent = `${powerup.name} ${Math.ceil(powerup.remaining)}s`;
        return pill;
      })
    );
    this.powerupsValue.classList.toggle('is-hidden', activePowerups.length === 0);
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
