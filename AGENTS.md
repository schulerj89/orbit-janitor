# Orbit Janitor Agent Notes

This repo is a small, highly iterable Vite + TypeScript + Three.js arcade game. Keep changes narrow, procedural, and easy to verify.

## Project Rules

- Use TypeScript.
- Do not change gameplay behavior unless the user explicitly asks for gameplay changes.
- Do not add dependencies without explicit approval.
- Do not introduce React, R3F, Drei, Phaser, Babylon, Cannon, Rapier, Ammo, GLTF, image textures, external asset CDNs, postprocessing, custom GLSL, or a physics engine.
- Keep all art, effects, and audio procedural.
- Keep using `WebGPURenderer` from `three/webgpu`.
- Do not mix imports from `three` and `three/webgpu`; use `three/webgpu` consistently for Three.js imports.
- Keep assets procedural unless explicitly asked.
- Use the Web Audio API directly for sound. Do not add audio files.
- Avoid broad rewrites. Touch only the files needed for the task.
- Prefer small, playable iterations.
- Run `npm run typecheck` and `npm run build` before finishing.

## Commands

Run these from the repo root:

```bash
npm install
npm run dev
npm run format
npm run format:check
npm run typecheck
npm run build
npm run preview
```

Required validation before handoff:

```bash
npm run format:check
npm run typecheck
npm run build
```

## Code Map

- `src/game/Game.ts` is the main composition root and update loop.
- `src/game/constants.ts` owns shared gameplay tuning constants.
- `src/game/input.ts` owns keyboard state and edge-triggered inputs.
- `src/game/entities/` contains renderable gameplay objects.
- `src/game/systems/` contains orchestration systems such as hazard scheduling.
- `src/game/effects/` contains transient visual feedback systems.
- `src/game/audio/AudioManager.ts` owns procedural Web Audio.
- `src/game/ui/Hud.ts` owns HUD markup and state display.
- `src/style.css` owns page, HUD, and overlay styling.

## System Boundaries

- Prefer adding small entity or system classes over expanding `Game.ts` when behavior has its own lifecycle.
- Keep collision simple and readable. Existing collision uses distances, lane radius proximity, and angular checks.
- Keep HUD changes in `Hud.ts` and `style.css`; avoid pushing display logic into gameplay entities.
- Keep audio calls in `Game.ts` at gameplay event boundaries, and synthesis details inside `AudioManager`.
- Keep debug state in `window.orbitJanitorDebug` useful for browser smoke tests.

## Review Guidance

When reviewing or modifying this repo, check:

- Existing controls still work: Enter/Space start, arrows/WASD movement and lane switching, Space boost, R restart after game over.
- Junk collection, combo scoring, boost fuel, obstacle collisions, hazard telegraphs, and restart behavior still work.
- No browser autoplay errors or stuck audio loops.
- HUD text does not overlap at desktop or mobile widths.
- `npm run typecheck` and `npm run build` pass.

Known non-blocking warning: current Three.js emits a `THREE.Clock` deprecation warning in the browser console.
