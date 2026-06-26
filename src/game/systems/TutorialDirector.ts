import type { InputState } from '../input';
import { angularDistance } from '../math';

export type TutorialStepId =
  | 'rotate'
  | 'collect'
  | 'lane-switch'
  | 'boost'
  | 'dodge-obstacle'
  | 'read-hazard'
  | 'finish';

export type TutorialSetupAction =
  | 'place-collect-junk'
  | 'place-lane-switch-junk'
  | 'place-boost-junk'
  | 'spawn-obstacle'
  | 'spawn-hazard'
  | 'clear-marker';

export interface TutorialStep {
  id: TutorialStepId;
  instruction: string;
  setupAction?: TutorialSetupAction;
  timeout?: number;
  isComplete: boolean;
}

export interface TutorialContext {
  input: InputState;
  playerAngle: number;
  playerLaneIndex: number;
  isBoosting: boolean;
  junkCollected: number;
  hazardsSurvived: number;
}

export interface TutorialSnapshot {
  isActive: boolean;
  isSkipped: boolean;
  isFinished: boolean;
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
}

const ROTATION_REQUIRED_RADIANS = 0.48;
const DODGE_SURVIVE_SECONDS = 8;
const FINISH_SECONDS = 1.5;

export class TutorialDirector {
  private readonly steps: TutorialStep[] = [
    {
      id: 'rotate',
      instruction: 'Hold Left/A or Right/D to orbit the planet.',
      isComplete: false
    },
    {
      id: 'collect',
      instruction: 'Collect the marked junk to clean the lane.',
      setupAction: 'place-collect-junk',
      isComplete: false
    },
    {
      id: 'lane-switch',
      instruction: 'Press Up/W or Down/S to switch lanes.',
      setupAction: 'place-lane-switch-junk',
      isComplete: false
    },
    {
      id: 'boost',
      instruction: 'Hold Space to boost. Fuel recharges when you stop.',
      setupAction: 'place-boost-junk',
      isComplete: false
    },
    {
      id: 'dodge-obstacle',
      instruction: 'Satellites are deadly. Change lanes or time your movement.',
      setupAction: 'spawn-obstacle',
      timeout: DODGE_SURVIVE_SECONDS,
      isComplete: false
    },
    {
      id: 'read-hazard',
      instruction: 'Orange means warning. Red means active danger.',
      setupAction: 'spawn-hazard',
      isComplete: false
    },
    {
      id: 'finish',
      instruction: 'Training complete. Keep the combo alive.',
      setupAction: 'clear-marker',
      timeout: FINISH_SECONDS,
      isComplete: false
    }
  ];

  private isActive = false;
  private isSkipped = false;
  private isFinished = false;
  private currentStepIndex = 0;
  private stepElapsed = 0;
  private stepStartAngle = 0;
  private stepStartLaneIndex = 0;
  private stepStartJunkCollected = 0;
  private stepStartHazardsSurvived = 0;
  private boostUsedThisStep = false;
  private pendingSetupAction: TutorialSetupAction | null = null;

  start(context: TutorialContext): void {
    this.isActive = true;
    this.isSkipped = false;
    this.isFinished = false;
    this.currentStepIndex = 0;
    this.steps.forEach((step) => {
      step.isComplete = false;
    });
    this.enterCurrentStep(context);
  }

  reset(): void {
    this.isActive = false;
    this.isSkipped = false;
    this.isFinished = false;
    this.currentStepIndex = 0;
    this.stepElapsed = 0;
    this.pendingSetupAction = null;
    this.steps.forEach((step) => {
      step.isComplete = false;
    });
  }

  skip(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.isSkipped = true;
    this.isFinished = true;
    this.pendingSetupAction = 'clear-marker';
  }

  update(delta: number, context: TutorialContext): TutorialSnapshot {
    if (!this.isActive) {
      return this.getSnapshot();
    }

    const step = this.steps[this.currentStepIndex];
    this.stepElapsed += delta;

    if (context.isBoosting) {
      this.boostUsedThisStep = true;
    }

    if (this.isStepComplete(step, context)) {
      step.isComplete = true;
      this.advance(context);
    }

    return this.getSnapshot();
  }

  consumeSetupAction(): TutorialSetupAction | null {
    const action = this.pendingSetupAction;
    this.pendingSetupAction = null;
    return action;
  }

  getSnapshot(): TutorialSnapshot {
    return {
      isActive: this.isActive,
      isSkipped: this.isSkipped,
      isFinished: this.isFinished,
      currentStep: this.steps[this.currentStepIndex] ?? null,
      stepIndex: Math.min(this.currentStepIndex, this.steps.length - 1),
      totalSteps: this.steps.length
    };
  }

  private advance(context: TutorialContext): void {
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.isActive = false;
      this.isFinished = true;
      return;
    }

    this.currentStepIndex += 1;
    this.enterCurrentStep(context);
  }

  private enterCurrentStep(context: TutorialContext): void {
    const step = this.steps[this.currentStepIndex];

    this.stepElapsed = 0;
    this.stepStartAngle = context.playerAngle;
    this.stepStartLaneIndex = context.playerLaneIndex;
    this.stepStartJunkCollected = context.junkCollected;
    this.stepStartHazardsSurvived = context.hazardsSurvived;
    this.boostUsedThisStep = false;
    this.pendingSetupAction = step?.setupAction ?? null;
  }

  private isStepComplete(step: TutorialStep, context: TutorialContext): boolean {
    if (step.id === 'rotate') {
      return (
        angularDistance(context.playerAngle, this.stepStartAngle) >=
        ROTATION_REQUIRED_RADIANS
      );
    }

    if (step.id === 'collect') {
      return context.junkCollected > this.stepStartJunkCollected;
    }

    if (step.id === 'lane-switch') {
      return context.playerLaneIndex !== this.stepStartLaneIndex;
    }

    if (step.id === 'boost') {
      return (
        this.boostUsedThisStep && context.junkCollected > this.stepStartJunkCollected
      );
    }

    if (step.id === 'dodge-obstacle') {
      return this.stepElapsed >= DODGE_SURVIVE_SECONDS;
    }

    if (step.id === 'read-hazard') {
      return context.hazardsSurvived > this.stepStartHazardsSurvived;
    }

    return this.stepElapsed >= FINISH_SECONDS;
  }
}
