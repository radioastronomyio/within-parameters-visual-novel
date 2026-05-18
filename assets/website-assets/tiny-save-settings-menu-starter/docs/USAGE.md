# Usage Notes

## Files To Edit

- `src/save-settings-starter.js`: storage key, default save data, settings defaults, export/import functions.
- `app.js`: UI rendering and button wiring.
- `styles.css`: colors, layout, responsive rules, button styling.

## Save Slots

The demo uses three sample save slots. Replace the sample slot objects with your own game state:

```js
{
  id: "slot-1",
  title: "Forest Outskirts",
  chapter: "Chapter 1",
  level: 7,
  playTime: "02:41:33",
  coins: 184
}
```

## Settings

Settings are stored in `state.settings` and persisted automatically.

Use these values to drive your game audio, display, difficulty, and accessibility systems.

## Keybinds

Controls are stored in `state.controls`. The starter records keyboard keys only. For controller mapping, keep the same UI but replace the key capture logic with your input library.

## Export / Import

The export format wraps the current state in:

```json
{
  "version": 1,
  "exportedAt": "date",
  "state": {}
}
```

You can add migration logic based on the `version` field later.
