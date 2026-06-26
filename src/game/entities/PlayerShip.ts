import * as THREE from 'three/webgpu';
import {
  LANE_SWITCH_COOLDOWN,
  LANE_SWITCH_DURATION,
  ORBIT_LANES,
  PLAYER_BASE_ANGULAR_SPEED,
  PLAYER_BOOST_MULTIPLIER,
  STARTING_LANE_INDEX
} from '../constants';
import type { InputState } from '../input';
import { clampLaneIndex, setOrbitPositionFromAngle, wrapAngle } from '../math';

export class PlayerShip {
  readonly group = new THREE.Group();
  angle = 0;
  laneIndex = STARTING_LANE_INDEX;
  targetLaneIndex = STARTING_LANE_INDEX;
  currentRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];

  private readonly engineGlow: THREE.Mesh;
  private facingDirection = 1;
  private laneSwitchStartRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];
  private laneSwitchElapsed = LANE_SWITCH_DURATION;
  private laneSwitchCooldownRemaining = 0;

  constructor() {
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.55, 4),
      new THREE.MeshStandardMaterial({
        color: 0xf5fbff,
        roughness: 0.38,
        metalness: 0.12,
        flatShading: true
      })
    );
    body.rotation.x = Math.PI / 2;

    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x48dfff })
    );
    cockpit.position.set(0, 0.07, 0.03);

    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x233141,
      roughness: 0.7,
      metalness: 0.2
    });
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.16), wingMaterial);
    leftWing.position.set(-0.22, -0.02, -0.08);

    const rightWing = leftWing.clone();
    rightWing.position.x = 0.22;

    this.engineGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 10),
      new THREE.MeshBasicMaterial({
        color: 0x32f4ff,
        transparent: true,
        opacity: 0.85
      })
    );
    this.engineGlow.position.set(0, 0, -0.31);
    this.engineGlow.visible = false;

    this.group.add(body, cockpit, leftWing, rightWing, this.engineGlow);
    this.reset();
  }

  update(delta: number, input: InputState, isGameOver: boolean, isBoosting: boolean): void {
    const direction = Number(input.left) - Number(input.right);

    if (!isGameOver) {
      this.laneSwitchCooldownRemaining = Math.max(0, this.laneSwitchCooldownRemaining - delta);
      this.handleLaneInput(input);
    }

    if (!isGameOver && direction !== 0) {
      const speed = PLAYER_BASE_ANGULAR_SPEED * (isBoosting ? PLAYER_BOOST_MULTIPLIER : 1);
      this.angle = wrapAngle(this.angle + direction * speed * delta);
      this.facingDirection = direction;
    }

    this.updateLaneSwitch(delta);
    this.engineGlow.visible = !isGameOver && isBoosting;
    this.engineGlow.scale.setScalar(!isGameOver && isBoosting ? 2.05 : 1);
    this.setAngle(this.angle);
  }

  setAngle(angle: number): void {
    this.angle = wrapAngle(angle);
    setOrbitPositionFromAngle(this.group.position, this.angle, this.currentRadius);
    this.group.rotation.set(
      0,
      this.facingDirection > 0 ? -this.angle : Math.PI - this.angle,
      this.facingDirection * -0.12
    );
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }

  reset(): void {
    this.facingDirection = 1;
    this.laneIndex = STARTING_LANE_INDEX;
    this.targetLaneIndex = STARTING_LANE_INDEX;
    this.currentRadius = ORBIT_LANES[STARTING_LANE_INDEX];
    this.laneSwitchStartRadius = this.currentRadius;
    this.laneSwitchElapsed = LANE_SWITCH_DURATION;
    this.laneSwitchCooldownRemaining = 0;
    this.setAngle(0);
    this.engineGlow.visible = false;
    this.engineGlow.scale.setScalar(1);
  }

  private handleLaneInput(input: InputState): void {
    if (this.laneSwitchCooldownRemaining > 0) {
      return;
    }

    if (input.laneUpPressed) {
      this.startLaneSwitch(this.targetLaneIndex + 1);
    } else if (input.laneDownPressed) {
      this.startLaneSwitch(this.targetLaneIndex - 1);
    }
  }

  private startLaneSwitch(nextLaneIndex: number): void {
    const clampedLaneIndex = clampLaneIndex(nextLaneIndex);

    if (clampedLaneIndex === this.targetLaneIndex) {
      return;
    }

    this.laneSwitchStartRadius = this.currentRadius;
    this.targetLaneIndex = clampedLaneIndex;
    this.laneIndex = clampedLaneIndex;
    this.laneSwitchElapsed = 0;
    this.laneSwitchCooldownRemaining = LANE_SWITCH_COOLDOWN;
  }

  private updateLaneSwitch(delta: number): void {
    if (this.laneSwitchElapsed >= LANE_SWITCH_DURATION) {
      this.currentRadius = ORBIT_LANES[this.targetLaneIndex];
      return;
    }

    this.laneSwitchElapsed = Math.min(
      this.laneSwitchElapsed + delta,
      LANE_SWITCH_DURATION
    );
    const t = this.laneSwitchElapsed / LANE_SWITCH_DURATION;
    const easedT = t * t * (3 - 2 * t);
    this.currentRadius =
      this.laneSwitchStartRadius +
      (ORBIT_LANES[this.targetLaneIndex] - this.laneSwitchStartRadius) * easedT;
  }
}
