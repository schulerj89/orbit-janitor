type ImpactFlashTone = 'hit' | 'complete' | 'nearMiss';

const FLASH_DURATIONS: Record<ImpactFlashTone, number> = {
  hit: 0.32,
  complete: 0.42,
  nearMiss: 0.2
};

export class ImpactFlash {
  private readonly element: HTMLElement;
  private timer = 0;
  private duration = 0;
  private reducedMotion = false;

  constructor(root: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'impact-flash is-hidden';
    root.append(this.element);
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
  }

  flash(tone: ImpactFlashTone): void {
    this.duration = this.reducedMotion
      ? Math.min(FLASH_DURATIONS[tone], 0.12)
      : FLASH_DURATIONS[tone];
    this.timer = this.duration;
    this.element.className = `impact-flash impact-flash-${tone}`;
    this.element.style.setProperty('--flash-progress', '1');
  }

  update(delta: number): void {
    if (this.timer <= 0) {
      return;
    }

    this.timer = Math.max(0, this.timer - delta);

    if (this.timer <= 0) {
      this.element.classList.add('is-hidden');
      this.element.style.setProperty('--flash-progress', '0');
      return;
    }

    const progress = this.duration > 0 ? this.timer / this.duration : 0;
    this.element.style.setProperty('--flash-progress', progress.toFixed(3));
  }

  clear(): void {
    this.timer = 0;
    this.element.className = 'impact-flash is-hidden';
    this.element.style.setProperty('--flash-progress', '0');
  }
}
