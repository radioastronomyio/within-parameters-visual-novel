const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BIT_DEPTH = 16;

const DIRS = {
  audio: path.join(ROOT, "exports", "audio", "wav"),
  waveform: path.join(ROOT, "exports", "waveforms"),
  data: path.join(ROOT, "data"),
  source: path.join(ROOT, "source"),
  marketing: path.join(ROOT, "marketing"),
};

const CATEGORY_META = {
  clicks: { name: "Clicks", color: "#7cf5b2", use: "Buttons, list selections, small menu actions" },
  hovers: { name: "Hovers", color: "#4bd9ee", use: "Cursor movement, focus changes, soft rollover feedback" },
  confirms: { name: "Confirms", color: "#ffe066", use: "Accept, collect, unlock, save, purchase confirmation" },
  cancels: { name: "Cancels", color: "#ff746f", use: "Back, close, dismiss, blocked action" },
  alerts: { name: "Alerts", color: "#ff8a64", use: "Warnings, notice chips, status pings" },
  toggles: { name: "Toggles", color: "#9aa4ae", use: "Switches, tabs, radio controls, settings" },
  transitions: { name: "Transitions", color: "#b8c0c8", use: "Panel movement, modal open, page change" },
  errors: { name: "Errors", color: "#ff5d7d", use: "Invalid input, denied action, depleted resources" },
};

const SOUNDS = [
  ...range(8).map((i) => click(i)),
  ...range(8).map((i) => hover(i)),
  ...range(8).map((i) => confirm(i)),
  ...range(8).map((i) => cancel(i)),
  ...range(8).map((i) => alert(i)),
  ...range(8).map((i) => toggle(i)),
  ...range(8).map((i) => transition(i)),
  ...range(8).map((i) => errorTone(i)),
];

function range(length) {
  return Array.from({ length }, (_, index) => index + 1);
}

function click(i) {
  return {
    id: `click_${String(i).padStart(2, "0")}`,
    title: `Click ${i}`,
    category: "clicks",
    duration: 0.085 + i * 0.006,
    recipe: "snap",
    freq: 1200 + i * 92,
    freq2: 980 + i * 78,
    noise: 0.18,
    tone: 0.72,
    volume: 0.72,
    seed: 1100 + i,
  };
}

function hover(i) {
  return {
    id: `hover_${String(i).padStart(2, "0")}`,
    title: `Hover ${i}`,
    category: "hovers",
    duration: 0.12 + i * 0.008,
    recipe: "soft",
    freq: 540 + i * 38,
    freq2: 640 + i * 46,
    noise: 0.05,
    tone: 0.48,
    volume: 0.45,
    seed: 2100 + i,
  };
}

function confirm(i) {
  return {
    id: `confirm_${String(i).padStart(2, "0")}`,
    title: `Confirm ${i}`,
    category: "confirms",
    duration: 0.19 + i * 0.012,
    recipe: "rising",
    freq: 520 + i * 28,
    freq2: 820 + i * 42,
    interval: i % 2 === 0 ? 1.5 : 1.25,
    noise: 0.04,
    tone: 0.72,
    volume: 0.58,
    seed: 3100 + i,
  };
}

function cancel(i) {
  return {
    id: `cancel_${String(i).padStart(2, "0")}`,
    title: `Cancel ${i}`,
    category: "cancels",
    duration: 0.16 + i * 0.01,
    recipe: "falling",
    freq: 760 + i * 36,
    freq2: 360 + i * 18,
    noise: 0.08,
    tone: 0.62,
    volume: 0.56,
    seed: 4100 + i,
  };
}

function alert(i) {
  return {
    id: `alert_${String(i).padStart(2, "0")}`,
    title: `Alert ${i}`,
    category: "alerts",
    duration: 0.26 + i * 0.016,
    recipe: "pulse",
    freq: 620 + i * 31,
    freq2: 1240 + i * 62,
    pulses: 2 + (i % 3),
    noise: 0.07,
    tone: 0.64,
    volume: 0.62,
    seed: 5100 + i,
  };
}

function toggle(i) {
  return {
    id: `toggle_${String(i).padStart(2, "0")}`,
    title: `Toggle ${i}`,
    category: "toggles",
    duration: 0.13 + i * 0.009,
    recipe: i % 2 === 0 ? "rising" : "falling",
    freq: 430 + i * 33,
    freq2: i % 2 === 0 ? 650 + i * 42 : 300 + i * 24,
    noise: 0.06,
    tone: 0.6,
    volume: 0.48,
    seed: 6100 + i,
  };
}

function transition(i) {
  return {
    id: `transition_${String(i).padStart(2, "0")}`,
    title: `Transition ${i}`,
    category: "transitions",
    duration: 0.32 + i * 0.025,
    recipe: i % 2 === 0 ? "sweep-up" : "sweep-down",
    freq: 210 + i * 24,
    freq2: i % 2 === 0 ? 1250 + i * 80 : 130 + i * 14,
    noise: 0.18,
    tone: 0.46,
    volume: 0.5,
    seed: 7100 + i,
  };
}

function errorTone(i) {
  return {
    id: `error_${String(i).padStart(2, "0")}`,
    title: `Error ${i}`,
    category: "errors",
    duration: 0.2 + i * 0.012,
    recipe: "error",
    freq: 260 + i * 18,
    freq2: 180 + i * 11,
    noise: 0.12,
    tone: 0.72,
    volume: 0.62,
    seed: 8100 + i,
  };
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, "utf8");
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function synth(sound) {
  const length = Math.max(1, Math.floor(SAMPLE_RATE * sound.duration));
  const data = new Float32Array(length);
  const random = seededRandom(sound.seed);
  let phase = 0;
  let phase2 = 0;
  let prevNoise = 0;

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const p = i / (length - 1);
    const attack = Math.min(1, p / 0.055);
    const release = Math.pow(1 - p, sound.recipe.includes("sweep") ? 1.65 : 2.8);
    const env = Math.sin(Math.PI * Math.min(1, p)) * release * attack;
    let freq = interp(sound.freq, sound.freq2, curveFor(sound.recipe, p));
    let amp = env;

    if (sound.recipe === "pulse") {
      const gate = Math.sin(Math.PI * sound.pulses * p);
      amp *= Math.max(0, gate);
      freq = p < 0.5 ? sound.freq : sound.freq2;
    } else if (sound.recipe === "error") {
      freq = p < 0.38 ? sound.freq : p < 0.66 ? sound.freq * 0.83 : sound.freq2;
      amp *= 0.82 + Math.sin(2 * Math.PI * 36 * t) * 0.18;
    } else if (sound.recipe === "snap") {
      amp = Math.exp(-p * 11) * attack;
      freq = interp(sound.freq, sound.freq2, p);
    }

    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    phase2 += (2 * Math.PI * freq * (sound.interval || 2)) / SAMPLE_RATE;
    const sine = Math.sin(phase);
    const tri = 2 * Math.asin(Math.sin(phase2)) / Math.PI;
    const square = Math.sign(Math.sin(phase)) * 0.32;
    const noiseRaw = random() * 2 - 1;
    prevNoise = prevNoise * 0.62 + noiseRaw * 0.38;
    const noise = prevNoise * sound.noise;
    let sample = (sine * sound.tone + tri * (0.32 - sound.tone * 0.16) + square * 0.08 + noise) * amp * sound.volume;
    sample += transient(p, sound.recipe) * (random() * 2 - 1) * sound.noise * 0.65;
    data[i] = softClip(sample);
  }

  normalize(data, 0.82);
  return data;
}

function curveFor(recipe, p) {
  if (recipe === "rising" || recipe === "sweep-up") return Math.pow(p, 0.72);
  if (recipe === "falling" || recipe === "sweep-down") return Math.pow(p, 1.35);
  if (recipe === "soft") return smoothstep(p);
  return p;
}

function interp(a, b, p) {
  return a + (b - a) * p;
}

function smoothstep(x) {
  return x * x * (3 - 2 * x);
}

function transient(p, recipe) {
  if (p > 0.09) return 0;
  const amount = Math.exp(-p * (recipe === "snap" ? 75 : 45));
  return amount;
}

function softClip(value) {
  return Math.tanh(value * 1.22) / Math.tanh(1.22);
}

function normalize(data, targetPeak) {
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  if (peak <= 0) return;
  const gain = targetPeak / peak;
  for (let i = 0; i < data.length; i += 1) data[i] *= gain;
}

function wavBuffer(samples) {
  const dataSize = samples.length * CHANNELS * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  header.writeUInt16LE(CHANNELS * 2, 32);
  header.writeUInt16LE(BIT_DEPTH, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const body = Buffer.alloc(dataSize);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    body.writeInt16LE(Math.round(sample * 32767), i * 2);
  }
  return Buffer.concat([header, body]);
}

function waveformSvg(sound, samples, width = 640, height = 180) {
  const meta = CATEGORY_META[sound.category];
  const bins = 160;
  const mid = height / 2;
  const step = Math.floor(samples.length / bins);
  const bars = [];
  for (let i = 0; i < bins; i += 1) {
    let peak = 0;
    const start = i * step;
    const end = Math.min(samples.length, start + step);
    for (let j = start; j < end; j += 1) peak = Math.max(peak, Math.abs(samples[j]));
    const x = 28 + i * ((width - 56) / bins);
    const h = Math.max(2, peak * (height - 68));
    bars.push(`<rect x="${x.toFixed(2)}" y="${(mid - h / 2).toFixed(2)}" width="2.3" height="${h.toFixed(2)}" rx="1.1" fill="${meta.color}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(sound.title)} waveform">
  <rect width="${width}" height="${height}" rx="18" fill="#10171d"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="#2d3943" stroke-width="2"/>
  <text x="28" y="38" fill="#f6fbff" font-family="Inter, Arial, sans-serif" font-weight="850" font-size="24">${escapeXml(sound.title)}</text>
  <text x="${width - 28}" y="38" fill="${meta.color}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="16">${Math.round(sound.duration * 1000)} ms</text>
  <g opacity="0.96">${bars.join("")}</g>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function makeCover(records) {
  const width = 630;
  const height = 500;
  const cards = records.slice(0, 24).map((record, index) => {
    const meta = CATEGORY_META[record.category];
    const x = 38 + (index % 6) * 92;
    const y = 260 + Math.floor(index / 6) * 54;
    const bars = Array.from({ length: 15 }, (_, i) => {
      const h = 8 + Math.abs(Math.sin((i + 1) * (index + 2))) * 24;
      return `<rect x="${x + 12 + i * 4.2}" y="${y + 26 - h / 2}" width="2.2" height="${h}" rx="1" fill="${meta.color}"/>`;
    }).join("");
    return `<rect x="${x}" y="${y}" width="78" height="38" rx="8" fill="#111820" stroke="#2d3943"/>
    ${bars}`;
  }).join("");
  const categoryDots = Object.keys(CATEGORY_META).map((key, index) => {
    const meta = CATEGORY_META[key];
    return `<circle cx="${46 + index * 28}" cy="222" r="7" fill="${meta.color}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <radialGradient id="bg" cx="72%" cy="8%" r="80%">
        <stop offset="0" stop-color="#17343b"/>
        <stop offset="0.55" stop-color="#10161b"/>
        <stop offset="1" stop-color="#080c0f"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="18" fill="none" stroke="#2d3943" stroke-width="2"/>
    <text x="42" y="88" fill="#f8fbff" font-family="Inter, Arial, sans-serif" font-weight="950" font-size="62">Tiny UI</text>
    <text x="42" y="154" fill="#88f2bf" font-family="Inter, Arial, sans-serif" font-weight="950" font-size="56">SFX Pack</text>
    <text x="44" y="198" fill="#c2ccd5" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="21">64 synthetic WAV sounds for game menus</text>
    ${categoryDots}
    <rect x="402" y="58" width="158" height="118" rx="14" fill="#111820" stroke="#2d3943" stroke-width="2"/>
    <text x="424" y="94" fill="#88f2bf" font-family="Inter, Arial, sans-serif" font-weight="900" font-size="34">64</text>
    <text x="482" y="94" fill="#f8fbff" font-family="Inter, Arial, sans-serif" font-weight="850" font-size="23">WAV</text>
    <text x="424" y="129" fill="#c2ccd5" font-family="Inter, Arial, sans-serif" font-weight="750" font-size="15">Clicks and hovers</text>
    <text x="424" y="153" fill="#c2ccd5" font-family="Inter, Arial, sans-serif" font-weight="750" font-size="15">Alerts and transitions</text>
    ${cards}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(DIRS.marketing, "itch-cover-630x500.png"));
  await sharp(Buffer.from(svg.replace(`width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`, `width="1200" height="630" viewBox="0 0 ${width} ${height}"`))).resize(1200, 630, { fit: "cover" }).png().toFile(path.join(DIRS.marketing, "social-preview-1200x630.png"));
}

async function makeContactSheet(records) {
  const cols = 4;
  const cellW = 310;
  const cellH = 132;
  const top = 190;
  const rows = Math.ceil(records.length / cols);
  const width = cols * cellW + 64;
  const height = top + rows * cellH + 60;
  const header = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#0b1013"/>
    <radialGradient id="g" cx="50%" cy="0%" r="82%"><stop stop-color="#17343b"/><stop offset="0.62" stop-color="#0b1013"/></radialGradient>
    <rect width="${width}" height="170" fill="url(#g)"/>
    <text x="38" y="70" fill="#f8fbff" font-family="Inter, Arial, sans-serif" font-weight="950" font-size="48">Tiny UI SFX Pack</text>
    <text x="40" y="112" fill="#88f2bf" font-family="Inter, Arial, sans-serif" font-weight="850" font-size="27">64 WAV sounds / 8 categories / synthetic source</text>
    <text x="40" y="148" fill="#aab5bf" font-family="Inter, Arial, sans-serif" font-weight="750" font-size="20">Short game-ready clicks, hovers, confirms, cancels, alerts, toggles, transitions, and errors.</text>
  </svg>`);
  const composites = [{ input: header, left: 0, top: 0 }];
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const x = 32 + (i % cols) * cellW;
    const y = top + Math.floor(i / cols) * cellH;
    composites.push({
      input: path.join(DIRS.waveform, `${record.id}.svg`),
      left: x,
      top: y,
    });
  }
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#0b1013",
    },
  }).composite(composites).png().toFile(path.join(DIRS.marketing, "contact-sheet.png"));
}

async function build() {
  Object.values(DIRS).forEach((dir) => {
    if (dir !== DIRS.marketing) resetDir(dir);
    else ensureDir(dir);
  });

  const records = [];
  const recipes = [];

  for (const sound of SOUNDS) {
    const samples = synth(sound);
    const wavPath = path.join(DIRS.audio, `${sound.id}.wav`);
    const waveform = waveformSvg(sound, samples);
    const waveformPath = path.join(DIRS.waveform, `${sound.id}.svg`);
    fs.writeFileSync(wavPath, wavBuffer(samples));
    writeText(waveformPath, `${waveform}\n`);
    const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    records.push({
      id: sound.id,
      title: sound.title,
      category: sound.category,
      categoryName: CATEGORY_META[sound.category].name,
      color: CATEGORY_META[sound.category].color,
      recommendedUse: CATEGORY_META[sound.category].use,
      durationMs: Math.round(sound.duration * 1000),
      sampleRate: SAMPLE_RATE,
      channels: CHANNELS,
      bitDepth: BIT_DEPTH,
      peak: Number(peak.toFixed(4)),
      rms: Number(rms.toFixed(4)),
      file: path.relative(ROOT, wavPath).replace(/\\/g, "/"),
      waveform: path.relative(ROOT, waveformPath).replace(/\\/g, "/"),
    });
    recipes.push(sound);
  }

  const index = {
    product: "Tiny UI SFX Pack",
    version: "1.0.0",
    disclosure: "All sounds are synthetic and procedurally generated from source recipes. No third-party samples were used.",
    stats: {
      wav: records.length,
      categories: Object.keys(CATEGORY_META).length,
      sampleRate: SAMPLE_RATE,
      channels: CHANNELS,
      bitDepth: BIT_DEPTH,
    },
    categories: Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta })),
    sounds: records,
  };

  writeText(path.join(DIRS.data, "sfx-index.json"), `${JSON.stringify(index, null, 2)}\n`);
  writeText(path.join(DIRS.data, "sfx-index.js"), `window.SFX_PACK_INDEX = ${JSON.stringify(index, null, 2)};\n`);
  writeText(path.join(DIRS.source, "sfx-recipes.json"), `${JSON.stringify(recipes, null, 2)}\n`);
  await makeCover(records);
  await makeContactSheet(records);
  console.log(`Built ${records.length} WAV sounds, ${records.length} waveform SVGs.`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
