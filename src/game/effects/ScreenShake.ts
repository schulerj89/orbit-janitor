import * as THREE from 'three/webgpu';

export class ScreenShake {
  private readonly offset = new THREE.Vector3();
  private trauma = 0;
  private time = 0;
  private reducedMotion = false;

  add(amount: number): void {
    if (this.reducedMotion) {
      return;
    }

    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(delta: number): void {
    if (this.reducedMotion) {
      this.clear();
      return;
    }

    this.time += delta;
    this.trauma = Math.max(0, this.trauma - delta * 1.8);

    const intensity = this.trauma * this.trauma;
    this.offset.set(
      Math.sin(this.time * 47.1) * intensity * 0.28,
      Math.sin(this.time * 39.7 + 1.8) * intensity * 0.2,
      Math.sin(this.time * 53.3 + 0.7) * intensity * 0.22
    );
  }

  getOffset(): THREE.Vector3 {
    return this.offset;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;

    if (reducedMotion) {
      this.clear();
    }
  }

  clear(): void {
    this.trauma = 0;
    this.offset.set(0, 0, 0);
  }
}
