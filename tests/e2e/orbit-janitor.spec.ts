import { expect, type Page, test } from '@playwright/test';

type DebugState = {
  sceneId: 'orbit-janitor';
  phase: string;
  playerAngle: number;
  playerLaneIndex: number;
  boostFuel: number;
  isBoosting: boolean;
  runTime: number;
  isPaused: boolean;
  helpOpen: boolean;
  sectorId: string;
  tutorialActive: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
};

type DebugApi = {
  getState: () => DebugState;
  restart?: () => void;
  forceGameOver?: (reason?: string) => void;
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

test('starts gameplay and responds to core controls', async ({ page }) => {
  await page.goto('/');
  await waitForGameReady(page);

  await page.keyboard.press('Enter');
  await expectPhase(page, 'playing');

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

  await page.keyboard.press('Enter');
  await expectPhase(page, 'playing');

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

  await page.keyboard.press('R');
  await expectPhase(page, 'playing');
  expect((await getDebugState(page)).runTime).toBeLessThan(1);
});

test('supports optional title tutorial, help, pause, and sector select flows', async ({
  page
}) => {
  await page.goto('/');
  await waitForGameReady(page);

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

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(a - b);
  return Math.min(difference, Math.PI * 2 - difference);
}
