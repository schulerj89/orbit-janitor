# Audio Prompts

These are the final prompts used to generate the committed static audio files. Generation happened offline with ElevenLabs APIs. The game never calls ElevenLabs from browser code and must continue to run without these files because procedural Web Audio fallbacks are built in.

Never put `ELEVENLABS_API_KEY` in browser code, manifests, logs, or committed docs.

## SFX Prompts

Generated with ElevenLabs Text to Sound Effects API, `eleven_text_to_sound_v2`.

### `public/audio/sfx/collect-junk.mp3`

Short bright sci-fi arcade pickup chime, tiny metallic sparkle, satisfying cleanup collection, compact game sound effect, no voice, no music bed.

### `public/audio/sfx/combo-up.mp3`

Rising retro-futuristic synth arpeggio for a combo multiplier increase, bright arcade reward, energetic but not loud, no voice.

### `public/audio/sfx/lane-switch.mp3`

Soft spaceship lane-switch servo whoosh, clean pneumatic motion, quick orbital lane change feedback, no harsh transient, no voice.

### `public/audio/sfx/boost-start.mp3`

Compact spacecraft boost ignition, low synth thrust rising quickly into motion, polished arcade spaceship sound, modest volume, no explosion, no voice.

### `public/audio/sfx/boost-loop.mp3`

Seamless quiet spacecraft boost loop, low pulsing synthetic engine, stable volume, no melody, no clicks at loop point, no voice.

### `public/audio/sfx/boost-end.mp3`

Short boost power-down chirp, descending soft sci-fi synth, clean arcade feedback, no voice.

### `public/audio/sfx/hazard-warning.mp3`

Urgent sci-fi proximity warning pulse, arcade hazard telegraph, orange-alert character, readable but not painful, no voice.

### `public/audio/sfx/hazard-active.mp3`

Brief hazard activation zap, red alert energy burst, sharper and more dangerous than the warning pulse, not painfully loud, no voice.

### `public/audio/sfx/shield-break.mp3`

Crystalline energy shield shatter, airy glassy burst with small electrical snap, protective but alarming arcade impact, no voice.

### `public/audio/sfx/impact.mp3`

Crunchy metallic collision with glassy energy burst and small explosion, arcade spaceship crash, short tail, no voice.

### `public/audio/sfx/objective-complete.mp3`

Positive objective complete flourish, compact three-note sci-fi success chime, bright and satisfying arcade reward, no voice.

### `public/audio/sfx/ui-start.mp3`

Title start confirmation sound, confident rising synth button press, polished sci-fi arcade UI style, no voice.

### `public/audio/sfx/ui-select.mp3`

Tiny settings toggle click, clean digital tick with slight pitch lift, low volume sci-fi UI sound, no voice.

## Music Prompts

Generated with ElevenLabs Music API, `music_v1`, with instrumental output.

### `public/audio/music/orbit-janitor-main-loop.mp3`

Instrumental only, 60-second seamless sci-fi arcade loop for Orbit Janitor, a space cleanup arcade game. Epic space opera energy with heroic orchestral-synth brass, soaring string-like pads, shimmering arpeggios, steady adventurous percussion, optimistic starfighter momentum. Original melody only, no copyrighted themes, no vocals.

### `public/audio/music/title-ambient-loop.mp3`

Instrumental only, 60-second seamless deep-space title ambient loop for Orbit Janitor. Warm analog pads, distant orbital shimmer, calm anticipation before launch, subtle cinematic space atmosphere, no percussion, no vocals, original melody only.

### `public/audio/music/sector-drive-loop.mp3`

Instrumental only, 60-second seamless epic sci-fi arcade sector loop for Orbit Janitor. Heroic space opera adventure, bold orchestral-synth brass, driving but clean synth pulse, light cinematic percussion, shimmering arpeggios, starfighter chase energy. Original melody only, no copyrighted themes, no vocals.

### `public/audio/music/danger-layer-loop.mp3`

Instrumental only, 30-second seamless danger intensity layer for Orbit Janitor. Tense pulsing low synth, subtle alarm rhythm, dark space hazard pressure, designed to layer under heroic sector music, minimal lead melody, no vocals.

### `public/audio/music/mission-complete-stinger.mp3`

Instrumental only, short epic sci-fi mission complete stinger for Orbit Janitor. Bright victorious synth brass, sparkling arpeggio, clean ending, optimistic arcade success, original melody only, no vocals.

### `public/audio/music/game-over-stinger.mp3`

Instrumental only, short sci-fi arcade game over stinger for Orbit Janitor. Dramatic descending synth brass, low impact tail, tense but not horror, clean ending, original melody only, no vocals.
