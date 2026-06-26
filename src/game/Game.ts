import * as THREE from 'three/webgpu';
import {
  BOOST_FUEL_DRAIN_PER_SECOND,
  BOOST_FUEL_MAX,
  BOOST_FUEL_RECHARGE_PER_SECOND,
  BOOST_MIN_TO_ACTIVATE,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  COMBO_WINDOW,
  JUNK_COLLISION_RADIUS,
  MAX_COMBO_MULTIPLIER,
  OBSTACLE_COLLISION_RADIUS,
  ORBIT_LANES,
  PLAYER_COLLISION_RADIUS,
  RUN_OBJECTIVE_TARGET_SCORE
} from './constants';
import { InputController, type InputState } from './input';
import { isAngleSafe, laneName, randomAngleAvoiding } from './math';
import { createRenderer } from './renderer';
import { ParticleBurst } from './effects/ParticleBurst';
import { ScreenShake } from './effects/ScreenShake';
import { Junk, type LaneAngle } from './entities/Junk';
import { ObstacleSatellite, type ObstacleConfig } from './entities/ObstacleSatellite';
import { OrbitLanes } from './entities/OrbitLanes';
import { Planet } from './entities/Planet';
import { PlayerShip } from './entities/PlayerShip';
import { Starfield } from './entities/Starfield';
import { HazardDirector, type HazardDirectorDebugState } from './systems/HazardDirector';
import { Hud, type GameState } from './ui/Hud';

const STARTING_OBSTACLES: ObstacleConfig[] = [
  { laneIndex: 0, angle: Math.PI * 0.72, angularSpeed: -0.72 },
  { laneIndex: 2, angle: Math.PI * 1.38, angularSpeed: 0.58 }
];

const OBSTACLE_SPEEDS = [-0.72, 0.58, -0.88, 0.69];
const OBSTACLE_SPAWN_MIN_SEPARATION = 1.0;

interface OrbitJanitorDebugState {
  sceneId: 'orbit-janitor';
  phase: GameState;
  score: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  boostFuel: number;
  isBoosting: boolean;
  runTime: number;
  objectiveComplete: boolean;
  playerAngle: number;
  playerLaneIndex: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  obstacles: LaneAngle[];
  hazard: HazardDirectorDebugState;
  playerPosition: number[];
  cameraPosition: number[];
  loadedAssetIds: string[];
  renderInfo: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
}

declare global {
  interface Window {
    orbitJanitorDebug?: {
      getState: () => OrbitJanitorDebugState;
      restart: () => void;
    };
  }
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly input = new InputController();
  private readonly obstacles: ObstacleSatellite[] = [];
  private readonly particles = new ParticleBurst();
  private readonly screenShake = new ScreenShake();
  private readonly hazardDirector = new HazardDirector();
  private readonly baseCameraPosition = new THREE.Vector3();
  private readonly shakenCameraPosition = new THREE.Vector3();
  private readonly playerPosition = new THREE.Vector3();
  private readonly junkPosition = new THREE.Vector3();
  private readonly obstaclePosition = new THREE.Vector3();

  private renderer!: THREE.WebGPURenderer;
  private hud!: Hud;
  private orbitLanes!: OrbitLanes;
  private planet!: Planet;
  private starfield!: Starfield;
  private player!: PlayerShip;
  private junk!: Junk;
  private state: GameState = 'playing';
  private score = 0;
  private comboCount = 0;
  private comboMultiplier = 1;
  private comboTimer = 0;
  private boostFuel = BOOST_FUEL_MAX;
  private boostLocked = false;
  private boostEmptyFlashTimer = 0;
  private isBoosting = false;
  private runTime = 0;
  private hazardWarning = false;
  private gameOverReason = 'Impact detected';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    this.updateCameraForViewport();
  }

  async init(): Promise<void> {
    this.renderer = await createRenderer(this.canvas);
    this.hud = new Hud(getHudRoot());

    this.scene.background = new THREE.Color(0x02050f);
    this.buildScene();
    this.restart();

    window.addEventListener('resize', this.handleResize);
    window.orbitJanitorDebug = {
      getState: () => this.getDebugState(),
      restart: () => this.restart()
    };
  }

  start(): void {
    this.clock.start();
    this.renderer.setAnimationLoop(this.update);
  }

  private buildScene(): void {
    const ambientLight = new THREE.AmbientLight(0xbdd7e8, 0.58);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6);
    directionalLight.position.set(4, 7, 5);

    this.planet = new Planet();
    this.orbitLanes = new OrbitLanes();
    this.starfield = new Starfield();
    this.player = new PlayerShip();
    this.junk = new Junk();

    this.scene.add(
      this.starfield.points,
      ambientLight,
      directionalLight,
      this.planet.group,
      this.orbitLanes.group,
      this.hazardDirector.group,
      this.player.group,
      this.junk.group,
      this.particles.group
    );
  }

  private readonly update = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const input = this.input.consumeFrame();

    if (input.restartPressed && this.state === 'gameover') {
      this.restart();
    }

    const isGameOver = this.state === 'gameover';
    const isBoosting = this.updateBoost(delta, input, isGameOver);

    this.player.update(delta, input, isGameOver, isBoosting);
    this.orbitLanes.setActiveLane(this.player.targetLaneIndex);
    this.junk.update(delta);
    this.particles.update(delta);
    this.screenShake.update(delta);

    if (!isGameOver) {
      this.runTime += delta;
      this.updateCombo(delta);
      this.updateObstacles(delta);
      const hazardResult = this.hazardDirector.update(delta, {
        score: this.score,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        isGameOver
      });
      this.hazardWarning = hazardResult.warning;

      if (hazardResult.hit) {
        this.triggerGameOver('Destroyed by lane hazard');
      } else {
        this.checkCollisions();
      }
    } else {
      this.hazardDirector.update(delta, {
        score: this.score,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        isGameOver
      });
    }

    this.applyCameraShake();
    this.updateHud(this.shouldShowBoostEmpty(input));
    this.renderer.render(this.scene, this.camera);
    this.syncDebugAttributes();
  };

  private updateBoost(delta: number, input: InputState, isGameOver: boolean): boolean {
    this.boostEmptyFlashTimer = Math.max(0, this.boostEmptyFlashTimer - delta);

    if (isGameOver) {
      this.isBoosting = false;
      return false;
    }

    if (this.boostLocked && this.boostFuel >= BOOST_MIN_TO_ACTIVATE) {
      this.boostLocked = false;
    }

    const hasFuelToStart = this.isBoosting
      ? this.boostFuel > 0
      : this.boostFuel >= BOOST_MIN_TO_ACTIVATE;
    const shouldBoost = input.boost && !this.boostLocked && hasFuelToStart;

    if (shouldBoost) {
      this.boostFuel = Math.max(0, this.boostFuel - BOOST_FUEL_DRAIN_PER_SECOND * delta);
      this.isBoosting = true;

      if (this.boostFuel <= 0) {
        this.boostFuel = 0;
        this.boostLocked = true;
        this.boostEmptyFlashTimer = 0.45;
        this.isBoosting = false;
        return false;
      }

      return true;
    }

    this.isBoosting = false;
    this.boostFuel = Math.min(
      BOOST_FUEL_MAX,
      this.boostFuel + BOOST_FUEL_RECHARGE_PER_SECOND * delta
    );

    if (input.boost && this.boostFuel < BOOST_MIN_TO_ACTIVATE) {
      this.boostEmptyFlashTimer = 0.18;
    }

    return false;
  }

  private shouldShowBoostEmpty(input: InputState): boolean {
    return (
      input.boost &&
      !this.isBoosting &&
      (this.boostLocked ||
        this.boostFuel < BOOST_MIN_TO_ACTIVATE ||
        this.boostEmptyFlashTimer > 0)
    );
  }

  private updateCombo(delta: number): void {
    if (this.comboTimer <= 0) {
      return;
    }

    this.comboTimer = Math.max(0, this.comboTimer - delta);

    if (this.comboTimer <= 0) {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }
  }

  private updateObstacles(delta: number): void {
    this.ensureObstacleCount();
    const difficultyFactor = 1 + Math.min(this.score / 60, 0.6);

    for (const obstacle of this.obstacles) {
      obstacle.update(delta, difficultyFactor);
    }
  }

  private checkCollisions(): void {
    const playerPosition = this.player.getPosition(this.playerPosition);

    if (
      playerPosition.distanceTo(this.junk.getPosition(this.junkPosition)) <=
      PLAYER_COLLISION_RADIUS + JUNK_COLLISION_RADIUS
    ) {
      this.collectJunk();
    }

    for (const obstacle of this.obstacles) {
      if (
        Math.abs(this.player.currentRadius - ORBIT_LANES[obstacle.laneIndex]) <=
          OBSTACLE_COLLISION_RADIUS &&
        playerPosition.distanceTo(obstacle.getPosition(this.obstaclePosition)) <=
        PLAYER_COLLISION_RADIUS + OBSTACLE_COLLISION_RADIUS
      ) {
        this.triggerGameOver('Impact detected');
        return;
      }
    }
  }

  private collectJunk(): void {
    if (this.comboTimer > 0) {
      this.comboCount += 1;
    } else {
      this.comboCount = 1;
    }

    this.comboMultiplier = Math.min(
      MAX_COMBO_MULTIPLIER,
      1 + Math.floor(this.comboCount / 3)
    );
    this.score += this.comboMultiplier;
    this.comboTimer = COMBO_WINDOW;

    this.particles.emit(this.junk.getPosition(this.junkPosition), 0xffb43a, 12);
    this.screenShake.add(0.035);
    this.respawnJunk();
    this.ensureObstacleCount();
  }

  private triggerGameOver(reason: string): void {
    if (this.state === 'gameover') {
      return;
    }

    this.state = 'gameover';
    this.gameOverReason = reason;
    this.particles.emit(this.player.getPosition(this.playerPosition), 0xcfefff, 28, true);
    this.screenShake.add(0.22);
  }

  private restart(): void {
    this.state = 'playing';
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.boostFuel = BOOST_FUEL_MAX;
    this.boostLocked = false;
    this.boostEmptyFlashTimer = 0;
    this.isBoosting = false;
    this.runTime = 0;
    this.hazardWarning = false;
    this.gameOverReason = 'Impact detected';
    this.screenShake.clear();
    this.particles.clear();
    this.hazardDirector.reset();
    this.player.reset();
    this.resetObstacles();
    this.respawnJunk();
    this.orbitLanes.setActiveLane(this.player.targetLaneIndex);
    this.applyCameraShake();
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private resetObstacles(): void {
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle.group);
    }

    this.obstacles.length = 0;
    STARTING_OBSTACLES.forEach((config) => this.createObstacle(config));
  }

  private ensureObstacleCount(): void {
    const desiredCount = this.getDesiredObstacleCount();

    while (this.obstacles.length < desiredCount) {
      this.createObstacle(this.createSafeObstacleConfig(this.obstacles.length));
    }
  }

  private getDesiredObstacleCount(): number {
    if (this.score >= 25) {
      return 4;
    }

    if (this.score >= 10) {
      return 3;
    }

    return 2;
  }

  private createObstacle(config: ObstacleConfig): void {
    const obstacle = new ObstacleSatellite(
      config.laneIndex,
      config.angle,
      config.angularSpeed
    );
    this.obstacles.push(obstacle);
    this.scene.add(obstacle.group);
  }

  private createSafeObstacleConfig(obstacleIndex: number): ObstacleConfig {
    for (let attempt = 0; attempt < 64; attempt += 1) {
      const laneIndex = Math.floor(Math.random() * ORBIT_LANES.length);
      const angle = Math.random() * Math.PI * 2;

      if (
        isAngleSafe(
          angle,
          this.getDisallowedAnglesForLane(laneIndex),
          OBSTACLE_SPAWN_MIN_SEPARATION
        )
      ) {
        return {
          laneIndex,
          angle,
          angularSpeed: this.getObstacleSpeed(obstacleIndex)
        };
      }
    }

    const laneIndex = obstacleIndex % ORBIT_LANES.length;
    return {
      laneIndex,
      angle: randomAngleAvoiding(
        this.getDisallowedAnglesForLane(laneIndex),
        OBSTACLE_SPAWN_MIN_SEPARATION
      ),
      angularSpeed: this.getObstacleSpeed(obstacleIndex)
    };
  }

  private getObstacleSpeed(obstacleIndex: number): number {
    const baseSpeed = OBSTACLE_SPEEDS[obstacleIndex % OBSTACLE_SPEEDS.length];
    return baseSpeed * (0.95 + Math.random() * 0.12);
  }

  private getDisallowedAnglesForLane(laneIndex: number): number[] {
    const disallowedAngles: number[] = [];

    if (this.player.targetLaneIndex === laneIndex) {
      disallowedAngles.push(this.player.angle);
    }

    if (this.junk.laneIndex === laneIndex) {
      disallowedAngles.push(this.junk.angle);
    }

    for (const obstacle of this.obstacles) {
      if (obstacle.laneIndex === laneIndex) {
        disallowedAngles.push(obstacle.angle);
      }
    }

    return disallowedAngles;
  }

  private respawnJunk(): void {
    this.junk.respawn(this.player.angle, this.player.targetLaneIndex, this.getObstacleLaneAngles());
  }

  private getObstacleLaneAngles(): LaneAngle[] {
    return this.obstacles.map((obstacle) => ({
      angle: obstacle.angle,
      laneIndex: obstacle.laneIndex
    }));
  }

  private updateHud(boostEmpty: boolean): void {
    this.hud.update({
      score: this.score,
      state: this.state,
      comboMultiplier: this.comboMultiplier,
      comboTimer: this.comboTimer,
      comboWindow: COMBO_WINDOW,
      laneName: laneName(this.player.targetLaneIndex),
      boostFuel: this.boostFuel / BOOST_FUEL_MAX,
      boostEmpty,
      runTime: this.runTime,
      objectiveTargetScore: RUN_OBJECTIVE_TARGET_SCORE,
      objectiveComplete: this.score >= RUN_OBJECTIVE_TARGET_SCORE,
      hazardWarning: this.hazardWarning,
      gameOverReason: this.gameOverReason
    });
  }

  private readonly handleResize = (): void => {
    this.updateCameraForViewport();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  private updateCameraForViewport(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const narrowViewportScale = aspect < 0.75 ? 1.55 : aspect < 1 ? 1.25 : 1;

    this.camera.aspect = aspect;
    this.baseCameraPosition.set(0, 8 * narrowViewportScale, 10 * narrowViewportScale);
    this.applyCameraShake();
    this.camera.updateProjectionMatrix();
  }

  private applyCameraShake(): void {
    this.shakenCameraPosition.copy(this.baseCameraPosition).add(this.screenShake.getOffset());
    this.camera.position.copy(this.shakenCameraPosition);
    this.camera.lookAt(0, 0, 0);
  }

  private getDebugState(): OrbitJanitorDebugState {
    return {
      sceneId: 'orbit-janitor',
      phase: this.state,
      score: this.score,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      comboTimer: this.comboTimer,
      boostFuel: this.boostFuel,
      isBoosting: this.isBoosting,
      runTime: this.runTime,
      objectiveComplete: this.score >= RUN_OBJECTIVE_TARGET_SCORE,
      playerAngle: this.player.angle,
      playerLaneIndex: this.player.targetLaneIndex,
      playerRadius: this.player.currentRadius,
      junkAngle: this.junk.angle,
      junkLaneIndex: this.junk.laneIndex,
      obstacles: this.getObstacleLaneAngles(),
      hazard: this.hazardDirector.getDebugState(),
      playerPosition: this.player.getPosition(this.playerPosition).toArray(),
      cameraPosition: this.camera.position.toArray(),
      loadedAssetIds: [],
      renderInfo: {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures
      }
    };
  }

  private syncDebugAttributes(): void {
    this.canvas.dataset.sceneId = 'orbit-janitor';
    this.canvas.dataset.phase = this.state;
    this.canvas.dataset.score = String(this.score);
    this.canvas.dataset.comboCount = String(this.comboCount);
    this.canvas.dataset.comboMultiplier = String(this.comboMultiplier);
    this.canvas.dataset.comboTimer = this.comboTimer.toFixed(3);
    this.canvas.dataset.boostFuel = this.boostFuel.toFixed(3);
    this.canvas.dataset.isBoosting = String(this.isBoosting);
    this.canvas.dataset.runTime = this.runTime.toFixed(2);
    this.canvas.dataset.objectiveComplete = String(this.score >= RUN_OBJECTIVE_TARGET_SCORE);
    this.canvas.dataset.playerAngle = this.player.angle.toFixed(4);
    this.canvas.dataset.playerLane = String(this.player.targetLaneIndex);
    this.canvas.dataset.playerRadius = this.player.currentRadius.toFixed(3);
    this.canvas.dataset.junkAngle = this.junk.angle.toFixed(4);
    this.canvas.dataset.junkLane = String(this.junk.laneIndex);
    this.canvas.dataset.obstacleCount = String(this.obstacles.length);
    this.canvas.dataset.obstacleAngles = this.obstacles
      .map((obstacle) => `${obstacle.laneIndex}:${obstacle.angle.toFixed(4)}`)
      .join(',');
    const hazard = this.hazardDirector.getDebugState();
    this.canvas.dataset.hazardPhase = hazard.phase;
    this.canvas.dataset.hazardLane = hazard.laneIndex === null ? '' : String(hazard.laneIndex);
    this.canvas.dataset.hazardAngle = hazard.angle === null ? '' : hazard.angle.toFixed(4);
    this.canvas.dataset.hazardNextSpawn = hazard.nextSpawnIn.toFixed(2);
    this.canvas.dataset.renderCalls = String(this.renderer.info.render.calls);
    this.canvas.dataset.renderTriangles = String(this.renderer.info.render.triangles);
    this.canvas.dataset.renderGeometries = String(this.renderer.info.memory.geometries);
    this.canvas.dataset.renderTextures = String(this.renderer.info.memory.textures);
  }
}

function getHudRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('#hud-root');

  if (!root) {
    throw new Error('Missing #hud-root element.');
  }

  return root;
}
