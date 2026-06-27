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
  HAZARD_COLLISION_RADIUS,
  JUNK_COLLISION_RADIUS,
  MAX_COMBO_MULTIPLIER,
  OBSTACLE_COLLISION_RADIUS,
  ORBIT_LANES,
  PLAYER_COLLISION_RADIUS,
  POWERUP_MAGNET_PICKUP_RADIUS_BONUS,
  POWERUP_MAGNET_PULL_RANGE,
  POWERUP_MAGNET_PULL_SPEED,
  POWERUP_SCRAP_CACHE_BONUS,
  RUN_OBJECTIVE_TARGET_SCORE
} from './constants';
import {
  InputController,
  createNeutralInputState,
  mergeInputStates,
  type InputState
} from './input';
import { GamepadInput } from './input/GamepadInput';
import { TouchControls } from './input/TouchControls';
import {
  angularDistance,
  isAngleSafe,
  laneName,
  randomAngleAvoiding,
  wrapAngle
} from './math';
import { createRenderer } from './renderer';
import { AudioManager } from './audio/AudioManager';
import { MusicDirector } from './audio/MusicDirector';
import { CinematicDirector } from './cinematics/CinematicDirector';
import type { CinematicContext, CinematicPresetKey } from './cinematics/CinematicShot';
import { CameraRig } from './effects/CameraRig';
import { ImpactFlash } from './effects/ImpactFlash';
import { ParticleBurst } from './effects/ParticleBurst';
import { ScreenShake } from './effects/ScreenShake';
import { GhostMarker } from './entities/GhostMarker';
import { Junk, type LaneAngle } from './entities/Junk';
import { ObstacleSatellite, type ObstacleConfig } from './entities/ObstacleSatellite';
import { OrbitLanes } from './entities/OrbitLanes';
import { PlayerShip } from './entities/PlayerShip';
import { getPowerupColor, type PowerupType } from './entities/Powerup';
import { Starfield } from './entities/Starfield';
import { createWorldCore } from './entities/world-cores/createWorldCore';
import type { WorldCore, WorldCoreType } from './entities/world-cores/WorldCore';
import { ChallengeMode, type ChallengeRunMode } from './systems/ChallengeMode';
import {
  EventWaveDirector,
  type EventWaveDebugState,
  type SatelliteNetEffect
} from './systems/EventWaveDirector';
import {
  HazardDirector,
  type HazardDirectorDebugState,
  type HazardDirectorResult
} from './systems/HazardDirector';
import type { HazardPatternType } from './systems/HazardTypes';
import { MissionDirector } from './systems/MissionDirector';
import {
  PowerupDirector,
  type PowerupDirectorDebugState
} from './systems/PowerupDirector';
import { RunStats, type RunStatsSnapshot } from './systems/RunStats';
import {
  DEFAULT_SECTOR_ID,
  TRAINING_SECTOR_ID,
  getSectorById
} from './systems/SectorConfig';
import { SectorProgress, type SectorProgressSnapshot } from './systems/SectorProgress';
import { type SectorTheme } from './systems/SectorTheme';
import { SeededRandom } from './systems/SeededRandom';
import {
  SettingsSystem,
  type ScreenShakeIntensity,
  type SettingsSnapshot
} from './systems/SettingsSystem';
import {
  TutorialDirector,
  type TutorialContext,
  type TutorialSetupAction
} from './systems/TutorialDirector';
import { UpgradeSystem, type UpgradeSnapshot } from './systems/UpgradeSystem';
import { FloatingText } from './ui/FloatingText';
import { CinematicLetterbox } from './ui/CinematicLetterbox';
import { HelpOverlay } from './ui/HelpOverlay';
import { Hud, type GameState } from './ui/Hud';
import { MissionCompleteOverlay } from './ui/MissionCompleteOverlay';
import { MissionIntroOverlay } from './ui/MissionIntroOverlay';
import { PauseOverlay } from './ui/PauseOverlay';
import { PowerupToast } from './ui/PowerupToast';
import { RunSummary } from './ui/RunSummary';
import { SectorSelectOverlay } from './ui/SectorSelectOverlay';
import { SettingsOverlay } from './ui/SettingsOverlay';
import { TitleOverlay } from './ui/TitleOverlay';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { UpgradePanel } from './ui/UpgradePanel';

const STARTING_OBSTACLES: ObstacleConfig[] = [
  { laneIndex: 0, angle: Math.PI * 0.72, angularSpeed: -0.72 },
  { laneIndex: 2, angle: Math.PI * 1.38, angularSpeed: 0.58 }
];

const OBSTACLE_SPEEDS = [-0.72, 0.58, -0.88, 0.69];
const OBSTACLE_SPAWN_MIN_SEPARATION = 1.0;
const MISSION_INTRO_DURATION = 3.35;
const MISSION_INTRO_REDUCED_MOTION_DURATION = 0.95;
const NEAR_MISS_DISTANCE_BONUS = 0.36;
const NEAR_MISS_COOLDOWN = 0.72;
const HAZARD_NEAR_MISS_ANGLE = 0.92;

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
  runMode: ChallengeRunMode;
  runLabel: string;
  runSeed: string;
  dailyBestScore: number;
  sectorId: string;
  sectorName: string;
  worldCoreType: WorldCoreType;
  missionProgress: string;
  sectorProgress: SectorProgressSnapshot;
  tutorialActive: boolean;
  tutorialStepId: string | null;
  tutorialSkipped: boolean;
  isPaused: boolean;
  helpOpen: boolean;
  settingsOpen: boolean;
  missionIntroActive: boolean;
  cinematicActive: boolean;
  cinematicPresetKey: CinematicPresetKey | null;
  cinematicTitle: string;
  reducedMotion: boolean;
  settings: SettingsSnapshot;
  scrap: number;
  shieldCharges: number;
  musicEnabled: boolean;
  musicVolume: number;
  musicDangerIntensity: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  playerAngle: number;
  playerLaneIndex: number;
  playerRadius: number;
  junkAngle: number;
  junkLaneIndex: number;
  obstacles: LaneAngle[];
  hazard: HazardDirectorDebugState;
  eventWave: EventWaveDebugState;
  powerup: PowerupDirectorDebugState;
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
      forceGameOver: (reason?: string) => void;
      skipCinematic: () => void;
    };
  }
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly input = new InputController();
  private readonly gamepadInput = new GamepadInput();
  private readonly settings = new SettingsSystem();
  private readonly audio = new AudioManager();
  private readonly music = new MusicDirector(this.audio);
  private readonly obstacles: ObstacleSatellite[] = [];
  private readonly particles = new ParticleBurst();
  private readonly screenShake = new ScreenShake();
  private readonly cameraRig = new CameraRig();
  private readonly cinematicDirector = new CinematicDirector();
  private readonly hazardDirector = new HazardDirector();
  private readonly eventWaveDirector = new EventWaveDirector();
  private readonly powerupDirector = new PowerupDirector();
  private readonly runStats = new RunStats(RUN_OBJECTIVE_TARGET_SCORE);
  private readonly upgrades = new UpgradeSystem();
  private readonly challengeMode = new ChallengeMode();
  private readonly missionDirector = new MissionDirector();
  private readonly sectorProgress = new SectorProgress();
  private readonly tutorialDirector = new TutorialDirector();
  private readonly baseCameraPosition = new THREE.Vector3();
  private readonly shakenCameraPosition = new THREE.Vector3();
  private readonly playerPosition = new THREE.Vector3();
  private readonly junkPosition = new THREE.Vector3();
  private readonly obstaclePosition = new THREE.Vector3();
  private reducedMotion = this.settings.getSnapshot().reducedMotion;
  private readonly nearMissObstacles = new Set<ObstacleSatellite>();

  private renderer!: THREE.WebGPURenderer;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private hud!: Hud;
  private titleOverlay!: TitleOverlay;
  private sectorSelectOverlay!: SectorSelectOverlay;
  private missionCompleteOverlay!: MissionCompleteOverlay;
  private runSummary!: RunSummary;
  private upgradePanel!: UpgradePanel;
  private tutorialOverlay!: TutorialOverlay;
  private helpOverlay!: HelpOverlay;
  private pauseOverlay!: PauseOverlay;
  private powerupToast!: PowerupToast;
  private settingsOverlay!: SettingsOverlay;
  private touchControls!: TouchControls;
  private impactFlash!: ImpactFlash;
  private floatingText!: FloatingText;
  private cinematicLetterbox!: CinematicLetterbox;
  private missionIntroOverlay!: MissionIntroOverlay;
  private orbitLanes!: OrbitLanes;
  private worldCore!: WorldCore;
  private starfield!: Starfield;
  private player!: PlayerShip;
  private junk!: Junk;
  private ghostMarker!: GhostMarker;
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
  private musicDangerIntensity = 0;
  private shieldCharges = 0;
  private shieldBrokenTimer = 0;
  private shieldGraceTimer = 0;
  private upgradePanelOpen = false;
  private isPaused = false;
  private helpOpen = false;
  private settingsOpen = false;
  private settingsSelectionIndex = 0;
  private objectiveAnnounced = false;
  private gameOverReason = 'Impact detected';
  private runRng = new SeededRandom('title');
  private selectedSectorId = DEFAULT_SECTOR_ID;
  private currentWorldCoreType: WorldCoreType | null = null;
  private titleCinematicPlayed = false;
  private newlyUnlockedSectorName: string | null = null;
  private sectorHintTimer = 0;
  private runBonusScrap = 0;
  private missionIntroTimer = 0;
  private missionIntroActive = false;
  private nearMissCooldown = 0;
  private hazardNearMissArmed = false;

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
    this.sectorSelectOverlay = new SectorSelectOverlay(hudRoot);
    this.missionCompleteOverlay = new MissionCompleteOverlay(hudRoot);
    this.runSummary = new RunSummary(hudRoot);
    this.upgradePanel = new UpgradePanel(hudRoot);
    this.tutorialOverlay = new TutorialOverlay(hudRoot);
    this.pauseOverlay = new PauseOverlay(hudRoot);
    this.helpOverlay = new HelpOverlay(hudRoot);
    this.powerupToast = new PowerupToast(hudRoot);
    this.settingsOverlay = new SettingsOverlay(hudRoot);
    this.touchControls = new TouchControls(hudRoot);
    this.impactFlash = new ImpactFlash(hudRoot);
    this.floatingText = new FloatingText(hudRoot);
    this.cinematicLetterbox = new CinematicLetterbox(hudRoot);
    this.missionIntroOverlay = new MissionIntroOverlay(hudRoot);
    this.applySettings();

    this.scene.background = new THREE.Color(0x02050f);
    this.buildScene();
    this.prepareTitle();

    window.addEventListener('resize', this.handleResize);
    window.orbitJanitorDebug = {
      getState: () => this.getDebugState(),
      restart: () => this.restart(),
      forceGameOver: (reason = 'Debug game over') => this.triggerGameOver(reason),
      skipCinematic: () => this.cinematicDirector.skip()
    };
  }

  start(): void {
    this.clock.start();
    this.renderer.setAnimationLoop(this.update);
  }

  private buildScene(): void {
    this.ambientLight = new THREE.AmbientLight(0xbdd7e8, 0.58);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.6);
    this.directionalLight.position.set(4, 7, 5);

    this.worldCore = createWorldCore(
      this.missionDirector.getCurrentSector().worldCoreType
    );
    this.currentWorldCoreType = this.missionDirector.getCurrentSector().worldCoreType;
    this.orbitLanes = new OrbitLanes();
    this.starfield = new Starfield();
    this.player = new PlayerShip();
    this.junk = new Junk();
    this.ghostMarker = new GhostMarker();

    this.scene.add(
      this.starfield.points,
      this.ambientLight,
      this.directionalLight,
      this.worldCore.group,
      this.orbitLanes.group,
      this.eventWaveDirector.group,
      this.hazardDirector.group,
      this.powerupDirector.group,
      this.ghostMarker.group,
      this.player.group,
      this.junk.group,
      this.particles.group
    );
    this.applyCurrentSectorTheme(false);
  }

  private readonly update = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const input = mergeInputStates(
      this.input.consumeFrame(),
      this.gamepadInput.consumeFrame(),
      this.touchControls.consumeFrame()
    );

    if (this.hasPlayerInput(input)) {
      this.music.unlock();
    }

    const cinematicWasActive = this.cinematicDirector.isActive();
    const titleCinematicSkip =
      cinematicWasActive && this.state === 'title' && this.hasPlayerInput(input);
    const cinematicInputConsumed =
      cinematicWasActive && (input.cinematicSkipPressed || titleCinematicSkip);

    if (cinematicInputConsumed) {
      this.cinematicDirector.skip();
      this.audio.playUiSelect();
      this.audio.playBoostLoopStop();
    }

    if (input.musicTogglePressed) {
      const musicEnabled = !this.music.isMusicEnabled();
      this.music.setMusicEnabled(musicEnabled);
      this.audio.playUiSelect();
    }

    if (input.musicVolumeDownPressed) {
      this.settings.adjustMusicVolume(-0.1);
      this.applySettings();
      this.audio.playUiSelect();
    }

    if (input.musicVolumeUpPressed) {
      this.settings.adjustMusicVolume(0.1);
      this.applySettings();
      this.audio.playUiSelect();
    }

    if (input.sfxVolumeDownPressed) {
      this.settings.adjustSfxVolume(-0.1);
      this.applySettings();
      this.audio.playUiSelect();
    }

    if (input.sfxVolumeUpPressed) {
      this.settings.adjustSfxVolume(0.1);
      this.applySettings();
      this.audio.playUiSelect();
    }

    if (input.sfxTogglePressed) {
      this.audio.toggleSfx();
      this.audio.playUiSelect();
    }

    const inputBlockedByCinematic =
      this.cinematicDirector.isActive() || cinematicInputConsumed;
    const consumedOverlayInput = inputBlockedByCinematic
      ? false
      : this.handleOverlayInput(input);
    const canUseUpgradePanel =
      !inputBlockedByCinematic &&
      !this.helpOpen &&
      !this.isPaused &&
      !this.settingsOpen &&
      (this.state === 'title' ||
        this.state === 'gameover' ||
        this.state === 'missionComplete');
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

    let consumedStartInput = cinematicInputConsumed;
    if (
      !inputBlockedByCinematic &&
      (consumedOverlayInput || this.helpOpen || this.isPaused || this.settingsOpen)
    ) {
      consumedStartInput = consumedOverlayInput;
    } else if (!inputBlockedByCinematic && this.state === 'title') {
      consumedStartInput = this.handleTitleInput(input);
    } else if (!inputBlockedByCinematic && this.state === 'sectorSelect') {
      consumedStartInput = this.handleSectorSelectInput(input);
    } else if (!inputBlockedByCinematic && this.state === 'missionComplete') {
      consumedStartInput = this.handleMissionCompleteInput(input);
    }

    if (
      input.restartPressed &&
      this.state === 'gameover' &&
      !this.helpOpen &&
      !inputBlockedByCinematic
    ) {
      this.restart();
    }

    if (
      input.tutorialSkipPressed &&
      this.state === 'playing' &&
      !this.isGameplayPaused() &&
      !inputBlockedByCinematic &&
      this.tutorialDirector.getSnapshot().isActive
    ) {
      this.tutorialDirector.skip();
      this.applyTutorialSetup(this.tutorialDirector.consumeSetupAction());
      this.triggerMissionComplete();
    }

    this.updateMissionIntro(delta);
    const gameplayPaused = this.isGameplayPaused();
    const isGameplayActive =
      this.state === 'playing' && !gameplayPaused && !this.missionIntroActive;
    const isGameOver = this.state === 'gameover';
    const controlsLocked =
      this.state !== 'playing' ||
      gameplayPaused ||
      consumedStartInput ||
      this.missionIntroActive;
    const inputPowerupEffects = this.powerupDirector.getEffects();
    const wasBoosting = this.isBoosting;
    const isBoosting = this.updateBoost(
      delta,
      input,
      controlsLocked,
      inputPowerupEffects.overdrive
    );
    const previousTargetLane = this.player.targetLaneIndex;

    if (isBoosting && !wasBoosting) {
      this.audio.playBoostStart();
      this.audio.playBoostLoopStart();
      this.cameraRig.punch(0.08);
    } else if (!isBoosting && wasBoosting) {
      this.audio.playBoostLoopStop();
      this.audio.playBoostEnd();
    }

    this.player.update(delta, input, controlsLocked, isBoosting);

    if (this.player.targetLaneIndex !== previousTargetLane) {
      this.audio.playLaneSwitch();
    }

    const eventWaveVisual = this.eventWaveDirector.getSnapshot();
    const eventWaveVisualEffects = this.eventWaveDirector.getEffects();

    this.worldCore.update(delta, {
      sectorId: this.missionDirector.getCurrentSector().id,
      eventWaveType: eventWaveVisual.type,
      eventWavePhase: eventWaveVisual.phase,
      eventPulseIntensity: eventWaveVisualEffects.worldCorePulseIntensity,
      runTime: this.runTime,
      reducedMotion: this.reducedMotion
    });
    this.orbitLanes.setActiveLane(this.player.targetLaneIndex);
    this.orbitLanes.update(delta);
    this.junk.update(delta);
    this.ghostMarker.update(delta);
    this.particles.update(delta);
    this.screenShake.update(delta);
    this.cameraRig.update(delta, isBoosting);
    this.impactFlash.update(delta);
    this.floatingText.update(delta);
    this.powerupToast.update(delta);
    this.shieldBrokenTimer = Math.max(0, this.shieldBrokenTimer - delta);
    this.shieldGraceTimer = Math.max(0, this.shieldGraceTimer - delta);
    this.sectorHintTimer = Math.max(0, this.sectorHintTimer - delta);
    this.nearMissCooldown = Math.max(0, this.nearMissCooldown - delta);

    if (isGameplayActive) {
      this.runTime += delta;
      this.syncRunStats();
      this.updateEventWave(delta);
      this.updatePowerups(delta);
      const powerupEffects = this.powerupDirector.getEffects();
      const eventEffects = this.eventWaveDirector.getEffects();
      this.applyMagnetSurge(delta, powerupEffects.magnetSurge);
      this.updateCombo(delta, powerupEffects.comboLock);
      this.updateObstacles(
        delta,
        powerupEffects.timeDilationScale,
        eventEffects.satelliteNet
      );
      this.syncRunStats();
      this.updateTutorial(delta, input, isBoosting);

      if (this.state === 'playing' && !this.tryCompleteMission()) {
        const difficulty = this.missionDirector.getDifficulty(
          this.runStats.getSnapshot()
        );
        const wasHazardWarning = this.hazardWarning;
        const wasHazardActive = this.hazardActive;
        const hazardResult = this.hazardDirector.update(
          delta * powerupEffects.timeDilationScale,
          {
            score: this.score,
            runTime: this.runTime,
            playerAngle: this.player.angle,
            playerRadius: this.player.currentRadius,
            junkAngle: this.junk.angle,
            junkLaneIndex: this.junk.laneIndex,
            rng: this.runRng,
            hazardIntensity:
              difficulty.hazardIntensity * eventEffects.regularHazardIntensityMultiplier,
            hazardIntervalMultiplier:
              difficulty.hazardIntervalMultiplier * eventEffects.hazardIntervalMultiplier,
            hazardTelegraphMultiplier:
              difficulty.hazardTelegraphMultiplier *
              eventEffects.hazardTelegraphMultiplier,
            hazardActiveMultiplier:
              difficulty.hazardActiveMultiplier * eventEffects.hazardActiveMultiplier,
            hazardSpeedMultiplier:
              difficulty.hazardSpeedMultiplier * eventEffects.hazardSpeedMultiplier,
            allowedHazardTypes: difficulty.allowedHazardTypes,
            isGameOver
          }
        );
        this.hazardWarning = hazardResult.warning;
        this.hazardActive = hazardResult.active;

        if (hazardResult.warning && !wasHazardWarning) {
          this.hazardNearMissArmed = true;
          this.audio.playHazardWarning();
        }

        if (hazardResult.active && !wasHazardActive) {
          this.hazardNearMissArmed = true;
          this.audio.playHazardActive();
        }

        if (hazardResult.completed) {
          this.hazardNearMissArmed = false;
          this.runStats.recordHazardSurvived();
          this.syncRunStats();
          this.updateTutorial(0, input, isBoosting);
        }

        if (this.tryCompleteMission()) {
          // Mission completion takes priority over any later collision checks.
        } else if (hazardResult.hit && this.tutorialDirector.getSnapshot().isActive) {
          this.absorbTutorialHit();
        } else if (hazardResult.hit) {
          this.handlePlayerHit('Destroyed by lane hazard');
        } else {
          this.checkHazardNearMiss(hazardResult);
          this.checkCollisions();
          this.syncRunStats();
          this.updateTutorial(0, input, isBoosting);
          this.tryCompleteMission();
        }
      }
    } else if (isGameOver && !this.cinematicDirector.isActive()) {
      this.hazardDirector.update(delta, {
        score: this.score,
        runTime: this.runTime,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        rng: this.runRng,
        isGameOver
      });
    } else if (this.state !== 'playing') {
      this.hazardWarning = false;
      this.hazardActive = false;
      this.hazardNearMissArmed = false;
    }

    this.cinematicDirector.update(delta);
    this.updateMusicIntensity();
    this.syncRunStats();
    this.applyCameraShake();
    this.applyCinematicCameraOverride();
    this.updateHud(this.shouldShowBoostEmpty(input));
    this.renderer.render(this.scene, this.camera);
    this.syncDebugAttributes();
  };

  private updateBoost(
    delta: number,
    input: InputState,
    controlsLocked: boolean,
    freeBoost: boolean
  ): boolean {
    this.boostEmptyFlashTimer = Math.max(0, this.boostEmptyFlashTimer - delta);

    if (controlsLocked) {
      this.isBoosting = false;
      return false;
    }

    if (this.boostLocked && this.boostFuel >= BOOST_MIN_TO_ACTIVATE) {
      this.boostLocked = false;
    }

    const hasFuelToStart = freeBoost
      ? true
      : this.isBoosting
        ? this.boostFuel > 0
        : this.boostFuel >= BOOST_MIN_TO_ACTIVATE;
    const shouldBoost = input.boost && hasFuelToStart && (freeBoost || !this.boostLocked);

    if (shouldBoost) {
      if (freeBoost) {
        this.isBoosting = true;
        return true;
      }

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
    if (this.powerupDirector.getEffects().overdrive) {
      return false;
    }

    return (
      input.boost &&
      !this.isBoosting &&
      (this.boostLocked ||
        this.boostFuel < BOOST_MIN_TO_ACTIVATE ||
        this.boostEmptyFlashTimer > 0)
    );
  }

  private handleOverlayInput(input: InputState): boolean {
    if (input.settingsTogglePressed && this.canToggleSettings()) {
      this.settingsOpen = !this.settingsOpen;
      this.helpOpen = false;
      this.upgradePanelOpen = false;
      this.audio.playUiSelect();

      if (this.settingsOpen && this.state === 'playing') {
        this.audio.playBoostLoopStop();
      }

      return true;
    }

    if (input.escapePressed && this.settingsOpen) {
      this.settingsOpen = false;
      this.audio.playUiSelect();
      return true;
    }

    if (this.settingsOpen) {
      return this.handleSettingsInput(input);
    }

    if (input.helpTogglePressed && this.canToggleHelp()) {
      this.helpOpen = !this.helpOpen;
      this.upgradePanelOpen = false;
      this.settingsOpen = false;
      this.audio.playUiSelect();

      if (this.helpOpen && this.state === 'playing') {
        this.audio.playBoostLoopStop();
      }

      return true;
    }

    if (input.escapePressed && this.helpOpen) {
      this.helpOpen = false;
      this.audio.playUiSelect();
      return true;
    }

    if (input.pausePressed && this.state === 'playing' && !this.helpOpen) {
      this.setPaused(!this.isPaused);
      return true;
    }

    if (input.escapePressed && this.state === 'playing' && this.isPaused) {
      this.setPaused(false);
      return true;
    }

    return false;
  }

  private handleSettingsInput(input: InputState): boolean {
    if (input.laneUpPressed) {
      this.settingsSelectionIndex = (this.settingsSelectionIndex + 5) % 6;
      this.audio.playUiSelect();
      return true;
    }

    if (input.laneDownPressed) {
      this.settingsSelectionIndex = (this.settingsSelectionIndex + 1) % 6;
      this.audio.playUiSelect();
      return true;
    }

    if (input.leftPressed) {
      this.adjustSelectedSetting(-1);
      return true;
    }

    if (input.rightPressed || input.startPressed) {
      this.adjustSelectedSetting(1);
      return true;
    }

    return false;
  }

  private adjustSelectedSetting(direction: number): void {
    if (this.settingsSelectionIndex === 0) {
      this.settings.toggleReducedMotion();
    } else if (this.settingsSelectionIndex === 1) {
      this.settings.cycleScreenShake(direction);
    } else if (this.settingsSelectionIndex === 2) {
      this.settings.adjustMusicVolume(direction * 0.1);
    } else if (this.settingsSelectionIndex === 3) {
      this.settings.adjustSfxVolume(direction * 0.1);
    } else if (this.settingsSelectionIndex === 4) {
      this.settings.toggleHighContrastHazards();
    } else if (this.settingsSelectionIndex === 5) {
      this.settings.cycleTouchControlsMode(direction);
    }

    this.applySettings();
    this.audio.playUiSelect();
  }

  private canToggleHelp(): boolean {
    return (
      this.state === 'title' ||
      this.state === 'sectorSelect' ||
      this.state === 'playing' ||
      this.state === 'gameover' ||
      this.state === 'missionComplete'
    );
  }

  private canToggleSettings(): boolean {
    return this.canToggleHelp();
  }

  private setPaused(isPaused: boolean): void {
    if (this.state !== 'playing') {
      this.isPaused = false;
      return;
    }

    this.isPaused = isPaused;
    this.audio.playUiSelect();

    if (isPaused) {
      this.audio.playBoostLoopStop();
    }
  }

  private isGameplayPaused(): boolean {
    return (
      this.isPaused ||
      this.settingsOpen ||
      this.cinematicDirector.isActive() ||
      this.missionIntroActive ||
      (this.helpOpen && this.state === 'playing')
    );
  }

  private updateEventWave(delta: number): void {
    const stats = this.runStats.getSnapshot();
    const result = this.eventWaveDirector.update(delta, {
      sector: this.missionDirector.getCurrentSector(),
      objective: this.missionDirector.getObjective(stats),
      stats,
      playerAngle: this.player.angle,
      playerRadius: this.player.currentRadius,
      rng: this.runRng,
      hazard: this.hazardDirector.getDebugState(),
      canStart: !this.tutorialDirector.getSnapshot().isActive
    });

    if (result.started) {
      this.hazardDirector.delayNextSpawn(2.25);
      this.audio.playHazardWarning();
      this.playCinematic('eventWarningShot', {
        eventCallout: this.eventWaveDirector.getSnapshot().callout || 'Event Incoming'
      });
    }

    if (result.activated) {
      this.audio.playHazardActive();
      this.screenShake.add(0.04);
    }

    if (result.forcedHazardType) {
      this.forceEventHazard(result.forcedHazardType);
    }

    if (result.completed) {
      this.hazardDirector.delayNextSpawn(1.4);
    }
  }

  private forceEventHazard(type: HazardPatternType): void {
    const difficulty = this.missionDirector.getDifficulty(this.runStats.getSnapshot());
    const eventEffects = this.eventWaveDirector.getEffects();

    if (
      this.hazardDirector.forceHazard(type, {
        score: this.score,
        runTime: this.runTime,
        playerAngle: this.player.angle,
        playerRadius: this.player.currentRadius,
        junkAngle: this.junk.angle,
        junkLaneIndex: this.junk.laneIndex,
        rng: this.runRng,
        hazardIntensity: 1,
        hazardIntervalMultiplier: 1.8,
        hazardTelegraphMultiplier:
          difficulty.hazardTelegraphMultiplier * eventEffects.hazardTelegraphMultiplier,
        hazardActiveMultiplier:
          difficulty.hazardActiveMultiplier * eventEffects.hazardActiveMultiplier,
        hazardSpeedMultiplier:
          difficulty.hazardSpeedMultiplier * eventEffects.hazardSpeedMultiplier,
        allowedHazardTypes: [type],
        isGameOver: false
      })
    ) {
      this.audio.playHazardWarning();
    }
  }

  private updatePowerups(delta: number): void {
    const tutorial = this.tutorialDirector.getSnapshot();
    const result = this.powerupDirector.update(delta, {
      playerAngle: this.player.angle,
      playerRadius: this.player.currentRadius,
      junkAngle: this.junk.angle,
      junkLaneIndex: this.junk.laneIndex,
      obstacles: this.getObstacleLaneAngles(),
      hazard: this.hazardDirector.getDebugState(),
      rng: this.runRng,
      canSpawn: !tutorial.isActive
    });

    if (result.collected) {
      this.handlePowerupCollected(result.collected);
    }
  }

  private handlePowerupCollected(type: PowerupType): void {
    this.powerupToast.show(type);
    this.audio.playCollect();
    this.particles.emit(
      this.powerupDirector.powerup.getPosition(this.junkPosition),
      getPowerupColor(type),
      16,
      type === 'shieldPickup'
    );
    this.screenShake.add(0.035);

    if (type === 'shieldPickup') {
      this.shieldCharges += 1;
      this.audio.playUiSelect();
      return;
    }

    if (type === 'scrapCache') {
      this.runBonusScrap += POWERUP_SCRAP_CACHE_BONUS;
      this.audio.playUiSelect();
      return;
    }

    this.audio.playUiSelect();
  }

  private applyMagnetSurge(delta: number, isActive: boolean): void {
    if (!isActive) {
      return;
    }

    this.junk.pullToward(
      this.player.angle,
      this.player.targetLaneIndex,
      delta,
      POWERUP_MAGNET_PULL_RANGE,
      POWERUP_MAGNET_PULL_SPEED
    );
  }

  private updateCombo(delta: number, comboLocked: boolean): void {
    if (this.comboTimer <= 0) {
      return;
    }

    if (comboLocked) {
      return;
    }

    this.comboTimer = Math.max(0, this.comboTimer - delta);

    if (this.comboTimer <= 0) {
      if (this.comboMultiplier > 1) {
        this.handleComboBreak();
      }

      this.comboCount = 0;
      this.comboMultiplier = 1;
    }
  }

  private handleComboBreak(): void {
    this.floatingText.show('COMBO LOST', 'lost');
    this.screenShake.add(0.025);
  }

  private updateObstacles(
    delta: number,
    timeScale: number,
    satelliteNet: SatelliteNetEffect | null
  ): void {
    if (satelliteNet) {
      this.updateSatelliteNetObstacles(delta * timeScale, satelliteNet);
      return;
    }

    this.ensureObstacleCount();
    const difficultyFactor = 1 + Math.min(this.score / 60, 0.6);
    const scaledDelta = delta * timeScale;

    for (const obstacle of this.obstacles) {
      obstacle.update(scaledDelta, difficultyFactor);
    }
  }

  private updateSatelliteNetObstacles(
    delta: number,
    satelliteNet: SatelliteNetEffect
  ): void {
    this.ensureObstacleCount(4);
    const dangerLanes = ORBIT_LANES.map((_, index) => index).filter(
      (laneIndex) => laneIndex !== satelliteNet.safeLaneIndex
    );
    const spacing = (Math.PI * 2) / Math.max(3, this.obstacles.length);

    this.obstacles.forEach((obstacle, index) => {
      const laneIndex = dangerLanes[index % dangerLanes.length];
      const laneOffset = index % dangerLanes.length === 0 ? -0.18 : 0.18;

      obstacle.laneIndex = laneIndex;
      obstacle.angle = wrapAngle(satelliteNet.centerAngle + index * spacing + laneOffset);
      obstacle.update(delta, 0);
    });
  }

  private checkCollisions(): void {
    const playerPosition = this.player.getPosition(this.playerPosition);
    const pickupRadius =
      this.currentJunkCollisionRadius +
      (this.powerupDirector.getEffects().magnetSurge
        ? POWERUP_MAGNET_PICKUP_RADIUS_BONUS
        : 0);

    if (
      playerPosition.distanceTo(this.junk.getPosition(this.junkPosition)) <=
      PLAYER_COLLISION_RADIUS + pickupRadius
    ) {
      this.collectJunk();

      if (this.tryCompleteMission()) {
        return;
      }
    }

    for (const obstacle of this.obstacles) {
      const laneDistance = Math.abs(
        this.player.currentRadius - ORBIT_LANES[obstacle.laneIndex]
      );
      const obstacleDistance = playerPosition.distanceTo(
        obstacle.getPosition(this.obstaclePosition)
      );
      const collisionDistance = PLAYER_COLLISION_RADIUS + OBSTACLE_COLLISION_RADIUS;

      if (
        laneDistance <= OBSTACLE_COLLISION_RADIUS &&
        obstacleDistance <= collisionDistance
      ) {
        this.handlePlayerHit('Impact detected');
        return;
      }

      if (
        !this.nearMissObstacles.has(obstacle) &&
        laneDistance <= OBSTACLE_COLLISION_RADIUS + 0.2 &&
        obstacleDistance > collisionDistance &&
        obstacleDistance <= collisionDistance + NEAR_MISS_DISTANCE_BONUS
      ) {
        this.nearMissObstacles.add(obstacle);
        this.triggerNearMiss();
      }
    }
  }

  private checkHazardNearMiss(result: HazardDirectorResult): void {
    if (
      !result.active ||
      result.hit ||
      !this.hazardNearMissArmed ||
      this.nearMissCooldown > 0
    ) {
      return;
    }

    const hazard = this.hazardDirector.getDebugState();
    const hazardAngle = hazard.angle;
    const laneIndices =
      hazard.laneIndices.length > 0
        ? hazard.laneIndices
        : hazard.laneIndex === null
          ? []
          : [hazard.laneIndex];

    if (hazardAngle === null || laneIndices.length === 0) {
      return;
    }

    const nearLane = laneIndices.some(
      (laneIndex) =>
        Math.abs(this.player.currentRadius - ORBIT_LANES[laneIndex]) <=
        HAZARD_COLLISION_RADIUS + 0.26
    );

    if (!nearLane) {
      return;
    }

    const nearAngle =
      hazard.type === 'gate'
        ? angularDistance(this.player.angle, hazardAngle) <= 0.68
        : angularDistance(this.player.angle, hazardAngle) <= HAZARD_NEAR_MISS_ANGLE;

    if (!nearAngle) {
      return;
    }

    this.hazardNearMissArmed = false;
    this.triggerNearMiss();
  }

  private triggerNearMiss(): void {
    if (this.nearMissCooldown > 0 || this.state !== 'playing') {
      return;
    }

    this.nearMissCooldown = NEAR_MISS_COOLDOWN;
    this.score += 1;
    this.syncRunStats();
    this.floatingText.show('NEAR MISS +1', 'bonus');
    this.impactFlash.flash('nearMiss');
    this.screenShake.add(0.035);
    this.cameraRig.punch(0.12);
    this.audio.playUiSelect();
  }

  private collectJunk(): void {
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
    this.comboTimer =
      this.currentComboWindow + this.eventWaveDirector.getEffects().comboWindowBonus;

    this.audio.playCollect();
    this.floatingText.show(
      `+${this.comboMultiplier}`,
      this.comboMultiplier > 1 ? 'bonus' : 'score'
    );
    if (this.comboMultiplier > previousMultiplier) {
      this.audio.playComboUp(this.comboMultiplier);
      this.floatingText.show(`COMBO x${this.comboMultiplier}`, 'bonus');
    }

    this.runStats.recordJunkCollected();
    this.syncRunStats();

    this.particles.emit(this.junk.getPosition(this.junkPosition), 0xffb43a, 12);
    this.screenShake.add(0.035);
    this.respawnJunk();
    this.ensureObstacleCount();
  }

  private handlePlayerHit(reason: string): void {
    if (this.shieldGraceTimer > 0) {
      return;
    }

    if (this.tutorialDirector.getSnapshot().isActive) {
      this.absorbTutorialHit();
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
      this.cameraRig.punch(0.16);
      this.impactFlash.flash('nearMiss');
      this.floatingText.show('SHIELD BROKEN', 'warning');
      this.audio.playShieldBreak();
      return;
    }

    this.triggerGameOver(reason);
  }

  private triggerGameOver(reason: string): void {
    if (this.state === 'gameover') {
      return;
    }

    this.state = 'gameover';
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.missionIntroActive = false;
    this.missionIntroTimer = 0;
    this.hazardNearMissArmed = false;
    this.gameOverReason = reason;
    this.syncRunStats();
    this.runStats.complete(reason);
    const finalStats = this.runStats.getSnapshot();

    this.challengeMode.completeRun(finalStats.finalScore);
    this.upgrades.awardRunScrap(finalStats, this.runBonusScrap);
    this.audio.playImpact();
    this.audio.playBoostLoopStop();
    this.music.playGameOver();
    this.eventWaveDirector.reset(this.runRng);
    this.powerupDirector.reset(this.runRng);
    this.powerupToast.clear();
    this.particles.emit(this.player.getPosition(this.playerPosition), 0xcfefff, 28, true);
    this.screenShake.add(0.22);
    this.cameraRig.punch(0.34);
    this.impactFlash.flash('hit');
    this.floatingText.show('CRITICAL HIT', 'warning');
    this.playCinematic('gameOverImpact', {
      gameOverReason: reason,
      focus: this.getPlayerFocus()
    });
  }

  private triggerMissionComplete(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.state = 'missionComplete';
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.missionIntroActive = false;
    this.missionIntroTimer = 0;
    this.hazardWarning = false;
    this.hazardActive = false;
    this.hazardNearMissArmed = false;
    this.syncRunStats();
    this.runStats.complete('Mission complete');
    const finalStats = this.runStats.getSnapshot();

    this.challengeMode.completeRun(finalStats.finalScore);

    const unlockedSectorId = this.sectorProgress.completeSector(
      this.missionDirector.getCurrentSector().id
    );
    this.newlyUnlockedSectorName =
      unlockedSectorId === null ? null : getSectorById(unlockedSectorId).name;

    this.upgrades.awardRunScrap(finalStats, this.runBonusScrap);
    this.audio.playObjectiveComplete();
    this.audio.playBoostLoopStop();
    this.music.playMissionComplete();
    this.hazardDirector.reset();
    this.eventWaveDirector.reset(this.runRng);
    this.powerupDirector.reset(this.runRng);
    this.powerupToast.clear();
    this.particles.emit(this.player.getPosition(this.playerPosition), 0xffe06b, 24, true);
    this.screenShake.add(0.08);
    this.cameraRig.punch(0.22);
    this.impactFlash.flash('complete');
    this.floatingText.show('MISSION COMPLETE', 'bonus');
    this.playCinematic('missionCompleteFlyBy', {
      focus: this.getPlayerFocus()
    });

    if (this.newlyUnlockedSectorName) {
      this.queueCinematic('sectorUnlockReveal', {
        unlockedSectorName: this.newlyUnlockedSectorName
      });
    }
  }

  private prepareTitle(): void {
    this.challengeMode.prepareTitle();
    this.missionDirector.setSector(this.sectorProgress.getDefaultSectorId());
    this.selectedSectorId = this.missionDirector.getCurrentSector().id;
    this.runRng = new SeededRandom(this.challengeMode.getSnapshot().titleSeed);
    this.resetRunState();
    this.applyCurrentSectorTheme(false);
    this.state = 'title';
    this.upgradePanelOpen = false;
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.music.startTitleMusic();
    if (!this.titleCinematicPlayed) {
      this.titleCinematicPlayed = true;
      this.playCinematic('titleFlyIn');
    }
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private startRun(mode: ChallengeRunMode, sectorId = this.selectedSectorId): void {
    if (
      this.state !== 'title' &&
      this.state !== 'sectorSelect' &&
      this.state !== 'missionComplete'
    ) {
      return;
    }

    this.missionDirector.setSector(sectorId);
    this.selectedSectorId = sectorId;
    this.applyCurrentSectorTheme(true);
    const run =
      mode === 'daily'
        ? this.challengeMode.startDailyChallenge()
        : mode === 'seeded'
          ? this.challengeMode.startSeededRun()
          : this.challengeMode.startNormalRun();
    this.runRng = new SeededRandom(run.seed);
    this.resetRunState();
    this.startTutorialIfNeeded();
    this.state = 'playing';
    this.startMissionIntro();
    this.playCinematic('sectorIntro');
    this.upgradePanelOpen = false;
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.audio.playUiStart();
    this.music.startSectorMusic(
      this.missionDirector.getCurrentSector().id,
      this.missionDirector.getMusicIntensityHint()
    );
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private restart(): void {
    const sectorId = this.missionDirector.getCurrentSector().id;
    this.missionDirector.setSector(sectorId);
    this.selectedSectorId = sectorId;
    this.applyCurrentSectorTheme(true);
    const run = this.challengeMode.restartCurrentRun();
    this.runRng = new SeededRandom(run.seed);
    this.resetRunState();
    this.startTutorialIfNeeded();
    this.state = 'playing';
    this.startMissionIntro();
    this.playCinematic('sectorIntro');
    this.upgradePanelOpen = false;
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.audio.playUiStart();
    this.music.startSectorMusic(
      this.missionDirector.getCurrentSector().id,
      this.missionDirector.getMusicIntensityHint()
    );
    this.updateHud(false);
    this.syncDebugAttributes();
  }

  private startMissionIntro(): void {
    this.missionIntroTimer = this.reducedMotion
      ? MISSION_INTRO_REDUCED_MOTION_DURATION
      : MISSION_INTRO_DURATION;
    this.missionIntroActive = true;
    this.audio.playBoostLoopStop();
  }

  private playCinematic(
    presetKey: CinematicPresetKey,
    overrides: Partial<CinematicContext> = {}
  ): void {
    this.cinematicDirector.play(presetKey, this.createCinematicContext(overrides));
    this.audio.playBoostLoopStop();
  }

  private queueCinematic(
    presetKey: CinematicPresetKey,
    overrides: Partial<CinematicContext> = {}
  ): void {
    this.cinematicDirector.queuePreset(presetKey, this.createCinematicContext(overrides));
  }

  private createCinematicContext(overrides: Partial<CinematicContext>): CinematicContext {
    const sector = this.missionDirector.getCurrentSector();
    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());

    return {
      reducedMotion: this.reducedMotion,
      sectorName: sector.name,
      sectorSubtitle: sector.subtitle,
      objectiveText: objective.text,
      ...overrides
    };
  }

  private getPlayerFocus(): [number, number, number] {
    const position = this.player.getPosition(this.playerPosition);

    return [position.x, position.y, position.z];
  }

  private updateMissionIntro(delta: number): void {
    const cinematicActive = this.cinematicDirector.isActive();

    if (this.state !== 'playing') {
      this.missionIntroActive = false;
      this.missionIntroTimer = 0;
    } else if (
      this.missionIntroActive &&
      !this.helpOpen &&
      !this.isPaused &&
      !cinematicActive
    ) {
      this.missionIntroTimer = Math.max(0, this.missionIntroTimer - delta);

      if (this.missionIntroTimer <= 0) {
        this.missionIntroActive = false;
        this.floatingText.show('CLEAN', 'bonus');
      }
    }

    const sector = this.missionDirector.getCurrentSector();
    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());

    this.missionIntroOverlay.update({
      isVisible: this.missionIntroActive && !cinematicActive,
      sectorName: sector.name,
      objectiveText: objective.text,
      countdownLabel: this.getMissionIntroCountdownLabel()
    });
  }

  private getMissionIntroCountdownLabel(): string {
    if (!this.missionIntroActive) {
      return '';
    }

    const duration = this.reducedMotion
      ? MISSION_INTRO_REDUCED_MOTION_DURATION
      : MISSION_INTRO_DURATION;
    const progress = 1 - this.missionIntroTimer / duration;

    if (progress < 0.28) {
      return '3';
    }

    if (progress < 0.56) {
      return '2';
    }

    if (progress < 0.82) {
      return '1';
    }

    return 'CLEAN';
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
    this.musicDangerIntensity = 0;
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.sectorHintTimer = 2.9;
    this.objectiveAnnounced = false;
    this.newlyUnlockedSectorName = null;
    this.gameOverReason = 'Impact detected';
    this.runBonusScrap = 0;
    this.missionIntroTimer = 0;
    this.missionIntroActive = false;
    this.nearMissCooldown = 0;
    this.hazardNearMissArmed = false;
    this.nearMissObstacles.clear();
    this.audio.stopAll();
    this.runStats.reset();
    this.tutorialDirector.reset();
    this.eventWaveDirector.reset(this.runRng);
    this.powerupDirector.reset(this.runRng);
    this.powerupToast.clear();
    this.ghostMarker.clear();
    this.screenShake.clear();
    this.cameraRig.clear();
    this.impactFlash.clear();
    this.floatingText.clear();
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
    this.clearObstacles();
    const startingObstacleCount =
      this.missionDirector.getDifficulty().startingObstacleCount;

    for (let index = 0; index < startingObstacleCount; index += 1) {
      this.createObstacle(
        STARTING_OBSTACLES[index] ?? this.createSafeObstacleConfig(index)
      );
    }
  }

  private clearObstacles(): void {
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle.group);
    }

    this.obstacles.length = 0;
  }

  private ensureObstacleCount(minimumCount = 0): void {
    const desiredCount = Math.max(this.getDesiredObstacleCount(), minimumCount);

    while (this.obstacles.length < desiredCount) {
      this.createObstacle(this.createSafeObstacleConfig(this.obstacles.length));
    }
  }

  private getDesiredObstacleCount(): number {
    const sector = this.missionDirector.getCurrentSector();
    const difficulty = this.missionDirector.getDifficulty();
    let desiredCount = difficulty.startingObstacleCount;

    if (this.score >= 10) {
      desiredCount += 1;
    }

    if (this.score >= 25) {
      desiredCount += 1;
    }

    if (sector.isEndless && this.score >= 50) {
      desiredCount += 1;
    }

    return Math.min(difficulty.maxObstacleCount, desiredCount);
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
      const laneIndex = this.runRng.int(0, ORBIT_LANES.length - 1);
      const angle = this.runRng.range(0, Math.PI * 2);

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
        OBSTACLE_SPAWN_MIN_SEPARATION,
        this.runRng
      ),
      angularSpeed: this.getObstacleSpeed(obstacleIndex)
    };
  }

  private getObstacleSpeed(obstacleIndex: number): number {
    const baseSpeed = OBSTACLE_SPEEDS[obstacleIndex % OBSTACLE_SPEEDS.length];
    return baseSpeed * this.runRng.range(0.95, 1.07);
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
    const difficulty = this.missionDirector.getDifficulty(this.runStats.getSnapshot());

    if (this.eventWaveDirector.getEffects().cleanupFrenzy) {
      this.respawnCleanupFrenzyJunk();
      return;
    }

    this.junk.respawn(
      this.player.angle,
      this.player.targetLaneIndex,
      this.getObstacleLaneAngles(),
      this.runRng,
      difficulty.junkLaneWeights
    );
  }

  private respawnCleanupFrenzyJunk(): void {
    const laneOffset = this.runRng.pick([-1, 0, 1]);
    const laneIndex = Math.max(
      0,
      Math.min(ORBIT_LANES.length - 1, this.player.targetLaneIndex + laneOffset)
    );
    const direction = this.runRng.next() < 0.5 ? -1 : 1;
    const disallowedAngles = this.getDisallowedAnglesForLane(laneIndex);
    let angle = wrapAngle(this.player.angle + direction * this.runRng.range(0.58, 1.05));

    if (!isAngleSafe(angle, disallowedAngles, 0.56)) {
      angle = randomAngleAvoiding(disallowedAngles, 0.72, this.runRng);
    }

    this.junk.place(laneIndex, angle, this.runRng);
  }

  private getObstacleLaneAngles(): LaneAngle[] {
    return this.obstacles.map((obstacle) => ({
      angle: obstacle.angle,
      laneIndex: obstacle.laneIndex
    }));
  }

  private startTutorialIfNeeded(): void {
    if (!this.missionDirector.getCurrentSector().isTutorial) {
      return;
    }

    this.tutorialDirector.start(
      this.createTutorialContext(createNeutralInputState(), false)
    );
    this.applyTutorialSetup(this.tutorialDirector.consumeSetupAction());
  }

  private updateTutorial(delta: number, input: InputState, isBoosting: boolean): void {
    const wasFinished = this.tutorialDirector.getSnapshot().isFinished;
    const snapshot = this.tutorialDirector.update(
      delta,
      this.createTutorialContext(input, isBoosting)
    );

    this.applyTutorialSetup(this.tutorialDirector.consumeSetupAction());

    if (
      !wasFinished &&
      snapshot.isFinished &&
      this.missionDirector.getCurrentSector().isTutorial
    ) {
      this.triggerMissionComplete();
    }
  }

  private createTutorialContext(input: InputState, isBoosting: boolean): TutorialContext {
    return {
      input,
      playerAngle: this.player.angle,
      playerLaneIndex: this.player.targetLaneIndex,
      isBoosting,
      junkCollected: this.runStats.getSnapshot().junkCollected,
      hazardsSurvived: this.runStats.getSnapshot().hazardsSurvived
    };
  }

  private applyTutorialSetup(action: TutorialSetupAction | null): void {
    if (!action) {
      return;
    }

    if (action === 'place-collect-junk') {
      this.placeTutorialJunk(this.player.targetLaneIndex, this.player.angle + 0.75);
      return;
    }

    if (action === 'place-lane-switch-junk') {
      const nextLane =
        this.player.targetLaneIndex < ORBIT_LANES.length - 1
          ? this.player.targetLaneIndex + 1
          : this.player.targetLaneIndex - 1;

      this.placeTutorialJunk(nextLane, this.player.angle + 0.85);
      return;
    }

    if (action === 'place-boost-junk') {
      this.placeTutorialJunk(this.player.targetLaneIndex, this.player.angle + 1.65);
      return;
    }

    if (action === 'spawn-obstacle') {
      this.spawnTutorialObstacle();
      return;
    }

    if (action === 'spawn-hazard') {
      this.spawnTutorialHazard();
      return;
    }

    this.ghostMarker.clear();
  }

  private placeTutorialJunk(laneIndex: number, angle: number): void {
    const safeAngle = wrapAngle(angle);

    this.junk.place(laneIndex, safeAngle, this.runRng);
    this.ghostMarker.show(laneIndex, safeAngle, 'goal');
  }

  private spawnTutorialObstacle(): void {
    this.clearObstacles();

    const laneIndex = this.player.targetLaneIndex;
    const angle = wrapAngle(this.player.angle + 1.45);

    this.createObstacle({
      laneIndex,
      angle,
      angularSpeed: -0.22
    });
    this.ghostMarker.show(laneIndex, angle, 'danger', 0.44);
  }

  private spawnTutorialHazard(): void {
    const difficulty = this.missionDirector.getDifficulty(this.runStats.getSnapshot());

    this.ghostMarker.clear();
    this.hazardDirector.reset();
    this.hazardDirector.forceHazard('laneArc', {
      score: this.score,
      runTime: this.runTime,
      playerAngle: this.player.angle,
      playerRadius: this.player.currentRadius,
      junkAngle: this.junk.angle,
      junkLaneIndex: this.junk.laneIndex,
      rng: this.runRng,
      hazardIntensity: 1,
      hazardIntervalMultiplier: difficulty.hazardIntervalMultiplier,
      hazardTelegraphMultiplier: difficulty.hazardTelegraphMultiplier,
      hazardActiveMultiplier: difficulty.hazardActiveMultiplier,
      hazardSpeedMultiplier: difficulty.hazardSpeedMultiplier,
      allowedHazardTypes: ['laneArc'],
      isGameOver: false
    });

    const hazard = this.hazardDirector.getDebugState();

    if (hazard.laneIndex !== null && hazard.angle !== null) {
      this.ghostMarker.show(hazard.laneIndex, hazard.angle, 'danger', 0.44);
    }
  }

  private absorbTutorialHit(): void {
    this.shieldBrokenTimer = 0.7;
    this.shieldGraceTimer = 0.85;
    this.particles.emit(this.player.getPosition(this.playerPosition), 0x7ee7ff, 18, true);
    this.screenShake.add(0.06);
    this.audio.playShieldBreak();
  }

  private handleTitleInput(input: InputState): boolean {
    if (input.sectorSelectPressed) {
      this.openSectorSelect();
      return true;
    }

    if (input.tutorialStartPressed) {
      this.startRun('normal', TRAINING_SECTOR_ID);
      return true;
    }

    if (input.seededStartPressed) {
      this.startRun('seeded', this.sectorProgress.getDefaultSectorId());
      return true;
    }

    if (input.dailyStartPressed) {
      this.startRun('daily', this.sectorProgress.getDefaultSectorId());
      return true;
    }

    if (input.startPressed) {
      this.startRun('normal', this.sectorProgress.getDefaultSectorId());
      return true;
    }

    return false;
  }

  private handleSectorSelectInput(input: InputState): boolean {
    if (input.escapePressed) {
      this.prepareTitle();
      return true;
    }

    if (input.laneUpPressed) {
      this.selectSector(-1);
      return true;
    }

    if (input.laneDownPressed) {
      this.selectSector(1);
      return true;
    }

    if (input.startPressed) {
      if (this.sectorProgress.isUnlocked(this.selectedSectorId)) {
        this.startRun('normal', this.selectedSectorId);
      } else {
        this.audio.playUiSelect();
      }

      return true;
    }

    return false;
  }

  private handleMissionCompleteInput(input: InputState): boolean {
    if (input.escapePressed) {
      this.prepareTitle();
      return true;
    }

    if (input.sectorSelectPressed) {
      this.openSectorSelect();
      return true;
    }

    if (input.restartPressed) {
      this.restart();
      return true;
    }

    if (input.startPressed) {
      const nextSectorId = this.sectorProgress.getNextPlayableSectorId(
        this.missionDirector.getCurrentSector().id
      );
      this.startRun('normal', nextSectorId);
      return true;
    }

    return false;
  }

  private openSectorSelect(): void {
    this.state = 'sectorSelect';
    this.upgradePanelOpen = false;
    this.isPaused = false;
    this.helpOpen = false;
    this.settingsOpen = false;
    this.selectedSectorId = this.sectorProgress.isUnlocked(this.selectedSectorId)
      ? this.selectedSectorId
      : this.sectorProgress.getDefaultSectorId();
    this.audio.playUiSelect();
    this.audio.playBoostLoopStop();
    this.music.startTitleMusic();
  }

  private selectSector(direction: number): void {
    const sectors = this.sectorProgress.getSnapshot().sectors;
    const currentIndex = Math.max(
      0,
      sectors.findIndex((sector) => sector.id === this.selectedSectorId)
    );
    const nextIndex = (currentIndex + direction + sectors.length) % sectors.length;

    this.selectedSectorId = sectors[nextIndex].id;
    this.audio.playUiSelect();
  }

  private tryCompleteMission(): boolean {
    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());
    const tutorial = this.tutorialDirector.getSnapshot();

    if (this.missionDirector.getCurrentSector().isTutorial && !tutorial.isFinished) {
      return false;
    }

    if (!objective.isComplete || objective.isEndless || this.state !== 'playing') {
      return false;
    }

    if (!this.objectiveAnnounced) {
      this.objectiveAnnounced = true;
    }

    this.triggerMissionComplete();
    return true;
  }

  private hasPlayerInput(input: InputState): boolean {
    return (
      input.left ||
      input.right ||
      input.up ||
      input.down ||
      input.boost ||
      input.leftPressed ||
      input.rightPressed ||
      input.laneUpPressed ||
      input.laneDownPressed ||
      input.startPressed ||
      input.tutorialStartPressed ||
      input.sectorSelectPressed ||
      input.dailyStartPressed ||
      input.seededStartPressed ||
      input.restartPressed ||
      input.escapePressed ||
      input.pausePressed ||
      input.helpTogglePressed ||
      input.tutorialSkipPressed ||
      input.musicTogglePressed ||
      input.musicVolumeDownPressed ||
      input.musicVolumeUpPressed ||
      input.sfxVolumeDownPressed ||
      input.sfxVolumeUpPressed ||
      input.sfxTogglePressed ||
      input.upgradeTogglePressed ||
      input.settingsTogglePressed ||
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
    this.runStats.syncProgress(
      this.score,
      this.runTime,
      this.comboCount,
      this.comboMultiplier,
      this.missionDirector.getObjective(this.runStats.getSnapshot()).isComplete
    );
  }

  private updateMusicIntensity(): void {
    if (this.state !== 'playing' || this.isGameplayPaused()) {
      this.musicDangerIntensity = 0;
      this.music.setDangerIntensity(0);
      return;
    }

    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());
    const objectivePressure = objective.isEndless
      ? Math.min(0.35, this.runTime / 240)
      : Math.max(0, objective.progress - 0.65) * 0.9;
    const comboPressure =
      this.comboMultiplier >= 4 ? 0.38 : this.comboMultiplier >= 2 ? 0.18 : 0;
    const hazardPressure = this.hazardActive ? 1 : this.hazardWarning ? 0.65 : 0;
    const eventPressure = this.eventWaveDirector.getEffects().dangerIntensity;

    this.musicDangerIntensity = Math.max(
      eventPressure,
      hazardPressure,
      comboPressure,
      Math.min(0.36, objectivePressure)
    );
    this.music.setDangerIntensity(this.musicDangerIntensity);
  }

  private updateHud(boostEmpty: boolean): void {
    const stats = this.runStats.getSnapshot();
    const challenge = this.challengeMode.getSnapshot();
    const sector = this.missionDirector.getCurrentSector();
    const difficulty = this.missionDirector.getDifficulty(stats);
    const objective = this.missionDirector.getObjective(stats);
    const sectorProgress = this.sectorProgress.getSnapshot();
    const tutorial = this.tutorialDirector.getSnapshot();
    const eventWave = this.eventWaveDirector.getSnapshot();
    const eventEffects = this.eventWaveDirector.getEffects();
    const settings = this.settings.getSnapshot();
    const cinematic = this.cinematicDirector.getSnapshot();

    this.hud.update({
      score: this.score,
      state: this.state,
      runLabel: challenge.label,
      runSeed: challenge.seed,
      dailyBestScore: challenge.dailyBestScore,
      sectorName: sector.name,
      sectorSubtitle: sector.subtitle,
      sectorModifierHint: difficulty.modifierHint,
      showSectorHint: this.state === 'playing' && this.sectorHintTimer > 0,
      objectiveText: objective.text,
      objectiveProgressText: objective.progressText,
      comboMultiplier: this.comboMultiplier,
      comboTimer: this.comboTimer,
      comboWindow: this.currentComboWindow + eventEffects.comboWindowBonus,
      laneName: laneName(this.player.targetLaneIndex),
      boostFuel: this.boostFuel / this.currentBoostFuelMax,
      boostEmpty,
      runTime: this.runTime,
      objectiveComplete: objective.isComplete && !objective.isEndless,
      hazardWarning: this.hazardWarning,
      hazardActive: this.hazardActive,
      eventName: eventWave.name,
      eventCallout: eventWave.callout,
      eventInstruction: eventWave.instruction,
      eventCountdown: eventWave.countdown,
      eventTimeRemaining: eventWave.timeRemaining,
      eventPhase: eventWave.phase,
      activePowerups: this.powerupDirector.getActivePowerups(),
      tutorialActive: tutorial.isActive,
      tutorialStepLabel: tutorial.currentStep?.id ?? null,
      isPaused: this.isPaused,
      cinematicActive: cinematic.isActive,
      cinematicPresetKey: cinematic.presetKey,
      shieldCharges: this.shieldCharges,
      shieldBroken: this.shieldBrokenTimer > 0,
      gameOverReason: this.gameOverReason,
      musicEnabled: this.audio.isMusicEnabled(),
      musicVolume: this.music.getMusicVolume(),
      sfxVolume: this.audio.getSfxVolume(),
      settingsOpen: this.settingsOpen,
      highContrastHazards: settings.highContrastHazards,
      sfxEnabled: this.audio.isSfxEnabled()
    });
    this.sectorSelectOverlay.update({
      state: this.state,
      sectors: sectorProgress.sectors,
      selectedSectorId: this.selectedSectorId,
      upgradePanelOpen: this.upgradePanelOpen
    });
    this.missionCompleteOverlay.update({
      state: this.state,
      sector,
      objective,
      stats,
      upgrades: this.upgrades.getSnapshot(),
      newlyUnlockedSectorName: this.newlyUnlockedSectorName,
      upgradePanelOpen: this.upgradePanelOpen,
      cinematicActive: cinematic.isActive
    });
    this.titleOverlay.update({
      state: this.state,
      upgradePanelOpen: this.upgradePanelOpen,
      titleSeed: challenge.titleSeed,
      dailySeed: challenge.dailySeed,
      dailyBestScore: challenge.dailyBestScore,
      musicEnabled: this.audio.isMusicEnabled(),
      musicVolume: this.music.getMusicVolume(),
      sfxEnabled: this.audio.isSfxEnabled(),
      cinematicPresetKey: cinematic.presetKey
    });
    this.runSummary.update({
      state: this.state,
      stats,
      challenge,
      upgrades: this.upgrades.getSnapshot(),
      upgradePanelOpen: this.upgradePanelOpen,
      cinematicActive: cinematic.isActive
    });
    this.upgradePanel.update({
      isOpen: this.upgradePanelOpen,
      canShow:
        this.state === 'title' ||
        this.state === 'gameover' ||
        this.state === 'missionComplete',
      upgrades: this.upgrades.getSnapshot()
    });
    this.tutorialOverlay.update({
      state: this.state,
      tutorial,
      upgradePanelOpen: this.upgradePanelOpen
    });
    this.pauseOverlay.update({
      state: this.state,
      isPaused: this.isPaused,
      helpOpen: this.helpOpen,
      sectorName: sector.name,
      objectiveText: objective.text,
      objectiveProgressText: objective.progressText
    });
    this.helpOverlay.update({
      state: this.state,
      isOpen: this.helpOpen,
      sectorName: sector.name,
      objectiveText: objective.text,
      objectiveProgressText: objective.progressText
    });
    this.settingsOverlay.update({
      isOpen: this.settingsOpen,
      settings,
      selectedIndex: this.settingsSelectionIndex
    });
    this.cinematicLetterbox.update(cinematic);
    this.touchControls.update({
      state: this.state,
      overlaysOpen:
        this.helpOpen ||
        this.settingsOpen ||
        this.upgradePanelOpen ||
        (this.isPaused && this.state === 'playing') ||
        cinematic.isActive ||
        this.missionIntroActive
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
    this.cameraRig.apply(
      this.camera,
      this.baseCameraPosition,
      this.shakenCameraPosition,
      CAMERA_FOV
    );
    this.shakenCameraPosition.add(this.screenShake.getOffset());
    this.camera.position.copy(this.shakenCameraPosition);
    this.camera.lookAt(0, 0, 0);
  }

  private applyCinematicCameraOverride(): void {
    const override = this.cinematicDirector.getCameraOverride();

    if (!override) {
      return;
    }

    this.camera.position.copy(override.position);
    this.camera.lookAt(override.lookAt);
    this.camera.fov = override.fov;
    this.camera.updateProjectionMatrix();
  }

  private applySettings(): void {
    const settings = this.settings.getSnapshot();
    const shakeIntensity = getShakeIntensityScale(settings.screenShakeIntensity);

    this.reducedMotion = settings.reducedMotion;
    this.screenShake.setReducedMotion(settings.reducedMotion);
    this.screenShake.setIntensity(shakeIntensity);
    this.cameraRig.setReducedMotion(settings.reducedMotion);
    this.impactFlash.setReducedMotion(settings.reducedMotion);
    this.floatingText.setReducedMotion(settings.reducedMotion);
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setSfxVolume(settings.sfxVolume);
    this.touchControls?.setMode(settings.touchControlsMode);
    document.documentElement.dataset.highContrastHazards = String(
      settings.highContrastHazards
    );

    if (this.worldCore) {
      this.applyCurrentSectorTheme(false);
    }
  }

  private applyCurrentSectorTheme(showHint: boolean): void {
    this.ensureWorldCoreForCurrentSector();
    const theme = this.getEffectiveSectorTheme(this.missionDirector.getCurrentTheme());
    const difficulty = this.missionDirector.getDifficulty(this.runStats.getSnapshot());

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(theme.backgroundColor);
    } else {
      this.scene.background = new THREE.Color(theme.backgroundColor);
    }

    this.ambientLight.color.setHex(theme.ambientLightColor);
    this.directionalLight.color.setHex(theme.directionalLightColor);
    this.worldCore.applyTheme(theme);
    this.orbitLanes.applyTheme(theme);
    this.starfield.applyTheme(theme);
    this.junk.applyTheme(theme, difficulty.junkColorVariance);
    this.hazardDirector.applyTheme(theme);
    this.eventWaveDirector.applyTheme(theme);

    if (showHint) {
      this.sectorHintTimer = 2.9;
    }
  }

  private ensureWorldCoreForCurrentSector(): void {
    const nextCoreType = this.missionDirector.getCurrentSector().worldCoreType;

    if (this.worldCore && this.currentWorldCoreType === nextCoreType) {
      return;
    }

    if (this.worldCore) {
      this.scene.remove(this.worldCore.group);
      this.worldCore.dispose?.();
    }

    this.worldCore = createWorldCore(nextCoreType);
    this.currentWorldCoreType = nextCoreType;
    this.scene.add(this.worldCore.group);
  }

  private getEffectiveSectorTheme(theme: SectorTheme): SectorTheme {
    if (!this.settings.getSnapshot().highContrastHazards) {
      return theme;
    }

    return {
      ...theme,
      hazardWarningColor: 0xffff00,
      hazardActiveColor: 0xff1744
    };
  }

  private getDebugState(): OrbitJanitorDebugState {
    const challenge = this.challengeMode.getSnapshot();
    const sector = this.missionDirector.getCurrentSector();
    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());
    const tutorial = this.tutorialDirector.getSnapshot();
    const settings = this.settings.getSnapshot();
    const cinematic = this.cinematicDirector.getSnapshot();

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
      objectiveComplete: objective.isComplete && !objective.isEndless,
      bestScore: this.runStats.getSnapshot().bestScore,
      runMode: challenge.mode,
      runLabel: challenge.label,
      runSeed: challenge.seed,
      dailyBestScore: challenge.dailyBestScore,
      sectorId: sector.id,
      sectorName: sector.name,
      worldCoreType: sector.worldCoreType,
      missionProgress: objective.progressText,
      sectorProgress: this.sectorProgress.getSnapshot(),
      tutorialActive: tutorial.isActive,
      tutorialStepId: tutorial.isActive ? (tutorial.currentStep?.id ?? null) : null,
      tutorialSkipped: tutorial.isSkipped,
      isPaused: this.isPaused,
      helpOpen: this.helpOpen,
      settingsOpen: this.settingsOpen,
      missionIntroActive: this.missionIntroActive,
      cinematicActive: cinematic.isActive,
      cinematicPresetKey: cinematic.presetKey,
      cinematicTitle: cinematic.title,
      reducedMotion: this.reducedMotion,
      settings,
      scrap: this.upgrades.getSnapshot().totalScrap,
      shieldCharges: this.shieldCharges,
      musicEnabled: this.audio.isMusicEnabled(),
      musicVolume: this.music.getMusicVolume(),
      musicDangerIntensity: this.musicDangerIntensity,
      sfxEnabled: this.audio.isSfxEnabled(),
      sfxVolume: this.audio.getSfxVolume(),
      playerAngle: this.player.angle,
      playerLaneIndex: this.player.targetLaneIndex,
      playerRadius: this.player.currentRadius,
      junkAngle: this.junk.angle,
      junkLaneIndex: this.junk.laneIndex,
      obstacles: this.getObstacleLaneAngles(),
      hazard: this.hazardDirector.getDebugState(),
      eventWave: this.eventWaveDirector.getDebugState(),
      powerup: this.powerupDirector.getDebugState(),
      runStats: this.runStats.getSnapshot(),
      upgrades: this.upgrades.getSnapshot(),
      playerPosition: this.player.getPosition(this.playerPosition).toArray(),
      cameraPosition: this.camera.position.toArray(),
      loadedAssetIds: this.audio.getLoadedAssetIds(),
      renderInfo: {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures
      }
    };
  }

  private syncDebugAttributes(): void {
    const challenge = this.challengeMode.getSnapshot();
    const sector = this.missionDirector.getCurrentSector();
    const objective = this.missionDirector.getObjective(this.runStats.getSnapshot());
    const tutorial = this.tutorialDirector.getSnapshot();
    const settings = this.settings.getSnapshot();
    const cinematic = this.cinematicDirector.getSnapshot();

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
    this.canvas.dataset.runMode = challenge.mode;
    this.canvas.dataset.runLabel = challenge.label;
    this.canvas.dataset.runSeed = challenge.seed;
    this.canvas.dataset.dailyBestScore = String(challenge.dailyBestScore);
    this.canvas.dataset.sectorId = sector.id;
    this.canvas.dataset.sectorName = sector.name;
    this.canvas.dataset.worldCoreType = sector.worldCoreType;
    this.canvas.dataset.missionObjective = objective.text;
    this.canvas.dataset.missionProgress = objective.progressText;
    this.canvas.dataset.missionComplete = String(
      objective.isComplete && !objective.isEndless
    );
    this.canvas.dataset.tutorialActive = String(tutorial.isActive);
    this.canvas.dataset.tutorialStep = tutorial.isActive
      ? (tutorial.currentStep?.id ?? '')
      : '';
    this.canvas.dataset.tutorialSkipped = String(tutorial.isSkipped);
    this.canvas.dataset.paused = String(this.isPaused);
    this.canvas.dataset.helpOpen = String(this.helpOpen);
    this.canvas.dataset.settingsOpen = String(this.settingsOpen);
    this.canvas.dataset.missionIntroActive = String(this.missionIntroActive);
    this.canvas.dataset.cinematicActive = String(cinematic.isActive);
    this.canvas.dataset.cinematicPreset = cinematic.presetKey ?? '';
    this.canvas.dataset.cinematicTitle = cinematic.title;
    this.canvas.dataset.reducedMotion = String(this.reducedMotion);
    this.canvas.dataset.screenShakeIntensity = settings.screenShakeIntensity;
    this.canvas.dataset.highContrastHazards = String(settings.highContrastHazards);
    this.canvas.dataset.touchControlsMode = settings.touchControlsMode;
    this.canvas.dataset.scrap = String(this.upgrades.getSnapshot().totalScrap);
    this.canvas.dataset.shieldCharges = String(this.shieldCharges);
    this.canvas.dataset.upgradePanelOpen = String(this.upgradePanelOpen);
    this.canvas.dataset.musicEnabled = String(this.audio.isMusicEnabled());
    this.canvas.dataset.musicVolume = this.music.getMusicVolume().toFixed(2);
    this.canvas.dataset.musicDangerIntensity = this.musicDangerIntensity.toFixed(3);
    this.canvas.dataset.sfxEnabled = String(this.audio.isSfxEnabled());
    this.canvas.dataset.sfxVolume = this.audio.getSfxVolume().toFixed(2);
    this.canvas.dataset.loadedAudioAssets = this.audio.getLoadedAssetIds().join(',');
    this.canvas.dataset.objectiveComplete = String(
      objective.isComplete && !objective.isEndless
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
    const eventWave = this.eventWaveDirector.getDebugState();
    this.canvas.dataset.eventWaveType = eventWave.type;
    this.canvas.dataset.eventWavePhase = eventWave.phase;
    this.canvas.dataset.eventWaveCallout = eventWave.callout;
    this.canvas.dataset.eventWaveInstruction = eventWave.instruction;
    this.canvas.dataset.eventWaveCountdown = eventWave.countdown.toFixed(2);
    this.canvas.dataset.eventWaveRemaining = eventWave.timeRemaining.toFixed(2);
    this.canvas.dataset.eventWaveSafeLane =
      eventWave.safeLaneIndex === null ? '' : String(eventWave.safeLaneIndex);
    const powerup = this.powerupDirector.getDebugState();
    this.canvas.dataset.powerupType = powerup.collectibleType;
    this.canvas.dataset.powerupLane =
      powerup.collectibleLaneIndex === null ? '' : String(powerup.collectibleLaneIndex);
    this.canvas.dataset.powerupAngle =
      powerup.collectibleAngle === null ? '' : powerup.collectibleAngle.toFixed(4);
    this.canvas.dataset.powerupNextSpawn = powerup.nextSpawnIn.toFixed(2);
    this.canvas.dataset.activePowerups = powerup.activeEffects
      .map((effect) => `${effect.type}:${effect.remaining.toFixed(2)}`)
      .join(',');
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

function getShakeIntensityScale(intensity: ScreenShakeIntensity): number {
  if (intensity === 'off') {
    return 0;
  }

  if (intensity === 'low') {
    return 0.45;
  }

  return 1;
}
