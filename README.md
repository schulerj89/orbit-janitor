# Orbit Janitor

Orbit Janitor is a procedural Three.js arcade game about cleaning orbital lanes without losing momentum. Pilot a tiny cleanup ship around a sector core, switch between three lanes, collect junk, chain combos, manage boost fuel, read hazard telegraphs, and survive sector missions.

[Live demo](https://schulerj89.github.io/orbit-janitor/) | [Design notes](docs/design-notes.md) | [Release checklist](docs/release-checklist.md) | [Balancing notes](docs/balancing.md)

## Demo Media

Demo media placeholders for the public release:

- Gameplay GIF: TODO capture a 10-15 second clip showing lane switching, pickup combos, hazard telegraphs, and a mission complete moment.
- Screenshot: TODO capture the title screen with sector/start options.
- Screenshot: TODO capture active gameplay with the HUD, a readable hazard warning, and procedural world-core/ship art.
- Social preview image: not committed yet. Add only when generated or provided, and document provenance if it includes generated or external assets.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173`.

## Development Commands

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

- `dev`: start the Vite development server.
- `format`: format supported source, config, and docs files with Prettier.
- `format:check`: verify Prettier formatting without writing files.
- `typecheck`: run TypeScript without emitting files.
- `test:e2e`: run Playwright smoke tests against the Vite dev server.
- `test:e2e:ui`: open the Playwright UI runner.
- `build`: typecheck and create a production build.
- `preview`: serve the production build locally.

## Controls

Keyboard:

- Enter or Space: start the default sector from the title screen.
- T: start Training Orbit from the title screen.
- C: open sector select from the title screen or mission complete screen.
- D: start the daily challenge from the title screen.
- S: start the visible seeded run from the title screen. Add `?seed=YOUR-SEED` to the URL to choose that seed.
- ArrowUp or W / ArrowDown or S: move selection in sector select.
- Escape: return to title from sector select or mission complete, or close help, pause, and settings overlays.
- Space / Enter / Escape: skip active cinematic sequences. On first load, this reveals the title menu before starting a run.
- ArrowLeft or A / ArrowRight or D: rotate around the sector core.
- ArrowUp or W / ArrowDown or S: switch orbit lanes while playing.
- Space: boost while held, limited by fuel.
- P: pause or resume while playing.
- H: open or close help/instructions.
- O: open or close settings.
- K: skip the Training Orbit tutorial while it is active.
- R: restart after game over.
- U: open upgrades from the title screen or game over.
- 1-6: buy upgrades while the upgrade panel is open.
- M: toggle music.
- N: toggle SFX.
- `-` / `=`: lower or raise music volume.
- `[` / `]`: lower or raise SFX volume.

Gamepad:

- Left stick or D-pad left/right: rotate.
- D-pad up/down or shoulder buttons: switch lanes.
- A / Cross: start or select.
- B / Circle: back out or close overlays.
- Right trigger or X / Square: boost.
- Start: pause or resume.

Touch:

- On narrow or coarse-pointer screens, touch controls appear automatically.
- Touch controls can be forced on or off from Settings.
- Edge buttons rotate, switch lanes, boost, and start or restart without covering the central orbit.

## Feature List

- Title, sector select, mission complete, pause, help, settings, upgrade, game over, and run summary overlays.
- Skippable real-time micro-cinematics for title fly-in, sector intro, event warnings, mission complete, game over, and sector unlock reveals.
- Structured sectors with score, junk collection, survival timer, hazard survival, tutorial, daily challenge, seeded run, and endless objectives.
- Persistent sector unlocks, best score, daily best, scrap total, upgrades, audio preferences, and accessibility settings.
- Training Orbit tutorial with guided rotate, pickup, lane switch, boost, obstacle, and hazard-reading steps.
- Three orbit lanes with smooth lane switching, readable ship direction, procedural world cores/lanes/stars/junk/satellites/hazards, and sector-specific visual themes.
- Sector-specific centerpieces: planet core, cracked planetoid, solar reactor, night planet, comet core, and orbital gate.
- Combo scoring, boost fuel, temporary powerups, upgrade effects, one-run shield support, near-miss feedback, mission intro countdown, and screen/camera feedback.
- Telegraph-first hazards: lane arcs, double lane arcs, sweepers, gate hazards, pulse mines, and debris showers.
- Sector-specific event waves near finales and in endless mode: Debris Storm debris crossings, Satellite Net safe-lane formations, Solar Flare lane pulses, Comet Pass background fly-bys, and Cleanup Frenzy reward phases.
- Keyboard, gamepad, and touch controls.
- Accessibility settings for reduced motion, screen shake intensity, high-contrast hazards, and audio volumes.
- Web Audio procedural fallback plus optional committed MP3 SFX/music under `public/audio`.
- Playwright smoke tests using `window.orbitJanitorDebug`.

## Audio Asset Policy

Orbit Janitor must work with no audio files present. `AudioManager` and `MusicDirector` attempt to load static MP3 files from `public/audio`, then fall back to procedural Web Audio if files are missing or fail to decode.

Committed static audio assets currently live under `public/audio/sfx` and `public/audio/music`. Provenance for every committed audio file is documented in `public/audio/AUDIO_CREDITS.md`, and the final generation prompts are in `docs/audio-prompts.md`.

Audio files are allowed only when explicitly requested, must live under `public/audio`, must have provenance/credits, and must not require runtime API keys. Do not call ElevenLabs or any generation service from browser runtime, and never commit API keys or secret values.

## GitHub Pages Deployment

Production builds use the `/orbit-janitor/` Vite base path for GitHub Pages. Local development still runs from `/` with `npm run dev`.

The `Deploy GitHub Pages` workflow builds `dist`, uploads it as a Pages artifact, and deploys it when changes land on `main`. If Pages is not enabled yet, open the GitHub repository settings, go to **Pages**, set **Build and deployment** source to **GitHub Actions**, then rerun the workflow or push to `main`.

The deployed site should be available at:

```text
https://schulerj89.github.io/orbit-janitor/
```

Before a public release, confirm the deployed URL loads the canvas, starts from the title screen, plays through at least one sector, and reports no blocking console errors.

## Technical Constraints

- Vite, vanilla TypeScript, and Three.js.
- `WebGPURenderer` from `three/webgpu`.
- Do not mix imports from `three` and `three/webgpu`.
- No React, R3F, Drei, Phaser, Babylon, physics engines, GLTF models, image textures, postprocessing, custom GLSL, or external asset CDNs.
- Visual assets stay procedural unless explicitly requested.
- Static audio is allowed only under `public/audio` with documented provenance.
- UI is plain HTML/CSS/TypeScript.
- Runtime debug state is exposed on `window.orbitJanitorDebug` for smoke tests.

## Roadmap

1. Capture final gameplay GIFs, screenshots, and a social preview image for the public demo.
2. Add an editable seeded-run entry field instead of relying on URL query strings.
3. Continue the audio mix pass so static music sits clearly above SFX while preserving procedural fallback.
4. Add more sector-specific hazard/event rules and powerup tuning.
5. Expand upgrades with more distinct late-run choices.
6. Add broader browser/device smoke coverage for gamepad, touch, reduced motion, and WebGPU fallback behavior.
