import * as THREE from 'three/webgpu';
import {
  DEFAULT_SHIP_ID,
  getShipDefinition,
  type ShipId,
  type ShipPalette
} from './ShipDefinitions';

export interface ShipModel {
  group: THREE.Group;
  palette: ShipPalette;
  bodyMaterials: THREE.MeshStandardMaterial[];
  wingMaterials: THREE.MeshStandardMaterial[];
  accentMaterials: THREE.MeshStandardMaterial[];
  cockpitMaterials: THREE.MeshBasicMaterial[];
  engineFlame: THREE.Mesh;
  engineGlow: THREE.Mesh;
  engineFlameMaterial: THREE.MeshBasicMaterial;
  engineGlowMaterial: THREE.MeshBasicMaterial;
}

interface ShipMaterialSet {
  palette: ShipPalette;
  body: THREE.MeshStandardMaterial;
  wing: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  cockpit: THREE.MeshBasicMaterial;
  engine: THREE.MeshStandardMaterial;
  engineFlame: THREE.MeshBasicMaterial;
  engineGlow: THREE.MeshBasicMaterial;
}

export function createShipModel(shipId: ShipId = DEFAULT_SHIP_ID): ShipModel {
  const definition = getShipDefinition(shipId) ?? getShipDefinition(DEFAULT_SHIP_ID);

  if (!definition) {
    throw new Error('Missing default ship definition.');
  }

  const materials = createShipMaterials(definition.palette);

  switch (definition.id) {
    case 'needle':
      return createNeedleModel(materials);
    case 'tugboat':
      return createTugboatModel(materials);
    case 'manta':
      return createMantaModel(materials);
    case 'comet-skiff':
      return createCometSkiffModel(materials);
    case 'solar-dart':
      return createSolarDartModel(materials);
    case 'night-runner':
      return createNightRunnerModel(materials);
    case 'golden-janitor':
      return createGoldenJanitorModel(materials);
    case 'scrapper':
      return createScrapperModel(materials);
  }
}

export function disposeShipModel(model: ShipModel): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  model.group.traverse((object) => {
    const renderable = object as {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    if (renderable.geometry) {
      geometries.add(renderable.geometry);
    }

    if (Array.isArray(renderable.material)) {
      renderable.material.forEach((material) => materials.add(material));
    } else if (renderable.material) {
      materials.add(renderable.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function createShipMaterials(palette: ShipPalette): ShipMaterialSet {
  return {
    palette,
    body: new THREE.MeshStandardMaterial({
      color: palette.body,
      roughness: 0.42,
      metalness: 0.18,
      flatShading: true
    }),
    wing: new THREE.MeshStandardMaterial({
      color: palette.wing,
      roughness: 0.72,
      metalness: 0.22,
      flatShading: true
    }),
    accent: new THREE.MeshStandardMaterial({
      color: palette.accent,
      roughness: 0.38,
      metalness: 0.1,
      flatShading: true
    }),
    cockpit: new THREE.MeshBasicMaterial({ color: palette.cockpit }),
    engine: new THREE.MeshStandardMaterial({
      color: 0x161f2b,
      roughness: 0.5,
      metalness: 0.38
    }),
    engineFlame: new THREE.MeshBasicMaterial({
      color: palette.engine,
      transparent: true,
      opacity: 0
    }),
    engineGlow: new THREE.MeshBasicMaterial({
      color: palette.engine,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  };
}

function createScrapperModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.58), materials.body);
  body.position.z = 0.02;

  const nose = createNose(0.15, 0.32, materials.accent, 4);
  nose.position.z = 0.44;

  const noseBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.16),
    materials.accent
  );
  noseBeacon.position.set(0, 0.035, 0.66);

  const cockpit = createCockpit(0.105, materials.cockpit);
  cockpit.scale.set(0.92, 0.58, 1.16);
  cockpit.position.set(0, 0.105, 0.08);

  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.035, 0.24),
    materials.wing
  );
  leftWing.position.set(-0.32, -0.025, -0.05);
  leftWing.rotation.z = 0.08;
  const rightWing = mirrorX(leftWing);

  const leftFin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.16), materials.wing);
  leftFin.position.set(-0.13, 0.085, -0.24);
  leftFin.rotation.z = -0.22;
  const rightFin = mirrorX(leftFin);

  const engine = createEnginePod(0.11, 0.09, 0.18, materials.engine);
  engine.position.z = -0.36;
  const engineParts = createEngineEffects(materials, -0.43, -0.58, 0.09, 0.085);

  group.add(
    body,
    nose,
    noseBeacon,
    cockpit,
    leftWing,
    rightWing,
    leftFin,
    rightFin,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createNeedleModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.82), materials.body);
  body.position.z = 0.04;

  const nose = createNose(0.12, 0.48, materials.accent, 5);
  nose.position.z = 0.68;

  const cockpit = createCockpit(0.08, materials.cockpit);
  cockpit.scale.set(0.7, 0.5, 1.45);
  cockpit.position.set(0, 0.09, 0.18);

  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.026, 0.18),
    materials.wing
  );
  leftWing.position.set(-0.25, -0.02, -0.12);
  leftWing.rotation.z = 0.18;
  leftWing.rotation.y = -0.12;
  const rightWing = mirrorX(leftWing);

  const leftCanard = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.018, 0.11),
    materials.accent
  );
  leftCanard.position.set(-0.17, 0.005, 0.36);
  leftCanard.rotation.z = -0.14;
  const rightCanard = mirrorX(leftCanard);

  const engine = createEnginePod(0.078, 0.062, 0.17, materials.engine);
  engine.position.z = -0.47;
  const engineParts = createEngineEffects(materials, -0.56, -0.72, 0.072, 0.064);

  group.add(
    body,
    nose,
    cockpit,
    leftWing,
    rightWing,
    leftCanard,
    rightCanard,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createTugboatModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.46), materials.body);
  body.position.z = 0.02;

  const nose = createNose(0.17, 0.22, materials.accent, 4);
  nose.position.z = 0.35;

  const cockpit = createCockpit(0.12, materials.cockpit);
  cockpit.scale.set(1.1, 0.55, 0.9);
  cockpit.position.set(0, 0.145, 0.1);

  const leftPod = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.48), materials.wing);
  leftPod.position.set(-0.28, -0.02, -0.06);
  const rightPod = mirrorX(leftPod);

  const leftClamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.16),
    materials.accent
  );
  leftClamp.position.set(-0.34, -0.02, 0.32);
  const rightClamp = mirrorX(leftClamp);

  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.18, 0.08),
    materials.wing
  );
  rearPlate.position.z = -0.31;

  const engine = createEnginePod(0.15, 0.12, 0.2, materials.engine);
  engine.position.z = -0.43;
  const engineParts = createEngineEffects(materials, -0.54, -0.72, 0.12, 0.11);

  group.add(
    body,
    nose,
    cockpit,
    leftPod,
    rightPod,
    leftClamp,
    rightClamp,
    rearPlate,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createMantaModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.5), materials.body);
  body.position.z = 0.05;

  const nose = createNose(0.14, 0.3, materials.accent, 5);
  nose.position.z = 0.42;

  const cockpit = createCockpit(0.095, materials.cockpit);
  cockpit.scale.set(1.0, 0.42, 1.05);
  cockpit.position.set(0, 0.08, 0.08);

  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.026, 0.34),
    materials.wing
  );
  leftWing.position.set(-0.42, -0.02, -0.02);
  leftWing.rotation.z = 0.07;
  leftWing.rotation.y = 0.12;
  const rightWing = mirrorX(leftWing);

  const leftTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), materials.accent);
  leftTip.rotation.set(Math.PI / 2, 0, -0.28);
  leftTip.position.set(-0.82, -0.02, 0.08);
  const rightTip = mirrorX(leftTip);

  const engine = createEnginePod(0.1, 0.082, 0.16, materials.engine);
  engine.position.z = -0.35;
  const engineParts = createEngineEffects(materials, -0.44, -0.58, 0.095, 0.08);

  group.add(
    body,
    nose,
    cockpit,
    leftWing,
    rightWing,
    leftTip,
    rightTip,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createCometSkiffModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), materials.body);
  body.scale.set(0.72, 0.52, 1.55);
  body.position.z = 0.08;

  const nose = createNose(0.12, 0.34, materials.accent, 6);
  nose.position.z = 0.5;

  const cockpit = createCockpit(0.082, materials.cockpit);
  cockpit.scale.set(0.78, 0.5, 1.1);
  cockpit.position.set(0, 0.095, 0.08);

  const shardGeometry = new THREE.TetrahedronGeometry(0.13, 0);
  const leftShard = new THREE.Mesh(shardGeometry, materials.wing);
  leftShard.position.set(-0.31, -0.015, -0.08);
  leftShard.rotation.set(0.1, 0.28, -0.38);
  leftShard.scale.set(1.6, 0.55, 1.25);
  const rightShard = mirrorX(leftShard);

  const leftTrailFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.028, 0.34),
    materials.accent
  );
  leftTrailFin.position.set(-0.12, 0.04, -0.32);
  leftTrailFin.rotation.z = -0.24;
  const rightTrailFin = mirrorX(leftTrailFin);

  const engine = createEnginePod(0.085, 0.07, 0.16, materials.engine);
  engine.position.z = -0.42;
  const engineParts = createEngineEffects(materials, -0.5, -0.68, 0.085, 0.072);

  group.add(
    body,
    nose,
    cockpit,
    leftShard,
    rightShard,
    leftTrailFin,
    rightTrailFin,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createSolarDartModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.13, 0.58, 6),
    materials.body
  );
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.03;

  const nose = createNose(0.13, 0.4, materials.accent, 6);
  nose.position.z = 0.54;

  const cockpit = createCockpit(0.075, materials.cockpit);
  cockpit.scale.set(0.8, 0.48, 1.18);
  cockpit.position.set(0, 0.095, 0.14);

  const finGeometry = new THREE.BoxGeometry(0.14, 0.028, 0.36);
  const leftFin = new THREE.Mesh(finGeometry, materials.wing);
  leftFin.position.set(-0.24, -0.02, -0.06);
  leftFin.rotation.z = 0.42;
  const rightFin = mirrorX(leftFin);
  const topFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.34), materials.accent);
  topFin.position.set(0, 0.14, -0.08);
  topFin.rotation.x = -0.12;

  const leftEngine = createEnginePod(0.058, 0.05, 0.14, materials.engine);
  leftEngine.position.set(-0.08, -0.015, -0.39);
  const rightEngine = mirrorX(leftEngine);
  const engineParts = createEngineEffects(materials, -0.5, -0.68, 0.09, 0.07);

  group.add(
    body,
    nose,
    cockpit,
    leftFin,
    rightFin,
    topFin,
    leftEngine,
    rightEngine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createNightRunnerModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.58), materials.body);
  body.position.z = 0.02;
  body.rotation.z = 0.02;

  const nose = createNose(0.13, 0.32, materials.accent, 4);
  nose.position.z = 0.45;
  nose.rotation.z = Math.PI / 4;

  const cockpit = createCockpit(0.082, materials.cockpit);
  cockpit.scale.set(0.86, 0.38, 1.24);
  cockpit.position.set(0, 0.075, 0.08);

  const wingGeometry = new THREE.BoxGeometry(0.52, 0.022, 0.24);
  const leftWing = new THREE.Mesh(wingGeometry, materials.wing);
  leftWing.position.set(-0.34, -0.018, -0.04);
  leftWing.rotation.z = -0.08;
  leftWing.rotation.y = 0.18;
  const rightWing = mirrorX(leftWing);

  const leftRearFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.14, 0.2),
    materials.accent
  );
  leftRearFin.position.set(-0.16, 0.07, -0.28);
  leftRearFin.rotation.z = -0.2;
  const rightRearFin = mirrorX(leftRearFin);

  const engine = createEnginePod(0.095, 0.076, 0.16, materials.engine);
  engine.position.z = -0.4;
  const engineParts = createEngineEffects(materials, -0.49, -0.66, 0.088, 0.074);

  group.add(
    body,
    nose,
    cockpit,
    leftWing,
    rightWing,
    leftRearFin,
    rightRearFin,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createGoldenJanitorModel(materials: ShipMaterialSet): ShipModel {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.56), materials.body);
  body.position.z = 0.04;

  const nose = createNose(0.16, 0.36, materials.accent, 5);
  nose.position.z = 0.46;

  const cockpit = createCockpit(0.1, materials.cockpit);
  cockpit.scale.set(0.9, 0.55, 1.08);
  cockpit.position.set(0, 0.11, 0.1);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.012, 6, 48),
    materials.accent
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.z = 0.02;

  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.032, 0.28),
    materials.wing
  );
  leftWing.position.set(-0.36, -0.02, -0.05);
  leftWing.rotation.z = 0.12;
  const rightWing = mirrorX(leftWing);

  const broomRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.72),
    materials.accent
  );
  broomRail.position.set(0, -0.08, -0.02);

  const engine = createEnginePod(0.115, 0.095, 0.18, materials.engine);
  engine.position.z = -0.38;
  const engineParts = createEngineEffects(materials, -0.48, -0.64, 0.1, 0.09);

  group.add(
    body,
    nose,
    cockpit,
    halo,
    leftWing,
    rightWing,
    broomRail,
    engine,
    engineParts.engineGlow,
    engineParts.engineFlame
  );

  return createModelResult(group, materials, engineParts);
}

function createNose(
  radius: number,
  length: number,
  material: THREE.MeshStandardMaterial,
  radialSegments: number
): THREE.Mesh {
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(radius, length, radialSegments),
    material
  );
  nose.rotation.x = Math.PI / 2;
  return nose;
}

function createCockpit(radius: number, material: THREE.MeshBasicMaterial): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 8), material);
}

function createEnginePod(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  material: THREE.MeshStandardMaterial
): THREE.Mesh {
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 12),
    material
  );
  engine.rotation.x = Math.PI / 2;
  return engine;
}

function createEngineEffects(
  materials: ShipMaterialSet,
  glowZ: number,
  flameZ: number,
  glowRadius: number,
  flameRadius: number
): Pick<
  ShipModel,
  'engineFlame' | 'engineGlow' | 'engineFlameMaterial' | 'engineGlowMaterial'
> {
  const engineFlame = new THREE.Mesh(
    new THREE.ConeGeometry(flameRadius, 0.34, 12),
    materials.engineFlame
  );
  engineFlame.rotation.x = -Math.PI / 2;
  engineFlame.position.z = flameZ;
  engineFlame.visible = false;

  const engineGlow = new THREE.Mesh(
    new THREE.SphereGeometry(glowRadius, 14, 8),
    materials.engineGlow
  );
  engineGlow.position.z = glowZ;
  engineGlow.visible = false;

  return {
    engineFlame,
    engineGlow,
    engineFlameMaterial: materials.engineFlame,
    engineGlowMaterial: materials.engineGlow
  };
}

function createModelResult(
  group: THREE.Group,
  materials: ShipMaterialSet,
  engineParts: Pick<
    ShipModel,
    'engineFlame' | 'engineGlow' | 'engineFlameMaterial' | 'engineGlowMaterial'
  >
): ShipModel {
  return {
    group,
    bodyMaterials: [materials.body],
    wingMaterials: [materials.wing],
    accentMaterials: [materials.accent],
    cockpitMaterials: [materials.cockpit],
    palette: materials.palette,
    ...engineParts
  };
}

function mirrorX<T extends THREE.Object3D>(object: T): T {
  const mirrored = object.clone() as T;

  mirrored.position.x = -object.position.x;
  mirrored.rotation.x = object.rotation.x;
  mirrored.rotation.y = -object.rotation.y;
  mirrored.rotation.z = -object.rotation.z;
  return mirrored;
}
