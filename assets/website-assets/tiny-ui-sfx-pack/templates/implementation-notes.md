# Implementation Notes

## Suggested mixer routing

- UI SFX bus: -8 dB to -4 dB.
- Keep hover sounds quieter than confirm/cancel sounds.
- Avoid playing hover sounds faster than every 60 ms.
- Randomize among 2-3 nearby variations for repeated button clicks.

## Basic naming pattern

```text
category_number.wav
```

Examples:

- `click_01.wav`
- `confirm_03.wav`
- `transition_07.wav`
