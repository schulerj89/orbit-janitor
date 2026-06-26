type FloatingTextTone = 'bonus' | 'lost' | 'score' | 'warning';

interface FloatingTextItem {
  element: HTMLElement;
  age: number;
  lifetime: number;
  driftX: number;
}

export class FloatingText {
  private readonly root: HTMLElement;
  private readonly items: FloatingTextItem[] = [];
  private reducedMotion = false;
  private sequence = 0;

  constructor(root: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'floating-text-layer';
    root.append(this.root);
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
  }

  show(text: string, tone: FloatingTextTone = 'score'): void {
    const element = document.createElement('div');
    const lifetime = this.reducedMotion ? 0.78 : 1.05;
    const driftX = ((this.sequence % 5) - 2) * 12;

    this.sequence += 1;
    element.className = `floating-text floating-text-${tone}`;
    element.textContent = text;
    this.root.append(element);
    this.items.push({
      element,
      age: 0,
      lifetime,
      driftX
    });
  }

  update(delta: number): void {
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      const item = this.items[index];

      item.age += delta;

      if (item.age >= item.lifetime) {
        item.element.remove();
        this.items.splice(index, 1);
        continue;
      }

      const progress = item.age / item.lifetime;
      const rise = this.reducedMotion ? 0 : -34 * progress;
      const fade =
        progress < 0.18 ? progress / 0.18 : 1 - Math.max(0, progress - 0.72) / 0.28;

      item.element.style.opacity = Math.max(0, Math.min(1, fade)).toFixed(3);
      item.element.style.transform = `translate(calc(-50% + ${item.driftX}px), ${rise}px) scale(${1 + (this.reducedMotion ? 0 : (1 - progress) * 0.05)})`;
    }
  }

  clear(): void {
    this.items.forEach((item) => item.element.remove());
    this.items.length = 0;
  }
}
