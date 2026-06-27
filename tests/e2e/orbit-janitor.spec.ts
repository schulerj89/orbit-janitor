import { expect, type Page, test } from '@playwright/test';

type DebugState = {
  sceneId: 'orbit-janitor';
  phase: string;
  playerAngle: number;
  playerLaneIndex: number;
  boostFuel: number;
  isBoosting: boolean;
  runTime: number;
  experienceMode: 'full' | 'mobileLite';
  mobileLite: {
    isActive: boolean;
    bestScore: number;
    guideVisible: boolean;
    guideText: string;
  };
  isPaused: boolean;
  helpOpen: boolean;
  settingsOpen: boolean;
  deviceGateOpen: boolean;
  deviceProfile: {
    isSmallViewport: boolean;
    isPortrait: boolean;
    isCoarsePointer: boolean;
    hasFinePointer: boolean;
    hasTouch: boolean;
    recommendedExperience: string;
    shouldShowDeviceGate: boolean;
  };
  contractBoardOpen: boolean;
  achievementsOpen: boolean;
  shipyardOpen: boolean;
  equippedShipId: string;
  ships: {
    ships: Array<{
      id: string;
      isUnlocked: boolean;
      isEquipped: boolean;
    }>;
    unlockedIds: string[];
    equippedId: string;
  };
  contracts: {
    completedCount: number;
    totalCount: number;
    contracts: Array<{
      id: string;
      isCompleted: boolean;
    }>;
  };
  medals: {
    goldOrBetterCount: number;
    primeCount: number;
    medals: Array<{
      sectorId: string;
      tier: string;
    }>;
  };
  achievements: {
    unlockedCount: number;
    totalCount: number;
    achievements: Array<{
      id: string;
      isUnlocked: boolean;
    }>;
  };
  debugPanelOpen: boolean;
  debugInvincible: boolean;
  missionIntroActive: boolean;
  cinematicActive: boolean;
  sectorId: string;
  sectorProgress: {
    sectors: Array<{
      id: string;
      isUnlocked: boolean;
      isCompleted: boolean;
    }>;
  };
  tutorialActive: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  settings: {
    reducedMotion: boolean;
    screenShakeIntensity: string;
    touchControlsMode: string;
    deviceExperienceMode: string;
  };
};

type DebugApi = {
  getState: () => DebugState;
  restart?: () => void;
  forceGameOver?: (reason?: string) => void;
  skipCinematic?: () => void;
};

type WindowWithDebug = Window & {
  orbitJanitorDebug?: DebugApi;
};

type ErrorState = {
  pageErrors: string[];
  consoleErrors: string[];
};

const errorStates = new WeakMap<Page, ErrorState>();

test.beforeEach(async ({ page }) => {
  const errorState: ErrorState = {
    pageErrors: [],
    consoleErrors: []
  };

  errorStates.set(page, errorState);

  page.on('pageerror', (error) => {
    errorState.pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }

    errorState.consoleErrors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  const errorState = errorStates.get(page);

  expect(errorState?.pageErrors ?? []).toEqual([]);
  expect(errorState?.consoleErrors ?? []).toEqual([]);
});

test('loads the title scene and exposes debug state', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  await expect(page.locator('#game-canvas')).toBeVisible();

  const state = await getDebugState(page);
  expect(state.sceneId).toBe('orbit-janitor');
  expect(state.phase).toBe('title');
  expect(state.deviceGateOpen).toBe(false);
  expect(state.deviceProfile.recommendedExperience).toBe('desktop');
  expect(state.sectorProgress.sectors.length).toBeGreaterThanOrEqual(13);
  expect(state.sectorProgress.sectors.map((sector) => sector.id)).toEqual(
    expect.arrayContaining([
      'graveyard-ring',
      'neon-belt',
      'frozen-relay',
      'reactor-grave',
      'junk-moon',
      'long-orbit'
    ])
  );
  expect(state.achievements.totalCount).toBeGreaterThanOrEqual(10);
});

test('shows device gate on phone-like viewport and allows continuing', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto('/');
  await waitForGameReady(page);

  await expect
    .poll(() => getDebugState(page).then((state) => state.deviceGateOpen))
    .toBe(true);
  await expect(page.locator('[data-device-gate-overlay]')).toBeVisible();
  await expect(page.locator('[data-device-gate-overlay]')).toContainText(
    'optimized for desktop keyboard or gamepad'
  );

  const gateState = await getDebugState(page);
  expect(gateState.deviceProfile.recommendedExperience).toBe('phone');
  expect(gateState.deviceProfile.shouldShowDeviceGate).toBe(true);

  await page.keyboard.press('Enter');
  await expect
    .poll(() => getDebugState(page).then((state) => state.deviceGateOpen))
    .toBe(false);
  expect((await getDebugState(page)).phase).toBe('title');
});

test('starts Mobile Lite from the phone device gate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto('/');
  await waitForGameReady(page);

  await expect
    .poll(() => getDebugState(page).then((state) => state.deviceGateOpen))
    .toBe(true);

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expectPhase(page, 'playing');
  await expect
    .poll(() => getDebugState(page).then((state) => state.experienceMode))
    .toBe('mobileLite');
  await expect(page.locator('.mobile-lite-touch-controls')).toBeVisible();

  await waitForMissionIntro(page);
  const angleBefore = (await getDebugState(page)).playerAngle;
  await page.waitForTimeout(350);
  const angleAfter = (await getDebugState(page)).playerAngle;

  expect(angularDistance(angleBefore, angleAfter)).toBeGreaterThan(0.02);

  await page.evaluate(() =>
    (window as WindowWithDebug).orbitJanitorDebug?.forceGameOver?.(
      'Playwright Mobile Lite end state'
    )
  );
  await expectPhase(page, 'gameover');
  await skipCinematic(page);
  await expect(page.locator('[data-run-summary]')).toContainText('Tap Replay to restart');
  await expect(page.locator('[data-run-summary]')).not.toContainText(
    'Press R to restart'
  );
  await page.locator('[data-mobile-lite-action="title"]').click();
  await expectPhase(page, 'title');
});

test('mobile touch end-state controls can advance a completed sector', async ({
  page
}) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('/?skipDeviceGate=1');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('Enter');
  await expectPhase(page, 'playing');
  await waitForMissionIntro(page);

  await page.keyboard.press('F2');
  await expectPhase(page, 'missionComplete');
  await skipCinematic(page);
  await expect(page.locator('[data-mission-complete-overlay]')).toContainText(
    'Tap Next for next sector'
  );
  await expect(page.locator('[data-mission-complete-overlay]')).not.toContainText(
    'R replay'
  );
  await expect(page.locator('.touch-controls-end-actions')).toBeVisible();
  await page.locator('[data-touch-action="next"]').click();
  await expectPhase(page, 'playing');
});

test('desktop title hides Mobile Lite from the main menu', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await expect(
    page.locator('.main-menu-option:visible', { hasText: 'Mobile Lite' })
  ).toHaveCount(0);

  await page.keyboard.press('L');
  await expectPhase(page, 'title');
  await expect
    .poll(() => getDebugState(page).then((state) => state.experienceMode))
    .toBe('full');
});

test('toggles music and sfx preferences from keyboard input', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  const initial = await getDebugState(page);

  await page.keyboard.press('M');
  await expect
    .poll(() => getDebugState(page).then((state) => state.musicEnabled))
    .toBe(!initial.musicEnabled);

  await page.keyboard.press('N');
  await expect
    .poll(() => getDebugState(page).then((state) => state.sfxEnabled))
    .toBe(!initial.sfxEnabled);
});

test('opens settings and exposes persisted accessibility controls', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('O');
  await expect
    .poll(() => getDebugState(page).then((state) => state.settingsOpen))
    .toBe(true);

  const initialReducedMotion = (await getDebugState(page)).settings.reducedMotion;
  await page.keyboard.press('Enter');
  await expect
    .poll(() => getDebugState(page).then((state) => state.settings.reducedMotion))
    .toBe(!initialReducedMotion);

  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.settingsOpen))
    .toBe(false);
});

test('opens shipyard from title and keeps equipped ship stable', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  const initial = await getDebugState(page);

  await page.keyboard.press('Y');
  await expect
    .poll(() => getDebugState(page).then((state) => state.shipyardOpen))
    .toBe(true);

  const shipyardState = await getDebugState(page);
  expect(shipyardState.ships.ships.length).toBeGreaterThanOrEqual(8);
  expect(shipyardState.ships.unlockedIds).toContain('scrapper');

  await page.keyboard.press('Enter');
  await expect
    .poll(() => getDebugState(page).then((state) => state.equippedShipId))
    .toBe(initial.equippedShipId);

  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.shipyardOpen))
    .toBe(false);
});

test('opens contract board from title', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('B');
  await expect
    .poll(() => getDebugState(page).then((state) => state.contractBoardOpen))
    .toBe(true);

  const contractState = await getDebugState(page);
  expect(contractState.contracts.totalCount).toBeGreaterThanOrEqual(12);
  expect(contractState.contracts.contracts.length).toBe(
    contractState.contracts.totalCount
  );

  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.contractBoardOpen))
    .toBe(false);
});

test('opens achievements from title', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('A');
  await expect
    .poll(() => getDebugState(page).then((state) => state.achievementsOpen))
    .toBe(true);

  const achievementState = await getDebugState(page);
  expect(achievementState.achievements.totalCount).toBeGreaterThanOrEqual(10);
  expect(achievementState.achievements.achievements.length).toBe(
    achievementState.achievements.totalCount
  );

  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.achievementsOpen))
    .toBe(false);
});

test('supports dev-only debug panel and invincible toggle', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  await page.keyboard.press('F1');
  await expect
    .poll(() => getDebugState(page).then((state) => state.debugPanelOpen))
    .toBe(true);
  await expect(page.locator('[data-debug-panel]')).toBeVisible();

  await page.keyboard.press('F6');
  await expect
    .poll(() => getDebugState(page).then((state) => state.debugInvincible))
    .toBe(true);

  await page.keyboard.press('F1');
  await expect
    .poll(() => getDebugState(page).then((state) => state.debugPanelOpen))
    .toBe(false);
});

test('shows touch controls on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto('/?skipDeviceGate=1');
  await waitForGameReady(page);

  await expect(page.locator('.touch-controls')).toBeVisible();
  await expect(page.locator('.touch-control-start')).toBeVisible();
});

test('starts gameplay and responds to core controls', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('Enter');
  await expectPhase(page, 'playing');
  await waitForMissionIntro(page);

  const angleBefore = (await getDebugState(page)).playerAngle;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  const angleAfter = (await getDebugState(page)).playerAngle;
  expect(angularDistance(angleBefore, angleAfter)).toBeGreaterThan(0.02);

  const laneBefore = (await getDebugState(page)).playerLaneIndex;
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(150);
  let laneAfter = (await getDebugState(page)).playerLaneIndex;

  if (laneAfter === laneBefore) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    laneAfter = (await getDebugState(page)).playerLaneIndex;
  }

  expect(laneAfter).not.toBe(laneBefore);

  const boostBefore = await getDebugState(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(200);
  const boostAfter = await getDebugState(page);
  await page.keyboard.up('Space');

  expect(boostAfter.isBoosting || boostAfter.boostFuel < boostBefore.boostFuel).toBe(
    true
  );

  const hasDebugRestart = await page.evaluate(
    () => typeof (window as WindowWithDebug).orbitJanitorDebug?.restart === 'function'
  );

  if (hasDebugRestart) {
    await page.waitForTimeout(300);
    const runTimeBeforeRestart = (await getDebugState(page)).runTime;
    await page.evaluate(() => (window as WindowWithDebug).orbitJanitorDebug?.restart?.());
    await expectPhase(page, 'playing');
    const restartedState = await getDebugState(page);

    expect(restartedState.runTime).toBeLessThan(runTimeBeforeRestart);
  }
});

test('restarts from game over with R when debug game-over hook is available', async ({
  page
}) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('Enter');
  await expectPhase(page, 'playing');
  await waitForMissionIntro(page);

  const hasForceGameOver = await page.evaluate(
    () =>
      typeof (window as WindowWithDebug).orbitJanitorDebug?.forceGameOver === 'function'
  );

  test.skip(!hasForceGameOver, 'Game does not expose a debug game-over hook.');

  await page.evaluate(() =>
    (window as WindowWithDebug).orbitJanitorDebug?.forceGameOver?.(
      'Playwright forced game over'
    )
  );
  await expectPhase(page, 'gameover');
  await skipCinematic(page);

  await page.keyboard.press('R');
  await expectPhase(page, 'playing');
  expect((await getDebugState(page)).runTime).toBeLessThan(1);
});

test('supports optional title tutorial, help, pause, and sector select flows', async ({
  page
}) => {
  await page.goto('/');
  await waitForGameReady(page);
  await skipCinematic(page);

  await page.keyboard.press('H');
  await expect.poll(() => getDebugState(page).then((state) => state.helpOpen)).toBe(true);
  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.helpOpen))
    .toBe(false);

  await page.keyboard.press('C');
  await page.waitForTimeout(250);
  const phaseAfterSectorSelect = (await getDebugState(page)).phase;

  if (phaseAfterSectorSelect === 'sectorSelect') {
    await page.keyboard.press('Escape');
    await expectPhase(page, 'title');
  }

  await page.keyboard.press('T');
  await expectPhase(page, 'playing');
  await skipCinematic(page);
  const tutorialState = await getDebugState(page);
  expect(tutorialState.sectorId).toBe('training-orbit');
  expect(tutorialState.tutorialActive).toBe(true);

  await page.keyboard.press('P');
  await expect.poll(() => getDebugState(page).then((state) => state.isPaused)).toBe(true);
  const pausedRunTime = (await getDebugState(page)).runTime;
  await page.waitForTimeout(500);
  expect((await getDebugState(page)).runTime).toBe(pausedRunTime);

  await page.keyboard.press('Escape');
  await expect
    .poll(() => getDebugState(page).then((state) => state.isPaused))
    .toBe(false);
});

async function waitForGameReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => typeof (window as WindowWithDebug).orbitJanitorDebug?.getState === 'function'
  );
}

async function getDebugState(page: Page): Promise<DebugState> {
  return page.evaluate(() => {
    const debug = (window as WindowWithDebug).orbitJanitorDebug;

    if (!debug) {
      throw new Error('Missing orbitJanitorDebug.');
    }

    return debug.getState();
  });
}

async function expectPhase(page: Page, phase: string): Promise<void> {
  await expect.poll(() => getDebugState(page).then((state) => state.phase)).toBe(phase);
}

async function waitForMissionIntro(page: Page): Promise<void> {
  await skipCinematic(page);
  await expect
    .poll(() => getDebugState(page).then((state) => state.missionIntroActive), {
      timeout: 10000
    })
    .toBe(false);
}

async function skipCinematic(page: Page): Promise<void> {
  await page.evaluate(() =>
    (window as WindowWithDebug).orbitJanitorDebug?.skipCinematic?.()
  );
  await expect
    .poll(() => getDebugState(page).then((state) => state.cinematicActive))
    .toBe(false);
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(a - b);
  return Math.min(difference, Math.PI * 2 - difference);
}
