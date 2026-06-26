import * as THREE from 'three/webgpu';
import type { SectorTheme } from '../systems/SectorTheme';

export class CometPass {
  readonly group = new THREE.Group();

  private readonly coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xcfefff,
    transparent: true,
    opacity: 0.95
  });
  private readonly glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x7ee7ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });
  private readonly tailMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fffee,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });
  private readonly core: THREE.Mesh;
  private readonly glow: THREE.Mesh;
  private readonly tailSegments: THREE.Mesh[] = [];
  private duration = 1;
  private elapsed = 0;

  constructor() {
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), this.coreMaterial);
    this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 12), this.glowMaterial);
    this.group.add(this.glow, this.core);

    for (let index = 0; index < 6; index += 1) {
      const segment = new THREE.Mesh(
        new THREE.ConeGeometry(0.28 + index * 0.07, 1.1 + index * 0.28, 8),
        this.tailMaterial
      );

      segment.rotation.z = Math.PI / 2;
      segment.position.x = 0.7 + index * 0.42;
      segment.scale.set(1, 0.75 + index * 0.16, 1);
      this.tailSegments.push(segment);
      this.group.add(segment);
    }

    this.group.visible = false;
  }

  start(duration: number): void {
    this.duration = Math.max(0.1, duration);
    this.elapsed = 0;
    this.group.visible = true;
    this.update(0);
  }

  update(delta: number): void {
    if (!this.group.visible) {
      return;
    }

    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / this.duration);
    const x = 9 - progress * 18;
    const z = -7.2 + Math.sin(progress * Math.PI) * 1.35;
    const y = 1.2 + Math.sin(progress * Math.PI * 2) * 0.28;
    const fade = Math.sin(progress * Math.PI);

    this.group.position.set(x, y, z);
    this.group.rotation.y = -0.4 + progress * 0.8;
    this.core.rotation.x += delta * 1.6;
    this.core.rotation.y += delta * 1.1;
    this.coreMaterial.opacity = 0.65 + fade * 0.35;
    this.glowMaterial.opacity = 0.08 + fade * 0.22;
    this.tailMaterial.opacity = 0.12 + fade * 0.34;
    this.group.scale.setScalar(0.82 + fade * 0.26);

    if (this.elapsed >= this.duration) {
      this.clear();
    }
  }

  clear(): void {
    this.group.visible = false;
    this.elapsed = 0;
  }

  applyTheme(theme: SectorTheme): void {
    this.coreMaterial.color.setHex(theme.atmosphereColor);
    this.glowMaterial.color.setHex(theme.activeLaneColor);
    this.tailMaterial.color.setHex(theme.hazardWarningColor);
  }
}
