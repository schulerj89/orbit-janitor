# Orbit Janitor

Orbit Janitor is a small procedural Three.js arcade game where you pilot a cleanup ship around a planet, switch between orbit lanes, collect scrap, build combos, manage boost fuel, avoid satellites, and react to telegraphed lane hazards.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run format
npm run format:check
npm run typecheck
npm run build
npm run preview
```

- `dev`: start the Vite development server
- `format`: format supported source, config, and docs files with Prettier
- `format:check`: verify Prettier formatting without writing files
- `typecheck`: run TypeScript without emitting files
- `build`: typecheck and create a production build
- `preview`: serve the production build locally

## Controls

- Enter or Space: start the first run
- ArrowLeft or A: rotate counterclockwise
- ArrowRight or D: rotate clockwise
- ArrowUp or W: switch outward
- ArrowDown or S: switch inward
- Space: boost while held, limited by fuel
- R: restart after game over

## Current Features

- Tiny start overlay and game-over restart overlay
- Three visible orbit lanes with smooth lane switching
- Junk and satellite hazards assigned to lanes
- Combo scoring for quick consecutive pickups
- Boost fuel drain, recharge, and empty feedback
- Procedural mesh particle bursts for pickups and impacts
- Lightweight procedural audio with Web Audio after first input
- Dynamic obstacle pacing as score increases
- Timed lane hazard telegraphs that warn before becoming dangerous
- Objective target: reach 50 cleanup points
- Run timer with objective and hazard status feedback

## Technical Notes

- Uses Vite, vanilla TypeScript, and Three.js.
- Uses `WebGPURenderer` imported from `three/webgpu`.
- Do not mix imports from `three` and `three/webgpu`.
- Prefers WebGPU and falls back through the renderer when unavailable.
- Uses no external assets, models, image textures, postprocessing, custom GLSL, or physics engine.
- All art and effects are procedural geometry and materials.
- Audio is generated with the Web Audio API; no audio files are used.
- UI is plain HTML/CSS/TypeScript, with no React.
- Runtime debug state is exposed on `window.orbitJanitorDebug` for smoke tests.

## Roadmap

1. Magnetic junk pickup upgrade
2. Daily/random challenge seeds
3. More hazard patterns
4. Main menu and run summary
5. More audio variation
6. TSL atmosphere and shield effects
