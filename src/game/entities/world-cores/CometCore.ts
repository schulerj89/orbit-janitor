import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  type WorldCore,
  type WorldCoreUpdateContext
} from './WorldCore';

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
  private readonly plumeMaterial = new THREE.MeshBasicMaterial({
    color: 0xcfefff,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  private readonly dustMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fffee,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });
  private readonly tail = new THREE.Group();
  private readonly shardCloud = new THREE.Group();
  private readonly plume = new THREE.Group();
  private readonly plumeParticles: THREE.Mesh[] = [];
  private readonly plumeBasePositions: THREE.Vector3[] = [];
  private readonly tailParticles: THREE.Mesh[] = [];
  private readonly shards: THREE.Mesh[] = [];
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

    this.group.add(this.tail, core, darkPatch, this.shardCloud, this.plume);
    this.addTail();
    this.addShards();
    this.addNucleusShards();
    this.addVentingPlume();
  }

  applyTheme(theme: SectorTheme): void {
    this.iceMaterial.color.setHex(lighten(theme.planetAccentColor, 0.15));
    this.shadowMaterial.color.setHex(darken(theme.planetBaseColor, 0.18));
    this.tailMaterial.color.setHex(theme.atmosphereColor);
    this.shardMaterial.color.setHex(lighten(theme.planetAccentColor, 0.28));
    this.plumeMaterial.color.setHex(lighten(theme.atmosphereColor, 0.12));
    this.dustMaterial.color.setHex(theme.activeLaneColor);
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.group.rotation.y += delta * 0.035;
    this.tail.rotation.z = Math.sin(this.elapsedTime * 0.7) * 0.04;
    this.shardCloud.rotation.y -= delta * 0.12;
    this.plume.rotation.z = Math.sin(this.elapsedTime * 0.9) * 0.08;

    const pulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 2.4) * 0.5;

    this.tailMaterial.opacity = 0.28 + pulse * 0.12;
    this.plumeMaterial.opacity = 0.24 + pulse * 0.18;
    this.dustMaterial.opacity = 0.2 + pulse * 0.12;

    this.plumeParticles.forEach((particle, index) => {
      const base = this.plumeBasePositions[index];
      const drift = context?.reducedMotion
        ? 0
        : Math.sin(this.elapsedTime * 1.8 + index * 0.6) * 0.06;
      particle.position.set(base.x - pulse * 0.18, base.y + drift, base.z - drift * 0.6);
      particle.scale.setScalar(0.65 + pulse * 0.35 + (index % 3) * 0.08);
    });

    this.tailParticles.forEach((particle, index) => {
      particle.rotation.x += delta * (0.09 + index * 0.004);
      particle.rotation.y -= delta * (0.07 + index * 0.003);
    });

    this.shards.forEach((shard, index) => {
      shard.rotation.x += delta * (0.11 + index * 0.005);
      shard.rotation.z -= delta * (0.08 + index * 0.004);
    });
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addTail(): void {
    const tailGeometry = new THREE.ConeGeometry(0.42, 2.8, 8, 1, true);
    const dustGeometry = new THREE.TetrahedronGeometry(0.055, 0);

    for (let index = 0; index < 4; index += 1) {
      const plume = new THREE.Mesh(tailGeometry, this.tailMaterial);
      plume.position.set(-1.48 - index * 0.34, 0.08 * (index - 1.5), -0.08 * index);
      plume.rotation.z = Math.PI / 2;
      plume.scale.set(1 + index * 0.22, 0.8 + index * 0.12, 1);
      this.tail.add(plume);
    }

    for (let index = 0; index < 24; index += 1) {
      const angle = index * 1.71;
      const particle = new THREE.Mesh(dustGeometry, this.dustMaterial);
      particle.position.set(
        -1.4 - (index % 8) * 0.24,
        Math.sin(angle) * (0.2 + (index % 4) * 0.08),
        Math.cos(angle) * (0.22 + (index % 5) * 0.06)
      );
      particle.rotation.set(index * 0.2, index * 0.41, index * 0.14);
      particle.scale.setScalar(0.65 + (index % 4) * 0.14);
      this.tailParticles.push(particle);
      this.tail.add(particle);
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
      this.shards.push(shard);
      this.shardCloud.add(shard);
    }
  }

  private addNucleusShards(): void {
    const shardGeometry = new THREE.OctahedronGeometry(0.085, 0);

    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      const shard = new THREE.Mesh(shardGeometry, this.shardMaterial);
      shard.position.set(
        Math.cos(angle) * (PLANET_RADIUS * 0.88),
        ((index % 5) - 2) * 0.12,
        Math.sin(angle) * (PLANET_RADIUS * 0.7)
      );
      shard.rotation.set(index * 0.37, index * 0.62, index * 0.21);
      shard.scale.set(0.7 + (index % 3) * 0.16, 1.2, 0.72);
      this.shards.push(shard);
      this.shardCloud.add(shard);
    }
  }

  private addVentingPlume(): void {
    const particleGeometry = new THREE.SphereGeometry(0.048, 7, 5);

    for (let index = 0; index < 16; index += 1) {
      const angle = index * 1.37;
      const particle = new THREE.Mesh(particleGeometry, this.plumeMaterial);
      const base = new THREE.Vector3(
        0.7 + (index % 6) * 0.11,
        0.18 + Math.sin(angle) * 0.16,
        -0.28 + Math.cos(angle) * 0.18
      );

      particle.position.copy(base);
      particle.scale.setScalar(0.58 + (index % 4) * 0.11);
      this.plumeBasePositions.push(base);
      this.plumeParticles.push(particle);
      this.plume.add(particle);
    }
  }
}
