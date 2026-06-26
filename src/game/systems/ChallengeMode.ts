export type ChallengeRunMode = 'normal' | 'seeded' | 'daily';

export interface ChallengeRun {
  mode: ChallengeRunMode;
  label: string;
  seed: string;
  dailyDate: string | null;
}

export interface ChallengeModeSnapshot extends ChallengeRun {
  dailySeed: string;
  titleSeed: string;
  dailyBestScore: number;
}

const DAILY_BEST_STORAGE_PREFIX = 'orbit-janitor.dailyBest.';

export class ChallengeMode {
  private titleSeed = createRandomSeed();
  private currentRun: ChallengeRun = {
    mode: 'normal',
    label: 'Normal Run',
    seed: this.titleSeed,
    dailyDate: null
  };
  private dailyDate = getLocalDateKey();
  private dailyBestScore = readStoredNumber(this.getDailyBestStorageKey(), 0);

  prepareTitle(): void {
    this.refreshDailyDate();
    this.titleSeed = readSeedFromLocation() ?? createRandomSeed();
    this.currentRun = {
      mode: 'normal',
      label: 'Normal Run',
      seed: this.titleSeed,
      dailyDate: null
    };
  }

  startNormalRun(): ChallengeRun {
    this.refreshDailyDate();
    this.currentRun = {
      mode: 'normal',
      label: 'Normal Run',
      seed: createRandomSeed(),
      dailyDate: null
    };

    return this.currentRun;
  }

  startSeededRun(seed = this.titleSeed): ChallengeRun {
    this.refreshDailyDate();
    const normalizedSeed = normalizeSeedText(seed) || createRandomSeed();

    this.currentRun = {
      mode: 'seeded',
      label: 'Seeded Run',
      seed: normalizedSeed,
      dailyDate: null
    };
    this.titleSeed = normalizedSeed;

    return this.currentRun;
  }

  startDailyChallenge(): ChallengeRun {
    this.refreshDailyDate();
    this.currentRun = {
      mode: 'daily',
      label: 'Daily Challenge',
      seed: this.dailyDate,
      dailyDate: this.dailyDate
    };

    return this.currentRun;
  }

  restartCurrentRun(): ChallengeRun {
    if (this.currentRun.mode === 'daily') {
      return this.startDailyChallenge();
    }

    if (this.currentRun.mode === 'seeded') {
      return this.startSeededRun(this.currentRun.seed);
    }

    return this.startNormalRun();
  }

  completeRun(score: number): void {
    if (this.currentRun.mode !== 'daily') {
      return;
    }

    this.refreshDailyDate();

    if (this.currentRun.dailyDate !== this.dailyDate) {
      return;
    }

    if (score > this.dailyBestScore) {
      this.dailyBestScore = score;
      writeStoredNumber(this.getDailyBestStorageKey(), this.dailyBestScore);
    }
  }

  getSnapshot(): ChallengeModeSnapshot {
    this.refreshDailyDate();

    return {
      ...this.currentRun,
      dailySeed: this.dailyDate,
      titleSeed: this.titleSeed,
      dailyBestScore: this.dailyBestScore
    };
  }

  private refreshDailyDate(): void {
    const nextDailyDate = getLocalDateKey();

    if (nextDailyDate === this.dailyDate) {
      return;
    }

    this.dailyDate = nextDailyDate;
    this.dailyBestScore = readStoredNumber(this.getDailyBestStorageKey(), 0);
  }

  private getDailyBestStorageKey(): string {
    return `${DAILY_BEST_STORAGE_PREFIX}${this.dailyDate}`;
  }
}

function createRandomSeed(): string {
  const randomValue = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(7, '0');

  return `OJ-${randomValue.slice(0, 7).toUpperCase()}`;
}

function normalizeSeedText(seed: string): string {
  return seed.trim().slice(0, 32);
}

function readSeedFromLocation(): string | null {
  try {
    const querySeed = new URLSearchParams(window.location.search).get('seed');
    const normalizedSeed = querySeed === null ? '' : normalizeSeedText(querySeed);

    return normalizedSeed || null;
  } catch {
    return null;
  }
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
    // Daily best persistence should not affect playability.
  }
}
