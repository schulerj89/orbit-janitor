export interface RunStatsSnapshot {
  score: number;
  finalScore: number;
  bestScore: number;
  runTime: number;
  junkCollected: number;
  longestCombo: number;
  highestMultiplier: number;
  hazardsSurvived: number;
  objectiveComplete: boolean;
  gameOverReason: string;
}

const BEST_SCORE_STORAGE_KEY = 'orbit-janitor.bestScore';

export class RunStats {
  private score = 0;
  private finalScore = 0;
  private bestScore = readStoredNumber(BEST_SCORE_STORAGE_KEY, 0);
  private runTime = 0;
  private junkCollected = 0;
  private longestCombo = 0;
  private highestMultiplier = 1;
  private hazardsSurvived = 0;
  private objectiveComplete = false;
  private gameOverReason = 'Impact detected';

  constructor(private readonly objectiveTargetScore: number) {}

  reset(): void {
    this.score = 0;
    this.finalScore = 0;
    this.bestScore = readStoredNumber(BEST_SCORE_STORAGE_KEY, this.bestScore);
    this.runTime = 0;
    this.junkCollected = 0;
    this.longestCombo = 0;
    this.highestMultiplier = 1;
    this.hazardsSurvived = 0;
    this.objectiveComplete = false;
    this.gameOverReason = 'Impact detected';
  }

  syncProgress(
    score: number,
    runTime: number,
    comboCount: number,
    comboMultiplier: number,
    objectiveComplete = score >= this.objectiveTargetScore
  ): void {
    this.score = score;
    this.runTime = runTime;
    this.longestCombo = Math.max(this.longestCombo, comboCount);
    this.highestMultiplier = Math.max(this.highestMultiplier, comboMultiplier);
    this.objectiveComplete = objectiveComplete;
  }

  recordJunkCollected(): void {
    this.junkCollected += 1;
  }

  recordHazardSurvived(): void {
    this.hazardsSurvived += 1;
  }

  complete(gameOverReason: string): void {
    this.finalScore = this.score;
    this.gameOverReason = gameOverReason;

    if (this.finalScore > this.bestScore) {
      this.bestScore = this.finalScore;
      writeStoredNumber(BEST_SCORE_STORAGE_KEY, this.bestScore);
    }
  }

  getSnapshot(): RunStatsSnapshot {
    return {
      score: this.score,
      finalScore: this.finalScore,
      bestScore: this.bestScore,
      runTime: this.runTime,
      junkCollected: this.junkCollected,
      longestCombo: this.longestCombo,
      highestMultiplier: this.highestMultiplier,
      hazardsSurvived: this.hazardsSurvived,
      objectiveComplete: this.objectiveComplete,
      gameOverReason: this.gameOverReason
    };
  }
}

function readStoredNumber(key: string, fallback: number): number {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    const parsedValue = Number(storedValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // localStorage can be unavailable in private contexts; gameplay should continue.
  }
}
