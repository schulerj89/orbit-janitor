import * as THREE from 'three/webgpu';
import { loadSimpleGlb } from '../../assets/SimpleGlbLoader';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  disposeWorldCoreGroup,
  lighten,
  type WorldCore,
  type WorldCoreUpdateContext
} from './WorldCore';
import { getPlanetAsset, type PlanetAssetId } from './PlanetAssetCatalog';

export class AssetPlanetCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly asset;
  private readonly modelRoot = new THREE.Group();
  private readonly atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff,
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });
  private readonly atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_RADIUS * 1.08, 32, 20),
    this.atmosphereMaterial
  );
  private readonly loadedMaterials: THREE.MeshStandardMaterial[] = [];
  private currentTheme: SectorTheme | null = null;
  private isDisposed = false;
  private elapsedTime = 0;

  constructor(
    private readonly assetId: PlanetAssetId,
    private fallback: WorldCore
  ) {
    this.asset = getPlanetAsset(assetId);
    this.group.name = `Asset Planet Core: ${this.asset.label}`;
    this.modelRoot.rotation.z = this.asset.tilt;
    this.group.add(this.fallback.group, this.modelRoot, this.atmosphere);
    void this.loadModel();
  }

  applyTheme(theme: SectorTheme): void {
    this.currentTheme = theme;
    this.fallback.applyTheme(theme);
    this.atmosphereMaterial.color.setHex(theme.atmosphereColor);
    this.applyThemeTint();
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.fallback.update(delta, context);
    this.modelRoot.rotation.y += delta * this.asset.rotationSpeed;

    const pulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 1.35) * 0.5;

    this.atmosphereMaterial.opacity =
      0.09 + pulse * 0.04 + (context?.eventPulseIntensity ?? 0) * 0.08;
  }

  dispose(): void {
    this.isDisposed = true;
    this.fallback.dispose?.();
    disposeWorldCoreGroup(this.modelRoot);
    this.atmosphere.geometry.dispose();
    this.atmosphereMaterial.dispose();
  }

  private async loadModel(): Promise<void> {
    try {
      const model = await loadSimpleGlb(this.asset.path);

      if (this.isDisposed) {
        disposeWorldCoreGroup(model);
        return;
      }

      this.normalizeModel(model);
      this.captureMaterials(model);
      this.modelRoot.add(model);
      this.group.remove(this.fallback.group);
      this.fallback.dispose?.();
      this.applyThemeTint();
    } catch (error) {
      console.warn(`Asset planet failed to load: ${this.asset.path}`, error);
    }
  }

  private normalizeModel(model: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxSize = Math.max(size.x, size.y, size.z);

    if (maxSize > 0) {
      model.scale.multiplyScalar(((PLANET_RADIUS * 2.04) / maxSize) * this.asset.scale);
    }

    box.setFromObject(model);
    box.getCenter(center);
    model.position.sub(center);
  }

  private captureMaterials(model: THREE.Object3D): void {
    model.traverse((object) => {
      const mesh = object as {
        material?: THREE.Material | THREE.Material[];
      };

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];

      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          this.loadedMaterials.push(material);
        }
      });
    });
  }

  private applyThemeTint(): void {
    if (!this.currentTheme) {
      return;
    }

    const tint = new THREE.Color(0xffffff).lerp(
      new THREE.Color(lighten(this.currentTheme.planetBaseColor, 0.08)),
      this.asset.tintStrength
    );

    this.loadedMaterials.forEach((material) => {
      material.color.copy(tint);
      material.needsUpdate = true;
    });
  }
}
