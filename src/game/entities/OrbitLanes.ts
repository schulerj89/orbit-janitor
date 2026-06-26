import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from '../constants';
import { clampLaneIndex } from '../math';

export class OrbitLanes {
  readonly group = new THREE.Group();

  private readonly rings: THREE.Mesh[] = [];
  private readonly materials: THREE.MeshBasicMaterial[] = [];

  constructor() {
    ORBIT_LANES.forEach((radius) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x526c7c,
        transparent: true,
        opacity: 0.42
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 160),
        material
      );
      ring.rotation.x = Math.PI / 2;

      this.rings.push(ring);
      this.materials.push(material);
      this.group.add(ring);
    });
  }

  setActiveLane(laneIndex: number): void {
    const activeLane = clampLaneIndex(laneIndex);

    this.rings.forEach((ring, index) => {
      const isActive = index === activeLane;
      this.materials[index].color.setHex(isActive ? 0x8fe8ff : 0x526c7c);
      this.materials[index].opacity = isActive ? 0.72 : 0.38;
      ring.scale.setScalar(isActive ? 1.004 : 1);
    });
  }
}
