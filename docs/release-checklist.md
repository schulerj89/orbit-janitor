# Orbit Janitor Release Checklist

Use this checklist before a public demo release or deployment branch.

## Build Checks

- Run `npm ci` from a clean checkout.
- Run `npm run format:check`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `npm run test:e2e`.
- Confirm `dist/` is not committed.
- Confirm no secrets, API keys, generated logs, or local environment files are staged.
- Confirm `package.json`, CI, README, and `AGENTS.md` agree on available scripts.

## Audio Credits

- Verify every committed MP3 under `public/audio/sfx` and `public/audio/music` has an entry in `public/audio/AUDIO_CREDITS.md`.
- Verify final prompts are documented in `docs/audio-prompts.md`.
- Confirm the game still runs if `public/audio` MP3 files are temporarily unavailable.
- Confirm no ElevenLabs or other generation API key is referenced from browser code.
- Confirm audio volume defaults are modest and Music/SFX toggles work.

## Browser Smoke Tests

- Chrome or Edge: load title screen, start Low Orbit Cleanup, collect junk, switch lanes, boost, pause, resume, open help, open settings, and restart from game over.
- Firefox or another non-WebGPU-first browser: confirm renderer fallback does not block the title screen.
- Mobile-sized viewport: confirm touch controls appear or can be enabled and do not cover the central orbit.
- Gamepad, if available: confirm movement, lane switching, boost, select/back, and pause.
- Accessibility: confirm reduced motion lowers shake/punch feedback, high-contrast hazards remain readable, and overlay text is legible.
- Console: confirm no uncaught page errors. Non-blocking adapter/fallback warnings should be noted if present.

## Deployment Check

- Confirm `vite.config.ts` uses `/orbit-janitor/` for production builds and `/` for local dev.
- Confirm `.github/workflows/deploy-pages.yml` builds on `main`, uploads `dist`, and deploys via GitHub Pages.
- In GitHub repository settings, set Pages source to **GitHub Actions**.
- After deployment, open `https://schulerj89.github.io/orbit-janitor/`.
- Confirm the deployed site loads the canvas, starts on the title screen, and can enter gameplay.
- Confirm static audio requests resolve when files are committed, and procedural fallback still works when they are missing.

## Demo Media

- Capture one short gameplay GIF showing collection, boost, lane switching, hazards, and mission completion.
- Capture at least two screenshots: title screen and in-run hazard read.
- Add a social preview image only when generated or provided.
- Document provenance for any generated or external media before committing it.

## Final Review

- README reflects the current game and does not promise unimplemented features.
- `docs/design-notes.md` and `docs/balancing.md` match current sector names and objective values.
- GitHub issue templates exist for bug reports, feature requests, and balance feedback.
- No gameplay behavior changed as part of the release docs pass.
