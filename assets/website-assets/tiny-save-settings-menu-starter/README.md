# Tiny Save / Settings Menu Starter

A small HTML/CSS/JS starter for web games that need save slots, persistent settings, keybinds, and data import/export.

## Included

- Working `index.html` demo
- 3 save slots with load, save, delete, quick save, and new run actions
- Persistent localStorage settings
- Audio, display, gameplay, accessibility, and theme controls
- Rebindable keyboard controls
- JSON export/import data tools
- Responsive layout for desktop and mobile
- Source files with no framework and no build step
- Docs, engine notes, itch page copy, and marketing images

## Quick Start

Open `index.html` in a browser.

The reusable logic lives in `src/save-settings-starter.js`. The UI wiring lives in `app.js`.

## Storage

The starter uses this localStorage key:

`tiny-save-settings-menu-starter:v1`

Change `STORAGE_KEY` in `src/save-settings-starter.js` before shipping your own game.

## Suggested Itch Price

Launch at `$2.99`. It is a focused utility starter, so buyers should feel like it saves them an evening of menu work.
