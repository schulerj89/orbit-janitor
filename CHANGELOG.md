# Changelog

## 0.1.1 - 2026-06-29

- Fixed sector music intensity selection so the runtime uses `SectorConfig.musicIntensityHint` instead of theme defaults.
- Fixed campaign default sector selection so completed campaign routes advance toward Endless Cleanup instead of returning to Low Orbit.
- Hardened Sector Select row rendering by replacing config-derived `innerHTML` with explicit text nodes.
