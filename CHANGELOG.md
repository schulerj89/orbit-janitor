# Changelog

## 0.1.3 - 2026-06-29

- Improved Sector Select keyboard usability by preserving selected-row accessibility state and scrolling the selected level into view when the list changes.

## 0.1.2 - 2026-06-29

- Improved mission-complete next-sector routing so campaign flow continues to the next unlocked incomplete level before falling back to the default route.

## 0.1.1 - 2026-06-29

- Fixed sector music intensity selection so the runtime uses `SectorConfig.musicIntensityHint` instead of theme defaults.
- Fixed campaign default sector selection so completed campaign routes advance toward Endless Cleanup instead of returning to Low Orbit.
- Hardened Sector Select row rendering by replacing config-derived `innerHTML` with explicit text nodes.
