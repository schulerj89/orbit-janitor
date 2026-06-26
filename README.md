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
- U: open upgrades from the title screen or game over
- 1-6: buy upgrades while the upgrade panel is open
- M: toggle music
- N: toggle SFX

## Current Features

- Title screen with controls and audio toggle hints
- Run summary after game over
- Persistent best score in localStorage
- Persistent scrap and ship upgrades in localStorage
- Three visible orbit lanes with smooth lane switching
- Junk and satellite hazards assigned to lanes
- Upgradeable junk pickup radius, boost fuel, boost recharge, lane switching, combo timing, and one-run shield
- Combo scoring for quick consecutive pickups
- Boost fuel drain, recharge, and empty feedback
- Procedural mesh particle bursts for pickups and impacts
- Lightweight procedural audio with Web Audio after first input
- Optional static SFX and music files under `public/audio`
- Dynamic obstacle pacing as score increases
- Timed hazard telegraphs that warn before becoming dangerous
- Hazard patterns include lane arcs, double lane arcs, sweepers, gate gaps, pulse mines, and debris showers
- Objective target: reach 50 cleanup points
- Run timer with objective and hazard status feedback

## Audio Assets

The game works with no audio files present. `AudioManager` attempts to load optional static MP3 files from `public/audio` and falls back to procedural Web Audio sounds if files are missing or fail to decode.

Expected optional file paths are documented in `public/audio/AUDIO_CREDITS.md`. Prompt ideas for generating those files are in `docs/audio-prompts.md`.

ElevenLabs-generated assets can be placed in `public/audio` after generation outside the browser runtime, but they are not required. No ElevenLabs API key should be committed, referenced in browser code, or shipped to the client.

## Technical Notes

- Uses Vite, vanilla TypeScript, and Three.js.
- Uses `WebGPURenderer` imported from `three/webgpu`.
- Do not mix imports from `three` and `three/webgpu`.
- Prefers WebGPU and falls back through the renderer when unavailable.
- Uses no external assets, models, image textures, postprocessing, custom GLSL, or physics engine.
- All art and effects are procedural geometry and materials.
- Audio uses the Web Audio API, with optional static MP3 files and procedural fallbacks.
- UI is plain HTML/CSS/TypeScript, with no React.
- Runtime debug state is exposed on `window.orbitJanitorDebug` for smoke tests.

## Roadmap

1. Daily/random challenge seeds
2. Additional title and summary polish
3. More audio variation
4. TSL atmosphere and shield effects
5. Additional upgrade choices and run modifiers
6. Challenge-specific hazard mixes
