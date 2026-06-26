# Audio Prompts

These prompts are for generating optional static audio files outside the game. The game must continue to run without these files because procedural Web Audio fallbacks are built in.

Do not call ElevenLabs or any other external audio service from browser code. Do not commit API keys. Add provenance for any committed audio file in `public/audio/AUDIO_CREDITS.md`.

## SFX Prompts

### collect-junk.mp3

Short bright sci-fi arcade pickup chime, tiny metallic sparkle, 0.35 seconds, no voice, no music bed.

### combo-up.mp3

Rising retro-futuristic synth arpeggio for a combo multiplier increase, 0.7 seconds, bright but not loud, no voice.

### lane-switch.mp3

Soft spaceship lane-switch servo whoosh, clean pneumatic motion, 0.25 seconds, no harsh transient, no voice.

### boost-start.mp3

Compact spacecraft boost ignition, low synth thrust rising quickly into motion, 0.45 seconds, modest volume, no explosion, no voice.

### boost-loop.mp3

Seamless quiet spacecraft boost loop, low pulsing synthetic engine, 1 second loop, stable volume, no melody, no clicks at loop point.

### boost-end.mp3

Short boost power-down chirp, descending soft sci-fi synth, 0.3 seconds, clean arcade feedback, no voice.

### hazard-warning.mp3

Urgent sci-fi proximity warning pulse, arcade hazard telegraph, 0.8 seconds, orange-alert character, no voice.

### hazard-active.mp3

Brief hazard activation zap, red alert energy burst, 0.45 seconds, sharper than warning but not painfully loud, no voice.

### shield-break.mp3

Crystalline energy shield shatter, airy glassy burst with small electrical snap, 0.8 seconds, protective but alarming, no voice.

### impact.mp3

Crunchy metallic collision with glassy energy burst and small explosion, 1.1 seconds, no long cinematic tail, no voice.

### objective-complete.mp3

Positive objective complete flourish, compact three-note sci-fi success chime, 0.9 seconds, bright and satisfying, no voice.

### ui-start.mp3

Title start confirmation sound, confident rising synth button press, 0.35 seconds, polished arcade UI style, no voice.

### ui-select.mp3

Tiny settings toggle click, clean digital tick with slight pitch lift, 0.2 seconds, low volume, no voice.

## Music Prompts

Generate these offline with ElevenLabs or another licensed source. Commit only final audio files with provenance in `public/audio/AUDIO_CREDITS.md`. Never put `ELEVENLABS_API_KEY` in browser code.

### orbit-janitor-main-loop.mp3

Instrumental only, 60-second seamless sci-fi arcade loop, optimistic synthwave, light percussion, shimmering arpeggios, no vocals.

### title-ambient-loop.mp3

Instrumental only, 60-second seamless deep-space title ambient loop, warm analog pads, distant orbital shimmer, calm anticipation, no percussion, no vocals.

### sector-drive-loop.mp3

Instrumental only, 60-second seamless epic sci-fi arcade sector loop, driving but clean synth pulse, heroic low brass-like synths, light percussion, shimmering arpeggios, no vocals.

### danger-layer-loop.mp3

Instrumental only, 30-second seamless danger intensity layer, tense pulsing low synth, subtle alarm rhythm, designed to layer over existing music, no melody lead, no vocals.

### mission-complete-stinger.mp3

Short epic sci-fi mission complete stinger, bright victorious synth brass and sparkling arpeggio, 2.5 seconds, clean ending, no vocals.

### game-over-stinger.mp3

Short sci-fi arcade game over stinger, dramatic descending synth brass with low impact tail, 2.5 seconds, not horror, no vocals.
