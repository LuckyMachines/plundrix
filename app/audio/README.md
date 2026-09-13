# Plundrix mechanical foley pipeline

This library turns a deliberately small set of CC0 source fragments into the
game's authored mechanical sound language. The source files are never played
directly by the product.

Run `npm run sound:build` from `app/` to regenerate every composite. The build:

- trims, filters, delays, and layers multiple source fragments per cue;
- renders three restrained pitch variations per cue;
- targets -18 LUFS for cues long enough to meter reliably and uses a -1.5 dB
  peak ceiling for short mechanical transients;
- exports mono 48 kHz, 96 kbps MP3 files for broad browser support;
- writes deterministic filenames consumed by `SessionAudioBridge`.

Runtime synthesis remains underneath the samples as a quiet signature and a
fallback when a file is not decoded yet. The result is recognizably Plundrix,
not an unedited stock-sound library.

See `LICENSE-KENNEY-CC0.txt` and `manifest.json` for the source/license record.

Open `public/audio-preview.html` through the Vite development or production
server to audition every cue, compare all three variations, filter by family,
and download individual rendered files. `sound:build` also regenerates the
standalone page's JSON and JavaScript indexes.
