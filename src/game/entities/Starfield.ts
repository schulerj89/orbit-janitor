import * as THREE from 'three/webgpu';
import { STAR_COUNT } from '../constants';
import type { SectorTheme } from '../systems/SectorTheme';

export class Starfield {
  readonly points: THREE.Points;

  private readonly material: THREE.PointsMaterial;

  constructor() {
    const positions = new Float32Array(STAR_COUNT * 3);

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const radius = 60 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const offset = index * 3;

      positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
      positions[offset + 1] = radius * Math.cos(phi);
      positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xdff7ff,
      size: 0.08,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(geometry, this.material);
  }

  applyTheme(theme: SectorTheme): void {
    this.material.color.setHex(theme.starColor);
  }
}
