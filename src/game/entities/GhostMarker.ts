import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from '../constants';
import { clampLaneIndex, setOrbitPositionFromAngle, wrapAngle } from '../math';

export type GhostMarkerKind = 'goal' | 'danger';

export class GhostMarker {
  readonly group = new THREE.Group();

  private readonly ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x58f6ff,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });
  private readonly coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fffee,
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });
  private readonly ring: THREE.Mesh;
  private readonly core: THREE.Mesh;
  private kind: GhostMarkerKind = 'goal';
  private age = 0;

  constructor() {
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.018, 8, 48),
      this.ringMaterial
    );
    this.ring.rotation.x = Math.PI / 2;

    this.core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), this.coreMaterial);
    this.group.add(this.ring, this.core);
    this.group.visible = false;
  }

  show(
    laneIndex: number,
    angle: number,
    kind: GhostMarkerKind = 'goal',
    yOffset = 0.34
  ): void {
    const clampedLane = clampLaneIndex(laneIndex);

    this.kind = kind;
    this.age = 0;
    setOrbitPositionFromAngle(
      this.group.position,
      wrapAngle(angle),
      ORBIT_LANES[clampedLane]
    );
    this.group.position.y = yOffset;
    this.group.visible = true;
    this.applyKind();
  }

  clear(): void {
    this.group.visible = false;
    this.age = 0;
  }

  update(delta: number): void {
    if (!this.group.visible) {
      return;
    }

    this.age += delta;
    const pulse = 1 + Math.sin(this.age * 7) * 0.12;
    const dangerPulse = 1 + Math.sin(this.age * 12) * 0.16;
    const scale = this.kind === 'danger' ? dangerPulse : pulse;

    this.ring.scale.setScalar(scale);
    this.core.scale.setScalar(0.9 + scale * 0.16);
    this.core.rotation.y += delta * 1.9;
    this.ringMaterial.opacity =
      this.kind === 'danger'
        ? 0.58 + Math.sin(this.age * 12) * 0.22
        : 0.6 + Math.sin(this.age * 7) * 0.16;
  }

  private applyKind(): void {
    if (this.kind === 'danger') {
      this.ringMaterial.color.setHex(0xff6a1f);
      this.coreMaterial.color.setHex(0xff3b22);
      return;
    }

    this.ringMaterial.color.setHex(0x58f6ff);
    this.coreMaterial.color.setHex(0x9fffee);
  }
}
