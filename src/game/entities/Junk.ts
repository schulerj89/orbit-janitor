import * as THREE from 'three/webgpu';
import { JUNK_MIN_ANGLE_SEPARATION, ORBIT_LANES } from '../constants';
import { randomAngleAvoiding, setOrbitPositionFromAngle, wrapAngle } from '../math';

export interface LaneAngle {
  angle: number;
  laneIndex: number;
}

export class Junk {
  readonly group = new THREE.Group();
  angle = 0;
  laneIndex = 1;

  private age = 0;

  constructor() {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0xffbf3f,
        roughness: 0.72,
        metalness: 0.18,
        flatShading: true
      })
    );
    box.rotation.set(0.45, 0.2, 0.15);

    const shardA = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: 0xff7d29,
        roughness: 0.65,
        metalness: 0.12
      })
    );
    shardA.position.set(0.16, 0.05, -0.05);
    shardA.rotation.set(0.4, 0.8, 0.25);

    const shardB = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.08, 0.26),
      new THREE.MeshStandardMaterial({
        color: 0xc76d24,
        roughness: 0.78,
        metalness: 0.1
      })
    );
    shardB.position.set(-0.12, -0.03, 0.08);
    shardB.rotation.set(0.1, -0.7, 0.35);

    this.group.add(box, shardA, shardB);
  }

  respawn(playerAngle: number, playerLaneIndex: number, obstacles: LaneAngle[]): void {
    this.laneIndex = Math.floor(Math.random() * ORBIT_LANES.length);
    const disallowedAngles: number[] = [];

    if (playerLaneIndex === this.laneIndex) {
      disallowedAngles.push(playerAngle);
    }

    obstacles.forEach((obstacle) => {
      if (obstacle.laneIndex === this.laneIndex) {
        disallowedAngles.push(obstacle.angle);
      }
    });

    this.angle = randomAngleAvoiding(disallowedAngles, JUNK_MIN_ANGLE_SEPARATION);
    this.setAngle(this.angle);
  }

  update(delta: number): void {
    this.age += delta;
    this.group.rotation.x += delta * 1.25;
    this.group.rotation.y += delta * 1.9;
    this.group.scale.setScalar(1 + Math.sin(this.age * 5.2) * 0.08);
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }

  private setAngle(angle: number): void {
    this.angle = wrapAngle(angle);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
  }
}
