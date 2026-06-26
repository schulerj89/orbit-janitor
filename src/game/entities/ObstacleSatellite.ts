import * as THREE from 'three/webgpu';
import { OBSTACLE_ANGULAR_SPEED, ORBIT_LANES } from '../constants';
import { clampLaneIndex, setOrbitPositionFromAngle, wrapAngle } from '../math';

export interface ObstacleConfig {
  laneIndex: number;
  angle: number;
  angularSpeed: number;
}

export class ObstacleSatellite {
  readonly group = new THREE.Group();
  angle = Math.PI * 1.15;
  laneIndex = 1;
  angularSpeed = OBSTACLE_ANGULAR_SPEED;

  private readonly visualRoot = new THREE.Group();

  constructor(
    laneIndex = 1,
    angle = Math.PI * 1.15,
    angularSpeed = OBSTACLE_ANGULAR_SPEED
  ) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0x98a6ad,
        roughness: 0.48,
        metalness: 0.32
      })
    );

    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c6282,
      roughness: 0.62,
      metalness: 0.16
    });
    const leftPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.035, 0.28),
      panelMaterial
    );
    leftPanel.position.x = -0.5;

    const rightPanel = leftPanel.clone();
    rightPanel.position.x = 0.5;

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.34, 8),
      new THREE.MeshBasicMaterial({ color: 0xd8f4ff })
    );
    antenna.position.y = 0.28;

    const warningLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3b2f })
    );
    warningLight.position.set(0, 0.03, 0.17);

    this.visualRoot.add(body, leftPanel, rightPanel, antenna, warningLight);
    this.group.add(this.visualRoot);
    this.reset({ laneIndex, angle, angularSpeed });
  }

  update(delta: number, difficultyFactor = 1): void {
    this.angle = wrapAngle(this.angle + this.angularSpeed * difficultyFactor * delta);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.rotation.y = -this.angle;
    this.visualRoot.rotation.y += delta * 1.4;
  }

  setLane(laneIndex: number): void {
    this.laneIndex = clampLaneIndex(laneIndex);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
  }

  reset(config: ObstacleConfig): void {
    this.laneIndex = clampLaneIndex(config.laneIndex);
    this.angle = wrapAngle(config.angle);
    this.angularSpeed = config.angularSpeed;
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.rotation.y = -this.angle;
    this.visualRoot.rotation.set(0, 0, 0);
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }
}
