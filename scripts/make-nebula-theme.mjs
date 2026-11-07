import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const extras = read("scripts/theme-source/nebula-extras.css");

const variants = [
  {
    id: "nebula",
    base: "dusk",
    scheme: "dark",
    tint: { hue: 248, maxSat: 0.3 },
    vars: {
      "--bg-1": "#0c0b1a",
      "--bg-2": "#151030",
      "--bg-3": "#0d0b1c",
      "--card": "rgba(30, 28, 54, 0.38)",
      "--card-solid": "rgba(30, 28, 54, 0.7)",
      "--header": "rgba(255, 255, 255, 0.08)",
      "--header-strong": "rgba(255, 255, 255, 0.16)",
      "--border": "rgba(255, 255, 255, 0.14)",
      "--border-2": "rgba(255, 255, 255, 0.14)",
      "--button-border": "rgba(255, 255, 255, 0.16)",
      "--button-border-strong": "rgba(126, 166, 255, 0.6)",
      "--entry-outline": "rgba(255, 255, 255, 0.14)",
      "--text": "#f2f1ff",
      "--text-soft": "#c4c2e6",
      "--shadow": "0 14px 36px rgba(0, 0, 0, 0.45)",
      "--shadow-strong": "0 20px 48px rgba(0, 0, 0, 0.55)",
      "--line-mid": "rgba(255, 255, 255, 0.14)",
      "--line-soft": "rgba(255, 255, 255, 0.08)",
      "--line-gloss": "rgba(255, 255, 255, 0.12)",
      "--scrollbar-track": "transparent",
      "--scrollbar-thumb": "rgba(255, 255, 255, 0.2)",
      "--overscroll-bg": "#0d0b1c",
      "--page-bg": "linear-gradient(180deg, #100e22 0%, #0c0b1a 55%, #0a0916 100%)",
      "--g-text": "#f4f3ff",
      "--g-text-soft": "#c4c2e6",
      "--g-heart": "#ff4f75",
      "--g-fill": "rgba(34, 30, 84, 0.34)",
      "--g-fill-popup": "rgba(20, 18, 38, 0.74)",
      "--g-edge": "rgba(255, 255, 255, 0.16)",
      "--g-edge-soft": "rgba(255, 255, 255, 0.09)",
      "--g-rim":
        "linear-gradient(155deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.12) 28%, rgba(255, 255, 255, 0.05) 62%, rgba(255, 255, 255, 0.18) 100%)",
      "--g-rim-lift":
        "linear-gradient(155deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.18) 28%, rgba(255, 255, 255, 0.08) 62%, rgba(255, 255, 255, 0.26) 100%)",
      "--g-shine":
        "linear-gradient(150deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 38%, rgba(255, 255, 255, 0) 62%, rgba(255, 255, 255, 0.06) 100%)",
      "--g-sheen":
        "linear-gradient(165deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0) 70%)",
      "--g-fill-entry": "rgba(26, 22, 86, 0.62)",
      "--g-band": "rgba(255, 255, 255, 0.05)",
      "--g-band-line": "rgba(255, 255, 255, 0.08)",
      "--g-shadow":
        "inset 0 1px 1px rgba(255, 255, 255, 0.07), inset 0 -14px 28px -22px rgba(255, 255, 255, 0.1), 0 18px 40px -12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.26)",
      "--g-shadow-lift":
        "inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -14px 28px -22px rgba(255, 255, 255, 0.14), 0 32px 64px -16px rgba(0, 0, 0, 0.66), 0 6px 16px rgba(0, 0, 0, 0.34)",
      "--g-btn": "linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05))",
      "--g-btn-hover":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.09))",
      "--g-btn-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)",
      "--g-btn-shadow-hover":
        "inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 8px 18px rgba(0, 0, 0, 0.38)",
      "--g-active-fill": "rgba(255, 255, 255, 0.2)",
      "--g-active-edge": "rgba(255, 255, 255, 0.36)",
      "--g-active-text": "#ffffff",
      "--g-active-shadow":
        "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 0 18px rgba(126, 166, 255, 0.3)",
      "--g-accent-edge": "rgba(126, 166, 255, 0.6)",
      "--g-accent-ring": "rgba(126, 166, 255, 0.24)",
      "--g-field": "rgba(0, 0, 0, 0.22)",
      "--g-field-focus": "rgba(0, 0, 0, 0.32)",
      "--g-field-shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
      "--g-placeholder": "rgba(220, 218, 255, 0.42)",
      "--g-inner": "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025))",
      "--g-inner-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.07)",
      "--g-overlay": "rgba(6, 5, 16, 0.58)",
      "--g-toast": "rgba(32, 30, 58, 0.74)",
      "--g-switch-off": "rgba(255, 255, 255, 0.14)",
      "--g-scroll": "rgba(255, 255, 255, 0.2)",
      "--g-decor": "rgba(230, 228, 255, 0.75)",
      "--g-decor-glow": "0 0 10px rgba(160, 150, 255, 0.8), 0 0 24px rgba(120, 90, 255, 0.5)",
      "--g-title-shadow": "0 1px 12px rgba(150, 140, 255, 0.28)",
      "--g-fallback": "rgba(26, 24, 46, 0.92)",
      "--g-solid": "#17152c",
      "--g-solid-popup": "#141227",
      "--g-wallpaper": [
        `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
        "radial-gradient(70vmax 52vmax at 50% -8%, rgba(92, 84, 214, 0.42), transparent 72%)",
        "radial-gradient(46vmax 40vmax at 6% 50%, rgba(104, 92, 240, 0.3), transparent 72%)",
        "radial-gradient(44vmax 40vmax at 96% 74%, rgba(84, 74, 220, 0.3), transparent 72%)",
        "radial-gradient(56vmax 46vmax at 88% 104%, rgba(64, 58, 170, 0.2), transparent 72%)",
        "linear-gradient(180deg, #100e22 0%, #0c0b1a 55%, #0a0916 100%)",
      ].join(",\n    "),
    },
  },
];

function spring(damping, response) {
  const w = (2 * Math.PI) / response;
  const at = (t) => {
    if (damping >= 1) return 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - damping ** 2);
    return (
      1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t))
    );
  };
  const seconds = damping >= 1 ? response * 1.5 : response * 2;
  const steps = 32;
  const points = Array.from({ length: steps + 1 }, (_, i) =>
    i === steps ? 1 : Number(at((seconds * i) / steps).toFixed(4)),
  );
  return { easing: `linear(${points.join(", ")})`, duration: `${Math.round(seconds * 1000)}ms` };
}

const motion = {
  "@SPRING_EASE": spring(1, 0.35).easing,
  "@SPRING_TIME": spring(1, 0.35).duration,
  "@BOUNCE_EASE": spring(0.8, 0.3).easing,
  "@BOUNCE_TIME": spring(0.8, 0.3).duration,
};

function toHsl(r, g, b) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return [0, s, l];
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((value) => Math.round(value * 255));
}

function retintColor(r, g, b, { hue, maxSat }) {
  const [, s, l] = toHsl(r, g, b);
  if (s > 0.7 && l > 0.35 && l < 0.72) return null;
  return hslToRgb(hue, Math.min(s, maxSat), l);
}

function retintCss(css, tint) {
  const hex = (value) => value.toString(16).padStart(2, "0");
  return css
    .replace(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi, (match, digits) => {
      const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
      const next = retintColor(r, g, b, tint);
      return next ? `#${next.map(hex).join("")}` : match;
    })
    .replace(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/gi,
      (match, r, g, b, alpha) => {
        const next = retintColor(Number(r), Number(g), Number(b), tint);
        if (!next) return match;
        return alpha
          ? `rgba(${next.join(", ")}${alpha.replace(/\s+/g, " ")})`
          : `rgb(${next.join(", ")})`;
      },
    );
}

for (const variant of variants) {
  const attr = `[data-theme="${variant.id}"]`;
  const plain = `html${attr}`;
  const strong = `html${attr.repeat(6)}`;
  const baseCss = retintCss(
    read(`src/themes/${variant.base}.css`).replaceAll(`"${variant.base}"`, `"${variant.id}"`),
    variant.tint,
  );
  const vars = Object.entries(variant.vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  const palette = `html${attr.repeat(4)} {\n  color-scheme: ${variant.scheme};\n${vars}\n}\n`;
  const layer = Object.entries(motion)
    .reduce((css, [token, value]) => css.replaceAll(token, value), extras)
    .replaceAll("@G", strong)
    .replaceAll("@T", plain);
  writeFileSync(
    path.join(root, `src/themes/${variant.id}.css`),
    `${baseCss.trimEnd()}\n\n${palette}\n${layer}`,
  );
  console.log(`wrote src/themes/${variant.id}.css`);
}
