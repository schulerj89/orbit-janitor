export interface DebugPanelSnapshot {
  isOpen: boolean;
  phase: string;
  sectorId: string;
  score: number;
  runTime: number;
  playerAngle: number;
  playerLaneIndex: number;
  hazardType: string;
  hazardPhase: string;
  activePowerups: string[];
  eventWaveType: string;
  eventWavePhase: string;
  musicDangerIntensity: number;
  fps: number;
  invincible: boolean;
  lastCommand: string;
  renderInfo: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
}

export class DebugPanel {
  private readonly element: HTMLElement;
  private readonly values = new Map<string, HTMLElement>();
  private readonly commandValue: HTMLElement;

  constructor(root: HTMLElement) {
    root.insertAdjacentHTML(
      'beforeend',
      `
        <aside class="debug-panel is-hidden" data-debug-panel aria-hidden="true">
          <div class="debug-panel-header">
            <strong>Dev Debug</strong>
            <span>F1 panel</span>
          </div>
          <div class="debug-panel-grid">
            ${renderRow('phase', 'State')}
            ${renderRow('sector', 'Sector')}
            ${renderRow('score', 'Score')}
            ${renderRow('time', 'Run Time')}
            ${renderRow('player', 'Player')}
            ${renderRow('hazard', 'Hazard')}
            ${renderRow('powerups', 'Powerups')}
            ${renderRow('event', 'Event')}
            ${renderRow('danger', 'Music Danger')}
            ${renderRow('fps', 'FPS')}
            ${renderRow('renderer', 'Renderer')}
            ${renderRow('invincible', 'Invincible')}
          </div>
          <div class="debug-panel-commands">
            <span>F2 complete</span>
            <span>F3 hazard/event</span>
            <span>F4 +scrap</span>
            <span>F5 theme</span>
            <span>F6 invincible</span>
            <span>F7 powerup</span>
            <span>F8 reset</span>
          </div>
          <p data-debug-command>Ready</p>
        </aside>
      `
    );

    this.element = getElement(root, '[data-debug-panel]');
    this.commandValue = getElement(root, '[data-debug-command]');

    [
      'phase',
      'sector',
      'score',
      'time',
      'player',
      'hazard',
      'powerups',
      'event',
      'danger',
      'fps',
      'renderer',
      'invincible'
    ].forEach((key) => {
      this.values.set(key, getElement(root, `[data-debug-value="${key}"]`));
    });
  }

  update(snapshot: DebugPanelSnapshot): void {
    this.setVisible(snapshot.isOpen);

    if (!snapshot.isOpen) {
      return;
    }

    this.setValue('phase', snapshot.phase);
    this.setValue('sector', snapshot.sectorId);
    this.setValue('score', String(snapshot.score));
    this.setValue('time', `${snapshot.runTime.toFixed(1)}s`);
    this.setValue(
      'player',
      `${snapshot.playerAngle.toFixed(2)} rad / lane ${snapshot.playerLaneIndex}`
    );
    this.setValue('hazard', `${snapshot.hazardType} / ${snapshot.hazardPhase}`);
    this.setValue(
      'powerups',
      snapshot.activePowerups.length > 0 ? snapshot.activePowerups.join(', ') : 'none'
    );
    this.setValue('event', `${snapshot.eventWaveType} / ${snapshot.eventWavePhase}`);
    this.setValue('danger', snapshot.musicDangerIntensity.toFixed(2));
    this.setValue('fps', String(Math.round(snapshot.fps)));
    this.setValue(
      'renderer',
      `${snapshot.renderInfo.calls} calls / ${snapshot.renderInfo.triangles} tris / ${snapshot.renderInfo.geometries} geo / ${snapshot.renderInfo.textures} tex`
    );
    this.setValue('invincible', snapshot.invincible ? 'on' : 'off');
    this.commandValue.textContent = snapshot.lastCommand || 'Ready';
  }

  private setVisible(isVisible: boolean): void {
    this.element.classList.toggle('is-hidden', !isVisible);
    this.element.setAttribute('aria-hidden', String(!isVisible));
  }

  private setValue(key: string, value: string): void {
    const element = this.values.get(key);

    if (element) {
      element.textContent = value;
    }
  }
}

function renderRow(key: string, label: string): string {
  return `
    <span>${label}</span>
    <strong data-debug-value="${key}">-</strong>
  `;
}

function getElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing debug panel element: ${selector}`);
  }

  return element;
}
