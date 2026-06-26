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
npm run test:e2e
npm run test:e2e:ui
npm run build
npm run preview
```

- `dev`: start the Vite development server
- `format`: format supported source, config, and docs files with Prettier
- `format:check`: verify Prettier formatting without writing files
- `typecheck`: run TypeScript without emitting files
- `test:e2e`: run Playwright smoke tests against the Vite dev server
- `test:e2e:ui`: open the Playwright UI runner
- `build`: typecheck and create a production build
- `preview`: serve the production build locally

## Controls

- Enter or Space: start the default sector
- T: start Training Orbit from the title screen
- K: skip the Training Orbit tutorial while it is active
- C: open sector select from the title screen or mission complete screen
- D: start the daily challenge from the title screen
- S: start the visible seeded run from the title screen
- Add `?seed=YOUR-SEED` to the URL to choose the visible seeded run seed
- ArrowUp or W / ArrowDown or S: move selection in sector select
- Escape: return to title from sector select or mission complete
- ArrowLeft or A: rotate counterclockwise
- ArrowRight or D: rotate clockwise
- ArrowUp or W: switch outward
- ArrowDown or S: switch inward
- Space: boost while held, limited by fuel
- P: pause or resume while playing
- H: open or close help/instructions
- O: open or close settings
- Escape: close help, pause, or settings overlays
- R: restart after game over
- U: open upgrades from the title screen or game over
- 1-6: buy upgrades while the upgrade panel is open
- M: toggle music
- - / =: lower or raise music volume
- [ / ]: lower or raise SFX volume
- N: toggle SFX

Gamepad:

- Left stick or D-pad left/right: rotate
- D-pad up/down or shoulder buttons: switch lanes
- A / Cross: start or select
- B / Circle: back out or close overlays
- Right trigger or X / Square: boost
- Start: pause or resume

Touch:

- On narrow or coarse-pointer screens, touch controls appear automatically.
- Touch controls can be forced on or off from Settings.
- Edge buttons rotate, switch lanes, boost, and start or restart without covering the central orbit.

## Current Features

- Title screen with controls and audio toggle hints
- Keyboard-first sector select and mission complete overlays
- Pause and compact help/instructions overlays
- Settings overlay with reduced motion, shake intensity, audio volume, high-contrast hazards, and touch control mode
- Gamepad input for movement, lane switching, boost, select/back, and pause
- Mobile-friendly touch controls on narrow/coarse-pointer screens
- Interactive Training Orbit tutorial with guided rotate, pickup, lane switch, boost, obstacle, and hazard steps
- Run summary after game over
- Persistent best score in localStorage
- Persistent sector unlocks and completions in localStorage
- Normal, seeded, and daily challenge run modes
- Persistent daily best score in localStorage
- Persistent scrap and ship upgrades in localStorage
- Temporary in-run powerups: Magnet Surge, Time Dilation, Overdrive, Shield Pickup, Combo Lock, and Scrap Cache
- Three visible orbit lanes with smooth lane switching
- Junk and satellite hazards assigned to lanes
- Upgradeable junk pickup radius, boost fuel, boost recharge, lane switching, combo timing, and one-run shield
- Combo scoring for quick consecutive pickups
- Boost fuel drain, recharge, and empty feedback
- Powerup HUD timers and pickup toasts for active run modifiers
- Procedural mesh particle bursts for pickups and impacts
- Lightweight procedural audio with Web Audio after first input
- Optional static SFX and layered music files under `public/audio`
- MusicDirector support for title ambience, sector drive loops, danger layering, and mission/game-over stingers
- Persistent music volume controls for making static music prominent over SFX
- Persistent music and SFX volume controls
- Dynamic obstacle pacing as score increases
- Timed hazard telegraphs that warn before becoming dangerous
- Optional high-contrast hazard colors plus text status for warning and active danger phases
- Hazard patterns include lane arcs, double lane arcs, sweepers, gate gaps, pulse mines, and debris showers
- Boss-like sector event waves near mission finales: Debris Storm, Satellite Net, Solar Flare, Comet Pass, and Cleanup Frenzy
- Objective target: reach 50 cleanup points
- Structured sectors with score, junk, timer, hazard-survival, and endless objectives
- Sector-specific procedural visual themes for planet, lanes, stars, junk, hazards, lighting, and background
- Sector modifiers including forgiving training telegraphs, solar-storm hazard cadence, comet-wake hazard speed, finale event waves, and endless scaling
- Run timer with sector objective and hazard status feedback

## Audio Assets

The game works with no audio files present. `AudioManager` attempts to load static MP3 files from `public/audio`, while `MusicDirector` layers title ambience, sector drive music, danger intensity, and stingers. Missing or undecodable files fall back to procedural Web Audio.

Committed audio file provenance is documented in `public/audio/AUDIO_CREDITS.md`. The final prompts used for generation are in `docs/audio-prompts.md`.

ElevenLabs-generated assets live in `public/audio` after generation outside the browser runtime, but they are not required for the game to run. No ElevenLabs API key should be committed, referenced in browser code, or shipped to the client.

## GitHub Pages Deployment

Production builds use the `/orbit-janitor/` Vite base path for GitHub Pages. Local development still runs from `/` with `npm run dev`.

The `Deploy GitHub Pages` workflow builds `dist`, uploads it as a Pages artifact, and deploys it when changes land on `main`. If Pages is not enabled yet, open the GitHub repository settings, go to **Pages**, set **Build and deployment** source to **GitHub Actions**, then rerun the workflow or push to `main`.

The deployed site should be available at:

```text
https://schulerj89.github.io/orbit-janitor/
```

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
- Accessibility and control settings are stored under `orbit-janitor.settings`.
- Sector progression is stored under the `orbit-janitor.sectors` localStorage prefix.
- Sector visual identity and modifier tuning live in `src/game/systems/SectorTheme.ts`.

## Roadmap

1. Editable seeded-run entry field
2. Additional title and summary polish
3. More audio variation
4. TSL atmosphere and shield effects
5. Additional upgrade choices and run modifiers
6. More sector-specific hazard, event-wave, and powerup rules
