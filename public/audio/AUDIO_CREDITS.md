# Audio Credits

This directory is reserved for optional static audio assets.

The game does not require these files to run. If an audio file is missing or fails to decode, `AudioManager` falls back to procedural Web Audio sounds.

All committed audio files must include provenance here: generator or creator, generation date, prompt or source description, license/usage rights, and any post-processing notes. Do not commit API keys or files with unclear rights.

Expected optional paths:

- `audio/sfx/collect-junk.mp3`
- `audio/sfx/combo-up.mp3`
- `audio/sfx/lane-switch.mp3`
- `audio/sfx/boost-start.mp3`
- `audio/sfx/boost-loop.mp3`
- `audio/sfx/boost-end.mp3`
- `audio/sfx/hazard-warning.mp3`
- `audio/sfx/hazard-active.mp3`
- `audio/sfx/shield-break.mp3`
- `audio/sfx/impact.mp3`
- `audio/sfx/objective-complete.mp3`
- `audio/sfx/ui-start.mp3`
- `audio/sfx/ui-select.mp3`
- `audio/music/orbit-janitor-main-loop.mp3`
- `audio/music/title-ambient-loop.mp3`
- `audio/music/sector-drive-loop.mp3`
- `audio/music/danger-layer-loop.mp3`
- `audio/music/mission-complete-stinger.mp3`
- `audio/music/game-over-stinger.mp3`

ElevenLabs-generated assets may be placed here after generation outside the browser runtime. Do not commit, expose, or reference any ElevenLabs API key in client code.

## Provenance Log

### `audio/music/title-ambient-loop.mp3`

```text
Asset filename: title-ambient-loop.mp3
Generation tool: Local Python oscillator/noise composition rendered to WAV, encoded to MP3 with ffmpeg 8.1
Prompt: Deep-space title ambient loop with warm pads, distant orbital shimmer, calm anticipation, no percussion, no vocals.
Generation date: 2026-06-26
License/plan notes: Original procedural asset generated for this repository; no external samples, no external asset CDN, no runtime API key.
Post-processing notes: Encoded from generated 44.1 kHz stereo WAV to MP3.
```

### `audio/music/sector-drive-loop.mp3`

```text
Asset filename: sector-drive-loop.mp3
Generation tool: Local Python oscillator/noise composition rendered to WAV, encoded to MP3 with ffmpeg 8.1
Prompt: Original epic space opera arcade loop with heroic brass-like synths, soaring string-like pads, shimmering arpeggios, deep adventurous percussion, starfighter chase energy, no vocals, no copyrighted melodies.
Generation date: 2026-06-26
License/plan notes: Original procedural asset generated for this repository; no external samples, no external asset CDN, no runtime API key.
Post-processing notes: Encoded from generated 44.1 kHz stereo WAV to MP3.
```

### `audio/music/danger-layer-loop.mp3`

```text
Asset filename: danger-layer-loop.mp3
Generation tool: Local Python oscillator/noise composition rendered to WAV, encoded to MP3 with ffmpeg 8.1
Prompt: Seamless danger intensity layer with tense low synth pulse, subtle alarm rhythm, designed to layer under sector music, no lead melody, no vocals.
Generation date: 2026-06-26
License/plan notes: Original procedural asset generated for this repository; no external samples, no external asset CDN, no runtime API key.
Post-processing notes: Encoded from generated 44.1 kHz stereo WAV to MP3.
```

Use this format for each committed audio asset:

```text
Asset filename:
Generation tool:
Prompt:
Generation date:
License/plan notes:
Post-processing notes:
```
