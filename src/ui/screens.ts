/**
 * Screen overlays — title, save/load modal, ending screen, settings, reward overlay, comms interrupt.
 * All screens are built once in initScreens() and toggled via show/hide pairs.
 * The ending screen generates the epilogue text dynamically from run community states.
 *
 * @module ui/screens
 */

import type { SaveSlot, PersistentData, GameState, CommunityRunState } from '../types/index';

// ─── Screen container refs ─────────────────────────────────────────────────────

let titleScreen: HTMLElement;
let saveLoadScreen: HTMLElement;
let endingScreen: HTMLElement;
let settingsScreen: HTMLElement;
let rewardOverlay: HTMLElement;
let commsOverlay: HTMLElement;

// ─── Init all screen overlays ─────────────────────────────────────────────────

export function initScreens(root: HTMLElement): void {
  const screensHtml = `
    <!-- Title Screen -->
    <div id="title-screen" class="screen-overlay hidden">
      <div class="title-logo">
        <div class="title-main">WITHIN PARAMETERS</div>
        <div class="title-sub">a relay technician's log</div>
      </div>
      <div class="title-menu" id="title-menu"></div>
    </div>

    <!-- Save / Load Screen -->
    <div id="save-load-screen" class="screen-overlay hidden">
      <div class="modal-title" id="save-load-title">LOAD GAME</div>
      <div class="slot-list" id="slot-list"></div>
      <button class="modal-close" id="modal-close-btn">CANCEL</button>
    </div>

    <!-- Ending Screen -->
    <div id="ending-screen" class="screen-overlay hidden">
      <div class="ending-type" id="ending-type-label"></div>
      <div class="ending-title" id="ending-title"></div>
      <div class="ending-epilogue" id="ending-epilogue"></div>
      <div style="display:flex;gap:12px;">
        <button class="ending-btn" id="ending-again-btn">NEW RUN</button>
        <button class="ending-btn" id="ending-title-btn">TITLE</button>
      </div>
    </div>

    <!-- Settings Screen -->
    <div id="settings-screen" class="screen-overlay hidden">
      <div class="settings-title">Settings</div>
      <div id="settings-rows"></div>
      <button class="modal-close" id="settings-close-btn" style="margin-top:24px">CLOSE</button>
    </div>

    <!-- Reward Overlay -->
    <div id="reward-overlay" class="hidden">
      <div class="reward-title">SELECT YOUR REWARD</div>
      <div class="reward-cards" id="reward-cards"></div>
    </div>

    <!-- Comms Overlay -->
    <div id="comms-overlay" class="hidden">
      <div class="comms-header">⚡ INCOMING COMMS</div>
      <div class="comms-text" id="comms-text"></div>
      <div class="comms-dismiss" id="comms-dismiss">[ acknowledge ]</div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = screensHtml;
  while (wrapper.firstChild) {
    root.appendChild(wrapper.firstChild);
  }

  titleScreen = document.getElementById('title-screen')!;
  saveLoadScreen = document.getElementById('save-load-screen')!;
  endingScreen = document.getElementById('ending-screen')!;
  settingsScreen = document.getElementById('settings-screen')!;
  rewardOverlay = document.getElementById('reward-overlay')!;
  commsOverlay = document.getElementById('comms-overlay')!;
}

// ─── Title Screen ─────────────────────────────────────────────────────────────

export function showTitleScreen(
  hasContinue: boolean,
  callbacks: {
    onNewGame: () => void;
    onContinue: () => void;
    onLoad: () => void;
    onSettings: () => void;
  }
): void {
  const menu = document.getElementById('title-menu')!;
  menu.innerHTML = '';

  const buttons: Array<{ label: string; disabled?: boolean; onClick: () => void }> = [
    { label: 'NEW GAME', onClick: callbacks.onNewGame },
    { label: 'CONTINUE', disabled: !hasContinue, onClick: callbacks.onContinue },
    { label: 'LOAD GAME', onClick: callbacks.onLoad },
    { label: 'SETTINGS', onClick: callbacks.onSettings },
  ];

  for (const btn of buttons) {
    const el = document.createElement('button');
    el.className = 'title-btn';
    el.textContent = btn.label;
    if (btn.disabled) el.disabled = true;
    el.addEventListener('click', btn.onClick);
    menu.appendChild(el);
  }

  titleScreen.classList.remove('hidden');
}

export function hideTitleScreen(): void {
  titleScreen.classList.add('hidden');
}

// ─── Save / Load Screen ───────────────────────────────────────────────────────

export function showSaveLoadScreen(
  mode: 'save' | 'load',
  slots: SaveSlot[],
  onSlotSelect: (slotId: number | 'auto') => void,
  onClose: () => void
): void {
  const title = document.getElementById('save-load-title')!;
  title.textContent = mode === 'save' ? 'SAVE GAME' : 'LOAD GAME';

  const slotList = document.getElementById('slot-list')!;
  slotList.innerHTML = '';

  // Autosave slot
  const autoSlot = slots.find((s) => s.id === 'auto');
  appendSlotItem(slotList, 'AUTOSAVE', autoSlot, () => onSlotSelect('auto'));

  // Manual slots 0-4
  for (let i = 0; i < 5; i++) {
    const slot = slots.find((s) => s.id === i);
    appendSlotItem(slotList, `SLOT ${i + 1}`, slot, () => onSlotSelect(i));
  }

  const closeBtn = document.getElementById('modal-close-btn')!;
  closeBtn.onclick = onClose;

  saveLoadScreen.classList.remove('hidden');
}

function appendSlotItem(
  container: HTMLElement,
  label: string,
  slot: SaveSlot | undefined,
  onClick: () => void
): void {
  const item = document.createElement('div');
  item.className = 'slot-item' + (slot ? '' : ' empty');
  item.addEventListener('click', onClick);

  const labelEl = document.createElement('div');
  labelEl.className = 'slot-label';
  labelEl.textContent = label;

  const sceneEl = document.createElement('div');
  sceneEl.className = 'slot-scene';
  sceneEl.textContent = slot ? slot.sceneLabel : '— empty —';

  const timeEl = document.createElement('div');
  timeEl.className = 'slot-time';
  timeEl.textContent = slot ? formatDate(slot.savedAt) : '';

  item.appendChild(labelEl);
  item.appendChild(sceneEl);
  item.appendChild(timeEl);
  container.appendChild(item);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function hideSaveLoadScreen(): void {
  saveLoadScreen.classList.add('hidden');
}

// ─── Ending Screen ────────────────────────────────────────────────────────────

const ENDING_TITLES: Record<string, string> = {
  'clock-failure': 'SALVAGE COMPLETE',
  'destruction': 'SYSTEM OFFLINE',
  'correction': 'PARAMETERS UPDATED',
};

const ENDING_SUBTITLES: Record<string, string> = {
  'clock-failure': 'ENDING I — CLOCK FAILURE',
  'destruction': 'ENDING II — DESTRUCTION',
  'correction': 'ENDING III — CORRECTION',
};

export function showEndingScreen(
  endingType: 'clock-failure' | 'destruction' | 'correction',
  state: GameState,
  callbacks: {
    onNewGame: () => void;
    onTitle: () => void;
  }
): void {
  const typeLabel = document.getElementById('ending-type-label')!;
  const titleEl = document.getElementById('ending-title')!;
  const epilogueEl = document.getElementById('ending-epilogue')!;

  typeLabel.textContent = ENDING_SUBTITLES[endingType] ?? '';
  titleEl.textContent = ENDING_TITLES[endingType] ?? 'THE END';

  epilogueEl.innerHTML = buildEpilogue(endingType, state.communities);

  const againBtn = document.getElementById('ending-again-btn')!;
  const titleBtn = document.getElementById('ending-title-btn')!;

  againBtn.onclick = callbacks.onNewGame;
  titleBtn.onclick = callbacks.onTitle;

  endingScreen.classList.remove('hidden');
}

/** Generates epilogue HTML from the run's community outcome data. Named communities appear as styled spans. Three branches: clock-failure, destruction, correction. */
function buildEpilogue(
  endingType: string,
  communities: CommunityRunState[]
): string {
  const helped = communities.filter((c) => c.state === 'helped');
  const harmed = communities.filter((c) => c.state === 'harmed');
  const ignored = communities.filter((c) => c.state === 'ignored');

  const communitySpan = (name: string) =>
    `<span class="ending-community">${name}</span>`;

  if (endingType === 'clock-failure') {
    const losses = communities.map((c) => communitySpan(c.community.name)).join(', ') || 'the settlements along your route';
    return `<p>The intrusion clock ran out. The archive AI's salvage protocol accelerated beyond containment, stripping infrastructure from ${losses} before any intervention could be mounted. You never made it to the facility.</p><p>The grid went dark in segments. People adapted — they always do. But they would have adapted differently if you'd arrived in time.</p>`;
  }

  if (endingType === 'destruction') {
    let text = `<p>You reached the facility. You found the archive. What you brought with you wasn't enough to correct it — only to destroy it.</p>`;
    if (harmed.length > 0) {
      text += `<p>The route cost you: ${harmed.map((c) => communitySpan(c.community.name)).join(', ')} were worse off for your passing. That sat with you as you made the call.</p>`;
    }
    if (helped.length > 0) {
      text += `<p>${helped.map((c) => communitySpan(c.community.name)).join(' and ')} had reason to remember you differently. It was something.</p>`;
    }
    text += `<p>The archive's micro-reactor was breached. The core failed. No more salvage signal. No more cannibalized relays. The grid stabilized — or will, eventually, in the segments that still had power to stabilize.</p>`;
    return text;
  }

  // Correction
  let text = `<p>You reached the facility with enough documentation to remap the archive's operational scope. The AI accepted the correction — not because it understood, but because the new parameters were valid within its framework. It resumed its original function: preserve and index. It stopped cannibalizing the relay network because the relay network was now within its definition of "infrastructure to protect."</p>`;
  if (helped.length > 0) {
    text += `<p>${helped.map((c) => communitySpan(c.community.name)).join(', ')} — the communities that gave you something along the way — received the first clean relay connections in three years. The archive's grid access was re-scoped to serve the network it had been dismantling.</p>`;
  }
  if (harmed.length > 0) {
    text += `<p>${harmed.map((c) => communitySpan(c.community.name)).join(' and ')} didn't benefit from your choices on the way in. The route matters. You knew that now in a way the briefing hadn't conveyed.</p>`;
  }
  if (ignored.length > 0 && helped.length === 0) {
    text += `<p>The communities along your route got a working relay network. Whether they knew who to thank was less clear.</p>`;
  }
  return text;
}

export function hideEndingScreen(): void {
  endingScreen.classList.add('hidden');
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

export function showSettings(
  persistent: PersistentData,
  callbacks: {
    onToggleMute: (muted: boolean) => void;
    onToggleCutscenes: (setting: 'all' | 'none') => void;
    onClose: () => void;
  }
): void {
  const rows = document.getElementById('settings-rows')!;
  rows.innerHTML = '';

  // Audio mute toggle
  const muteRow = buildToggleRow(
    'AUDIO',
    persistent.audioMuted ? 'MUTED' : 'ON',
    !persistent.audioMuted,
    () => {
      const newMuted = !persistent.audioMuted;
      callbacks.onToggleMute(newMuted);
      showSettings({ ...persistent, audioMuted: newMuted }, callbacks);
    }
  );
  rows.appendChild(muteRow);

  // Cutscene toggle
  const cutscenesRow = buildToggleRow(
    'CUTSCENES',
    persistent.cutscenesSetting === 'all' ? 'ON' : 'OFF',
    persistent.cutscenesSetting === 'all',
    () => {
      const newSetting = persistent.cutscenesSetting === 'all' ? 'none' : 'all';
      callbacks.onToggleCutscenes(newSetting);
      showSettings({ ...persistent, cutscenesSetting: newSetting }, callbacks);
    }
  );
  rows.appendChild(cutscenesRow);

  const closeBtn = document.getElementById('settings-close-btn')!;
  closeBtn.onclick = callbacks.onClose;

  settingsScreen.classList.remove('hidden');
}

function buildToggleRow(label: string, btnText: string, active: boolean, onClick: () => void): HTMLElement {
  const row = document.createElement('div');
  row.className = 'settings-row';

  const labelEl = document.createElement('div');
  labelEl.className = 'settings-label';
  labelEl.textContent = label;

  const btn = document.createElement('button');
  btn.className = 'toggle-btn' + (active ? ' active' : '');
  btn.textContent = btnText;
  btn.addEventListener('click', onClick);

  row.appendChild(labelEl);
  row.appendChild(btn);
  return row;
}

export function hideSettings(): void {
  settingsScreen.classList.add('hidden');
}

// ─── Reward Overlay ───────────────────────────────────────────────────────────

import type { RewardOption } from '../types/index';

/** Presents the three reward cards after each event. Hides automatically when a card is selected. */
export function showRewardOverlay(
  rewards: RewardOption[],
  onSelect: (index: number) => void
): void {
  const cards = document.getElementById('reward-cards')!;
  cards.innerHTML = '';

  const typeLabels: Record<string, string> = {
    'consumable': 'Resource',
    'knowledge': 'Intelligence',
    'clock-reduction': 'Clock Suppression',
  };

  rewards.forEach((reward, i) => {
    const card = document.createElement('div');
    card.className = 'reward-card';

    card.innerHTML = `
      <div class="reward-card-type">${typeLabels[reward.type] ?? reward.type}</div>
      <div class="reward-card-label">${reward.label}</div>
      <div class="reward-card-desc">${reward.description}</div>
    `;

    card.addEventListener('click', () => {
      hideRewardOverlay();
      onSelect(i);
    });

    cards.appendChild(card);
  });

  rewardOverlay.classList.remove('hidden');
}

export function hideRewardOverlay(): void {
  rewardOverlay.classList.add('hidden');
}

// ─── Comms Overlay ────────────────────────────────────────────────────────────

export function showCommsOverlay(text: string, onDismiss: () => void): void {
  const commsText = document.getElementById('comms-text')!;
  commsText.textContent = text;

  const dismissEl = document.getElementById('comms-dismiss')!;
  dismissEl.onclick = () => {
    hideCommsOverlay();
    onDismiss();
  };

  commsOverlay.classList.remove('hidden');
}

export function hideCommsOverlay(): void {
  commsOverlay.classList.add('hidden');
}
