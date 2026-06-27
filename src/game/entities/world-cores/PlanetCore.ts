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

export class PlanetCore implements WorldCore {
  readonly group = new THREE.Group();

  private readonly materials = {
    ocean: new THREE.MeshStandardMaterial({
      color: 0x0f6f8f,
      roughness: 0.86,
      metalness: 0.02,
      flatShading: true
    }),
    deepBand: new THREE.MeshBasicMaterial({
      color: 0x0a4d6e,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    }),
    shallowBand: new THREE.MeshBasicMaterial({
      color: 0x2aa4a8,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    }),
    land: new THREE.MeshStandardMaterial({
      color: 0x3f8d58,
      roughness: 0.92,
      metalness: 0.01,
      flatShading: true
    }),
    highland: new THREE.MeshStandardMaterial({
      color: 0x83a85a,
      roughness: 0.95,
      metalness: 0.01,
      flatShading: true
    }),
    crater: new THREE.MeshBasicMaterial({
      color: 0x07364f,
      transparent: true,
      opacity: 0.46,
      depthWrite: false
    }),
    atmosphere: new THREE.MeshBasicMaterial({
      color: 0x78e8ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    }),
    cloudBand: new THREE.MeshBasicMaterial({
      color: 0xdff7ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    }),
    cityLight: new THREE.MeshBasicMaterial({
      color: 0xfff08a,
      transparent: true,
      opacity: 0.74,
      depthWrite: false
    }),
    habitatHull: new THREE.MeshStandardMaterial({
      color: 0xcfefff,
      roughness: 0.56,
      metalness: 0.18,
      flatShading: true
    }),
    habitatPanel: new THREE.MeshBasicMaterial({
      color: 0x78e8ff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    })
  };
  private readonly planetBody = new THREE.Group();
  private readonly cloudRings = new THREE.Group();
  private readonly cityLights = new THREE.Group();
  private readonly habitatOrbit = new THREE.Group();
  private elapsedTime = 0;

  constructor() {
    const planet = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS, 3),
      this.materials.ocean
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.06, 32, 24),
      this.materials.atmosphere
    );

    this.group.add(this.planetBody, this.cloudRings, this.habitatOrbit);
    this.planetBody.add(planet);
    this.addSurfaceBands();
    this.addLandPatches();
    this.addCraters();
    this.addNightCityLights();
    this.addCloudBands();
    this.addHabitatStation();
    this.planetBody.add(this.cityLights, atmosphere);
  }

  applyTheme(theme: SectorTheme): void {
    this.materials.ocean.color.setHex(theme.planetBaseColor);
    this.materials.deepBand.color.setHex(darken(theme.planetBaseColor, 0.58));
    this.materials.shallowBand.color.setHex(lighten(theme.planetBaseColor, 0.28));
    this.materials.land.color.setHex(theme.planetAccentColor);
    this.materials.highland.color.setHex(lighten(theme.planetAccentColor, 0.22));
    this.materials.crater.color.setHex(darken(theme.planetBaseColor, 0.48));
    this.materials.atmosphere.color.setHex(theme.atmosphereColor);
    this.materials.cloudBand.color.setHex(lighten(theme.atmosphereColor, 0.12));
    this.materials.cityLight.color.setHex(lighten(theme.hazardWarningColor, 0.24));
    this.materials.habitatHull.color.setHex(lighten(theme.laneColor, 0.38));
    this.materials.habitatPanel.color.setHex(theme.activeLaneColor);
  }

  update(delta: number, context?: WorldCoreUpdateContext): void {
    this.elapsedTime += delta;
    this.planetBody.rotation.y += delta * 0.018;
    this.cloudRings.rotation.y -= delta * 0.04;
    this.cloudRings.rotation.z = Math.sin(this.elapsedTime * 0.17) * 0.03;
    this.habitatOrbit.rotation.y += delta * 0.2;

    const pulse = context?.reducedMotion
      ? 0.5
      : 0.5 + Math.sin(this.elapsedTime * 1.6) * 0.5;

    this.materials.cloudBand.opacity = 0.14 + pulse * 0.05;
    this.materials.cityLight.opacity = 0.62 + pulse * 0.18;
  }

  dispose(): void {
    disposeWorldCoreGroup(this.group);
  }

  private addSurfaceBands(): void {
    const bandConfigs = [
      { y: -0.92, tube: 0.012, material: this.materials.deepBand },
      { y: -0.34, tube: 0.01, material: this.materials.shallowBand },
      { y: 0.44, tube: 0.012, material: this.materials.deepBand },
      { y: 1.04, tube: 0.01, material: this.materials.shallowBand }
    ];

    for (const config of bandConfigs) {
      const ringRadius = Math.sqrt(PLANET_RADIUS * PLANET_RADIUS - config.y * config.y);
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius, config.tube, 6, 96),
        config.material
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = config.y;
      this.planetBody.add(band);
    }
  }

  private addCloudBands(): void {
    const cloudConfigs = [
      { y: -0.72, radiusScale: 0.78, tube: 0.008, tilt: 0.08 },
      { y: -0.18, radiusScale: 0.96, tube: 0.009, tilt: -0.06 },
      { y: 0.36, radiusScale: 0.9, tube: 0.008, tilt: 0.12 },
      { y: 0.82, radiusScale: 0.62, tube: 0.007, tilt: -0.1 }
    ];

    for (const config of cloudConfigs) {
      const baseRadius = Math.sqrt(PLANET_RADIUS * PLANET_RADIUS - config.y * config.y);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(baseRadius * config.radiusScale, config.tube, 6, 112),
        this.materials.cloudBand
      );
      ring.rotation.x = Math.PI / 2 + config.tilt;
      ring.rotation.y = config.tilt * 0.7;
      ring.position.y = config.y;
      this.cloudRings.add(ring);
    }
  }

  private addLandPatches(): void {
    const patchGeometry = new THREE.CircleGeometry(1, 7);
    const patches = [
      [0.28, 0.25, 0.54, 0.28, this.materials.land],
      [-0.42, 1.15, 0.46, 0.22, this.materials.highland],
      [0.08, 2.35, 0.34, 0.2, this.materials.land],
      [0.64, 3.1, 0.38, 0.18, this.materials.highland],
      [-0.68, 4.15, 0.42, 0.2, this.materials.land],
      [0.38, 5.2, 0.32, 0.18, this.materials.land],
      [-0.12, 5.75, 0.26, 0.16, this.materials.highland]
    ] as const;

    for (const [latitude, longitude, scaleX, scaleY, material] of patches) {
      const patch = new THREE.Mesh(patchGeometry, material);
      placeSurfaceDetail(patch, latitude, longitude, PLANET_RADIUS * 1.012);
      patch.scale.set(scaleX, scaleY, 1);
      patch.rotation.z += longitude * 0.45;
      this.planetBody.add(patch);
    }
  }

  private addCraters(): void {
    const smallCraterGeometry = new THREE.TorusGeometry(0.11, 0.009, 6, 18);
    const largeCraterGeometry = new THREE.TorusGeometry(0.17, 0.012, 6, 20);
    const craters = [
      [0.5, 0.92, 1.1, smallCraterGeometry],
      [-0.18, 3.72, 0.92, largeCraterGeometry],
      [0.82, 4.62, 0.72, smallCraterGeometry],
      [-0.72, 2.5, 0.8, smallCraterGeometry]
    ] as const;

    for (const [latitude, longitude, scale, geometry] of craters) {
      const crater = new THREE.Mesh(geometry, this.materials.crater);
      placeSurfaceDetail(crater, latitude, longitude, PLANET_RADIUS * 1.018);
      crater.scale.setScalar(scale);
      this.planetBody.add(crater);
    }
  }

  private addNightCityLights(): void {
    const lightGeometry = new THREE.CircleGeometry(0.018, 6);

    for (let index = 0; index < 28; index += 1) {
      const latitude = -0.6 + ((index * 0.31) % 1.2);
      const longitude = Math.PI * 0.72 + ((index * 0.73) % (Math.PI * 0.82));
      const light = new THREE.Mesh(lightGeometry, this.materials.cityLight);
      placeSurfaceDetail(light, latitude, longitude, PLANET_RADIUS * 1.024);
      light.scale.setScalar(0.6 + (index % 4) * 0.16);
      this.cityLights.add(light);
    }
  }

  private addHabitatStation(): void {
    const station = new THREE.Group();
    const hub = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.14),
      this.materials.habitatHull
    );
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.48, 6),
      this.materials.habitatHull
    );
    const leftPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.015, 0.16),
      this.materials.habitatPanel
    );
    const rightPanel = leftPanel.clone();
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      this.materials.cityLight
    );

    mast.rotation.z = Math.PI / 2;
    leftPanel.position.x = -0.34;
    rightPanel.position.x = 0.34;
    beacon.position.set(0, 0.12, 0);
    station.position.set(PLANET_RADIUS * 1.82, 0.32, 0);
    station.rotation.y = Math.PI / 2;
    station.scale.setScalar(0.9);
    station.add(mast, hub, leftPanel, rightPanel, beacon);
    this.habitatOrbit.rotation.x = 0.28;
    this.habitatOrbit.rotation.z = -0.18;
    this.habitatOrbit.add(station);
  }
}
