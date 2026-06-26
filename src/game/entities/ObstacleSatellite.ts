import * as THREE from 'three/webgpu';
import { OBSTACLE_ANGULAR_SPEED, ORBIT_LANES } from '../constants';
import { clampLaneIndex, setOrbitPositionFromAngle, wrapAngle } from '../math';

export interface ObstacleConfig {
  laneIndex: number;
  angle: number;
  angularSpeed: number;
}

export class ObstacleSatellite {
  readonly group = new THREE.Group();
  angle = Math.PI * 1.15;
  laneIndex = 1;
  angularSpeed = OBSTACLE_ANGULAR_SPEED;

  private readonly visualRoot = new THREE.Group();
  private readonly warningLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3b2f,
    transparent: true,
    opacity: 0.78
  });
  private readonly spinSpeed = 0.42 + Math.random() * 0.36;
  private age = Math.random() * Math.PI * 2;

  constructor(
    laneIndex = 1,
    angle = Math.PI * 1.15,
    angularSpeed = OBSTACLE_ANGULAR_SPEED
  ) {
    this.visualRoot.add(
      createSatelliteVariant(
        Math.floor(Math.random() * SATELLITE_VARIANT_COUNT),
        this.warningLightMaterial
      )
    );
    this.group.add(this.visualRoot);
    this.reset({ laneIndex, angle, angularSpeed });
  }

  update(delta: number, difficultyFactor = 1): void {
    this.age += delta;
    this.angle = wrapAngle(this.angle + this.angularSpeed * difficultyFactor * delta);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.rotation.y = -this.angle;
    this.visualRoot.rotation.y += delta * this.spinSpeed;
    this.visualRoot.rotation.x = Math.sin(this.age * 0.75) * 0.08;
    this.warningLightMaterial.opacity = 0.52 + Math.sin(this.age * 5.4) * 0.28;
  }

  setLane(laneIndex: number): void {
    this.laneIndex = clampLaneIndex(laneIndex);
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
  }

  reset(config: ObstacleConfig): void {
    this.laneIndex = clampLaneIndex(config.laneIndex);
    this.angle = wrapAngle(config.angle);
    this.angularSpeed = config.angularSpeed;
    setOrbitPositionFromAngle(
      this.group.position,
      this.angle,
      ORBIT_LANES[this.laneIndex]
    );
    this.group.rotation.y = -this.angle;
    this.visualRoot.rotation.set(0, 0, 0);
    this.age = 0;
  }

  getPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.group.position);
  }
}

const SATELLITE_VARIANT_COUNT = 3;

const satelliteMaterials = {
  body: new THREE.MeshStandardMaterial({
    color: 0x9aaab1,
    roughness: 0.48,
    metalness: 0.34,
    flatShading: true
  }),
  darkBody: new THREE.MeshStandardMaterial({
    color: 0x52616b,
    roughness: 0.58,
    metalness: 0.28,
    flatShading: true
  }),
  panel: new THREE.MeshStandardMaterial({
    color: 0x315f82,
    roughness: 0.62,
    metalness: 0.18
  }),
  panelTrim: new THREE.MeshStandardMaterial({
    color: 0xaac0c8,
    roughness: 0.52,
    metalness: 0.22
  }),
  antenna: new THREE.MeshBasicMaterial({ color: 0xd8f4ff })
};

const satelliteGeometries = {
  bus: new THREE.BoxGeometry(0.36, 0.25, 0.28),
  compactBus: new THREE.BoxGeometry(0.26, 0.3, 0.24),
  barrel: new THREE.CylinderGeometry(0.16, 0.16, 0.34, 12),
  panelWide: new THREE.BoxGeometry(0.72, 0.026, 0.3),
  panelNarrow: new THREE.BoxGeometry(0.52, 0.026, 0.22),
  panelTrim: new THREE.BoxGeometry(0.04, 0.034, 0.33),
  strut: new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8),
  antenna: new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8),
  warningLight: new THREE.SphereGeometry(0.05, 12, 8),
  dish: new THREE.ConeGeometry(0.15, 0.09, 16),
  sensor: new THREE.OctahedronGeometry(0.18, 0)
};

function createSatelliteVariant(
  variantIndex: number,
  warningLightMaterial: THREE.MeshBasicMaterial
): THREE.Group {
  if (variantIndex === 1) {
    return createBarrelSatellite(warningLightMaterial);
  }

  if (variantIndex === 2) {
    return createSensorSatellite(warningLightMaterial);
  }

  return createBusSatellite(warningLightMaterial);
}

function createBusSatellite(warningLightMaterial: THREE.MeshBasicMaterial): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(satelliteGeometries.bus, satelliteMaterials.body);
  const leftPanel = createPanel(-0.58, satelliteGeometries.panelWide);
  const rightPanel = createPanel(0.58, satelliteGeometries.panelWide);
  const leftTrim = createTrim(-0.94);
  const rightTrim = createTrim(0.94);
  const antenna = createAntenna(0.28);
  const warningLight = createWarningLight(warningLightMaterial, 0.17);

  group.add(body, leftPanel, rightPanel, leftTrim, rightTrim, antenna, warningLight);
  return group;
}

function createBarrelSatellite(
  warningLightMaterial: THREE.MeshBasicMaterial
): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(satelliteGeometries.barrel, satelliteMaterials.darkBody);
  body.rotation.z = Math.PI / 2;

  const leftPanel = createPanel(-0.5, satelliteGeometries.panelNarrow);
  leftPanel.rotation.z = 0.08;
  const rightPanel = createPanel(0.5, satelliteGeometries.panelNarrow);
  rightPanel.rotation.z = -0.08;

  const dish = new THREE.Mesh(satelliteGeometries.dish, satelliteMaterials.antenna);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = 0.23;

  const antenna = createAntenna(0.24);
  const warningLight = createWarningLight(warningLightMaterial, -0.19);

  group.add(body, leftPanel, rightPanel, dish, antenna, warningLight);
  return group;
}

function createSensorSatellite(
  warningLightMaterial: THREE.MeshBasicMaterial
): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(satelliteGeometries.sensor, satelliteMaterials.body);
  body.scale.set(1.05, 0.78, 0.9);

  const upperPanel = createPanel(0, satelliteGeometries.panelNarrow);
  upperPanel.position.y = 0.24;
  upperPanel.rotation.z = Math.PI / 2;

  const lowerPanel = createPanel(0, satelliteGeometries.panelNarrow);
  lowerPanel.position.y = -0.24;
  lowerPanel.rotation.z = Math.PI / 2;

  const leftStrut = createStrut(-0.24, Math.PI / 2);
  const rightStrut = createStrut(0.24, Math.PI / 2);
  const warningLight = createWarningLight(warningLightMaterial, 0.18);

  group.add(body, upperPanel, lowerPanel, leftStrut, rightStrut, warningLight);
  return group;
}

function createPanel(x: number, geometry: THREE.BufferGeometry): THREE.Mesh {
  const panel = new THREE.Mesh(geometry, satelliteMaterials.panel);
  panel.position.x = x;
  return panel;
}

function createTrim(x: number): THREE.Mesh {
  const trim = new THREE.Mesh(
    satelliteGeometries.panelTrim,
    satelliteMaterials.panelTrim
  );
  trim.position.x = x;
  return trim;
}

function createStrut(x: number, rotationZ: number): THREE.Mesh {
  const strut = new THREE.Mesh(satelliteGeometries.strut, satelliteMaterials.antenna);
  strut.position.x = x;
  strut.rotation.z = rotationZ;
  return strut;
}

function createAntenna(y: number): THREE.Mesh {
  const antenna = new THREE.Mesh(satelliteGeometries.antenna, satelliteMaterials.antenna);
  antenna.position.y = y;
  return antenna;
}

function createWarningLight(
  warningLightMaterial: THREE.MeshBasicMaterial,
  z: number
): THREE.Mesh {
  const warningLight = new THREE.Mesh(
    satelliteGeometries.warningLight,
    warningLightMaterial
  );
  warningLight.position.set(0, 0.035, z);
  return warningLight;
}
