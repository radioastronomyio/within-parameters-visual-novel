const starter = window.TinySaveSettingsStarter;
let state = starter.load();
let listeningFor = null;

const appShell = document.querySelector(".app-shell");
const tabs = [...document.querySelectorAll(".tab-button")];
const panels = [...document.querySelectorAll(".tab-panel")];
const saveGrid = document.querySelector("#save-grid");
const controlsGrid = document.querySelector("#controls-grid");
const screenKicker = document.querySelector("#screen-kicker");
const screenTitle = document.querySelector("#screen-title");
const activeTitle = document.querySelector("#active-title");
const activeMeta = document.querySelector("#active-meta");
const toast = document.querySelector("#toast");
const exportBox = document.querySelector("#export-box");
const importBox = document.querySelector("#import-box");

const tabTitles = {
  saves: ["Save Slots", "Manage Progress"],
  settings: ["Settings", "Tune The Game"],
  controls: ["Controls", "Rebind Keys"],
  data: ["Data", "Backup & Restore"],
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function persist() {
  starter.save(state);
}

function setTheme() {
  appShell.dataset.theme = state.settings.theme;
}

function renderSnapshot() {
  const slot = state.slots[state.activeSlot];
  activeTitle.textContent = slot?.title || "No Save Loaded";
  activeMeta.textContent = slot?.empty
    ? "Active slot is empty."
    : `${slot.chapter} / Level ${slot.level} / ${slot.playTime}`;
}

function renderSaves() {
  saveGrid.innerHTML = state.slots
    .map((slot, index) => `
      <article class="save-card ${index === state.activeSlot ? "active" : ""}" style="--slot-a:${slot.colors[0]}; --slot-b:${slot.colors[1]};">
        <div class="slot-art" aria-hidden="true"></div>
        <div>
          <h3>${slot.title}</h3>
          <div class="save-meta">
            <span>${slot.chapter}</span>
            <span>Level ${slot.level}</span>
            <span>${slot.difficulty}</span>
            <span>${slot.playTime}</span>
            <span>${slot.coins} coins</span>
            <span>${slot.updatedAt}</span>
          </div>
        </div>
        <div class="slot-actions">
          <button class="secondary-button" data-load="${index}" type="button">Load</button>
          <button class="secondary-button" data-save="${index}" type="button">Save</button>
          <button class="danger-button" data-delete="${index}" type="button">Delete</button>
        </div>
      </article>
    `)
    .join("");
}

function renderSettings() {
  for (const input of document.querySelectorAll("[data-setting]")) {
    const key = input.dataset.setting;
    const value = state.settings[key];
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value;
  }
}

function renderControls() {
  controlsGrid.innerHTML = Object.entries(starter.controlLabels)
    .map(([key, label]) => `
      <div class="bind-row">
        <span>${label}</span>
        <button class="secondary-button ${listeningFor === key ? "listening" : ""}" data-bind="${key}" type="button">
          ${listeningFor === key ? "Press key" : state.controls[key]}
        </button>
      </div>
    `)
    .join("");
}

function renderAll() {
  setTheme();
  renderSnapshot();
  renderSaves();
  renderSettings();
  renderControls();
}

function setTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tabName}`));
  screenKicker.textContent = tabTitles[tabName][0];
  screenTitle.textContent = tabTitles[tabName][1];
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
});

saveGrid.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  const loadIndex = target.dataset.load;
  const saveIndex = target.dataset.save;
  const deleteIndex = target.dataset.delete;

  if (loadIndex !== undefined) {
    state.activeSlot = Number(loadIndex);
    persist();
    showToast("Slot loaded.");
  }

  if (saveIndex !== undefined) {
    state.activeSlot = Number(saveIndex);
    starter.quickSave(state);
    showToast("Slot saved.");
  }

  if (deleteIndex !== undefined) {
    starter.deleteSlot(state, Number(deleteIndex));
    showToast("Slot deleted.");
  }

  renderAll();
});

document.querySelector("#quick-save").addEventListener("click", () => {
  starter.quickSave(state);
  renderAll();
  showToast("Active slot saved.");
});

document.querySelector("#new-run").addEventListener("click", () => {
  starter.freshRun(state);
  renderAll();
  showToast("New run created.");
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  state = starter.reset();
  renderAll();
  showToast("Demo restored.");
});

document.querySelectorAll("[data-setting]").forEach((input) => {
  input.addEventListener("input", () => {
    const key = input.dataset.setting;
    state.settings[key] = input.type === "checkbox" ? input.checked : input.type === "range" ? Number(input.value) : input.value;
    persist();
    setTheme();
  });
});

controlsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bind]");
  if (!button) return;
  listeningFor = button.dataset.bind;
  renderControls();
});

window.addEventListener("keydown", (event) => {
  if (!listeningFor) return;
  event.preventDefault();
  state.controls[listeningFor] = event.key === " " ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;
  listeningFor = null;
  persist();
  renderControls();
  showToast("Keybind updated.");
});

document.querySelector("#export-data").addEventListener("click", async () => {
  const data = starter.exportData(state);
  exportBox.value = data;
  try {
    await navigator.clipboard.writeText(data);
    showToast("Data exported and copied.");
  } catch {
    showToast("Data exported.");
  }
});

document.querySelector("#import-data").addEventListener("click", () => {
  try {
    state = starter.importData(importBox.value);
    renderAll();
    showToast("Data imported.");
  } catch {
    showToast("Import failed. Check the JSON.");
  }
});

document.querySelector("#wipe-data").addEventListener("click", () => {
  state = starter.reset();
  exportBox.value = "";
  importBox.value = "";
  renderAll();
  showToast("Local data wiped.");
});

renderAll();
