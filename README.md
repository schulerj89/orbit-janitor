# Orbit Janitor

Orbit Janitor is a small procedural Three.js arcade game where you pilot a cleanup ship around a planet, switch between orbit lanes, collect scrap, build combos, manage boost fuel, and avoid satellites.

## Local Setup

```bash
npm install
npm run dev
npm run build
```

## Controls

- ArrowLeft or A: rotate counterclockwise
- ArrowRight or D: rotate clockwise
- ArrowUp or W: switch outward
- ArrowDown or S: switch inward
- Space: boost while held, limited by fuel
- R: restart after game over

## Current Features

- Three visible orbit lanes with smooth lane switching
- Junk and satellite hazards assigned to lanes
- Combo scoring for quick consecutive pickups
- Boost fuel drain, recharge, and empty feedback
- Procedural mesh particle bursts for pickups and impacts
- Dynamic obstacle pacing as score increases

## Technical Notes

- Uses Vite, vanilla TypeScript, and Three.js.
- Uses `WebGPURenderer` imported from `three/webgpu`.
- Prefers WebGPU and falls back through the renderer when unavailable.
- Uses no external assets, models, image textures, postprocessing, GLSL, or physics engine.
- All art and effects are procedural geometry and materials.

## Roadmap

1. Hazard telegraphs
2. Magnetic junk pickup upgrade
3. Daily/random challenge seeds
4. TSL atmosphere and shield effects
5. Audio
6. Main menu and run summary
