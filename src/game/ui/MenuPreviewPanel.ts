import type { MainMenuOptionId } from './MainMenuOverlay';

export interface MenuPreviewSnapshot {
  selectedOptionId: MainMenuOptionId;
  defaultSectorName: string;
  defaultSectorSubtitle: string;
  unlockedSectorCount: number;
  totalSectorCount: number;
  dailySeed: string;
  dailyBestScore: number;
  titleSeed: string;
  totalScrap: number;
  unlockedShipCount: number;
  totalShipCount: number;
  completedContractCount: number;
  totalContractCount: number;
  equippedShipName: string;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
}

export interface MenuPreviewContent {
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
}

export function getMenuPreviewContent(snapshot: MenuPreviewSnapshot): MenuPreviewContent {
  switch (snapshot.selectedOptionId) {
    case 'startMission':
      return {
        eyebrow: 'Next sector',
        title: snapshot.defaultSectorName,
        body: snapshot.defaultSectorSubtitle,
        meta: 'Continue campaign route'
      };
    case 'trainingOrbit':
      return {
        eyebrow: 'Tutorial',
        title: 'Training Orbit',
        body: 'Guided flight check for lanes, boost, pickups, satellites, and warnings.',
        meta: 'Forgiving hazards'
      };
    case 'sectorSelect':
      return {
        eyebrow: 'Missions',
        title: 'Sector Select',
        body: `${snapshot.unlockedSectorCount} of ${snapshot.totalSectorCount} sectors unlocked.`,
        meta: 'Choose route'
      };
    case 'dailyChallenge':
      return {
        eyebrow: 'Daily seed',
        title: snapshot.dailySeed,
        body: `Best today: ${snapshot.dailyBestScore}`,
        meta: 'One shared route'
      };
    case 'seededRun':
      return {
        eyebrow: 'Seeded route',
        title: snapshot.titleSeed,
        body: 'Start a deterministic run from the visible title seed.',
        meta: 'Repeatable spawns'
      };
    case 'contracts':
      return {
        eyebrow: 'Challenge board',
        title: 'Replay Contracts',
        body: `${snapshot.completedContractCount} of ${snapshot.totalContractCount} contracts cleared.`,
        meta: 'B hotkey'
      };
    case 'shipyard':
      return {
        eyebrow: 'Hangar',
        title: 'Shipyard',
        body: `${snapshot.unlockedShipCount} of ${snapshot.totalShipCount} ships unlocked. Equipped: ${snapshot.equippedShipName}.`,
        meta: 'Y hotkey'
      };
    case 'upgrades':
      return {
        eyebrow: 'Persistent scrap',
        title: `${snapshot.totalScrap} scrap`,
        body: 'Buy small upgrades that make later cleanup routes more forgiving.',
        meta: 'U hotkey'
      };
    case 'settings':
      return {
        eyebrow: 'Settings',
        title: 'Audio + Access',
        body: `Music ${snapshot.musicEnabled ? `${Math.round(snapshot.musicVolume * 100)}%` : 'Off'} / SFX ${snapshot.sfxEnabled ? 'On' : 'Off'}`,
        meta: 'Controls, contrast, motion'
      };
  }
}

export function renderMenuPreviewPanel(): string {
  return `
    <aside class="menu-preview-panel" aria-live="polite">
      <span class="menu-preview-eyebrow" data-menu-preview-eyebrow>Next sector</span>
      <strong data-menu-preview-title>Low Orbit Cleanup</strong>
      <p data-menu-preview-body>Standard route</p>
      <small data-menu-preview-meta>Continue campaign route</small>
    </aside>
  `;
}
