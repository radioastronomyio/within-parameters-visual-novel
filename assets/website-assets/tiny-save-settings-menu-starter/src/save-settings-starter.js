(function () {
  const STORAGE_KEY = "tiny-save-settings-menu-starter:v1";

  const defaultState = {
    activeSlot: 0,
    runCounter: 3,
    settings: {
      master: 80,
      music: 62,
      sfx: 86,
      resolution: "1280 x 720",
      fullscreen: false,
      vsync: true,
      pixelPerfect: true,
      screenShake: true,
      tutorials: true,
      difficulty: "Normal",
      reducedMotion: false,
      textSpeed: 7,
      theme: "teal",
    },
    controls: {
      moveUp: "W",
      moveLeft: "A",
      moveDown: "S",
      moveRight: "D",
      jump: "Space",
      attack: "J",
      interact: "E",
      pause: "Escape",
    },
    slots: [
      {
        id: "slot-1",
        title: "Forest Outskirts",
        chapter: "Chapter 1",
        level: 7,
        difficulty: "Normal",
        playTime: "02:41:33",
        coins: 184,
        updatedAt: "Today 14:32",
        colors: ["#73d7b5", "#244b43"],
      },
      {
        id: "slot-2",
        title: "Crystal Caverns",
        chapter: "Chapter 2",
        level: 12,
        difficulty: "Hard",
        playTime: "06:18:54",
        coins: 412,
        updatedAt: "May 24 19:07",
        colors: ["#6fa3ff", "#182a56"],
      },
      {
        id: "slot-3",
        title: "Sunken Ruins",
        chapter: "Chapter 1",
        level: 3,
        difficulty: "Easy",
        playTime: "01:15:20",
        coins: 73,
        updatedAt: "May 21 09:11",
        colors: ["#be7194", "#30213f"],
      },
    ],
  };

  const controlLabels = {
    moveUp: "Move Up",
    moveLeft: "Move Left",
    moveDown: "Move Down",
    moveRight: "Move Right",
    jump: "Jump",
    attack: "Attack",
    interact: "Interact",
    pause: "Pause Menu",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDefaults(input) {
    const fallback = clone(defaultState);
    if (!input || typeof input !== "object") return fallback;
    return {
      ...fallback,
      ...input,
      settings: { ...fallback.settings, ...(input.settings || {}) },
      controls: { ...fallback.controls, ...(input.controls || {}) },
      slots: Array.isArray(input.slots) ? input.slots.slice(0, 3) : fallback.slots,
    };
  }

  function load() {
    try {
      return mergeDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return clone(defaultState);
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function freshRun(state) {
    const next = (state.runCounter || 0) + 1;
    state.runCounter = next;
    state.slots[state.activeSlot] = {
      id: `slot-${state.activeSlot + 1}`,
      title: `New Run ${next}`,
      chapter: "Prologue",
      level: 1,
      difficulty: state.settings.difficulty,
      playTime: "00:00:04",
      coins: 0,
      updatedAt: "Just now",
      colors: ["#48e6b2", "#132a33"],
    };
    save(state);
    return state;
  }

  function quickSave(state) {
    const slot = state.slots[state.activeSlot];
    slot.level += 1;
    slot.coins += 12 + state.activeSlot * 3;
    slot.playTime = bumpTime(slot.playTime);
    slot.updatedAt = "Just now";
    save(state);
    return state;
  }

  function deleteSlot(state, index) {
    state.slots[index] = {
      id: `slot-${index + 1}`,
      title: "Empty Slot",
      chapter: "No data",
      level: 0,
      difficulty: "-",
      playTime: "00:00:00",
      coins: 0,
      updatedAt: "Empty",
      colors: ["#2c3a45", "#101821"],
      empty: true,
    };
    if (state.activeSlot === index) state.activeSlot = 0;
    save(state);
    return state;
  }

  function bumpTime(time) {
    const [h, m, s] = time.split(":").map(Number);
    const total = h * 3600 + m * 60 + s + 137;
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function reset() {
    const state = clone(defaultState);
    save(state);
    return state;
  }

  function exportData(state) {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2);
  }

  function importData(text) {
    const parsed = JSON.parse(text);
    const state = mergeDefaults(parsed.state || parsed);
    save(state);
    return state;
  }

  window.TinySaveSettingsStarter = {
    STORAGE_KEY,
    controlLabels,
    defaultState,
    load,
    save,
    reset,
    quickSave,
    freshRun,
    deleteSlot,
    exportData,
    importData,
  };
})();
