const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");

function writeSvg(file, svg) {
  fs.writeFileSync(path.join(ROOT, file), svg);
}

function svgBuffer(svg) {
  return Buffer.from(svg);
}

async function fitImage(file, width, height, position = "top") {
  return sharp(path.join(ROOT, file))
    .resize(width, height, { fit: "cover", position })
    .png()
    .toBuffer();
}

async function renderComposite(svg, output, composites) {
  writeSvg(output.replace(/\.png$/, ".svg"), svg);
  await sharp(svgBuffer(svg))
    .png()
    .composite(composites)
    .png()
    .toFile(path.join(ROOT, output));
}

async function main() {
  const coverSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="630" height="500" viewBox="0 0 630 500">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#071017"/>
      <stop offset="0.58" stop-color="#0d1d28"/>
      <stop offset="1" stop-color="#102f29"/>
    </linearGradient>
  </defs>
  <rect width="630" height="500" fill="url(#bg)"/>
  <circle cx="550" cy="66" r="130" fill="#48e6b2" opacity=".12"/>
  <text x="38" y="74" font-family="Impact, Arial Black, Arial, sans-serif" font-size="54" fill="#f4f9fb">Tiny Save</text>
  <text x="38" y="126" font-family="Impact, Arial Black, Arial, sans-serif" font-size="54" fill="#48e6b2">/ Settings</text>
  <text x="38" y="177" font-family="Impact, Arial Black, Arial, sans-serif" font-size="50" fill="#f4f9fb">Menu Starter</text>
  <text x="40" y="214" font-family="Arial, sans-serif" font-size="17" font-weight="900" fill="#c6d3dc">HTML + JS / local saves</text>
  <rect x="324" y="70" width="262" height="220" rx="18" fill="#0d1622" stroke="#2a4054"/>
  <rect x="454" y="306" width="112" height="180" rx="16" fill="#0d1622" stroke="#2a4054"/>
  <g>
    <rect x="38" y="258" width="180" height="54" rx="12" fill="#101c28" stroke="#2a4054"/>
    <text x="59" y="292" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#48e6b2">3 save slots</text>
    <rect x="38" y="326" width="180" height="54" rx="12" fill="#101c28" stroke="#2a4054"/>
    <text x="59" y="360" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#ffd45d">settings tabs</text>
    <rect x="38" y="394" width="180" height="54" rx="12" fill="#101c28" stroke="#2a4054"/>
    <text x="59" y="428" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#f4f9fb">keybinds + data</text>
  </g>
</svg>`;

  await renderComposite(coverSvg, "marketing/itch-cover-630x500.png", [
    { input: await fitImage("marketing/preview-desktop.png", 262, 220, "top"), left: 324, top: 70 },
    { input: await fitImage("marketing/preview-mobile.png", 112, 180, "top"), left: 454, top: 306 },
  ]);

  const socialSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#071017"/>
      <stop offset="0.58" stop-color="#0d1d28"/>
      <stop offset="1" stop-color="#102f29"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="78" r="220" fill="#48e6b2" opacity=".12"/>
  <text x="70" y="130" font-family="Impact, Arial Black, Arial, sans-serif" font-size="92" fill="#f4f9fb">Tiny Save</text>
  <text x="70" y="220" font-family="Impact, Arial Black, Arial, sans-serif" font-size="92" fill="#48e6b2">/ Settings</text>
  <text x="70" y="305" font-family="Impact, Arial Black, Arial, sans-serif" font-size="84" fill="#f4f9fb">Menu Starter</text>
  <text x="75" y="360" font-family="Arial, sans-serif" font-size="29" font-weight="900" fill="#c6d3dc">HTML + CSS + JS / localStorage / import-export</text>
  <rect x="655" y="80" width="470" height="360" rx="22" fill="#0d1622" stroke="#2a4054"/>
  <rect x="950" y="250" width="190" height="350" rx="20" fill="#0d1622" stroke="#2a4054"/>
  <rect x="75" y="420" width="245" height="70" rx="14" fill="#101c28" stroke="#2a4054"/>
  <text x="104" y="464" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#48e6b2">3 save slots</text>
  <rect x="350" y="420" width="250" height="70" rx="14" fill="#101c28" stroke="#2a4054"/>
  <text x="382" y="464" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#ffd45d">settings tabs</text>
  <rect x="75" y="512" width="315" height="70" rx="14" fill="#101c28" stroke="#2a4054"/>
  <text x="104" y="556" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#f4f9fb">keybinds + data</text>
</svg>`;
  await renderComposite(socialSvg, "marketing/social-preview-1200x630.png", [
    { input: await fitImage("marketing/preview-desktop.png", 470, 360, "top"), left: 655, top: 80 },
    { input: await fitImage("marketing/preview-mobile.png", 190, 350, "top"), left: 950, top: 250 },
  ]);

  const contactSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1100" viewBox="0 0 1400 1100">
  <rect width="1400" height="1100" fill="#071017"/>
  <rect x="28" y="28" width="1344" height="1044" rx="28" fill="#0d1622" stroke="#2a4054"/>
  <text x="60" y="92" font-family="Impact, Arial Black, Arial, sans-serif" font-size="58" fill="#f4f9fb">Tiny Save / Settings Menu Starter</text>
  <text x="63" y="130" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#48e6b2">Working menu demo / save slots / settings / keybinds / import-export / no framework</text>
  <rect x="60" y="166" width="820" height="560" rx="18" fill="#071017" stroke="#2a4054"/>
  <rect x="930" y="166" width="250" height="590" rx="18" fill="#071017" stroke="#2a4054"/>
  <text x="60" y="812" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffd45d">Included files</text>
  <text x="60" y="854" font-family="Arial, sans-serif" font-size="24" fill="#dbe5ec">index.html, styles.css, app.js, reusable starter source, docs, templates, license, marketing art</text>
  <text x="60" y="918" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffd45d">Best for</text>
  <text x="60" y="960" font-family="Arial, sans-serif" font-size="24" fill="#dbe5ec">Game jams, browser games, idle games, RPG prototypes, roguelikes, and tiny tools</text>
</svg>`;
  await renderComposite(contactSvg, "marketing/contact-sheet.png", [
    { input: await fitImage("marketing/preview-desktop.png", 820, 560, "top"), left: 60, top: 166 },
    { input: await fitImage("marketing/preview-mobile.png", 250, 590, "top"), left: 930, top: 166 },
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
