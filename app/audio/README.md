# Plundrix mechanical foley pipeline

This library turns a deliberately small set of CC0 source recordings into the
game's authored mechanical sound language. The source files are never played
directly by the product.

Run `npm run sound:build` from `app/` to regenerate every cue. The build:

- trims and filters one recognizable source for most cues, with a second source
  reserved for the victory ceremony;
- renders three restrained pitch variations per cue;
- targets -20 LUFS for cues long enough to meter reliably and uses a -1.5 dB
  peak ceiling for short mechanical transients;
- exports mono 48 kHz, 96 kbps MP3 files for broad browser support;
- writes deterministic filenames consumed by `SessionAudioBridge`.

Runtime playback is sample-only: no oscillator layer or generated noise is
added. Cue prioritization, repeat cooldowns, and a four-voice ceiling prevent
rapid events from becoming an unreadable wall of sound.

See `LICENSE-KENNEY-CC0.txt` and `manifest.json` for the source/license record.

## Background music

`npm run music:build` downloads two full-length CC0 heist and gambling tracks
from a pinned SoundSafari repository commit, verifies each source with SHA-256,
removes sub-bass rumble and excessive high-frequency noise, adds clean entry
and exit fades, normalizes the score to -24 LUFS with a -2 dB true-peak ceiling,
and exports stereo 48 kHz MP3s. The originals stay in the operating system's
temporary cache rather than inflating the repository.

`SessionMusicBridge` starts the playlist after the first user interaction so it
respects browser autoplay rules. Music and sound effects have independent mute
and 50% default volume controls. Gameplay cues temporarily duck the music so
both remain legible. See `LICENSE-SOUNDSAFARI-CC0.txt` and `music-manifest.json`
for the exact source, pinned revision, hashes, and rights.

Open `public/audio-preview.html` through the Vite development or production
server to audition the background score and every cue, compare all three sound
variations, filter by family, and download individual rendered files. The build
scripts also regenerate the standalone page's JSON and JavaScript indexes.
