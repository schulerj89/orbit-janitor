import * as THREE from 'three/webgpu';

export class CameraRig {
  private boostAmount = 0;
  private impactKick = 0;
  private reducedMotion = false;

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
  }

  update(delta: number, isBoosting: boolean): void {
    const boostTarget = isBoosting && !this.reducedMotion ? 1 : 0;

    this.boostAmount += (boostTarget - this.boostAmount) * Math.min(1, delta * 7.5);
    this.impactKick = Math.max(0, this.impactKick - delta * 3.8);
  }

  punch(amount: number): void {
    if (this.reducedMotion) {
      return;
    }

    this.impactKick = Math.min(1, Math.max(this.impactKick, amount));
  }

  apply(
    camera: THREE.PerspectiveCamera,
    basePosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    baseFov: number
  ): void {
    const boostPullback = this.boostAmount * 0.48;
    const impactPullback = this.impactKick * 0.34;

    targetPosition.copy(basePosition);

    if (!this.reducedMotion) {
      targetPosition.y += boostPullback * 0.24;
      targetPosition.z += boostPullback + impactPullback;
    }

    camera.fov = baseFov + (this.reducedMotion ? 0 : this.boostAmount * 2.4);
    camera.updateProjectionMatrix();
  }

  clear(): void {
    this.boostAmount = 0;
    this.impactKick = 0;
  }
}
