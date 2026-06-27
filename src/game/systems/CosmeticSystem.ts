export type CosmeticCategory =
  | 'shipBody'
  | 'cockpit'
  | 'engineTrail'
  | 'laneAccent'
  | 'pickupBurst'
  | 'titleBadge';

export interface EquippedCosmeticVisuals {
  shipBodyPrimary: number;
  shipBodySecondary: number;
  shipBodyAccent: number;
  cockpitColor: number;
  engineTrailColor: number;
  laneAccentColor: number | null;
  pickupBurstColor: number;
  titleBadgeLabel: string;
  titleBadgeId: string;
}

export interface CosmeticItemSnapshot {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  unlockHint: string;
  isUnlocked: boolean;
  isEquipped: boolean;
  swatchColor: string | null;
}

export interface CosmeticCategorySnapshot {
  id: CosmeticCategory;
  label: string;
  items: CosmeticItemSnapshot[];
}

export interface CosmeticSnapshot {
  categories: CosmeticCategorySnapshot[];
  unlockedIds: string[];
  equipped: Record<CosmeticCategory, string>;
  visuals: EquippedCosmeticVisuals;
  dailyBadgeDate: string | null;
}

interface CosmeticCategoryDefinition {
  id: CosmeticCategory;
  label: string;
}

interface CosmeticVisualOverrides {
  shipBodyPrimary?: number;
  shipBodySecondary?: number;
  shipBodyAccent?: number;
  cockpitColor?: number;
  engineTrailColor?: number;
  laneAccentColor?: number | null;
  pickupBurstColor?: number;
  titleBadgeLabel?: string;
}

interface CosmeticItemDefinition {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  unlockHint: string;
  defaultUnlocked?: boolean;
  visuals: CosmeticVisualOverrides;
}

const STORAGE_PREFIX = 'orbit-janitor.cosmetics';
const UNLOCKED_STORAGE_KEY = `${STORAGE_PREFIX}.unlocked`;
const EQUIPPED_STORAGE_KEY = `${STORAGE_PREFIX}.equipped`;
const DAILY_BADGE_DATE_STORAGE_KEY = `${STORAGE_PREFIX}.dailyBadgeDate`;

const CATEGORY_DEFINITIONS: readonly CosmeticCategoryDefinition[] = [
  { id: 'shipBody', label: 'Ship Body' },
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'engineTrail', label: 'Engine Trail' },
  { id: 'laneAccent', label: 'Lane Accent' },
  { id: 'pickupBurst', label: 'Pickup Burst' },
  { id: 'titleBadge', label: 'Title Badge' }
];

const DEFAULT_VISUALS: EquippedCosmeticVisuals = {
  shipBodyPrimary: 0xf3f8fb,
  shipBodySecondary: 0x243648,
  shipBodyAccent: 0xffd86b,
  cockpitColor: 0x54e6ff,
  engineTrailColor: 0x35f4ff,
  laneAccentColor: null,
  pickupBurstColor: 0xffb43a,
  titleBadgeLabel: 'None',
  titleBadgeId: 'badge-none'
};

const COSMETIC_ITEMS: readonly CosmeticItemDefinition[] = [
  {
    id: 'hull-default',
    category: 'shipBody',
    name: 'Factory White',
    description: 'Clean white hull with dark utility wings.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      shipBodyPrimary: 0xf3f8fb,
      shipBodySecondary: 0x243648,
      shipBodyAccent: 0xffd86b
    }
  },
  {
    id: 'hull-basic-cyan',
    category: 'shipBody',
    name: 'Training Cyan',
    description: 'Bright training paint for a fresh cleanup license.',
    unlockHint: 'Complete Training Orbit.',
    visuals: {
      shipBodyPrimary: 0xd9fbff,
      shipBodySecondary: 0x1d5264,
      shipBodyAccent: 0x9fffee
    }
  },
  {
    id: 'hull-amber-scrap',
    category: 'shipBody',
    name: 'Amber Scrap',
    description: 'Salvage-belt plating with warm amber panels.',
    unlockHint: 'Complete Debris Belt.',
    visuals: {
      shipBodyPrimary: 0xffcf7a,
      shipBodySecondary: 0x3d2e24,
      shipBodyAccent: 0xff9d35
    }
  },
  {
    id: 'hull-orange-flare',
    category: 'shipBody',
    name: 'Solar Flare',
    description: 'High-visibility orange hull for storm work.',
    unlockHint: 'Complete Solar Storm.',
    visuals: {
      shipBodyPrimary: 0xffa15c,
      shipBodySecondary: 0x4a1e16,
      shipBodyAccent: 0xffe06b
    }
  },
  {
    id: 'hull-violet-stealth',
    category: 'shipBody',
    name: 'Night Violet',
    description: 'Dark hull panels with violet signal trim.',
    unlockHint: 'Complete Night Side.',
    visuals: {
      shipBodyPrimary: 0x9b8cff,
      shipBodySecondary: 0x171a32,
      shipBodyAccent: 0xd9ceff
    }
  },
  {
    id: 'hull-icy-comet',
    category: 'shipBody',
    name: 'Comet Ice',
    description: 'Cold ceramic plating from the comet route.',
    unlockHint: 'Complete Comet Wake.',
    visuals: {
      shipBodyPrimary: 0xcfefff,
      shipBodySecondary: 0x1d4054,
      shipBodyAccent: 0xffffff
    }
  },
  {
    id: 'cockpit-default',
    category: 'cockpit',
    name: 'Signal Cyan',
    description: 'Standard cyan canopy glow.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      cockpitColor: 0x54e6ff
    }
  },
  {
    id: 'cockpit-amber-scrap',
    category: 'cockpit',
    name: 'Amber Lens',
    description: 'Warm scanner glass tuned for salvage clutter.',
    unlockHint: 'Complete Debris Belt.',
    visuals: {
      cockpitColor: 0xffc857
    }
  },
  {
    id: 'cockpit-orange-flare',
    category: 'cockpit',
    name: 'Flare Lens',
    description: 'Orange canopy glow for reactor sectors.',
    unlockHint: 'Complete Solar Storm.',
    visuals: {
      cockpitColor: 0xff8e4f
    }
  },
  {
    id: 'cockpit-violet-stealth',
    category: 'cockpit',
    name: 'Violet Lens',
    description: 'Low-light canopy glass from Night Side crews.',
    unlockHint: 'Complete Night Side.',
    visuals: {
      cockpitColor: 0xc7a6ff
    }
  },
  {
    id: 'cockpit-icy-comet',
    category: 'cockpit',
    name: 'Ice Lens',
    description: 'Pale comet-blue cockpit glow.',
    unlockHint: 'Complete Comet Wake.',
    visuals: {
      cockpitColor: 0xcfefff
    }
  },
  {
    id: 'trail-default',
    category: 'engineTrail',
    name: 'Standard Ion',
    description: 'Default blue cleanup thruster trail.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      engineTrailColor: 0x35f4ff
    }
  },
  {
    id: 'trail-basic-cyan',
    category: 'engineTrail',
    name: 'Basic Cyan Trail',
    description: 'Training-certified cyan engine trail.',
    unlockHint: 'Complete Training Orbit.',
    visuals: {
      engineTrailColor: 0x9fffee
    }
  },
  {
    id: 'trail-amber-scrap',
    category: 'engineTrail',
    name: 'Amber Scrap Trail',
    description: 'Warm exhaust glow from the debris belt.',
    unlockHint: 'Complete Debris Belt.',
    visuals: {
      engineTrailColor: 0xffc857
    }
  },
  {
    id: 'trail-orange-flare',
    category: 'engineTrail',
    name: 'Orange Flare Trail',
    description: 'Solar-charged orange boost plume.',
    unlockHint: 'Complete Solar Storm.',
    visuals: {
      engineTrailColor: 0xff6a1f
    }
  },
  {
    id: 'trail-violet-stealth',
    category: 'engineTrail',
    name: 'Violet Stealth Trail',
    description: 'Violet exhaust tuned for night-side routes.',
    unlockHint: 'Complete Night Side.',
    visuals: {
      engineTrailColor: 0xb28cff
    }
  },
  {
    id: 'trail-icy-comet',
    category: 'engineTrail',
    name: 'Icy Comet Trail',
    description: 'Cold blue-white comet wake plume.',
    unlockHint: 'Complete Comet Wake.',
    visuals: {
      engineTrailColor: 0xcfefff
    }
  },
  {
    id: 'lane-sector-sync',
    category: 'laneAccent',
    name: 'Sector Sync',
    description: 'Use each sector theme for the active lane.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      laneAccentColor: null
    }
  },
  {
    id: 'lane-basic-cyan',
    category: 'laneAccent',
    name: 'Cyan Lane Pulse',
    description: 'Cyan active-lane accent.',
    unlockHint: 'Complete Training Orbit.',
    visuals: {
      laneAccentColor: 0x9fffee
    }
  },
  {
    id: 'lane-amber-scrap',
    category: 'laneAccent',
    name: 'Amber Lane Pulse',
    description: 'Amber active-lane accent.',
    unlockHint: 'Complete Debris Belt.',
    visuals: {
      laneAccentColor: 0xffc857
    }
  },
  {
    id: 'lane-orange-flare',
    category: 'laneAccent',
    name: 'Flare Lane Pulse',
    description: 'Orange active-lane accent.',
    unlockHint: 'Complete Solar Storm.',
    visuals: {
      laneAccentColor: 0xff6a1f
    }
  },
  {
    id: 'lane-violet-stealth',
    category: 'laneAccent',
    name: 'Violet Lane Pulse',
    description: 'Violet active-lane accent.',
    unlockHint: 'Complete Night Side.',
    visuals: {
      laneAccentColor: 0xb28cff
    }
  },
  {
    id: 'lane-icy-comet',
    category: 'laneAccent',
    name: 'Comet Lane Pulse',
    description: 'Icy active-lane accent.',
    unlockHint: 'Complete Comet Wake.',
    visuals: {
      laneAccentColor: 0xcfefff
    }
  },
  {
    id: 'burst-default',
    category: 'pickupBurst',
    name: 'Cleanup Sparks',
    description: 'Default orange pickup particle burst.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      pickupBurstColor: 0xffb43a
    }
  },
  {
    id: 'burst-basic-cyan',
    category: 'pickupBurst',
    name: 'Cyan Pickup Sparks',
    description: 'Cyan pickup burst for training graduates.',
    unlockHint: 'Complete Training Orbit.',
    visuals: {
      pickupBurstColor: 0x9fffee
    }
  },
  {
    id: 'burst-amber-scrap',
    category: 'pickupBurst',
    name: 'Amber Pickup Sparks',
    description: 'Amber salvage sparkle on junk pickup.',
    unlockHint: 'Complete Debris Belt.',
    visuals: {
      pickupBurstColor: 0xffc857
    }
  },
  {
    id: 'burst-orange-flare',
    category: 'pickupBurst',
    name: 'Flare Pickup Sparks',
    description: 'Orange pickup burst for storm sectors.',
    unlockHint: 'Complete Solar Storm.',
    visuals: {
      pickupBurstColor: 0xff6a1f
    }
  },
  {
    id: 'burst-violet-stealth',
    category: 'pickupBurst',
    name: 'Violet Pickup Sparks',
    description: 'Violet pickup burst for low-light crews.',
    unlockHint: 'Complete Night Side.',
    visuals: {
      pickupBurstColor: 0xb28cff
    }
  },
  {
    id: 'burst-icy-comet',
    category: 'pickupBurst',
    name: 'Comet Pickup Sparks',
    description: 'Blue-white pickup burst from the comet route.',
    unlockHint: 'Complete Comet Wake.',
    visuals: {
      pickupBurstColor: 0xcfefff
    }
  },
  {
    id: 'badge-none',
    category: 'titleBadge',
    name: 'No Badge',
    description: 'Keep the title screen clean.',
    unlockHint: 'Default kit.',
    defaultUnlocked: true,
    visuals: {
      titleBadgeLabel: 'None'
    }
  },
  {
    id: 'badge-gold-cleanup',
    category: 'titleBadge',
    name: 'Gold Cleanup Badge',
    description: 'A gold title badge for endless specialists.',
    unlockHint: 'Reach score 100 in Endless Cleanup.',
    visuals: {
      titleBadgeLabel: 'Gold Cleanup'
    }
  },
  {
    id: 'badge-daily',
    category: 'titleBadge',
    name: 'Daily Badge',
    description: 'A dated title badge for completing a daily challenge.',
    unlockHint: 'Complete the daily challenge.',
    visuals: {
      titleBadgeLabel: 'Daily Badge'
    }
  }
];

const DEFAULT_EQUIPPED: Record<CosmeticCategory, string> = {
  shipBody: 'hull-default',
  cockpit: 'cockpit-default',
  engineTrail: 'trail-default',
  laneAccent: 'lane-sector-sync',
  pickupBurst: 'burst-default',
  titleBadge: 'badge-none'
};

const SECTOR_UNLOCKS: Record<string, readonly string[]> = {
  'training-orbit': [
    'hull-basic-cyan',
    'trail-basic-cyan',
    'lane-basic-cyan',
    'burst-basic-cyan'
  ],
  'debris-belt': [
    'hull-amber-scrap',
    'cockpit-amber-scrap',
    'trail-amber-scrap',
    'lane-amber-scrap',
    'burst-amber-scrap'
  ],
  'solar-storm': [
    'hull-orange-flare',
    'cockpit-orange-flare',
    'trail-orange-flare',
    'lane-orange-flare',
    'burst-orange-flare'
  ],
  'night-side': [
    'hull-violet-stealth',
    'cockpit-violet-stealth',
    'trail-violet-stealth',
    'lane-violet-stealth',
    'burst-violet-stealth'
  ],
  'comet-wake': [
    'hull-icy-comet',
    'cockpit-icy-comet',
    'trail-icy-comet',
    'lane-icy-comet',
    'burst-icy-comet'
  ]
};

export class CosmeticSystem {
  private readonly unlockedIds = readUnlockedIds();
  private equipped = readEquippedIds(this.unlockedIds);
  private dailyBadgeDate = readStoredString(DAILY_BADGE_DATE_STORAGE_KEY);

  constructor() {
    this.ensureDefaults();
  }

  syncCompletedSectors(sectorIds: readonly string[]): void {
    for (const sectorId of sectorIds) {
      this.completeSector(sectorId);
    }
  }

  completeSector(sectorId: string): string[] {
    return this.unlockItems(SECTOR_UNLOCKS[sectorId] ?? []);
  }

  recordEndlessScore(score: number): string[] {
    return score >= 100 ? this.unlockItems(['badge-gold-cleanup']) : [];
  }

  completeDailyChallenge(dailyDate: string): string[] {
    this.dailyBadgeDate = dailyDate;
    writeStoredString(DAILY_BADGE_DATE_STORAGE_KEY, dailyDate);

    return this.unlockItems(['badge-daily']);
  }

  equip(itemId: string): boolean {
    const item = getItem(itemId);

    if (!item || !this.unlockedIds.has(item.id)) {
      return false;
    }

    this.equipped = {
      ...this.equipped,
      [item.category]: item.id
    };
    writeEquippedIds(this.equipped);
    return true;
  }

  getSnapshot(): CosmeticSnapshot {
    const visuals = this.getEquippedVisuals();

    return {
      categories: CATEGORY_DEFINITIONS.map((category) => ({
        ...category,
        items: getItemsForCategory(category.id).map((item) =>
          this.createItemSnapshot(item)
        )
      })),
      unlockedIds: [...this.unlockedIds],
      equipped: { ...this.equipped },
      visuals,
      dailyBadgeDate: this.dailyBadgeDate
    };
  }

  getEquippedVisuals(): EquippedCosmeticVisuals {
    const visuals = { ...DEFAULT_VISUALS };

    for (const category of CATEGORY_DEFINITIONS) {
      const item =
        getItem(this.equipped[category.id]) ?? getItem(DEFAULT_EQUIPPED[category.id]);

      if (!item) {
        continue;
      }

      Object.assign(visuals, item.visuals);
    }

    visuals.titleBadgeId = this.equipped.titleBadge;

    if (visuals.titleBadgeId === 'badge-daily' && this.dailyBadgeDate) {
      visuals.titleBadgeLabel = `Daily ${this.dailyBadgeDate}`;
    }

    return visuals;
  }

  private unlockItems(itemIds: readonly string[]): string[] {
    const unlockedNames: string[] = [];

    for (const itemId of itemIds) {
      const item = getItem(itemId);

      if (!item || this.unlockedIds.has(item.id)) {
        continue;
      }

      this.unlockedIds.add(item.id);
      unlockedNames.push(item.name);
    }

    if (unlockedNames.length > 0) {
      writeUnlockedIds(this.unlockedIds);
    }

    return unlockedNames;
  }

  private ensureDefaults(): void {
    let changed = false;

    for (const item of COSMETIC_ITEMS) {
      if (item.defaultUnlocked && !this.unlockedIds.has(item.id)) {
        this.unlockedIds.add(item.id);
        changed = true;
      }
    }

    if (changed) {
      writeUnlockedIds(this.unlockedIds);
    }

    this.equipped = readEquippedIds(this.unlockedIds);
  }

  private createItemSnapshot(item: CosmeticItemDefinition): CosmeticItemSnapshot {
    const name =
      item.id === 'badge-daily' && this.unlockedIds.has(item.id) && this.dailyBadgeDate
        ? `${item.name} ${this.dailyBadgeDate}`
        : item.name;
    const description =
      item.id === 'badge-daily' && this.unlockedIds.has(item.id) && this.dailyBadgeDate
        ? `${item.description} Latest: ${this.dailyBadgeDate}.`
        : item.description;

    return {
      id: item.id,
      category: item.category,
      name,
      description,
      unlockHint: item.unlockHint,
      isUnlocked: this.unlockedIds.has(item.id),
      isEquipped: this.equipped[item.category] === item.id,
      swatchColor: getSwatchColor(item.visuals)
    };
  }
}

function getItemsForCategory(category: CosmeticCategory): CosmeticItemDefinition[] {
  return COSMETIC_ITEMS.filter((item) => item.category === category);
}

function getItem(itemId: string): CosmeticItemDefinition | null {
  return COSMETIC_ITEMS.find((item) => item.id === itemId) ?? null;
}

function getSwatchColor(visuals: CosmeticVisualOverrides): string | null {
  const color =
    visuals.shipBodyPrimary ??
    visuals.cockpitColor ??
    visuals.engineTrailColor ??
    visuals.laneAccentColor ??
    visuals.pickupBurstColor ??
    null;

  return color === null ? null : colorToCss(color);
}

function colorToCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function readUnlockedIds(): Set<string> {
  const defaultIds = COSMETIC_ITEMS.filter((item) => item.defaultUnlocked).map(
    (item) => item.id
  );

  try {
    const storedValue = window.localStorage.getItem(UNLOCKED_STORAGE_KEY);

    if (storedValue === null) {
      return new Set(defaultIds);
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set(defaultIds);
    }

    return new Set([
      ...defaultIds,
      ...parsedValue.filter(
        (itemId): itemId is string =>
          typeof itemId === 'string' && getItem(itemId) !== null
      )
    ]);
  } catch {
    return new Set(defaultIds);
  }
}

function readEquippedIds(unlockedIds: Set<string>): Record<CosmeticCategory, string> {
  try {
    const storedValue = window.localStorage.getItem(EQUIPPED_STORAGE_KEY);
    const parsedValue =
      storedValue === null ? null : (JSON.parse(storedValue) as unknown);

    if (parsedValue === null || typeof parsedValue !== 'object') {
      return { ...DEFAULT_EQUIPPED };
    }

    const equipped = { ...DEFAULT_EQUIPPED };
    const storedEquipped = parsedValue as Partial<Record<CosmeticCategory, unknown>>;

    for (const category of CATEGORY_DEFINITIONS) {
      const itemId = storedEquipped[category.id];
      const item = typeof itemId === 'string' ? getItem(itemId) : null;

      if (item && item.category === category.id && unlockedIds.has(item.id)) {
        equipped[category.id] = item.id;
      }
    }

    return equipped;
  } catch {
    return { ...DEFAULT_EQUIPPED };
  }
}

function writeUnlockedIds(unlockedIds: Set<string>): void {
  try {
    window.localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify([...unlockedIds]));
  } catch {
    // Cosmetic persistence should not affect playability.
  }
}

function writeEquippedIds(equipped: Record<CosmeticCategory, string>): void {
  try {
    window.localStorage.setItem(EQUIPPED_STORAGE_KEY, JSON.stringify(equipped));
  } catch {
    // Cosmetic persistence should not affect playability.
  }
}

function readStoredString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Cosmetic persistence should not affect playability.
  }
}
