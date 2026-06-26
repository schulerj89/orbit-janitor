import * as THREE from 'three/webgpu';
import { PLANET_RADIUS } from '../constants';

export class Planet {
  readonly group = new THREE.Group();

  constructor() {
    const planet = new THREE.Mesh(
      new THREE.IcosahedronGeometry(PLANET_RADIUS, 3),
      planetMaterials.ocean
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS * 1.06, 32, 24),
      planetMaterials.atmosphere
    );

    this.group.add(planet);
    addSurfaceBands(this.group);
    addLandPatches(this.group);
    addCraters(this.group);
    this.group.add(atmosphere);
  }
}

const planetMaterials = {
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
  })
};

const surfacePatchGeometry = new THREE.CircleGeometry(1, 7);
const smallCraterGeometry = new THREE.TorusGeometry(0.11, 0.009, 6, 18);
const largeCraterGeometry = new THREE.TorusGeometry(0.17, 0.012, 6, 20);
const localSurfaceNormal = new THREE.Vector3(0, 0, 1);

function addSurfaceBands(group: THREE.Group): void {
  const bandConfigs = [
    { y: -0.92, tube: 0.012, material: planetMaterials.deepBand },
    { y: -0.34, tube: 0.01, material: planetMaterials.shallowBand },
    { y: 0.44, tube: 0.012, material: planetMaterials.deepBand },
    { y: 1.04, tube: 0.01, material: planetMaterials.shallowBand }
  ];

  for (const config of bandConfigs) {
    const ringRadius = Math.sqrt(PLANET_RADIUS * PLANET_RADIUS - config.y * config.y);
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, config.tube, 6, 96),
      config.material
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = config.y;
    group.add(band);
  }
}

function addLandPatches(group: THREE.Group): void {
  const patches = [
    [0.28, 0.25, 0.54, 0.28, planetMaterials.land],
    [-0.42, 1.15, 0.46, 0.22, planetMaterials.highland],
    [0.08, 2.35, 0.34, 0.2, planetMaterials.land],
    [0.64, 3.1, 0.38, 0.18, planetMaterials.highland],
    [-0.68, 4.15, 0.42, 0.2, planetMaterials.land],
    [0.38, 5.2, 0.32, 0.18, planetMaterials.land],
    [-0.12, 5.75, 0.26, 0.16, planetMaterials.highland]
  ] as const;

  for (const [latitude, longitude, scaleX, scaleY, material] of patches) {
    const patch = new THREE.Mesh(surfacePatchGeometry, material);
    placeSurfaceDetail(patch, latitude, longitude, 1.012);
    patch.scale.set(scaleX, scaleY, 1);
    patch.rotation.z += longitude * 0.45;
    group.add(patch);
  }
}

function addCraters(group: THREE.Group): void {
  const craters = [
    [0.5, 0.92, 1.1, smallCraterGeometry],
    [-0.18, 3.72, 0.92, largeCraterGeometry],
    [0.82, 4.62, 0.72, smallCraterGeometry],
    [-0.72, 2.5, 0.8, smallCraterGeometry]
  ] as const;

  for (const [latitude, longitude, scale, geometry] of craters) {
    const crater = new THREE.Mesh(geometry, planetMaterials.crater);
    placeSurfaceDetail(crater, latitude, longitude, 1.018);
    crater.scale.setScalar(scale);
    group.add(crater);
  }
}

function placeSurfaceDetail(
  mesh: THREE.Mesh,
  latitude: number,
  longitude: number,
  radiusMultiplier: number
): void {
  const normal = sphericalNormal(latitude, longitude);

  mesh.position.copy(normal).multiplyScalar(PLANET_RADIUS * radiusMultiplier);
  mesh.quaternion.setFromUnitVectors(localSurfaceNormal, normal);
}

function sphericalNormal(latitude: number, longitude: number): THREE.Vector3 {
  const cosLatitude = Math.cos(latitude);

  return new THREE.Vector3(
    Math.cos(longitude) * cosLatitude,
    Math.sin(latitude),
    Math.sin(longitude) * cosLatitude
  ).normalize();
}
