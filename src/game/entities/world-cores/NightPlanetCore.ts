import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  placeSurfaceDetail,
  type WorldCore,
  type WorldCoreUpdateContext
} from './WorldCore';

export class NightPlanetCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly surfaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x101a34,
    roughness: 0.9,
    metalness: 0.02,
    flatShading: true
  });
  private readonly cityMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff08a,
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });
  private readonly atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x78e8ff,
    transparent: true,
    opacity: 0.13,
    depthWrite: false
  });
  private readonly cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0x364254,
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });
  private readonly auroraMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fffee,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  private readonly auroraAccentMaterial = new THREE.MeshBasicMaterial({
    color: 0xc58cff,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });
  private readonly scannerMaterial = new THREE.MeshBasicMaterial({
    color: 0x78e8ff,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  private readonly cityLights = new THREE.Group();
  private readonly auroras = new THREE.Group();
  private readonly scanner = new THREE.Group();
  private elapsedTime = 0;

  constructor() {
    const surface = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS, 3),
      this.surfaceMaterial
    );
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.055, 32, 18),
      this.atmosphereMaterial
    );

    this.group.add(surface);
    this.addCloudBands();
    this.addCityLights();
    this.addAuroras();
    this.addScanner();
    this.group.add(this.cityLights, this.auroras, this.scanner, atmosphere);
  }

  applyTheme(theme: SectorTheme): void {
    this.surfaceMaterial.color.setHex(darken(theme.planetBaseColor, 0.45));
    this.cityMaterial.color.setHex(lighten(theme.hazardWarningColor, 0.18));
    this.atmosphereMaterial.color.setHex(theme.atmosphereColor);
    this.cloudMaterial.color.setHex(lighten(theme.laneColor, 0.08));
    this.auroraMaterial.color.setHex(theme.activeLaneColor);
    this.auroraAccentMaterial.color.setHex(lighten(theme.planetAccentColor, 0.28));
    this.scannerMaterial.color.setHex(theme.atmosphereColor);
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.group.rotation.y += delta * 0.02;
    this.cityLights.rotation.y += delta * 0.01;
    this.auroras.rotation.y -= delta * 0.025;
    this.scanner.rotation.z += delta * 0.18;
    this.scanner.rotation.y = Math.sin(this.elapsedTime * 0.35) * 0.18;

    const pulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 1.7) * 0.5;

    this.cityMaterial.opacity = 0.78 + pulse * 0.16;
    this.auroraMaterial.opacity = 0.34 + pulse * 0.22;
    this.auroraAccentMaterial.opacity = 0.24 + pulse * 0.18;
    this.scannerMaterial.opacity = 0.25 + pulse * 0.16;
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addCloudBands(): void {
    const bandGeometry = new THREE.TorusGeometry(PLANET_RADIUS * 0.96, 0.012, 6, 96);

    for (let index = 0; index < 5; index += 1) {
      const band = new THREE.Mesh(bandGeometry, this.cloudMaterial);
      band.rotation.x = Math.PI / 2;
      band.position.y = -1.05 + index * 0.52;
      band.scale.x = 0.75 + index * 0.08;
      band.scale.y = 0.75 + index * 0.08;
      this.group.add(band);
    }
  }

  private addCityLights(): void {
    const lightGeometry = new THREE.CircleGeometry(0.024, 6);

    for (let index = 0; index < 78; index += 1) {
      const latitude = -0.82 + ((index * 0.37) % 1.64);
      const longitude = (index * 2.399963229728653) % (Math.PI * 2);
      const dot = new THREE.Mesh(lightGeometry, this.cityMaterial);
      placeSurfaceDetail(dot, latitude, longitude, PLANET_RADIUS * 1.021);
      const scale = 0.72 + (index % 4) * 0.18;
      dot.scale.setScalar(scale);
      this.cityLights.add(dot);
    }
  }

  private addAuroras(): void {
    const auroraGeometry = new THREE.SphereGeometry(0.035, 6, 4);
    const arcConfigs = [
      {
        latitude: 0.72,
        start: 0.38,
        length: 1.95,
        material: this.auroraMaterial,
        radiusScale: 1.12
      },
      {
        latitude: -0.64,
        start: 3.35,
        length: 1.55,
        material: this.auroraAccentMaterial,
        radiusScale: 1.1
      }
    ];

    for (const config of arcConfigs) {
      const y = Math.sin(config.latitude) * PLANET_RADIUS * config.radiusScale;
      const ringRadius = Math.cos(config.latitude) * PLANET_RADIUS * config.radiusScale;

      for (let index = 0; index < 20; index += 1) {
        const t = index / 19;
        const longitude = config.start + config.length * t;
        const bead = new THREE.Mesh(auroraGeometry, config.material);
        bead.position.set(
          Math.cos(longitude) * ringRadius,
          y + Math.sin(t * Math.PI) * 0.08,
          Math.sin(longitude) * ringRadius
        );
        bead.scale.set(1 + Math.sin(t * Math.PI) * 1.6, 0.5, 0.72);
        this.auroras.add(bead);
      }
    }
  }

  private addScanner(): void {
    const scanRing = new THREE.Mesh(
      new THREE.TorusGeometry(PLANET_RADIUS * 1.18, 0.008, 5, 128),
      this.scannerMaterial
    );
    const sweepLine = new THREE.Mesh(
      new THREE.BoxGeometry(PLANET_RADIUS * 2.25, 0.012, 0.018),
      this.scannerMaterial
    );

    scanRing.rotation.x = Math.PI / 2.55;
    sweepLine.rotation.z = 0.18;
    this.scanner.rotation.x = 0.32;
    this.scanner.add(scanRing, sweepLine);
  }
}
