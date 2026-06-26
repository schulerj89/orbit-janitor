import * as THREE from 'three/webgpu';
import { JUNK_MIN_ANGLE_SEPARATION, ORBIT_LANES } from '../constants';
import { randomAngleAvoiding, setOrbitPositionFromAngle, wrapAngle } from '../math';

export interface LaneAngle {
  angle: number;
  laneIndex: number;
}

export class Junk {
  readonly group = new THREE.Group();
  angle = 0;
  laneIndex = 1;

  private readonly variants: THREE.Group[];
  private age = 0;
  private activeVariantIndex = 0;

  constructor() {
    this.variants = createJunkVariants();
    this.variants.forEach((variant) => this.group.add(variant));
    this.selectVariant(0);
  }

  respawn(playerAngle: number, playerLaneIndex: number, obstacles: LaneAngle[]): void {
    this.laneIndex = Math.floor(Math.random() * ORBIT_LANES.length);
    const disallowedAngles: number[] = [];

    if (playerLaneIndex === this.laneIndex) {
      disallowedAngles.push(playerAngle);
    }

    obstacles.forEach((obstacle) => {
      if (obstacle.laneIndex === this.laneIndex) {
        disallowedAngles.push(obstacle.angle);
      }
    });

    this.angle = randomAngleAvoiding(disallowedAngles, JUNK_MIN_ANGLE_SEPARATION);
    this.selectVariant(Math.floor(Math.random() * this.variants.length));
    this.setAngle(this.angle);
  }

  update(delta: number): void {
    this.age += delta;
    this.group.rotation.x += delta * 1.25;
    this.group.rotation.y += delta * 1.9;
    this.group.scale.setScalar(1 + Math.sin(this.age * 5.2) * 0.08);
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }

  private setAngle(angle: number): void {
    this.angle = wrapAngle(angle);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
  }

  private selectVariant(variantIndex: number): void {
    this.activeVariantIndex = variantIndex;
    this.variants.forEach((variant, index) => {
      variant.visible = index === this.activeVariantIndex;
    });
  }
}

const junkMaterials = {
  amber: new THREE.MeshStandardMaterial({
    color: 0xffbf3f,
    roughness: 0.72,
    metalness: 0.16,
    flatShading: true
  }),
  burnt: new THREE.MeshStandardMaterial({
    color: 0x8f4a32,
    roughness: 0.82,
    metalness: 0.12,
    flatShading: true
  }),
  copper: new THREE.MeshStandardMaterial({
    color: 0xd5762c,
    roughness: 0.68,
    metalness: 0.22,
    flatShading: true
  }),
  blueScrap: new THREE.MeshStandardMaterial({
    color: 0x3d7895,
    roughness: 0.64,
    metalness: 0.2,
    flatShading: true
  })
};

const junkGeometries = {
  box: new THREE.BoxGeometry(0.2, 0.13, 0.16),
  longBox: new THREE.BoxGeometry(0.32, 0.06, 0.14),
  plate: new THREE.BoxGeometry(0.34, 0.035, 0.22),
  tinyBox: new THREE.BoxGeometry(0.12, 0.08, 0.12),
  shard: new THREE.TetrahedronGeometry(0.16, 0),
  pipe: new THREE.CylinderGeometry(0.032, 0.032, 0.28, 8),
  shortPipe: new THREE.CylinderGeometry(0.038, 0.038, 0.16, 8)
};

function createJunkVariants(): THREE.Group[] {
  return [
    createVariant([
      part('box', 'amber', [0, 0, 0], [0.4, 0.2, -0.2], [1.05, 0.85, 0.9]),
      part('shard', 'copper', [0.15, 0.06, -0.06], [0.2, 0.8, 0.1]),
      part('shortPipe', 'burnt', [-0.14, -0.03, 0.09], [Math.PI / 2, 0.2, 0.5])
    ]),
    createVariant([
      part('plate', 'blueScrap', [0, 0, 0], [0.1, 0.4, 0.2], [1.1, 1, 0.7]),
      part('longBox', 'amber', [-0.02, 0.06, 0.1], [0.2, -0.8, 0.1]),
      part('shard', 'burnt', [0.18, -0.03, -0.08], [0.9, 0.2, 0.6], [0.8, 1, 1])
    ]),
    createVariant([
      part('pipe', 'copper', [-0.08, 0.02, 0], [0, 0, Math.PI / 2]),
      part('pipe', 'burnt', [0.08, -0.02, 0.03], [Math.PI / 2, 0.2, 0.1]),
      part('tinyBox', 'amber', [0, 0.08, -0.08], [0.5, 0.5, 0.2])
    ]),
    createVariant([
      part('plate', 'burnt', [-0.07, 0, 0.01], [0.35, -0.25, 0.4]),
      part(
        'plate',
        'blueScrap',
        [0.11, 0.03, -0.04],
        [-0.2, 0.5, -0.35],
        [0.72, 1, 0.82]
      ),
      part('shard', 'copper', [0, -0.08, 0.13], [0.1, 1.1, 0.2], [0.75, 0.75, 0.75])
    ]),
    createVariant([
      part('shortPipe', 'blueScrap', [0, 0, 0], [Math.PI / 2, 0, 0], [1.2, 1.2, 1.2]),
      part('tinyBox', 'amber', [-0.13, 0, 0], [0.2, 0.3, 0.1]),
      part('tinyBox', 'burnt', [0.13, 0, 0], [-0.2, 0.5, -0.1])
    ]),
    createVariant([
      part('box', 'blueScrap', [0.02, 0, 0], [0.7, 0.2, 0.5], [0.8, 0.75, 1.15]),
      part(
        'pipe',
        'amber',
        [-0.14, 0.05, -0.05],
        [0.1, 0, Math.PI / 2],
        [0.75, 0.75, 0.75]
      ),
      part('longBox', 'burnt', [0.12, -0.06, 0.09], [-0.2, -0.3, 0.65], [0.62, 1, 0.9])
    ]),
    createVariant([
      part('longBox', 'copper', [0, 0, 0], [0.1, 0.1, 0.78], [0.9, 1, 0.7]),
      part('longBox', 'burnt', [0, 0.02, 0], [-0.05, -0.2, -0.78], [0.82, 1, 0.62]),
      part('shard', 'amber', [0.02, 0.11, 0.04], [0.2, 0.5, 0.3], [0.65, 0.65, 0.65])
    ]),
    createVariant([
      part('tinyBox', 'amber', [-0.08, 0.04, 0.05], [0.2, 0.6, 0.1], [1.2, 0.8, 1.1]),
      part(
        'tinyBox',
        'blueScrap',
        [0.08, -0.04, -0.03],
        [0.7, 0.1, 0.4],
        [0.95, 1.2, 0.85]
      ),
      part('shortPipe', 'copper', [0.02, 0.02, -0.13], [0.2, Math.PI / 2, 0.3]),
      part('shard', 'burnt', [0.15, 0.05, 0.09], [0.2, 0.9, 0.7], [0.6, 0.6, 0.6])
    ])
  ];
}

type JunkGeometryKey = keyof typeof junkGeometries;
type JunkMaterialKey = keyof typeof junkMaterials;

interface JunkPartConfig {
  geometry: JunkGeometryKey;
  material: JunkMaterialKey;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

function part(
  geometry: JunkGeometryKey,
  material: JunkMaterialKey,
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number] = [1, 1, 1]
): JunkPartConfig {
  return { geometry, material, position, rotation, scale };
}

function createVariant(parts: JunkPartConfig[]): THREE.Group {
  const group = new THREE.Group();

  for (const config of parts) {
    const mesh = new THREE.Mesh(
      junkGeometries[config.geometry],
      junkMaterials[config.material]
    );
    mesh.position.set(...config.position);
    mesh.rotation.set(...config.rotation);
    mesh.scale.set(...config.scale);
    group.add(mesh);
  }

  return group;
}
