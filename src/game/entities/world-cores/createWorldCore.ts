import { AssetPlanetCore } from './AssetPlanetCore';
import { CometCore } from './CometCore';
import { CrackedPlanetoidCore } from './CrackedPlanetoidCore';
import { NightPlanetCore } from './NightPlanetCore';
import { OrbitalGateCore } from './OrbitalGateCore';
import { PlanetCore } from './PlanetCore';
import { SolarReactorCore } from './SolarReactorCore';
import type { PlanetAssetId } from './PlanetAssetCatalog';
import type { WorldCore, WorldCoreType } from './WorldCore';

export function createWorldCore(
  type: WorldCoreType,
  planetAssetId?: PlanetAssetId
): WorldCore {
  const fallback = createProceduralWorldCore(type);

  return planetAssetId ? new AssetPlanetCore(planetAssetId, fallback) : fallback;
}

function createProceduralWorldCore(type: WorldCoreType): WorldCore {
  switch (type) {
    case 'planet':
      return new PlanetCore();
    case 'crackedPlanetoid':
      return new CrackedPlanetoidCore();
    case 'solarReactor':
      return new SolarReactorCore();
    case 'nightPlanet':
      return new NightPlanetCore();
    case 'comet':
      return new CometCore();
    case 'orbitalGate':
      return new OrbitalGateCore();
  }
}
