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
import { AudioManager } from './audio/AudioManager';
import { ParticleBurst } from './effects/ParticleBurst';
import { ScreenShake } from './effects/ScreenShake';
import { Junk, type LaneAngle } from './entities/Junk';
import { ObstacleSatellite, type ObstacleConfig } from './entities/ObstacleSatellite';
import { OrbitLanes } from './entities/OrbitLanes';
import { Planet } from './entities/Planet';
import { PlayerShip } from './entities/PlayerShip';
import { Starfield } from './entities/Starfield';
import { HazardDirector, type HazardDirectorDebugState } from './systems/HazardDirector';
import { RunStats, type RunStatsSnapshot } from './systems/RunStats';
import { UpgradeSystem, type UpgradeSnapshot } from './systems/UpgradeSystem';
import { Hud, type GameState } from './ui/Hud';
import { RunSummary } from './ui/RunSummary';
import { TitleOverlay } from './ui/TitleOverlay';
import { UpgradePanel } from './ui/UpgradePanel';

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
  bestScore: number;
  scrap: number;
  shieldCharges: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  playerAngle: number;
  playerLaneIndex: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  obstacles: LaneAngle[];
  hazard: HazardDirectorDebugState;
  runStats: RunStatsSnapshot;
  upgrades: UpgradeSnapshot;
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
  private readonly audio = new AudioManager();
  private readonly obstacles: ObstacleSatellite[] = [];
  private readonly particles = new ParticleBurst();
  private readonly screenShake = new ScreenShake();
  private readonly hazardDirector = new HazardDirector();
  private readonly runStats = new RunStats(RUN_OBJECTIVE_TARGET_SCORE);
  private readonly upgrades = new UpgradeSystem();
  private readonly baseCameraPosition = new THREE.Vector3();
  private readonly shakenCameraPosition = new THREE.Vector3();
  private readonly playerPosition = new THREE.Vector3();
  private readonly junkPosition = new THREE.Vector3();
  private readonly obstaclePosition = new THREE.Vector3();

  private renderer!: THREE.WebGPURenderer;
  private hud!: Hud;
  private titleOverlay!: TitleOverlay;
  private runSummary!: RunSummary;
  private upgradePanel!: UpgradePanel;
  private orbitLanes!: OrbitLanes;
  private planet!: Planet;
  private starfield!: Starfield;
  private player!: PlayerShip;
  private junk!: Junk;
  private state: GameState = 'title';
  private score = 0;
  private comboCount = 0;
  private comboMultiplier = 1;
  private comboTimer = 0;
  private boostFuel = BOOST_FUEL_MAX;
  private currentJunkCollisionRadius = JUNK_COLLISION_RADIUS;
  private currentBoostFuelMax = BOOST_FUEL_MAX;
  private currentBoostRechargePerSecond = BOOST_FUEL_RECHARGE_PER_SECOND;
  private currentComboWindow = COMBO_WINDOW;
  private boostLocked = false;
  private boostEmptyFlashTimer = 0;
  private isBoosting = false;
  private runTime = 0;
  private hazardWarning = false;
  private hazardActive = false;
  private shieldCharges = 0;
  private shieldBrokenTimer = 0;
  private shieldGraceTimer = 0;
  private upgradePanelOpen = false;
  private objectiveAnnounced = false;
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
    const hudRoot = getHudRoot();
    this.hud = new Hud(hudRoot);
    this.titleOverlay = new TitleOverlay(hudRoot);
    this.runSummary = new RunSummary(hudRoot);
    this.upgradePanel = new UpgradePanel(hudRoot);

    this.scene.background = new THREE.Color(0x02050f);
    this.buildScene();
    this.prepareTitle();

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

    if (this.hasPlayerInput(input)) {
      this.audio.unlock();
    }

    if (input.musicTogglePressed) {
      const musicEnabled = this.audio.toggleMusic();
      this.audio.playUiSelect();

      if (musicEnabled && this.state === 'playing') {
        this.audio.startMusic();
      }
    }

    if (input.sfxTogglePressed) {
      this.audio.toggleSfx();
      this.audio.playUiSelect();
    }

    const canUseUpgradePanel = this.state === 'title' || this.state === 'gameover';
    if (input.upgradeTogglePressed && canUseUpgradePanel) {
      this.upgradePanelOpen = !this.upgradePanelOpen;
      this.audio.playUiSelect();
    }

    if (
      input.upgradeBuyPressed !== null &&
      this.upgradePanelOpen &&
      canUseUpgradePanel &&
      this.upgrades.buyUpgrade(input.upgradeBuyPressed)
    ) {
      this.audio.playUiSelect();
    }

    const consumedStartInput = this.state === 'title' && input.startPressed;
    if (consumedStartInput) {
      this.startRun();
    }

    if (input.restartPressed && this.state === 'gameover') {
      this.restart();
    }

    const isGameplayActive = this.state === 'playing';
    const isGameOver = this.state === 'gameover';
    const controlsLocked = !isGameplayActive || consumedStartInput;
    const wasBoosting = this.isBoosting;
    const isBoosting = this.updateBoost(delta, input, controlsLocked);
    const previousTargetLane = this.player.targetLaneIndex;

    if (isBoosting && !wasBoosting) {
      this.audio.playBoostStart();
      this.audio.playBoostLoopStart();
    } else if (!isBoosting && wasBoosting) {
      this.audio.playBoostLoopStop();
    }

    this.player.update(delta, input, controlsLocked, isBoosting);

    if (this.player.targetLaneIndex !== previousTargetLane) {
      this.audio.playLaneSwitch();
    }

    this.orbitLanes.setActiveLane(this.player.targetLaneIndex);
    this.orbitLanes.update(delta);
    this.junk.update(delta);
    this.particles.update(delta);
    this.screenShake.update(delta);
    this.shieldBrokenTimer = Math.max(0, this.shieldBrokenTimer - delta);
    this.shieldGraceTimer = Math.max(0, this.shieldGraceTimer - delta);

    if (isGameplayActive) {
      this.runTime += delta;
      this.updateCombo(delta);
      this.updateObstacles(delta);
      const wasHazardWarning = this.hazardWarning;
      const wasHazardActive = this.hazardActive;
      const hazardResult = this.hazardDirector.update(delta, {
        score: this.score,
        runTime: this.runTime,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        isGameOver
      });
      this.hazardWarning = hazardResult.warning;
      this.hazardActive = hazardResult.active;

      if (hazardResult.warning && !wasHazardWarning) {
        this.audio.playHazardWarning();
      }

      if (hazardResult.active && !wasHazardActive) {
        this.audio.playHazardActive();
      }

      if (hazardResult.completed) {
        this.runStats.recordHazardSurvived();
      }

      if (hazardResult.hit) {
        this.handlePlayerHit('Destroyed by lane hazard');
      } else {
        this.checkCollisions();
      }
    } else if (isGameOver) {
      this.hazardDirector.update(delta, {
        score: this.score,
        runTime: this.runTime,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        isGameOver
      });
    } else {
      this.hazardWarning = false;
      this.hazardActive = false;
    }

    this.syncRunStats();
    this.applyCameraShake();
    this.updateHud(this.shouldShowBoostEmpty(input));
    this.renderer.render(this.scene, this.camera);
    this.syncDebugAttributes();
  };

  private updateBoost(
    delta: number,
    input: InputState,
    controlsLocked: boolean
  ): boolean {
    this.boostEmptyFlashTimer = Math.max(0, this.boostEmptyFlashTimer - delta);

    if (controlsLocked) {
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
      this.currentBoostFuelMax,
      this.boostFuel + this.currentBoostRechargePerSecond * delta
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
      PLAYER_COLLISION_RADIUS + this.currentJunkCollisionRadius
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
        this.handlePlayerHit('Impact detected');
        return;
      }
    }
  }

  private collectJunk(): void {
    const previousScore = this.score;
    const previousMultiplier = this.comboMultiplier;

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
    this.comboTimer = this.currentComboWindow;

    this.audio.playCollect();
    if (this.comboMultiplier > previousMultiplier) {
      this.audio.playComboUp(this.comboMultiplier);
    }

    this.runStats.recordJunkCollected();
    this.syncRunStats();

    if (
      !this.objectiveAnnounced &&
      previousScore < RUN_OBJECTIVE_TARGET_SCORE &&
      this.score >= RUN_OBJECTIVE_TARGET_SCORE
    ) {
      this.objectiveAnnounced = true;
      this.audio.playObjectiveComplete();
    }

    this.particles.emit(this.junk.getPosition(this.junkPosition), 0xffb43a, 12);
    this.screenShake.add(0.035);
    this.respawnJunk();
    this.ensureObstacleCount();
  }

  private handlePlayerHit(reason: string): void {
    if (this.shieldGraceTimer > 0) {
      return;
    }

    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.shieldBrokenTimer = 1.2;
      this.shieldGraceTimer = 1.15;
      this.particles.emit(
        this.player.getPosition(this.playerPosition),
        0x7ee7ff,
        24,
        true
      );
      this.screenShake.add(0.09);
      return;
    }

    this.triggerGameOver(reason);
  }

  private triggerGameOver(reason: string): void {
    if (this.state === 'gameover') {
      return;
    }

    this.state = 'gameover';
    this.gameOverReason = reason;
    this.syncRunStats();
    this.runStats.complete(reason);
    this.upgrades.awardRunScrap(this.runStats.getSnapshot());
    this.audio.playImpact();
    this.audio.playBoostLoopStop();
    this.audio.stopMusic();
    this.particles.emit(this.player.getPosition(this.playerPosition), 0xcfefff, 28, true);
    this.screenShake.add(0.22);
  }

  private prepareTitle(): void {
    this.resetRunState();
    this.state = 'title';
    this.upgradePanelOpen = false;
    this.audio.stopMusic();
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private startRun(): void {
    if (this.state !== 'title') {
      return;
    }

    this.resetRunState();
    this.state = 'playing';
    this.upgradePanelOpen = false;
    this.audio.playUiStart();
    this.audio.startMusic();
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private restart(): void {
    this.resetRunState();
    this.state = 'playing';
    this.upgradePanelOpen = false;
    this.audio.playUiStart();
    this.audio.startMusic();
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private resetRunState(): void {
    const upgradeEffects = this.upgrades.getRunEffects();

    this.currentJunkCollisionRadius =
      JUNK_COLLISION_RADIUS + upgradeEffects.junkPickupRadiusBonus;
    this.currentBoostFuelMax = upgradeEffects.boostFuelMax;
    this.currentBoostRechargePerSecond = upgradeEffects.boostRechargePerSecond;
    this.currentComboWindow = upgradeEffects.comboWindow;
    this.shieldCharges = upgradeEffects.shieldCharges;
    this.shieldBrokenTimer = 0;
    this.shieldGraceTimer = 0;
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.boostFuel = this.currentBoostFuelMax;
    this.boostLocked = false;
    this.boostEmptyFlashTimer = 0;
    this.isBoosting = false;
    this.runTime = 0;
    this.hazardWarning = false;
    this.hazardActive = false;
    this.objectiveAnnounced = false;
    this.gameOverReason = 'Impact detected';
    this.audio.stopAll();
    this.runStats.reset();
    this.screenShake.clear();
    this.particles.clear();
    this.hazardDirector.reset();
    this.player.setLaneSwitchDuration(upgradeEffects.laneSwitchDuration);
    this.player.reset();
    this.resetObstacles();
    this.respawnJunk();
    this.orbitLanes.setActiveLane(this.player.targetLaneIndex);
    this.applyCameraShake();
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
    this.junk.respawn(
      this.player.angle,
      this.player.targetLaneIndex,
      this.getObstacleLaneAngles()
    );
  }

  private getObstacleLaneAngles(): LaneAngle[] {
    return this.obstacles.map((obstacle) => ({
      angle: obstacle.angle,
      laneIndex: obstacle.laneIndex
    }));
  }

  private hasPlayerInput(input: InputState): boolean {
    return (
      input.left ||
      input.right ||
      input.up ||
      input.down ||
      input.boost ||
      input.laneUpPressed ||
      input.laneDownPressed ||
      input.startPressed ||
      input.restartPressed ||
      input.musicTogglePressed ||
      input.sfxTogglePressed ||
      input.upgradeTogglePressed ||
      input.upgradeBuyPressed !== null
    );
  }

  private syncRunStats(): void {
    this.runStats.syncProgress(
      this.score,
      this.runTime,
      this.comboCount,
      this.comboMultiplier
    );
  }

  private updateHud(boostEmpty: boolean): void {
    const stats = this.runStats.getSnapshot();

    this.hud.update({
      score: this.score,
      state: this.state,
      comboMultiplier: this.comboMultiplier,
      comboTimer: this.comboTimer,
      comboWindow: this.currentComboWindow,
      laneName: laneName(this.player.targetLaneIndex),
      boostFuel: this.boostFuel / this.currentBoostFuelMax,
      boostEmpty,
      runTime: this.runTime,
      objectiveTargetScore: RUN_OBJECTIVE_TARGET_SCORE,
      objectiveComplete: this.score >= RUN_OBJECTIVE_TARGET_SCORE,
      hazardWarning: this.hazardWarning,
      shieldCharges: this.shieldCharges,
      shieldBroken: this.shieldBrokenTimer > 0,
      gameOverReason: this.gameOverReason,
      musicEnabled: this.audio.isMusicEnabled(),
      sfxEnabled: this.audio.isSfxEnabled()
    });
    this.titleOverlay.update({
      state: this.state,
      upgradePanelOpen: this.upgradePanelOpen,
      musicEnabled: this.audio.isMusicEnabled(),
      sfxEnabled: this.audio.isSfxEnabled()
    });
    this.runSummary.update({
      state: this.state,
      stats,
      upgrades: this.upgrades.getSnapshot(),
      upgradePanelOpen: this.upgradePanelOpen
    });
    this.upgradePanel.update({
      isOpen: this.upgradePanelOpen,
      canShow: this.state === 'title' || this.state === 'gameover',
      upgrades: this.upgrades.getSnapshot()
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
    this.shakenCameraPosition
      .copy(this.baseCameraPosition)
      .add(this.screenShake.getOffset());
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
      bestScore: this.runStats.getSnapshot().bestScore,
      scrap: this.upgrades.getSnapshot().totalScrap,
      shieldCharges: this.shieldCharges,
      musicEnabled: this.audio.isMusicEnabled(),
      sfxEnabled: this.audio.isSfxEnabled(),
      playerAngle: this.player.angle,
      playerLaneIndex: this.player.targetLaneIndex,
      playerRadius: this.player.currentRadius,
      junkAngle: this.junk.angle,
      junkLaneIndex: this.junk.laneIndex,
      obstacles: this.getObstacleLaneAngles(),
      hazard: this.hazardDirector.getDebugState(),
      runStats: this.runStats.getSnapshot(),
      upgrades: this.upgrades.getSnapshot(),
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
    this.canvas.dataset.bestScore = String(this.runStats.getSnapshot().bestScore);
    this.canvas.dataset.scrap = String(this.upgrades.getSnapshot().totalScrap);
    this.canvas.dataset.shieldCharges = String(this.shieldCharges);
    this.canvas.dataset.upgradePanelOpen = String(this.upgradePanelOpen);
    this.canvas.dataset.musicEnabled = String(this.audio.isMusicEnabled());
    this.canvas.dataset.sfxEnabled = String(this.audio.isSfxEnabled());
    this.canvas.dataset.objectiveComplete = String(
      this.score >= RUN_OBJECTIVE_TARGET_SCORE
    );
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
    this.canvas.dataset.hazardType = hazard.type;
    this.canvas.dataset.hazardPhase = hazard.phase;
    this.canvas.dataset.hazardLanes = hazard.laneIndices.join(',');
    this.canvas.dataset.hazardLane =
      hazard.laneIndex === null ? '' : String(hazard.laneIndex);
    this.canvas.dataset.hazardAngle =
      hazard.angle === null ? '' : hazard.angle.toFixed(4);
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
