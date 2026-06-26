import * as THREE from 'three/webgpu';
import { HAZARD_ACTIVE_DURATION, ORBIT_LANES, PLANET_RADIUS } from '../constants';

export class PlanetPulseHazard {
  readonly group = new THREE.Group();

  private readonly material = new THREE.MeshBasicMaterial({
    color: 0xff5a32,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  private readonly ring: THREE.Mesh;
  private age = 0;
  private duration = HAZARD_ACTIVE_DURATION;

  constructor() {
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(PLANET_RADIUS * 1.06, 0.025, 8, 120),
      this.material
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring.visible = false;
    this.group.add(this.ring);
  }

  emit(): void {
    this.age = 0;
    this.duration = HAZARD_ACTIVE_DURATION;
    this.ring.visible = true;
    this.ring.scale.setScalar(1);
    this.material.opacity = 0.55;
  }

  update(delta: number): void {
    if (!this.ring.visible) {
      return;
    }

    this.age += delta;
    const progress = Math.min(1, this.age / this.duration);
    const maxRadius = ORBIT_LANES[ORBIT_LANES.length - 1] / (PLANET_RADIUS * 1.06);

    this.ring.scale.setScalar(1 + (maxRadius - 1) * progress);
    this.material.opacity = Math.max(0, 0.55 * (1 - progress));

    if (progress >= 1) {
      this.ring.visible = false;
    }
  }

  clear(): void {
    this.age = 0;
    this.ring.visible = false;
    this.material.opacity = 0;
  }
}
