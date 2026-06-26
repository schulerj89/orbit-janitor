import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from '../constants';
import { clampLaneIndex } from '../math';

export class OrbitLanes {
  readonly group = new THREE.Group();

  private readonly rings: THREE.Mesh[] = [];
  private readonly glows: THREE.Mesh[] = [];
  private readonly materials: THREE.MeshBasicMaterial[] = [];
  private readonly glowMaterials: THREE.MeshBasicMaterial[] = [];
  private activeLaneIndex = 1;
  private pulseTime = 0;

  constructor() {
    ORBIT_LANES.forEach((radius) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x526c7c,
        transparent: true,
        opacity: 0.42
      });
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8fe8ff,
        transparent: true,
        opacity: 0.06,
        depthWrite: false
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 160),
        material
      );
      const glow = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.028, 8, 160),
        glowMaterial
      );
      ring.rotation.x = Math.PI / 2;
      glow.rotation.x = Math.PI / 2;

      this.rings.push(ring);
      this.glows.push(glow);
      this.materials.push(material);
      this.glowMaterials.push(glowMaterial);
      this.group.add(glow, ring);
    });
  }

  setActiveLane(laneIndex: number): void {
    this.activeLaneIndex = clampLaneIndex(laneIndex);
  }

  update(delta: number): void {
    this.pulseTime += delta;
    const pulse = 0.5 + Math.sin(this.pulseTime * 5.5) * 0.5;

    this.rings.forEach((ring, index) => {
      const isActive = index === this.activeLaneIndex;
      this.materials[index].color.setHex(isActive ? 0x8fe8ff : 0x526c7c);
      this.materials[index].opacity = isActive ? 0.62 + pulse * 0.22 : 0.28;
      this.glowMaterials[index].opacity = isActive ? 0.12 + pulse * 0.18 : 0.025;
      ring.scale.setScalar(isActive ? 1.003 + pulse * 0.003 : 1);
      this.glows[index].scale.setScalar(isActive ? 1.006 + pulse * 0.005 : 1);
    });
  }
}
