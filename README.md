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

- ArrowUp/W and ArrowDown/S: move selection on the title main menu and sector select.
- Enter or Space: activate the selected title menu option, or start the default sector when Start Mission is selected.
- T: start Training Orbit from the title screen.
- C: open sector select from the title screen or mission complete screen.
- D: start the daily challenge from the title screen.
- S: start the visible seeded run before menu navigation, or move down after the title menu is active. Add `?seed=YOUR-SEED` to the URL to choose that seed.
- Escape: return to title from sector select or mission complete, or close help, pause, and settings overlays.
- Space / Enter / Escape: skip active cinematic sequences, including title, sector, daily, endless, medal, and ship unlock reveals.
- ArrowLeft or A / ArrowRight or D: rotate around the sector core.
- ArrowUp or W / ArrowDown or S: switch orbit lanes while playing.
- Space: boost while held, limited by fuel.
- P: pause or resume while playing.
- H: open or close help/instructions.
- O: open or close settings.
- B: open the Contract Board from the title screen; arrow keys review optional replay challenges.
- A: open Achievements from the title screen; arrow keys review medal and lifetime goals.
- Y: open the Shipyard from the title screen; arrow keys preview ships and Enter equips unlocked models.
- G: open the cosmetic gallery from the title screen; arrow keys navigate and Enter equips unlocked cosmetics.
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

Touch and mobile:

- Orbit Janitor is optimized for desktop keyboard/gamepad.
- Touch controls exist, but full mobile play is experimental because the complete game includes sectors, upgrades, shipyard, challenge boards, powerups, event waves, audio, cinematics, and multiple overlays.
- Phone-like viewports show a desktop-optimized notice before entering the full game.
- Mobile Lite is available as a simplified Pocket Cleanup mode from the phone device gate or device experience setting.
- Landscape is recommended on phones.
- Mobile Lite auto-orbits clockwise. Use Lane In, Lane Out, and Boost to dodge, collect, and finish the short objective: collect 20 junk or survive 75 seconds.
- Mobile Lite has larger hazard warning windows, a two-satellite cap, no event waves, and a limited powerup pool.
- On narrow or coarse-pointer screens, full-game touch controls appear automatically after entering the full game.
- Touch controls can be forced on or off from Settings.
- Edge buttons rotate, switch lanes, boost, and start or restart without covering the central orbit. Mobile Lite uses its own larger touch controls.

## Feature List

- Official title screen with keyboard/gamepad main menu, sector select, mission complete, pause, help, settings, upgrade, cosmetic gallery, game over, and run summary overlays.
- Mobile Lite Pocket Cleanup mode for phone-like devices, with auto-orbit, large touch controls, reduced hazards, shorter missions, reduced scrap rewards, and a separate best score.
- Skippable real-time micro-cinematics for the official title reveal, sector world reveals, daily challenge launches, endless warnings, event warnings, mission complete fly-bys, medal ceremonies, ship unlocks, game over beats, and sector unlock reveals.
- Structured sectors with score, junk collection, survival timer, hazard survival, tutorial, daily challenge, seeded run, and endless objectives.
- Second sector pack with Graveyard Ring, Neon Belt, Frozen Relay, Reactor Grave, Junk Moon, and Long Orbit.
- Persistent sector unlocks, sector medals, achievements, best score, daily best, scrap total, upgrades, cosmetic unlocks/equips, audio preferences, and accessibility settings.
- Training Orbit tutorial with guided rotate, pickup, lane switch, boost, obstacle, and hazard-reading steps.
- Three orbit lanes with smooth lane switching, readable ship direction, procedural world cores/lanes/stars/junk/satellites/hazards, and sector-specific visual themes.
- Sector-specific centerpieces with procedural identity: habitat/cloud planet, cracked rubble planetoid, venting solar reactor, night world with city lights and auroras, icy comet plume, and a non-planet orbital gate.
- Text-only radio comms for title onboarding, sector intros, tutorial steps, hazards, powerups, objective progress, event waves, mission completion, crashes, and sector unlocks.
- Combo scoring, boost fuel, temporary powerups, upgrade effects, one-run shield support, near-miss feedback, mission intro countdown, and screen/camera feedback.
- Contract Board with optional replay challenges, persistent completions, scrap rewards, and cosmetic or ship unlock rewards.
- Sector medal chase with Bronze, Silver, Gold, and Prime ratings on non-tutorial missions, plus lifetime achievements for sector completion, combos, hazards, near misses, powerups, daily clears, and medal mastery.
- Shipyard with unlockable procedural ship models: Scrapper, Needle, Tugboat, Manta, Comet Skiff, Solar Dart, Night Runner, and Golden Janitor.
- Cosmetic gallery with procedural ship palettes, cockpit colors, engine trails, lane accents, pickup burst colors, and title badges.
- Telegraph-first hazards: lane arcs, double lane arcs, sweepers, gate hazards, pulse mines, and debris showers.
- Sector-specific event waves near finales and in endless mode: Debris Storm debris crossings, Satellite Net safe-lane formations, Solar Flare lane pulses, Comet Pass background fly-bys, and Cleanup Frenzy reward phases.
- Desktop-first keyboard/gamepad controls, with experimental full-game touch controls and Mobile Lite for phones.
- Accessibility settings for reduced motion, screen shake intensity, high-contrast hazards, and audio volumes.
- Web Audio procedural fallback plus optional committed MP3 SFX/music under `public/audio`.
- Playwright smoke tests using `window.orbitJanitorDebug`.

## Sector Packs

Core route:

- Training Orbit: guided tutorial pickups.
- Low Orbit Cleanup: reach 50 cleanup points.
- Debris Belt: collect 25 junk.
- Solar Storm: survive 90 seconds.
- Night Side: reach 80 cleanup points.
- Comet Wake: survive 8 hazards.
- Endless Cleanup: open high-score route.

Second pack:

- Graveyard Ring: survive 6 Satellite Net waves or 100 seconds.
- Neon Belt: reach 5x combo and 90 score.
- Frozen Relay: collect 5 powerups and reach 70 score.
- Reactor Grave: survive 4 Solar Flare waves or 120 seconds.
- Junk Moon: collect 40 junk.
- Long Orbit: survive 180 seconds with slow endurance scaling.

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
5. Expand upgrades and cosmetics with more distinct late-run choices.
6. Add broader browser/device smoke coverage for gamepad, touch, reduced motion, Mobile Lite, and WebGPU fallback behavior.
