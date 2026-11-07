const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

const THEMES = {
  dusk: { bg: ["#17101c", "#21142a", "#2a1832"], glow: "#f4b3dc", deep: "#8a2f78" },
  ember: { bg: ["#070607", "#0d0b0d", "#140d10"], glow: "#ff5a66", deep: "#6a0b18" },
  pine: { bg: ["#0f1c1d", "#142728", "#1b2e2f"], glow: "#b4ecd9", deep: "#2b6a5e" },
  nebula: { bg: ["#100e22", "#0c0b1a", "#1e1b3c"], glow: "#f3f0ff", deep: "#5c54d6" },
  blossom: { bg: ["#fff8fb", "#fff0f6", "#fde6f0"], glow: "#d6527c", deep: "#f3c3d4" },
};

const HEART = "M0 9 C-3 5 -10 3 -10 -3 C-10 -8 -3 -9 0 -4 C3 -9 10 -8 10 -3 C10 3 3 5 0 9 Z";

function logo(color) {
  const ring = (cx) =>
    `<circle cx="${cx}" cy="0" r="92" fill="none" stroke="${color}" stroke-width="16"/>`;
  return `
    ${ring(-58)}
    ${ring(58)}
    <g clip-path="url(#link)">${ring(-58)}</g>
    <path d="${HEART}" transform="scale(2.5)" fill="${color}"/>`;
}

const defs = (theme, width, height) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      ${theme.bg.map((color, index) => `<stop offset="${index / (theme.bg.length - 1)}" stop-color="${color}"/>`).join("")}
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0" stop-color="${theme.deep}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${theme.deep}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
    <clipPath id="link"><rect x="-10" y="-120" width="120" height="120"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>`;

function glowingLogo(theme, x, y, scale) {
  return `
    <ellipse cx="${x}" cy="${y}" rx="${300 * scale}" ry="${270 * scale}" fill="url(#halo)"/>
    <g transform="translate(${x} ${y}) scale(${scale})">
      <g filter="url(#soft)" opacity="0.7">${logo(theme.glow)}</g>
      ${logo(theme.glow)}
    </g>`;
}

const sparkle = (x, y, size, color, opacity) =>
  `<path transform="translate(${x} ${y}) scale(${size})" fill="${color}" opacity="${opacity}"
    d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z"/>`;

function sparkles(theme, width, height, count, clearRadius) {
  const marks = [];
  for (let index = 0; index < count; index += 1) {
    const x = ((index * 0.7548777 + 0.13) % 1) * width;
    const y = ((index * 0.5698403 + 0.29) % 1) * height;
    if (Math.hypot(x - width / 2, y - height / 2) < clearRadius) continue;
    marks.push(
      sparkle(
        x.toFixed(1),
        y.toFixed(1),
        0.5 + (index % 4) * 0.45,
        theme.glow,
        0.35 + (index % 3) * 0.2,
      ),
    );
  }
  return marks.join("");
}

function launchSvg(theme, width, height) {
  const scale = Math.min(width, height) / 620;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${defs(theme, width, height)}
    ${sparkles(theme, width, height, 34, 300 * scale)}
    ${glowingLogo(theme, width / 2, height / 2, scale)}
  </svg>`;
}

function iconSvg(theme, size, logoShare) {
  const scale = (size * logoShare) / 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    ${defs(theme, size, size)}
    ${glowingLogo(theme, size / 2, size / 2, scale)}
  </svg>`;
}

const SAMPLES = {
  "keepsake-one": `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b2a63"/><stop offset="0.55" stop-color="#d9607e"/><stop offset="1" stop-color="#fbbf77"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#sky)"/>
    <circle cx="430" cy="300" r="62" fill="#ffe2a8"/>
    <path d="M0 360 C120 300 230 350 340 330 C450 310 540 350 640 320 V480 H0 Z" fill="#4a2f5e"/>
    <path d="M0 420 C140 380 300 430 420 400 C520 380 590 410 640 396 V480 H0 Z" fill="#2c1c3f"/>
  </svg>`,
  "keepsake-two": `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9fd8e6"/><stop offset="0.6" stop-color="#e8f4ef"/>
      </linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3f9db5"/><stop offset="1" stop-color="#17506b"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#sky)"/>
    <rect y="270" width="640" height="210" fill="url(#sea)"/>
    <path d="M0 330 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#bfe6ea" stroke-width="4" opacity="0.6"/>
    <path d="M0 400 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#bfe6ea" stroke-width="4" opacity="0.4"/>
  </svg>`,
  cover: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f7a8c4"/><stop offset="1" stop-color="#6a4fb3"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <circle cx="200" cy="200" r="130" fill="#1b1424"/>
    <circle cx="200" cy="200" r="96" fill="none" stroke="#3a2d4a" stroke-width="3"/>
    <circle cx="200" cy="200" r="66" fill="none" stroke="#3a2d4a" stroke-width="3"/>
    <circle cx="200" cy="200" r="38" fill="#f7a8c4"/>
    <circle cx="200" cy="200" r="7" fill="#1b1424"/>
  </svg>`,
};

const render = (svg) => sharp(Buffer.from(svg));

async function writeLaunch(theme, dir) {
  for (const [name, width, height] of [
    ["launching", 940, 2036],
    ["launching-pc", 1671, 940],
  ]) {
    const svg = launchSvg(theme, width, height);
    await render(svg)
      .jpeg({ quality: 86 })
      .toFile(path.join(dir, `${name}.jpeg`));
    await render(svg)
      .webp({ quality: 84 })
      .toFile(path.join(dir, `${name}.webp`));
  }
}

async function writeIcon(svg, file) {
  await render(svg).png().toFile(file);
}

async function writeCursor(file) {
  const size = 32;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <path d="${HEART}" transform="translate(13 14) scale(1.05)" fill="#f7a8c4" stroke="#ffffff" stroke-width="1.6"/>
  </svg>`;
  const rgba = await render(svg).ensureAlpha().raw().toBuffer();

  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);

  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const from = (y * size + x) * 4;
      const to = ((size - 1 - y) * size + x) * 4;
      pixels[to] = rgba[from + 2];
      pixels[to + 1] = rgba[from + 1];
      pixels[to + 2] = rgba[from];
      pixels[to + 3] = rgba[from + 3];
    }
  }
  const mask = Buffer.alloc((size * size) / 8);
  const image = Buffer.concat([header, pixels, mask]);

  const directory = Buffer.alloc(22);
  directory.writeUInt16LE(2, 2);
  directory.writeUInt16LE(1, 4);
  directory[6] = size;
  directory[7] = size;
  directory.writeUInt16LE(4, 10);
  directory.writeUInt16LE(5, 12);
  directory.writeUInt32LE(image.length, 14);
  directory.writeUInt32LE(22, 18);
  fs.writeFileSync(file, Buffer.concat([directory, image]));
}

async function main() {
  await writeCursor(path.join(__dirname, "..", "src", "cursor.cur"));

  const sampleDir = path.join(publicDir, "samples");
  fs.mkdirSync(sampleDir, { recursive: true });
  for (const [name, svg] of Object.entries(SAMPLES)) {
    await render(svg)
      .webp({ quality: 84 })
      .toFile(path.join(sampleDir, `${name}.webp`));
  }

  for (const [id, theme] of Object.entries(THEMES)) {
    const isDefault = id === "nebula";
    const dir = isDefault ? publicDir : path.join(publicDir, "themes", id);
    const iconDir = isDefault ? path.join(publicDir, "icons") : dir;
    fs.mkdirSync(iconDir, { recursive: true });

    await writeLaunch(theme, dir);
    await writeIcon(iconSvg(theme, 192, 0.74), path.join(iconDir, "icon-192.png"));
    await writeIcon(iconSvg(theme, 180, 0.74), path.join(iconDir, "apple-touch-icon.png"));
    await writeIcon(iconSvg(theme, 48, 0.84), path.join(iconDir, "favicon-48.png"));

    if (isDefault) {
      await writeIcon(iconSvg(theme, 512, 0.74), path.join(iconDir, "icon-512.png"));
      await writeIcon(iconSvg(theme, 192, 0.56), path.join(iconDir, "icon-maskable-192.png"));
      await writeIcon(iconSvg(theme, 512, 0.56), path.join(iconDir, "icon-maskable-512.png"));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
