export interface DebugCommandContext {
  forceCompleteSector: () => string;
  spawnHazardOrEvent: () => string;
  addScrap: () => string;
  cycleWorldCoreTheme: () => string;
  toggleInvincible: () => string;
  spawnPowerup: () => string;
  resetLocalStorageProgress: () => string;
}

export class DebugCommands {
  execute(functionKey: number, context: DebugCommandContext): string {
    if (!import.meta.env.DEV) {
      return 'Debug commands are disabled in production builds.';
    }

    switch (functionKey) {
      case 2:
        return context.forceCompleteSector();
      case 3:
        return context.spawnHazardOrEvent();
      case 4:
        return context.addScrap();
      case 5:
        return context.cycleWorldCoreTheme();
      case 6:
        return context.toggleInvincible();
      case 7:
        return context.spawnPowerup();
      case 8:
        return context.resetLocalStorageProgress();
      default:
        return `Unhandled debug command F${functionKey}.`;
    }
  }
}
