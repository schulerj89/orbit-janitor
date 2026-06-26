# Orbit Janitor Design Notes

## Design Pillars

1. Readable arcade orbit action. The player should understand lane, direction, hazard phase, boost state, and objective progress at a glance.
2. Telegraph-first danger. Orange warning states teach the upcoming danger before red active states can punish the player.
3. Small playable iterations. New systems should add one clear behavior at a time without rewriting the game loop.
4. Procedural identity. Ships, junk, satellites, planets, lanes, hazards, particles, and UI feedback should come from code-native geometry, CSS, and audio systems.
5. Fast recovery and persistent meaning. Runs should restart quickly, while scrap, upgrades, best scores, sector unlocks, daily scores, and seeded runs make repeated attempts useful.
6. Accessible control options. Keyboard remains the primary path, with gamepad, touch, reduced motion, shake intensity, high-contrast hazards, and audio settings layered on top.

## Progression Loop

Orbit Janitor uses a compact arcade loop:

1. Choose a sector, daily challenge, seeded run, or Training Orbit from the title flow.
2. Start a mission with a short countdown and clear objective.
3. Collect junk, build combo, manage boost fuel, and read lane hazards.
4. Finish the sector objective or crash into a satellite/hazard.
5. Review the run summary, earn scrap, improve upgrades, and unlock the next sector.
6. Return to sector select, replay, start the next sector, or chase endless/daily scores.

## Sector List

| Sector            | Objective                   | Identity              | Notes                                                                                            |
| ----------------- | --------------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Training Orbit    | Complete 3 training pickups | Flight check          | Tutorial steps guide rotation, collection, lane switching, boost, obstacles, and hazard reading. |
| Low Orbit Cleanup | Reach 50 cleanup points     | Standard route        | Baseline mission with basic hazards and early event waves.                                       |
| Debris Belt       | Collect 25 junk             | Dense salvage band    | More obstacle traffic and wider junk lane variation.                                             |
| Solar Storm       | Survive 90 seconds          | Charged warning lanes | Shorter hazard cadence and stronger solar-flare pressure.                                        |
| Night Side        | Reach 80 cleanup points     | Low light cleanup     | Darker scene treatment with bright hazard telegraphs.                                            |
| Comet Wake        | Survive 8 hazards           | Volatile trail        | Late-pattern hazards and comet/debris event pressure.                                            |
| Endless Cleanup   | Endless high-score mode     | Open route            | Escalates over time and triggers recurring event waves.                                          |

## System Boundaries

- `Game.ts` wires event-level behavior and state transitions.
- `MissionDirector` owns sector objective progress and difficulty values.
- `HazardDirector` owns telegraphed hazard timing, selection, collision, and debug state.
- `EventWaveDirector` owns sector finale waves and temporary event modifiers.
- `UpgradeSystem` owns persistent scrap, upgrade levels, and run-start effects.
- `SettingsSystem` owns accessibility/input/audio preferences.
- `AudioManager` and `MusicDirector` own static audio loading and procedural fallback details.
- `Hud` and overlay classes own UI presentation; gameplay systems should expose snapshots instead of writing DOM directly.

## Future Ideas

- Editable seed entry and shareable seeded-run links.
- More sector-specific event-wave scripts.
- Upgrade branches that trade safety against scoring potential.
- More powerup risk/reward tuning by sector.
- Replayable challenge modifiers such as low fuel, one lane disabled, or combo-only scoring.
- Capture-ready demo media and social preview art.
- Broader browser/device QA notes for WebGPU, WebGL fallback, gamepad, touch, and reduced motion.
