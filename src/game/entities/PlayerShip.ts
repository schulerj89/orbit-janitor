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
import type { EquippedCosmeticVisuals } from '../systems/CosmeticSystem';

type ShipVariant = 'janitor';

interface ShipModel {
  group: THREE.Group;
  engineFlame: THREE.Mesh;
  engineGlow: THREE.Mesh;
  engineFlameMaterial: THREE.MeshBasicMaterial;
  engineGlowMaterial: THREE.MeshBasicMaterial;
}

const shipBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3f8fb,
  roughness: 0.42,
  metalness: 0.18,
  flatShading: true
});
const shipNoseMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd86b,
  roughness: 0.38,
  metalness: 0.1,
  flatShading: true
});
const shipWingMaterial = new THREE.MeshStandardMaterial({
  color: 0x243648,
  roughness: 0.72,
  metalness: 0.22,
  flatShading: true
});
const shipCockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x54e6ff });
const shipEngineMaterial = new THREE.MeshStandardMaterial({
  color: 0x161f2b,
  roughness: 0.5,
  metalness: 0.38
});

export class PlayerShip {
  readonly group = new THREE.Group();
  angle = 0;
  laneIndex = STARTING_LANE_INDEX;
  targetLaneIndex = STARTING_LANE_INDEX;
  currentRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];

  private readonly model: ShipModel;
  private facingDirection = 1;
  private bankAngle = 0;
  private enginePulse = 0;
  private boostSquash = 0;
  private laneSwitchStartRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];
  private laneSwitchElapsed = LANE_SWITCH_DURATION;
  private laneSwitchDuration = LANE_SWITCH_DURATION;
  private laneSwitchCooldownRemaining = 0;

  constructor(variant: ShipVariant = 'janitor') {
    this.model = createShipModel(variant);
    this.group.add(this.model.group);
    this.reset();
  }

  update(
    delta: number,
    input: InputState,
    isGameOver: boolean,
    isBoosting: boolean
  ): void {
    const direction = Number(input.left) - Number(input.right);

    if (!isGameOver) {
      this.laneSwitchCooldownRemaining = Math.max(
        0,
        this.laneSwitchCooldownRemaining - delta
      );
      this.handleLaneInput(input);
    }

    if (!isGameOver && direction !== 0) {
      const speed =
        PLAYER_BASE_ANGULAR_SPEED * (isBoosting ? PLAYER_BOOST_MULTIPLIER : 1);
      this.angle = wrapAngle(this.angle + direction * speed * delta);
      this.facingDirection = direction;
    }

    const targetBank = !isGameOver ? direction * -0.34 : 0;
    this.bankAngle += (targetBank - this.bankAngle) * Math.min(1, delta * 9);
    this.enginePulse += delta * (isBoosting ? 22 : 6);
    this.updateLaneSwitch(delta);
    this.updateEngineVisuals(isGameOver, isBoosting);
    this.setAngle(this.angle);
  }

  setAngle(angle: number): void {
    this.angle = wrapAngle(angle);
    setOrbitPositionFromAngle(this.group.position, this.angle, this.currentRadius);
    this.group.rotation.set(
      0,
      this.facingDirection > 0 ? -this.angle : Math.PI - this.angle,
      this.bankAngle
    );
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }

  setLaneSwitchDuration(duration: number): void {
    this.laneSwitchDuration = Math.max(0.05, duration);
    this.laneSwitchElapsed = Math.min(this.laneSwitchElapsed, this.laneSwitchDuration);
  }

  applyCosmetics(visuals: EquippedCosmeticVisuals): void {
    shipBodyMaterial.color.setHex(visuals.shipBodyPrimary);
    shipWingMaterial.color.setHex(visuals.shipBodySecondary);
    shipNoseMaterial.color.setHex(visuals.shipBodyAccent);
    shipCockpitMaterial.color.setHex(visuals.cockpitColor);
    this.model.engineFlameMaterial.color.setHex(visuals.engineTrailColor);
    this.model.engineGlowMaterial.color.setHex(visuals.engineTrailColor);
  }

  reset(): void {
    this.facingDirection = 1;
    this.laneIndex = STARTING_LANE_INDEX;
    this.targetLaneIndex = STARTING_LANE_INDEX;
    this.currentRadius = ORBIT_LANES[STARTING_LANE_INDEX];
    this.laneSwitchStartRadius = this.currentRadius;
    this.laneSwitchElapsed = this.laneSwitchDuration;
    this.laneSwitchCooldownRemaining = 0;
    this.bankAngle = 0;
    this.enginePulse = 0;
    this.boostSquash = 0;
    this.setAngle(0);
    this.model.group.position.set(0, 0, 0);
    this.model.group.scale.set(1, 1, 1);
    this.model.engineFlame.visible = false;
    this.model.engineGlow.visible = false;
    this.model.engineFlame.scale.setScalar(1);
    this.model.engineGlow.scale.setScalar(1);
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
    if (this.laneSwitchElapsed >= this.laneSwitchDuration) {
      this.currentRadius = ORBIT_LANES[this.targetLaneIndex];
      return;
    }

    this.laneSwitchElapsed = Math.min(
      this.laneSwitchElapsed + delta,
      this.laneSwitchDuration
    );
    const t = this.laneSwitchElapsed / this.laneSwitchDuration;
    const easedT = t * t * (3 - 2 * t);
    this.currentRadius =
      this.laneSwitchStartRadius +
      (ORBIT_LANES[this.targetLaneIndex] - this.laneSwitchStartRadius) * easedT;
  }

  private updateEngineVisuals(isGameOver: boolean, isBoosting: boolean): void {
    const engineVisible = !isGameOver && isBoosting;
    const pulse = 1 + Math.sin(this.enginePulse) * 0.18;
    const boostTarget = engineVisible ? 1 : 0;

    this.boostSquash += (boostTarget - this.boostSquash) * 0.22;
    this.model.group.position.z = -0.035 * this.boostSquash;
    this.model.group.scale.set(
      1 + this.boostSquash * 0.035,
      1,
      1 + this.boostSquash * 0.02
    );

    this.model.engineFlame.visible = engineVisible;
    this.model.engineGlow.visible = engineVisible;
    this.model.engineFlame.scale.set(0.95 * pulse, 1.05 * pulse, 1.55 * pulse);
    this.model.engineGlow.scale.setScalar(1.7 + Math.sin(this.enginePulse * 0.8) * 0.22);
    this.model.engineFlameMaterial.opacity = engineVisible ? 0.82 : 0;
    this.model.engineGlowMaterial.opacity = engineVisible ? 0.54 : 0;
  }
}

function createShipModel(variant: ShipVariant): ShipModel {
  if (variant !== 'janitor') {
    throw new Error(`Unsupported ship variant: ${variant}`);
  }

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.58), shipBodyMaterial);
  body.position.z = 0.02;

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.32, 4), shipNoseMaterial);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 0.44;

  const noseBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xfff2a8 })
  );
  noseBeacon.position.set(0, 0.035, 0.66);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 16, 10),
    shipCockpitMaterial
  );
  cockpit.scale.set(0.92, 0.58, 1.16);
  cockpit.position.set(0, 0.105, 0.08);

  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.035, 0.24),
    shipWingMaterial
  );
  leftWing.position.set(-0.32, -0.025, -0.05);
  leftWing.rotation.z = 0.08;

  const rightWing = leftWing.clone();
  rightWing.position.x = 0.32;
  rightWing.rotation.z = -0.08;

  const leftFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.18, 0.16),
    shipWingMaterial
  );
  leftFin.position.set(-0.13, 0.085, -0.24);
  leftFin.rotation.z = -0.22;

  const rightFin = leftFin.clone();
  rightFin.position.x = 0.13;
  rightFin.rotation.z = 0.22;

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.09, 0.18, 12),
    shipEngineMaterial
  );
  engine.rotation.x = Math.PI / 2;
  engine.position.z = -0.36;

  const engineFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0x35f4ff,
    transparent: true,
    opacity: 0
  });
  const engineFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.34, 12),
    engineFlameMaterial
  );
  engineFlame.rotation.x = -Math.PI / 2;
  engineFlame.position.z = -0.58;
  engineFlame.visible = false;

  const engineGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x2ce7ff,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const engineGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 14, 8),
    engineGlowMaterial
  );
  engineGlow.position.z = -0.43;
  engineGlow.visible = false;

  group.add(
    body,
    nose,
    noseBeacon,
    cockpit,
    leftWing,
    rightWing,
    leftFin,
    rightFin,
    engine,
    engineGlow,
    engineFlame
  );

  return {
    group,
    engineFlame,
    engineGlow,
    engineFlameMaterial,
    engineGlowMaterial
  };
}
