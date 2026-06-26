export const PLANET_RADIUS = 2.2;
export const ORBIT_LANES = [4.3, 5.0, 5.7] as const;
export const STARTING_LANE_INDEX = 1;
export const ORBIT_RADIUS = ORBIT_LANES[STARTING_LANE_INDEX];
export const LANE_SWITCH_DURATION = 0.16;
export const LANE_SWITCH_COOLDOWN = 0.12;
export const PLAYER_BASE_ANGULAR_SPEED = 1.8;
export const PLAYER_BOOST_MULTIPLIER = 2.2;
export const JUNK_COLLISION_RADIUS = 0.45;
export const OBSTACLE_COLLISION_RADIUS = 0.55;
export const PLAYER_COLLISION_RADIUS = 0.35;
export const OBSTACLE_ANGULAR_SPEED = -0.75;
export const CAMERA_FOV = 55;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 200;
export const MAX_PIXEL_RATIO = 2;

export const JUNK_MIN_ANGLE_SEPARATION = 0.9;
export const STAR_COUNT = 600;

export const COMBO_WINDOW = 2.2;
export const MAX_COMBO_MULTIPLIER = 5;

export const BOOST_FUEL_MAX = 1.0;
export const BOOST_FUEL_DRAIN_PER_SECOND = 0.55;
export const BOOST_FUEL_RECHARGE_PER_SECOND = 0.32;
export const BOOST_MIN_TO_ACTIVATE = 0.12;

export const HAZARD_FIRST_SPAWN_TIME = 8;
export const HAZARD_BASE_INTERVAL = 7;
export const HAZARD_MIN_INTERVAL = 3.2;
export const HAZARD_TELEGRAPH_DURATION = 1.25;
export const HAZARD_ACTIVE_DURATION = 0.65;
export const HAZARD_ARC_WIDTH_RADIANS = 0.65;
export const HAZARD_COLLISION_RADIUS = 0.45;
export const RUN_OBJECTIVE_TARGET_SCORE = 50;
export const SECTOR_STORAGE_PREFIX = 'orbit-janitor.sectors';
