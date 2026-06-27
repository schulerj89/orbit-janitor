export type MainMenuOptionId =
  | 'startMission'
  | 'trainingOrbit'
  | 'sectorSelect'
  | 'dailyChallenge'
  | 'seededRun'
  | 'shipyard'
  | 'upgrades'
  | 'settings';

export interface MainMenuOption {
  id: MainMenuOptionId;
  label: string;
  shortcut: string;
  disabled?: boolean;
}

export const MAIN_MENU_OPTIONS: readonly MainMenuOption[] = [
  {
    id: 'startMission',
    label: 'Start Mission',
    shortcut: 'Enter'
  },
  {
    id: 'trainingOrbit',
    label: 'Training Orbit',
    shortcut: 'T'
  },
  {
    id: 'sectorSelect',
    label: 'Sector Select',
    shortcut: 'C'
  },
  {
    id: 'dailyChallenge',
    label: 'Daily Challenge',
    shortcut: 'D'
  },
  {
    id: 'seededRun',
    label: 'Seeded Run',
    shortcut: 'S'
  },
  {
    id: 'shipyard',
    label: 'Shipyard',
    shortcut: 'Y'
  },
  {
    id: 'upgrades',
    label: 'Upgrades',
    shortcut: 'U'
  },
  {
    id: 'settings',
    label: 'Settings',
    shortcut: 'O'
  }
];

export function getMainMenuOption(index: number): MainMenuOption {
  return MAIN_MENU_OPTIONS[normalizeMainMenuIndex(index)];
}

export function normalizeMainMenuIndex(index: number): number {
  const optionCount = MAIN_MENU_OPTIONS.length;

  return (index + optionCount) % optionCount;
}

export function renderMainMenuOverlay(): string {
  const rows = MAIN_MENU_OPTIONS.map(
    (option, index) => `
      <div class="main-menu-option${option.disabled ? ' is-disabled' : ''}" data-main-menu-option="${index}" role="option" aria-selected="false" aria-disabled="${String(Boolean(option.disabled))}">
        <span class="main-menu-option-index">${String(index + 1).padStart(2, '0')}</span>
        <strong>${option.label}</strong>
        <small>${option.shortcut}</small>
      </div>
    `
  ).join('');

  return `
    <nav class="main-menu-overlay" aria-label="Main menu" role="listbox">
      ${rows}
    </nav>
  `;
}
