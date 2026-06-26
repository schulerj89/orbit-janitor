import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../../constants';
import type { SectorTheme } from '../../systems/SectorTheme';
import {
  darken,
  disposeWorldCoreGroup,
  lighten,
  placeSurfaceDetail,
  type WorldCore
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
  private readonly cityLights = new THREE.Group();

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
    this.group.add(this.cityLights, atmosphere);
  }

  applyTheme(theme: SectorTheme): void {
    this.surfaceMaterial.color.setHex(darken(theme.planetBaseColor, 0.45));
    this.cityMaterial.color.setHex(lighten(theme.hazardWarningColor, 0.18));
    this.atmosphereMaterial.color.setHex(theme.atmosphereColor);
    this.cloudMaterial.color.setHex(lighten(theme.laneColor, 0.08));
  }

  update(delta: number): void {
    this.group.rotation.y += delta * 0.02;
    this.cityLights.rotation.y += delta * 0.01;
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
    const lightGeometry = new THREE.CircleGeometry(0.028, 6);

    for (let index = 0; index < 46; index += 1) {
      const latitude = -0.82 + ((index * 0.37) % 1.64);
      const longitude = (index * 2.399963229728653) % (Math.PI * 2);
      const dot = new THREE.Mesh(lightGeometry, this.cityMaterial);
      placeSurfaceDetail(dot, latitude, longitude, PLANET_RADIUS * 1.021);
      const scale = 0.72 + (index % 4) * 0.18;
      dot.scale.setScalar(scale);
      this.cityLights.add(dot);
    }
  }
}
