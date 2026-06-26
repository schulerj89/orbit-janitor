import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import { darken, disposeWorldCoreGroup, lighten, type WorldCore } from './WorldCore';

export class CometCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly iceMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfefff,
    roughness: 0.74,
    metalness: 0.02,
    flatShading: true
  });
  private readonly shadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x234f5c,
    roughness: 0.92,
    metalness: 0.01,
    flatShading: true
  });
  private readonly tailMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fffee,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });
  private readonly shardMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8fbff,
    roughness: 0.62,
    metalness: 0.03,
    flatShading: true
  });
  private readonly tail = new THREE.Group();
  private readonly shardCloud = new THREE.Group();
  private elapsedTime = 0;

  constructor() {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.74, 2),
      this.iceMaterial
    );
    core.scale.set(1.18, 0.84, 0.96);

    const darkPatch = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS * 0.34, 1),
      this.shadowMaterial
    );
    darkPatch.position.set(0.44, -0.18, 0.5);
    darkPatch.scale.set(1.0, 0.48, 0.8);

    this.group.add(this.tail, core, darkPatch, this.shardCloud);
    this.addTail();
    this.addShards();
  }

  applyTheme(theme: SectorTheme): void {
    this.iceMaterial.color.setHex(lighten(theme.planetAccentColor, 0.15));
    this.shadowMaterial.color.setHex(darken(theme.planetBaseColor, 0.18));
    this.tailMaterial.color.setHex(theme.atmosphereColor);
    this.shardMaterial.color.setHex(lighten(theme.planetAccentColor, 0.28));
  }

  update(delta: number): void {
    this.elapsedTime += delta;
    this.group.rotation.y += delta * 0.035;
    this.tail.rotation.z = Math.sin(this.elapsedTime * 0.7) * 0.04;
    this.shardCloud.rotation.y -= delta * 0.12;
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addTail(): void {
    const tailGeometry = new THREE.ConeGeometry(0.42, 2.8, 8, 1, true);

    for (let index = 0; index < 4; index += 1) {
      const plume = new THREE.Mesh(tailGeometry, this.tailMaterial);
      plume.position.set(-1.48 - index * 0.34, 0.08 * (index - 1.5), -0.08 * index);
      plume.rotation.z = Math.PI / 2;
      plume.scale.set(1 + index * 0.22, 0.8 + index * 0.12, 1);
      this.tail.add(plume);
    }
  }

  private addShards(): void {
    const shardGeometry = new THREE.TetrahedronGeometry(0.1, 0);

    for (let index = 0; index < 12; index += 1) {
      const angle = index * 1.17;
      const shard = new THREE.Mesh(shardGeometry, this.shardMaterial);
      shard.position.set(
        -0.8 - (index % 4) * 0.35,
        Math.sin(angle) * 0.68,
        Math.cos(angle) * 0.62
      );
      shard.rotation.set(index * 0.4, index * 0.7, index * 0.2);
      shard.scale.setScalar(0.7 + (index % 3) * 0.18);
      this.shardCloud.add(shard);
    }
  }
}
