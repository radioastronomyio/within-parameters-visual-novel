# Tiny UI SFX Pack

A compact synthetic UI sound pack for indie game menus, buttons, tutorials, settings screens, and small feedback moments.

## Included

- 64 WAV sound effects.
- 8 categories: clicks, hovers, confirms, cancels, alerts, toggles, transitions, and errors.
- 44.1 kHz, 16-bit, mono WAV files.
- Waveform SVG previews for every sound.
- JSON index with metadata, duration, category, and file paths.
- Source recipes used to generate the sounds.
- Browser preview page for quick auditioning.

## Quick start

Open `preview.html` in a browser and press any play button to audition sounds.

Use `exports/audio/wav/` in your game engine. The files are short, normalized, and named by category:

```text
click_01.wav
hover_04.wav
confirm_07.wav
error_02.wav
```

## Source

The sounds are synthetic and generated from `source/sfx-recipes.json` by `scripts/build-pack.js`. No third-party samples were used.
