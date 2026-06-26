import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../constants';

export class Planet {
  readonly group = new THREE.Group();

  constructor() {
    const planet = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS, 3),
      new THREE.MeshStandardMaterial({
        color: 0x0f6f8f,
        roughness: 0.86,
        metalness: 0.02,
        flatShading: true
      })
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.06, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x78e8ff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      })
    );

    this.group.add(planet, atmosphere);
  }
}
