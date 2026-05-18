# Unity Notes

This starter is web-first, but the menu structure can be rebuilt in Unity UI Toolkit or uGUI.

Suggested mapping:

- `state.slots` -> JSON files in `Application.persistentDataPath`
- `state.settings` -> `PlayerPrefs` or a settings JSON file
- `state.controls` -> Input System action rebinding
- export/import -> JSON backup text

Keep the same tab structure: Save Slots, Settings, Controls, Data.
