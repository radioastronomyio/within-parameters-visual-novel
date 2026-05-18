# Usage

## Folder map

- `exports/audio/wav/`: final WAV files.
- `exports/waveforms/`: SVG waveform preview images.
- `data/sfx-index.json`: metadata index for tools and websites.
- `source/sfx-recipes.json`: procedural source recipes.

## Recommended game use

- `click_*`: buttons, list rows, small menu actions.
- `hover_*`: cursor movement and focus changes.
- `confirm_*`: accepted actions, saves, purchases, unlocks.
- `cancel_*`: back, close, dismiss, negative actions.
- `alert_*`: warnings and attention sounds.
- `toggle_*`: tabs, switches, and settings.
- `transition_*`: panels, modals, screen changes.
- `error_*`: invalid input, denied actions, depleted resources.

## Audio format

All files are:

- WAV
- 44.1 kHz
- 16-bit
- Mono
- Short one-shot sounds

Mono is intentional for UI SFX: it keeps files small and lets the engine handle panning or mixing.
