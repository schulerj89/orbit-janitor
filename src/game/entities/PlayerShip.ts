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
import { DEFAULT_SHIP_ID, type ShipId } from './ships/ShipDefinitions';
import {
  createShipModel,
  disposeShipModel,
  type ShipModel
} from './ships/ShipModelFactory';

const DEFAULT_BODY_PRIMARY = 0xf3f8fb;
const DEFAULT_BODY_SECONDARY = 0x243648;
const DEFAULT_BODY_ACCENT = 0xffd86b;
const DEFAULT_COCKPIT = 0x54e6ff;
const DEFAULT_ENGINE_TRAIL = 0x35f4ff;

export class PlayerShip {
  readonly group = new THREE.Group();
  angle = 0;
  laneIndex = STARTING_LANE_INDEX;
  targetLaneIndex = STARTING_LANE_INDEX;
  currentRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];

  private model: ShipModel;
  private shipId: ShipId;
  private currentCosmetics: EquippedCosmeticVisuals | null = null;
  private facingDirection = 1;
  private bankAngle = 0;
  private enginePulse = 0;
  private boostSquash = 0;
  private laneSwitchStartRadius: number = ORBIT_LANES[STARTING_LANE_INDEX];
  private laneSwitchElapsed = LANE_SWITCH_DURATION;
  private laneSwitchDuration = LANE_SWITCH_DURATION;
  private laneSwitchCooldownRemaining = 0;

  constructor(shipId: ShipId = DEFAULT_SHIP_ID) {
    this.shipId = shipId;
    this.model = createShipModel(shipId);
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

  getShipId(): ShipId {
    return this.shipId;
  }

  setShipModel(shipId: ShipId): void {
    if (this.shipId === shipId) {
      return;
    }

    this.group.remove(this.model.group);
    disposeShipModel(this.model);
    this.shipId = shipId;
    this.model = createShipModel(shipId);
    this.group.add(this.model.group);

    if (this.currentCosmetics) {
      this.applyCosmetics(this.currentCosmetics);
    }

    this.resetModelVisualState();
  }

  applyCosmetics(visuals: EquippedCosmeticVisuals): void {
    this.currentCosmetics = visuals;
    const useNativeHull =
      visuals.shipBodyPrimary === DEFAULT_BODY_PRIMARY &&
      visuals.shipBodySecondary === DEFAULT_BODY_SECONDARY &&
      visuals.shipBodyAccent === DEFAULT_BODY_ACCENT;
    const cockpitColor =
      visuals.cockpitColor === DEFAULT_COCKPIT
        ? this.model.palette.cockpit
        : visuals.cockpitColor;
    const engineTrailColor =
      visuals.engineTrailColor === DEFAULT_ENGINE_TRAIL
        ? this.model.palette.engine
        : visuals.engineTrailColor;
    const bodyColor = useNativeHull ? this.model.palette.body : visuals.shipBodyPrimary;
    const wingColor = useNativeHull ? this.model.palette.wing : visuals.shipBodySecondary;
    const accentColor = useNativeHull
      ? this.model.palette.accent
      : visuals.shipBodyAccent;

    this.model.bodyMaterials.forEach((material) => material.color.setHex(bodyColor));
    this.model.wingMaterials.forEach((material) => material.color.setHex(wingColor));
    this.model.accentMaterials.forEach((material) => material.color.setHex(accentColor));
    this.model.cockpitMaterials.forEach((material) =>
      material.color.setHex(cockpitColor)
    );
    this.model.engineFlameMaterial.color.setHex(engineTrailColor);
    this.model.engineGlowMaterial.color.setHex(engineTrailColor);
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
    this.resetModelVisualState();
  }

  private resetModelVisualState(): void {
    this.model.group.position.set(0, 0, 0);
    this.model.group.scale.set(1, 1, 1);
    this.model.engineFlame.visible = false;
    this.model.engineGlow.visible = false;
    this.model.engineFlame.scale.setScalar(1);
    this.model.engineGlow.scale.setScalar(1);
    this.model.engineFlameMaterial.opacity = 0;
    this.model.engineGlowMaterial.opacity = 0;
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
