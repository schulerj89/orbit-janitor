import * as THREE from 'three/webgpu';
import { ORBIT_LANES } from '../constants';
import { setOrbitPositionFromAngle, wrapAngle } from '../math';

export type PowerupType =
  | 'magnetSurge'
  | 'timeDilation'
  | 'overdrive'
  | 'shieldPickup'
  | 'comboLock'
  | 'scrapCache';

export interface PowerupDefinition {
  type: PowerupType;
  name: string;
  color: number;
}

export const POWERUP_DEFINITIONS: Record<PowerupType, PowerupDefinition> = {
  magnetSurge: {
    type: 'magnetSurge',
    name: 'Magnet Surge',
    color: 0x7ee7ff
  },
  timeDilation: {
    type: 'timeDilation',
    name: 'Time Dilation',
    color: 0xb28cff
  },
  overdrive: {
    type: 'overdrive',
    name: 'Overdrive',
    color: 0x4aa3ff
  },
  shieldPickup: {
    type: 'shieldPickup',
    name: 'Shield Pickup',
    color: 0x75f08a
  },
  comboLock: {
    type: 'comboLock',
    name: 'Combo Lock',
    color: 0xffd45f
  },
  scrapCache: {
    type: 'scrapCache',
    name: 'Scrap Cache',
    color: 0xff9c38
  }
};

const POWERUP_TYPES = Object.keys(POWERUP_DEFINITIONS) as PowerupType[];

export function getPowerupName(type: PowerupType): string {
  return POWERUP_DEFINITIONS[type].name;
}

export function getPowerupColor(type: PowerupType): number {
  return POWERUP_DEFINITIONS[type].color;
}

export function getPowerupTypes(): readonly PowerupType[] {
  return POWERUP_TYPES;
}

export class Powerup {
  readonly group = new THREE.Group();
  type: PowerupType = 'magnetSurge';
  angle = 0;
  laneIndex = 1;

  private readonly models = new Map<PowerupType, THREE.Group>();
  private readonly auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x7ee7ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });
  private readonly aura: THREE.Mesh;
  private age = 0;

  constructor() {
    this.aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.012, 8, 42),
      this.auraMaterial
    );
    this.aura.rotation.x = Math.PI / 2;
    this.group.add(this.aura);

    this.models.set('magnetSurge', createMagnetModel());
    this.models.set('timeDilation', createTimeModel());
    this.models.set('overdrive', createOverdriveModel());
    this.models.set('shieldPickup', createShieldModel());
    this.models.set('comboLock', createComboLockModel());
    this.models.set('scrapCache', createScrapCacheModel());
    this.models.forEach((model) => this.group.add(model));
    this.group.visible = false;
  }

  spawn(type: PowerupType, laneIndex: number, angle: number): void {
    this.type = type;
    this.laneIndex = laneIndex;
    this.angle = wrapAngle(angle);
    this.age = 0;
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.position.y = 0.32;
    this.group.visible = true;
    this.auraMaterial.color.setHex(getPowerupColor(type));
    this.models.forEach((model, modelType) => {
      model.visible = modelType === type;
    });
  }

  update(delta: number): void {
    if (!this.group.visible) {
      return;
    }

    this.age += delta;
    const pulse = 1 + Math.sin(this.age * 7.5) * 0.1;

    this.group.rotation.y += delta * 1.2;
    this.group.rotation.x = Math.sin(this.age * 2.8) * 0.12;
    this.group.scale.setScalar(pulse);
    this.aura.scale.setScalar(1.05 + Math.sin(this.age * 5.5) * 0.12);
    this.auraMaterial.opacity = 0.14 + Math.sin(this.age * 6.2) * 0.06;
  }

  clear(): void {
    this.age = 0;
    this.group.visible = false;
  }

  isVisible(): boolean {
    return this.group.visible;
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }
}

const sharedGeometries = {
  torusSmall: new THREE.TorusGeometry(0.2, 0.018, 8, 32),
  torusMedium: new THREE.TorusGeometry(0.26, 0.018, 8, 42),
  box: new THREE.BoxGeometry(0.24, 0.18, 0.24),
  bar: new THREE.BoxGeometry(0.42, 0.045, 0.08),
  tinyBar: new THREE.BoxGeometry(0.16, 0.035, 0.06),
  cone: new THREE.ConeGeometry(0.17, 0.42, 7),
  octa: new THREE.OctahedronGeometry(0.22, 0),
  cylinderHex: new THREE.CylinderGeometry(0.24, 0.24, 0.055, 6),
  cylinder: new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8)
};

function material(color: number, opacity = 0.92): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1
  });
}

function createMagnetModel(): THREE.Group {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(sharedGeometries.torusMedium, material(0x7ee7ff, 0.95));
  const core = new THREE.Mesh(sharedGeometries.torusSmall, material(0xcff8ff, 0.76));

  ring.rotation.x = Math.PI / 2;
  core.rotation.x = Math.PI / 2;
  core.scale.set(0.62, 0.62, 0.62);
  group.add(ring, core);
  return group;
}

function createTimeModel(): THREE.Group {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(sharedGeometries.torusMedium, material(0xb28cff, 0.9));
  const handMaterial = material(0xe5d8ff, 0.9);

  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  for (let index = 0; index < 6; index += 1) {
    const spoke = new THREE.Mesh(sharedGeometries.tinyBar, handMaterial);
    spoke.rotation.y = (index / 6) * Math.PI * 2;
    spoke.position.set(
      Math.cos(spoke.rotation.y) * 0.16,
      0,
      Math.sin(spoke.rotation.y) * 0.16
    );
    group.add(spoke);
  }

  return group;
}

function createOverdriveModel(): THREE.Group {
  const group = new THREE.Group();
  const flame = new THREE.Mesh(sharedGeometries.cone, material(0x4aa3ff, 0.95));
  const core = new THREE.Mesh(sharedGeometries.cone, material(0xcfefff, 0.8));

  flame.rotation.x = Math.PI;
  core.rotation.x = Math.PI;
  core.scale.set(0.55, 0.68, 0.55);
  core.position.y = 0.03;
  group.add(flame, core);
  return group;
}

function createShieldModel(): THREE.Group {
  const group = new THREE.Group();
  const hex = new THREE.Mesh(sharedGeometries.cylinderHex, material(0x75f08a, 0.86));
  const ring = new THREE.Mesh(sharedGeometries.torusMedium, material(0xd8ffe0, 0.72));

  hex.rotation.x = Math.PI / 2;
  ring.rotation.x = Math.PI / 2;
  group.add(hex, ring);
  return group;
}

function createComboLockModel(): THREE.Group {
  const group = new THREE.Group();
  const gold = material(0xffd45f, 0.95);
  const shackle = new THREE.Mesh(sharedGeometries.torusSmall, gold);
  const body = new THREE.Mesh(sharedGeometries.box, material(0xffb13d, 0.95));
  const chainA = new THREE.Mesh(sharedGeometries.bar, gold);
  const chainB = new THREE.Mesh(sharedGeometries.bar, gold);

  shackle.rotation.x = Math.PI / 2;
  shackle.position.y = 0.13;
  shackle.scale.set(0.75, 0.75, 0.75);
  body.scale.set(0.82, 0.6, 0.82);
  body.position.y = -0.06;
  chainA.position.x = -0.22;
  chainA.rotation.z = 0.4;
  chainB.position.x = 0.22;
  chainB.rotation.z = -0.4;
  group.add(chainA, chainB, shackle, body);
  return group;
}

function createScrapCacheModel(): THREE.Group {
  const group = new THREE.Group();
  const crate = new THREE.Mesh(sharedGeometries.box, material(0xff9c38, 0.96));
  const bandA = new THREE.Mesh(sharedGeometries.bar, material(0xffd45f, 0.9));
  const bandB = new THREE.Mesh(sharedGeometries.bar, material(0xffd45f, 0.9));

  crate.scale.set(1, 0.82, 1);
  bandA.position.y = 0.04;
  bandA.rotation.z = Math.PI / 2;
  bandB.position.y = -0.04;
  group.add(crate, bandA, bandB);
  return group;
}
