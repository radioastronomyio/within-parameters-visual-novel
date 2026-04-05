import type { GameState, CommunityRunState } from '../types/index';

// ─── DOM References ───────────────────────────────────────────────────────────

let clockPanel: HTMLElement;
let clockReading: HTMLElement;
let clockFill: HTMLElement;

let knowledgeFill: HTMLElement;
let knowledgeValue: HTMLElement;

let rapportFill: HTMLElement;
let rapportValue: HTMLElement;

let consumablesRow: HTMLElement;

let timelinePanel: HTMLElement;

let totalStops = 6;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initHUD(sidebar: HTMLElement, journeyStops: number): void {
  totalStops = journeyStops;

  sidebar.innerHTML = `
    <div id="clock-panel">
      <div id="clock-label">INTRUSION CLOCK</div>
      <div id="clock-reading">0 / 10</div>
      <div class="stat-bar-track">
        <div id="clock-fill" class="stat-bar-fill clock-fill" style="width:0%"></div>
      </div>
    </div>

    <div class="divider"></div>

    <div id="stat-panel">
      <div class="stat-row">
        <div class="stat-header">
          <span class="stat-name">Knowledge</span>
          <span id="knowledge-value" class="stat-value">0</span>
        </div>
        <div class="stat-bar-track">
          <div id="knowledge-fill" class="stat-bar-fill knowledge-fill" style="width:0%"></div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-header">
          <span class="stat-name">Rapport</span>
          <span id="rapport-value" class="stat-value">0</span>
        </div>
        <div class="rapport-bar-track">
          <div class="rapport-center"></div>
          <div id="rapport-fill" class="rapport-fill" style="left:50%;width:0%;background:var(--accent-green)"></div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-header">
          <span class="stat-name">Resources</span>
          <span id="resources-value" class="stat-value">0</span>
        </div>
        <div id="consumables-row" class="consumables-row"></div>
      </div>
    </div>

    <div class="divider"></div>

    <div id="timeline-panel">
      <div class="sidebar-label">Route</div>
    </div>
  `;

  clockPanel = document.getElementById('clock-panel')!;
  clockReading = document.getElementById('clock-reading')!;
  clockFill = document.getElementById('clock-fill')!;

  knowledgeFill = document.getElementById('knowledge-fill')!;
  knowledgeValue = document.getElementById('knowledge-value')!;

  rapportFill = document.getElementById('rapport-fill')!;
  rapportValue = document.getElementById('rapport-value')!;

  consumablesRow = document.getElementById('consumables-row')!;

  timelinePanel = document.getElementById('timeline-panel')!;

  // Seed the timeline with empty stops
  updateTimeline(0, totalStops, []);
}

// ─── Update Functions ─────────────────────────────────────────────────────────

export function updateStats(state: GameState): void {
  const { stats, clock } = state;

  // Clock
  const clockPct = clock.max > 0 ? (clock.current / clock.max) * 100 : 0;
  clockFill.style.width = `${clockPct}%`;
  clockReading.textContent = `${clock.current} / ${clock.max}`;

  clockFill.classList.remove('warn', 'danger');
  clockReading.classList.remove('warn', 'danger');
  clockPanel.classList.remove('warn', 'danger');

  if (clockPct >= 70) {
    clockFill.classList.add('danger');
    clockReading.classList.add('danger');
    clockPanel.classList.add('danger');
  } else if (clockPct >= 40) {
    clockFill.classList.add('warn');
    clockReading.classList.add('warn');
    clockPanel.classList.add('warn');
  }

  // Knowledge — treat knowledgeGoodEndingThreshold as max for display (hardcoded to 10 for display)
  const knowledgeMax = 10;
  const knowledgePct = Math.min(100, (stats.knowledge / knowledgeMax) * 100);
  knowledgeFill.style.width = `${knowledgePct}%`;
  knowledgeValue.textContent = String(stats.knowledge);

  // Rapport — center origin bar, range roughly -6 to +6
  const rapportMax = 6;
  const rapport = Math.max(-rapportMax, Math.min(rapportMax, stats.rapport));
  rapportValue.textContent = rapport >= 0 ? `+${rapport}` : String(rapport);

  if (rapport >= 0) {
    const pct = (rapport / rapportMax) * 50;
    rapportFill.style.left = '50%';
    rapportFill.style.width = `${pct}%`;
    rapportFill.style.background = 'var(--accent-green)';
  } else {
    const pct = (Math.abs(rapport) / rapportMax) * 50;
    rapportFill.style.left = `${50 - pct}%`;
    rapportFill.style.width = `${pct}%`;
    rapportFill.style.background = 'var(--accent-red)';
  }

  // Consumables — pips
  const consumableMax = 8; // display cap
  consumablesRow.innerHTML = '';
  const shown = Math.min(consumableMax, Math.max(0, stats.consumables));
  for (let i = 0; i < shown; i++) {
    const pip = document.createElement('div');
    pip.className = 'consumable-pip' + (i < stats.consumables ? ' filled' : '');
    consumablesRow.appendChild(pip);
  }
  const resourcesValue = document.getElementById('resources-value');
  if (resourcesValue) resourcesValue.textContent = String(stats.consumables);
}

export function updateTimeline(
  currentStop: number,
  stops: number,
  communities: CommunityRunState[]
): void {
  // Preserve label header
  timelinePanel.innerHTML = '<div class="sidebar-label">Route</div>';

  for (let i = 1; i <= stops; i++) {
    const stop = document.createElement('div');
    stop.className = 'timeline-stop';

    if (i < currentStop) {
      stop.classList.add('visited');
    } else if (i === currentStop) {
      stop.classList.add('current');
    } else {
      stop.classList.add('upcoming');
    }

    const dot = document.createElement('div');
    dot.className = 'timeline-dot';

    const label = document.createElement('div');
    label.className = 'timeline-label';

    const community = communities.find((c) => c.stop === i);
    if (community) {
      label.textContent = community.community.name;
    } else if (i === currentStop) {
      label.textContent = `STOP ${i}`;
    } else {
      label.textContent = `— STOP ${i} —`;
    }

    stop.appendChild(dot);
    stop.appendChild(label);
    timelinePanel.appendChild(stop);
  }
}
