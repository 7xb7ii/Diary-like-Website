const PHOTO_TEXT_FONTS = [
  { id: "cute", label: "cute" },
  { id: "hand", label: "hand" },
  { id: "script", label: "script" },
  { id: "serif", label: "serif" },
];

const PHOTO_TEXT_EFFECTS = [
  { id: "shadow", label: "shadow" },
  { id: "outline", label: "outline" },
  { id: "pill", label: "label" },
  { id: "glow", label: "glow" },
];

export function normalizePhotoTextFont(value) {
  return PHOTO_TEXT_FONTS.some((font) => font.id === value) ? value : "cute";
}

export function normalizePhotoTextEffect(value) {
  return PHOTO_TEXT_EFFECTS.some((effect) => effect.id === value) || value === "none"
    ? value
    : "shadow";
}

export function getPhotoTextClasses(data) {
  return `photo-text-font-${normalizePhotoTextFont(data?.textFont)} photo-text-fx-${normalizePhotoTextEffect(data?.textEffect)}`;
}

const ADJUSTMENTS = [
  { id: "brightness", label: "brightness", min: -100, max: 100 },
  { id: "contrast", label: "contrast", min: -100, max: 100 },
  { id: "saturation", label: "saturation", min: -100, max: 100 },
  { id: "warmth", label: "warmth", min: -100, max: 100 },
  { id: "tint", label: "tint", min: -100, max: 100 },
  { id: "highlights", label: "highlights", min: -100, max: 100 },
  { id: "shadows", label: "shadows", min: -100, max: 100 },
  { id: "fade", label: "fade", min: 0, max: 100 },
  { id: "vignette", label: "vignette", min: 0, max: 100 },
  { id: "grain", label: "grain", min: 0, max: 100 },
];

const FILTERS = [
  { id: "none", label: "original", values: {} },
  { id: "soft", label: "soft", values: { brightness: 6, contrast: -12, saturation: -8, fade: 18 } },
  { id: "warm", label: "warm", values: { warmth: 30, saturation: 8, highlights: -6 } },
  { id: "cool", label: "cool", values: { warmth: -28, tint: -6, contrast: 6 } },
  { id: "rosy", label: "rosy", values: { warmth: 12, tint: 22, fade: 10, brightness: 4 } },
  {
    id: "dreamy",
    label: "dreamy",
    values: { brightness: 10, contrast: -20, saturation: -10, fade: 26, vignette: 14 },
  },
  { id: "vivid", label: "vivid", values: { saturation: 38, contrast: 16, shadows: 8 } },
  {
    id: "film",
    label: "film",
    values: { contrast: 10, fade: 16, warmth: 8, saturation: -8, grain: 30 },
  },
  {
    id: "vintage",
    label: "vintage",
    values: { sepia: 50, fade: 24, contrast: -8, vignette: 32, grain: 18 },
  },
  {
    id: "midnight",
    label: "midnight",
    values: { brightness: -12, warmth: -24, saturation: -24, contrast: 18, vignette: 34 },
  },
  { id: "bw", label: "b&w", values: { mono: 100, contrast: 12 } },
  {
    id: "noir",
    label: "noir",
    values: { mono: 100, contrast: 42, brightness: -8, vignette: 44, grain: 12 },
  },
];

const BRUSHES = [
  { id: "pen", label: "pen" },
  { id: "marker", label: "marker" },
  { id: "glow", label: "glow" },
  { id: "eraser", label: "eraser" },
];

const SWATCHES = [
  "#ffffff",
  "#111111",
  "#ff5fa2",
  "#ffb3d1",
  "#e5383b",
  "#ffd166",
  "#7bdcb5",
  "#6ec6ff",
  "#b39dff",
];
const MAX_STROKE_POINTS = 6000;
const PREVIEW_MAX = 900;
const TEXT_SNAP_PX = 6;
const OUTPUT_MAX = 1080;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeHex(value, fallback) {
  const raw = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  return fallback;
}

function defaultEdits() {
  return {
    turns: 0,
    flipX: false,
    flipY: false,
    straighten: 0,
    filter: "none",
    filterStrength: 100,
    adjust: Object.fromEntries(ADJUSTMENTS.map((item) => [item.id, 0])),
    strokes: [],
  };
}

function normalizeEdits(raw) {
  const base = defaultEdits();
  if (!raw || typeof raw !== "object") return base;
  const adjust = { ...base.adjust };
  ADJUSTMENTS.forEach((item) => {
    const value = Number(raw.adjust?.[item.id]);
    if (Number.isFinite(value)) adjust[item.id] = clamp(Math.round(value), item.min, item.max);
  });
  return {
    turns: ((Math.round(Number(raw.turns) || 0) % 4) + 4) % 4,
    flipX: Boolean(raw.flipX),
    flipY: Boolean(raw.flipY),
    straighten: clamp(Number(raw.straighten) || 0, -20, 20),
    filter: FILTERS.some((filter) => filter.id === raw.filter) ? raw.filter : "none",
    filterStrength: clamp(
      Number.isFinite(Number(raw.filterStrength)) ? Number(raw.filterStrength) : 100,
      0,
      100,
    ),
    adjust,
    strokes: Array.isArray(raw.strokes)
      ? raw.strokes
          .filter((stroke) => stroke && Array.isArray(stroke.points) && stroke.points.length)
          .map((stroke) => ({
            brush: BRUSHES.some((brush) => brush.id === stroke.brush) ? stroke.brush : "pen",
            color: normalizeHex(stroke.color, "#ffffff"),
            size: clamp(Number(stroke.size) || 6, 1, 40),
            points: stroke.points
              .filter((point) => Array.isArray(point) && point.length >= 2)
              .map(([x, y]) => [clamp(Number(x) || 0, 0, 1), clamp(Number(y) || 0, 0, 1)]),
          }))
      : [],
  };
}

function isDefaultEdits(edits) {
  return JSON.stringify(normalizeEdits(edits)) === JSON.stringify(defaultEdits());
}

function getEffectiveAdjust(edits) {
  const filter = FILTERS.find((item) => item.id === edits.filter) || FILTERS[0];
  const strength = edits.filterStrength / 100;
  const result = { mono: 0, sepia: 0 };
  ADJUSTMENTS.forEach((item) => {
    result[item.id] = edits.adjust[item.id] || 0;
  });
  Object.entries(filter.values).forEach(([key, value]) => {
    result[key] = (result[key] || 0) + value * strength;
  });
  return result;
}

function hasPixelWork(adjust) {
  return [
    "brightness",
    "contrast",
    "saturation",
    "warmth",
    "tint",
    "highlights",
    "shadows",
    "fade",
    "grain",
    "mono",
    "sepia",
  ].some((key) => Math.abs(adjust[key] || 0) > 0.01);
}

function applyPixelAdjustments(ctx, size, adjust) {
  if (!hasPixelWork(adjust)) return;
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;

  const contrastAmount = clamp(adjust.contrast || 0, -100, 100) * 1.28;
  const contrastFactor = (259 * (contrastAmount + 255)) / (255 * (259 - contrastAmount));
  const brightness = (adjust.brightness || 0) * 0.9;
  const highlights = (adjust.highlights || 0) * 0.55;
  const shadows = (adjust.shadows || 0) * 0.55;
  const warmth = (adjust.warmth || 0) * 0.45;
  const tint = (adjust.tint || 0) * 0.35;
  const fade = clamp(adjust.fade || 0, 0, 100) / 100;

  const curve = (value) => {
    let v = value + brightness;
    const n = clamp(v / 255, 0, 1);
    v += highlights * n * n + shadows * (1 - n) * (1 - n);
    v = contrastFactor * (v - 128) + 128;
    return v;
  };
  const lutR = new Float32Array(256);
  const lutG = new Float32Array(256);
  const lutB = new Float32Array(256);
  const lutFade = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i += 1) {
    const base = curve(i);
    lutR[i] = base + warmth + tint * 0.4;
    lutG[i] = base - tint;
    lutB[i] = base - warmth + tint * 0.4;
    lutFade[i] = i + fade * (48 - i * 0.22);
  }

  const saturation = 1 + clamp(adjust.saturation || 0, -100, 100) / 100;
  const mono = clamp(adjust.mono || 0, 0, 100) / 100;
  const sepia = clamp(adjust.sepia || 0, 0, 100) / 100;
  const grain = clamp(adjust.grain || 0, 0, 100) * 0.7;
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < data.length; i += 4) {
    let r = lutR[data[i]];
    let g = lutG[data[i + 1]];
    let b = lutB[data[i + 2]];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (saturation !== 1) {
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;
    }
    if (mono) {
      const gray2 = 0.299 * r + 0.587 * g + 0.114 * b;
      r += (gray2 - r) * mono;
      g += (gray2 - g) * mono;
      b += (gray2 - b) * mono;
    }
    if (sepia) {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      r += (sr - r) * sepia;
      g += (sg - g) * sepia;
      b += (sb - b) * sepia;
    }
    if (grain) {
      const noise = (random() - 0.5) * grain;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = lutFade[clamp(Math.round(r), 0, 255)];
    data[i + 1] = lutFade[clamp(Math.round(g), 0, 255)];
    data[i + 2] = lutFade[clamp(Math.round(b), 0, 255)];
  }

  ctx.putImageData(image, 0, 0);
}

function drawVignette(ctx, size, amount) {
  if (amount <= 0) return;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.28,
    size / 2,
    size / 2,
    size * 0.75,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${clamp(amount, 0, 100) * 0.0075})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

function drawStroke(ctx, stroke, size) {
  const width = (stroke.size / 360) * size;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  if (stroke.brush === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
  } else if (stroke.brush === "marker") {
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = width * 1.8;
    ctx.lineCap = "square";
  } else if (stroke.brush === "glow") {
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = width * 2.4;
  }

  const points = stroke.points;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0][0] * size, points[0][1] * size, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * size, points[0][1] * size);
    for (let i = 1; i < points.length - 1; i += 1) {
      const midX = ((points[i][0] + points[i + 1][0]) / 2) * size;
      const midY = ((points[i][1] + points[i + 1][1]) / 2) * size;
      ctx.quadraticCurveTo(points[i][0] * size, points[i][1] * size, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last[0] * size, last[1] * size);
    ctx.stroke();
  }
  ctx.restore();
}

function renderEdits(canvas, source, edits, size) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";

  const angle = ((edits.turns * 90 + edits.straighten) * Math.PI) / 180;
  const tilt = Math.abs((edits.straighten * Math.PI) / 180);
  const cover = Math.cos(tilt) + Math.sin(tilt);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(angle);
  ctx.scale(edits.flipX ? -1 : 1, edits.flipY ? -1 : 1);
  ctx.drawImage(source, (-size * cover) / 2, (-size * cover) / 2, size * cover, size * cover);
  ctx.restore();

  const adjust = getEffectiveAdjust(edits);
  applyPixelAdjustments(ctx, size, adjust);
  drawVignette(ctx, size, adjust.vignette || 0);

  if (edits.strokes.length) {
    const layer = document.createElement("canvas");
    layer.width = size;
    layer.height = size;
    const layerCtx = layer.getContext("2d");
    edits.strokes.forEach((stroke) => drawStroke(layerCtx, stroke, size));
    ctx.drawImage(layer, 0, 0);
  }
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!/^(data|blob):/i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("could not load image"));
    image.src = src;
  });
}

function canReadPixels(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, 1, 1);
    ctx.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

async function loadEditableImage(src) {
  try {
    const image = await loadImage(src);
    if (canReadPixels(image)) return image;
  } catch {}
  const response = await fetch(src, { mode: "cors", cache: "reload" });
  if (!response.ok) throw new Error("could not load image");
  const url = URL.createObjectURL(await response.blob());
  try {
    const image = await loadImage(url);
    if (!canReadPixels(image)) throw new Error("photo is not editable");
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toSquareSource(image, maxSize = 1600) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const side = Math.min(width, height);
  const size = Math.max(1, Math.round(Math.min(maxSize, side)));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
  return canvas;
}

function capturePointer(element, event) {
  try {
    element.setPointerCapture?.(event.pointerId);
  } catch {}
}

function icon(path) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
}

const ICONS = {
  photo: icon(
    '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4.5 17 4.8-4.6 3.4 3.2 2.6-2.4 4.2 3.8"/>',
  ),
  undo: icon('<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-2"/>'),
  redo: icon('<path d="m15 7 4.5 4.5L15 16"/><path d="M19 11.5h-9a5 5 0 0 0 0 10h2"/>'),
  rotateLeft: icon('<path d="M7 8.5A7 7 0 1 1 5 13"/><path d="M3.5 5v4.5H8"/>'),
  rotateRight: icon('<path d="M17 8.5A7 7 0 1 0 19 13"/><path d="M20.5 5v4.5H16"/>'),
  flipX: icon(
    '<path d="M12 3v18"/><path d="M9 7 4 17h5z"/><path d="m15 7 5 10h-5z" fill="currentColor" stroke="none" opacity=".35"/><path d="m15 7 5 10h-5z"/>',
  ),
  flipY: icon(
    '<path d="M3 12h18"/><path d="M7 9 17 4v5z"/><path d="m7 15 10 5v-5z" fill="currentColor" stroke="none" opacity=".35"/><path d="m7 15 10 5v-5z"/>',
  ),
  crop: icon('<path d="M6 2.5V17a1 1 0 0 0 1 1h14.5"/><path d="M2.5 6H17a1 1 0 0 1 1 1v14.5"/>'),
  trash: icon('<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>'),
  pen: icon('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
  marker: icon('<path d="m14 4 6 6-8.5 8.5H6.5v-5z"/><path d="M4 21h9"/>'),
  glow: icon('<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>'),
  eraser: icon(
    '<path d="m8.5 19.5-4-4a2 2 0 0 1 0-2.8l8.2-8.2a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8l-8.2 8.2z"/><path d="m9 8.5 6.5 6.5"/><path d="M8.5 19.5H20"/>',
  ),
  brushSize: icon(
    '<circle cx="5.5" cy="12" r="1" fill="currentColor"/><circle cx="11" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="3.5" fill="currentColor"/>',
  ),
};

const toolGlyphs = (target, color, sizeIcon) => `
  <span class="pe-glyphs-divider" aria-hidden="true"></span>
  <button class="pe-glyph" type="button" data-pe-pop="${target}-color" title="colour" aria-label="colour" aria-expanded="false"><span class="pe-color-dot" data-pe-dot="${target}" style="--swatch:${color}"></span></button>
  <button class="pe-glyph" type="button" data-pe-pop="${target}-size" title="size" aria-label="size" aria-expanded="false">${sizeIcon}</button>
`;

const TABS = [
  { id: "crop", label: "crop" },
  { id: "draw", label: "draw" },
  { id: "text", label: "text" },
];

export function mountPhotoEditor(container, options = {}) {
  const data = options.data || {};
  const notify = options.message || (() => {});
  const text = {
    value: String(data.text || ""),
    color: normalizeHex(data.textColor, "#ffffff"),
    size: clamp(Number(data.textSize) || 22, 12, 46),
    x: clamp(Number.isFinite(Number(data.textX)) ? Number(data.textX) : 50, 0, 100),
    y: clamp(Number.isFinite(Number(data.textY)) ? Number(data.textY) : 86, 0, 100),
    font: normalizePhotoTextFont(data.textFont),
    effect: normalizePhotoTextEffect(data.textEffect),
  };

  let edits = normalizeEdits(data.edits);
  if (!data.edits && Number(data.rotate)) {
    edits.turns = ((Math.round(Number(data.rotate) / 90) % 4) + 4) % 4;
  }
  let source = null;
  let sourceUrl = String(data.originalImage || data.image || "");
  let sourceIsNew = false;
  let editable = false;
  let imageCleared = false;
  let sourceLoading = Boolean(sourceUrl);
  let activeTab = "text";
  let openPop = "";
  let brush = { brush: "pen", color: "#ffffff", size: 6 };
  let crop = null;
  let renderQueued = false;
  let drawing = null;
  const startSignature = () => JSON.stringify({ edits, text });
  let initialSignature = "";
  const history = [];
  let historyIndex = -1;

  container.innerHTML = `
    <div class="pe">
      <input id="photoWidgetImageData" type="hidden" value="${escapeAttr(data.image || "")}" />
      <input id="photoWidgetOriginal" type="hidden" value="${escapeAttr(data.originalImage || "")}" />
      <input id="photoWidgetEdits" type="hidden" value="" />
      <input id="photoWidgetRotate" type="hidden" value="${Number(data.rotate) || 0}" />
      <input id="photoWidgetTextX" type="hidden" value="${text.x}" />
      <input id="photoWidgetTextY" type="hidden" value="${text.y}" />
      <input id="photoTextColor" type="hidden" value="${text.color}" />
      <input id="photoTextSize" type="hidden" value="${text.size}" />
      <input id="photoTextFont" type="hidden" value="${text.font}" />
      <input id="photoTextEffect" type="hidden" value="${text.effect}" />
      <input id="photoWidgetInput" class="pe-file" type="file" accept="image/*" hidden />

      <div class="pe-topbar">
        <button class="soft-btn pe-btn pe-icon" type="button" data-pe="pick" title="new photo" aria-label="new photo">${ICONS.photo}</button>
        <div class="pe-topbar-group">
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="undo" title="undo" aria-label="undo">${ICONS.undo}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="redo" title="redo" aria-label="redo">${ICONS.redo}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="clear" title="delete everything" aria-label="delete everything">${ICONS.trash}</button>
        </div>
      </div>

      <div class="photo-editor-preview pe-stage" id="photoEditorPreview">
        <canvas class="pe-canvas" hidden></canvas>
        <img class="pe-fallback" alt="photo preview" hidden />
        <div class="photo-editor-preview-text ${getPhotoTextClasses({ textFont: text.font, textEffect: text.effect })}" id="photoEditorPreviewText"></div>
        <div class="pe-guide pe-guide-x" hidden></div>
        <div class="pe-guide pe-guide-y" hidden></div>
        <div class="pe-empty">
          <span>no photo pinned yet</span>
          <button class="soft-btn pe-btn" type="button" data-pe="pick">${ICONS.photo}<span>choose a photo</span></button>
        </div>
      </div>

      <div class="pe-crop" id="photoCropControls" hidden>
        <div class="pe-hint">drag to move · pinch or slide to zoom</div>
        <input class="pe-range" id="photoCropZoom" type="range" min="1" max="4" step="0.01" value="1" aria-label="zoom" />
        <label class="pe-slider">
          <span class="pe-slider-head"><span>straighten</span><output data-pe-out="straighten">0°</output></span>
          <input class="pe-range" type="range" min="-20" max="20" step="0.5" value="${edits.straighten}" data-pe-input="straighten" />
        </label>
        <div class="pe-crop-actions">
          <button class="soft-btn pe-btn" id="photoCropCancelBtn" type="button">cancel</button>
          <button class="soft-btn pe-btn pe-primary" id="photoCropApplyBtn" type="button">done</button>
        </div>
      </div>

      <div class="pe-tabs" role="tablist" aria-label="editing tools">
        ${TABS.map(
          (tab) =>
            `<button class="pe-tab" type="button" role="tab" data-pe-tab="${tab.id}" aria-selected="${tab.id === activeTab}">${tab.label}</button>`,
        ).join("")}
      </div>

      <div class="pe-panel" data-panel="crop">
        <div class="pe-row pe-row-center">
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="rotate-left" title="rotate left" aria-label="rotate left">${ICONS.rotateLeft}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="rotate-right" title="rotate right" aria-label="rotate right">${ICONS.rotateRight}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="flip-x" title="flip sideways" aria-label="flip sideways">${ICONS.flipX}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="flip-y" title="flip upside down" aria-label="flip upside down">${ICONS.flipY}</button>
          <button class="soft-btn pe-btn pe-icon" type="button" data-pe="recrop" title="crop" aria-label="crop">${ICONS.crop}</button>
        </div>
      </div>

      <div class="pe-panel" data-panel="draw">
        <div class="pe-glyphs">
          ${BRUSHES.map(
            (item) =>
              `<button class="pe-glyph" type="button" data-pe-brush="${item.id}" title="${item.label}" aria-label="${item.label}" aria-pressed="${item.id === brush.brush}">${ICONS[item.id]}</button>`,
          ).join("")}
          ${toolGlyphs("brush", brush.color, ICONS.brushSize)}
          <span class="pe-glyphs-divider" aria-hidden="true"></span>
          <button class="pe-glyph" type="button" data-pe="undo-stroke" title="undo line" aria-label="undo line">${ICONS.undo}</button>
          <button class="pe-glyph" type="button" data-pe="clear-drawing" title="clear drawing" aria-label="clear drawing">${ICONS.trash}</button>
        </div>
        <div class="pe-swatches" data-pe-swatches="brush" data-pe-popover="brush-color" hidden>
          ${SWATCHES.map(
            (color) =>
              `<button class="pe-swatch" type="button" data-color="${color}" style="--swatch:${color}" aria-label="colour ${color}" aria-pressed="${color === brush.color}"></button>`,
          ).join("")}
          <input class="pe-color" type="color" value="${brush.color}" data-pe-color="brush" aria-label="pick any colour" title="pick any colour" />
        </div>
        <label class="pe-size" data-pe-popover="brush-size" hidden>
          <span aria-hidden="true">${ICONS.brushSize}</span>
          <input class="pe-range" type="range" min="1" max="40" step="1" value="${brush.size}" data-pe-input="brush" aria-label="brush size" />
          <output data-pe-out="brush">${brush.size}</output>
        </label>
      </div>

      <div class="pe-panel" data-panel="text">
        <textarea class="popup-input pe-text-input" id="photoWidgetText" rows="1" maxlength="60" placeholder="write on the photo, then drag it ♡">${escapeAttr(text.value)}</textarea>
        <div class="pe-glyphs">
          ${PHOTO_TEXT_FONTS.map(
            (font) =>
              `<button class="pe-glyph photo-text-font-${font.id}" type="button" data-pe-font="${font.id}" title="${font.label}" aria-label="${font.label} font" aria-pressed="${font.id === text.font}">Aa</button>`,
          ).join("")}
          <span class="pe-glyphs-divider" aria-hidden="true"></span>
          ${PHOTO_TEXT_EFFECTS.map(
            (effect) =>
              `<button class="pe-glyph pe-glyph-fx-${effect.id}" type="button" data-pe-effect="${effect.id}" title="${effect.label}" aria-label="${effect.label} effect" aria-pressed="${effect.id === text.effect}"><span>A</span></button>`,
          ).join("")}
          ${toolGlyphs("text", text.color, '<span class="pe-glyph-size" aria-hidden="true"><small>A</small>A</span>')}
        </div>
        <div class="pe-swatches" data-pe-swatches="text" data-pe-popover="text-color" hidden>
          ${SWATCHES.map(
            (color) =>
              `<button class="pe-swatch" type="button" data-color="${color}" style="--swatch:${color}" aria-label="colour ${color}" aria-pressed="${color === text.color}"></button>`,
          ).join("")}
          <input class="pe-color photo-color-trigger" id="photoColorTrigger" type="color" value="${text.color}" data-pe-color="text" aria-label="pick any colour" title="pick any colour" />
        </div>
        <label class="pe-size" data-pe-popover="text-size" hidden>
          <span aria-hidden="true">A</span>
          <input class="pe-range" type="range" min="12" max="46" step="1" value="${text.size}" data-pe-input="text-size" aria-label="text size" />
          <output data-pe-out="text-size">${text.size}</output>
        </label>
      </div>
    </div>
  `;

  const root = container.querySelector(".pe");
  const stage = root.querySelector(".pe-stage");
  const canvas = root.querySelector(".pe-canvas");
  const fallbackImage = root.querySelector(".pe-fallback");
  const emptyState = root.querySelector(".pe-empty");
  const textEl = root.querySelector("#photoEditorPreviewText");
  const textInput = root.querySelector("#photoWidgetText");
  const fileInput = root.querySelector("#photoWidgetInput");
  const field = (id) => root.querySelector(`#${id}`);
  const cropControls = root.querySelector("#photoCropControls");
  const cropZoomInput = root.querySelector("#photoCropZoom");
  const guideX = root.querySelector(".pe-guide-x");
  const guideY = root.querySelector(".pe-guide-y");

  const snapshot = () => JSON.stringify({ edits, text });
  const pushHistory = () => {
    const state = snapshot();
    if (history[historyIndex] === state) return;
    history.splice(historyIndex + 1);
    history.push(state);
    if (history.length > 60) history.shift();
    historyIndex = history.length - 1;
    syncHistoryButtons();
  };
  const resetHistory = () => {
    history.length = 0;
    historyIndex = -1;
    pushHistory();
  };
  const restore = (state) => {
    const parsed = JSON.parse(state);
    edits = normalizeEdits(parsed.edits);
    Object.assign(text, parsed.text);
    syncControls();
    syncText();
    queueRender();
    syncHistoryButtons();
  };
  const syncHistoryButtons = () => {
    root.querySelector('[data-pe="undo"]').disabled = historyIndex <= 0;
    root.querySelector('[data-pe="redo"]').disabled = historyIndex >= history.length - 1;
  };

  const previewSize = () => {
    const width = stage.clientWidth || 320;
    return Math.round(Math.min(PREVIEW_MAX, width * Math.min(2, window.devicePixelRatio || 1)));
  };

  const render = () => {
    renderQueued = false;
    if (!source || crop) return;
    renderEdits(canvas, source, edits, previewSize());
  };

  const queueRender = () => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(render);
  };

  const syncStage = () => {
    const hasPhoto = Boolean(source) || (!editable && Boolean(sourceUrl) && !imageCleared);
    stage.classList.toggle("has-image", hasPhoto);
    canvas.hidden = !source || Boolean(crop);
    fallbackImage.hidden = Boolean(source) || !hasPhoto || Boolean(crop);
    emptyState.hidden = hasPhoto || Boolean(crop);
    textEl.hidden = !hasPhoto || Boolean(crop);
    root.classList.toggle("pe-locked", !editable && !sourceLoading);
    root.classList.toggle("pe-no-photo", !hasPhoto);
  };

  const syncText = () => {
    textEl.textContent = text.value;
    textEl.className = `photo-editor-preview-text ${getPhotoTextClasses({ textFont: text.font, textEffect: text.effect })}`;
    textEl.style.left = `${text.x}%`;
    textEl.style.top = `${text.y}%`;
    textEl.style.color = text.color;
    textEl.style.setProperty("--photo-text-translate-x", `-${text.x}%`);
    textEl.style.setProperty("--photo-text-translate-y", `-${text.y}%`);
    textEl.style.setProperty("--photo-text-size", String(text.size));
    if (textInput.value !== text.value) textInput.value = text.value;
    fitTextInput();
    field("photoWidgetTextX").value = String(text.x);
    field("photoWidgetTextY").value = String(text.y);
    field("photoTextColor").value = text.color;
    field("photoTextSize").value = String(text.size);
    field("photoTextFont").value = text.font;
    field("photoTextEffect").value = text.effect;
  };

  const fitTextInput = () => {
    textInput.style.height = "auto";
    if (!textInput.scrollHeight) return;
    const border = textInput.offsetHeight - textInput.clientHeight;
    textInput.style.height = `${textInput.scrollHeight + border}px`;
  };

  const setPressed = (selector, matches) => {
    root.querySelectorAll(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(matches(button)));
    });
  };

  const syncControls = () => {
    root.querySelectorAll("[data-pe-tab]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.peTab === activeTab));
    });
    root.querySelectorAll(".pe-panel").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== activeTab;
    });
    stage.classList.toggle("is-drawing", activeTab === "draw" && Boolean(source));
    stage.classList.toggle("is-text-mode", activeTab === "text");
    fitTextInput();

    root.querySelector('[data-pe-input="straighten"]').value = String(edits.straighten);
    root.querySelector('[data-pe-out="straighten"]').textContent = `${edits.straighten}°`;

    setPressed("[data-pe-brush]", (button) => button.dataset.peBrush === brush.brush);
    setPressed(
      '[data-pe-swatches="brush"] .pe-swatch',
      (button) => button.dataset.color === brush.color,
    );
    root.querySelector('[data-pe-color="brush"]').value = brush.color;
    root.querySelector('[data-pe-input="brush"]').value = String(brush.size);
    root.querySelector('[data-pe-out="brush"]').textContent = String(brush.size);

    setPressed("[data-pe-font]", (button) => button.dataset.peFont === text.font);
    setPressed("[data-pe-effect]", (button) => button.dataset.peEffect === text.effect);
    setPressed(
      '[data-pe-swatches="text"] .pe-swatch',
      (button) => button.dataset.color === text.color,
    );
    root.querySelector('[data-pe-color="text"]').value = text.color;
    root.querySelector('[data-pe-input="text-size"]').value = String(text.size);
    root.querySelector('[data-pe-out="text-size"]').textContent = String(text.size);

    root.querySelector('[data-pe-dot="brush"]').style.setProperty("--swatch", brush.color);
    root.querySelector('[data-pe-dot="text"]').style.setProperty("--swatch", text.color);
    root.querySelectorAll("[data-pe-popover]").forEach((popover) => {
      popover.hidden = popover.dataset.pePopover !== openPop;
    });
    root.querySelectorAll("[data-pe-pop]").forEach((button) => {
      button.setAttribute("aria-expanded", String(button.dataset.pePop === openPop));
    });
  };

  const useSource = (squareCanvas, { isNew = false } = {}) => {
    source = squareCanvas;
    editable = true;
    imageCleared = false;
    sourceIsNew = isNew;
    syncStage();
    syncControls();
    queueRender();
  };

  const loadExisting = async () => {
    if (!sourceUrl) {
      syncStage();
      return;
    }
    try {
      const image = await loadEditableImage(sourceUrl);
      if (imageCleared || source) return;
      useSource(toSquareSource(image));
    } catch (error) {
      console.error(error);
      if (imageCleared || source) return;
      editable = false;
      fallbackImage.src = String(data.image || sourceUrl);
      fallbackImage.style.transform = Number(data.rotate)
        ? `rotate(${Number(data.rotate)}deg)`
        : "";
      syncStage();
      notify("this photo can't be edited here — choose it again to edit ♡");
    } finally {
      sourceLoading = false;
      syncStage();
    }
  };

  const getCropScale = () => {
    const viewSize = stage.clientWidth || 1;
    const shortSide = Math.min(crop.width, crop.height);
    return (viewSize / shortSide) * crop.zoom;
  };

  const renderCrop = () => {
    if (!crop) return;
    const viewSize = stage.clientWidth || 1;
    const scale = getCropScale();
    const half = viewSize / 2 / scale;
    crop.centerX = clamp(crop.centerX, half, crop.width - half);
    crop.centerY = clamp(crop.centerY, half, crop.height - half);
    const el = crop.element;
    el.style.width = `${crop.width * scale}px`;
    el.style.height = `${crop.height * scale}px`;
    el.style.left = `${viewSize / 2 - crop.centerX * scale}px`;
    el.style.top = `${viewSize / 2 - crop.centerY * scale}px`;
    const tilt = Math.abs((crop.straighten * Math.PI) / 180);
    el.style.transformOrigin = `${crop.centerX * scale}px ${crop.centerY * scale}px`;
    el.style.transform = crop.straighten
      ? `rotate(${crop.straighten}deg) scale(${Math.cos(tilt) + Math.sin(tilt)})`
      : "";
  };

  const showCropStraighten = () => {
    root.querySelector('[data-pe-input="straighten"]').value = String(crop.straighten);
    root.querySelector('[data-pe-out="straighten"]').textContent = `${crop.straighten}°`;
  };

  const startCrop = (element, width, height, isNew) => {
    crop = {
      element,
      width,
      height,
      isNew,
      straighten: isNew ? 0 : edits.straighten,
      zoom: 1,
      centerX: width / 2,
      centerY: height / 2,
      pointers: new Map(),
      pinchDistance: 0,
    };
    element.classList.add("pe-crop-image");
    element.draggable = false;
    stage.appendChild(element);
    stage.classList.add("has-image", "is-cropping");
    root.classList.add("is-cropping");
    cropControls.hidden = false;
    cropZoomInput.value = "1";
    showCropStraighten();
    syncStage();
    renderCrop();
  };

  const endCrop = () => {
    crop?.element.remove();
    crop = null;
    stage.classList.remove("is-cropping");
    root.classList.remove("is-cropping");
    cropControls.hidden = true;
    fileInput.value = "";
    syncStage();
    syncControls();
    queueRender();
  };

  const applyCrop = () => {
    if (!crop) return;
    const viewSize = stage.clientWidth || 1;
    const sourceSize = viewSize / getCropScale();
    const outputSize = Math.max(1, Math.round(Math.min(1600, sourceSize)));
    const out = document.createElement("canvas");
    out.width = outputSize;
    out.height = outputSize;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      crop.element,
      crop.centerX - sourceSize / 2,
      crop.centerY - sourceSize / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize,
    );
    const isNew = crop.isNew;
    const straighten = crop.straighten;
    endCrop();
    if (isNew) {
      edits = defaultEdits();
      Object.assign(text, { value: "", x: 50, y: 86 });
      syncText();
    } else {
      edits = { ...edits, strokes: [] };
    }
    edits.straighten = straighten;
    useSource(out, { isNew: true });
    resetHistory();
  };

  const setCropZoom = (nextZoom) => {
    if (!crop) return;
    crop.zoom = clamp(nextZoom, 1, 4);
    cropZoomInput.value = String(crop.zoom);
    renderCrop();
  };

  const pinchDistance = () => {
    const [first, second] = [...crop.pointers.values()];
    return Math.hypot(first.x - second.x, first.y - second.y);
  };

  const pointFromEvent = (event) => {
    const rect = stage.getBoundingClientRect();
    return [
      Math.round(clamp((event.clientX - rect.left) / rect.width, 0, 1) * 1000) / 1000,
      Math.round(clamp((event.clientY - rect.top) / rect.height, 0, 1) * 1000) / 1000,
    ];
  };

  let textDrag = null;

  const startTextDrag = (event) => {
    if (crop || activeTab === "draw" || !text.value || textEl.hidden) return false;
    if (activeTab !== "text" && !textEl.contains(event.target)) return false;
    event.preventDefault();
    capturePointer(stage, event);
    textDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: text.x,
      y: text.y,
    };
    textEl.classList.add("is-dragging");
    return true;
  };

  const moveText = (event) => {
    const rect = stage.getBoundingClientRect();
    const textRect = textEl.getBoundingClientRect();
    const roomX = Math.max(1, rect.width - textRect.width);
    const roomY = Math.max(1, rect.height - textRect.height);
    const dx = ((event.clientX - textDrag.startX) / roomX) * 100;
    const dy = ((event.clientY - textDrag.startY) / roomY) * 100;
    const x = Math.round(clamp(textDrag.x + dx, 0, 100) * 10) / 10;
    const y = Math.round(clamp(textDrag.y + dy, 0, 100) * 10) / 10;
    const snapX = (Math.abs(x - 50) / 100) * roomX <= TEXT_SNAP_PX;
    const snapY = (Math.abs(y - 50) / 100) * roomY <= TEXT_SNAP_PX;
    if ((snapX && guideX.hidden) || (snapY && guideY.hidden)) navigator.vibrate?.(8);
    text.x = snapX ? 50 : x;
    text.y = snapY ? 50 : y;
    guideX.hidden = !snapX;
    guideY.hidden = !snapY;
    syncText();
  };

  const totalStrokePoints = () =>
    edits.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);

  stage.addEventListener("pointerdown", (event) => {
    if (crop) {
      event.preventDefault();
      capturePointer(stage, event);
      crop.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (crop.pointers.size === 2) crop.pinchDistance = pinchDistance();
      return;
    }
    if (startTextDrag(event)) return;
    if (activeTab !== "draw" || !source) return;
    if (totalStrokePoints() > MAX_STROKE_POINTS) {
      notify("that's a lot of drawing ♡ clear some to keep going");
      return;
    }
    event.preventDefault();
    capturePointer(stage, event);
    drawing = { pointerId: event.pointerId, stroke: { ...brush, points: [pointFromEvent(event)] } };
    edits.strokes.push(drawing.stroke);
    queueRender();
  });

  stage.addEventListener("pointermove", (event) => {
    if (crop) {
      if (!crop.pointers.has(event.pointerId)) return;
      event.preventDefault();
      const last = crop.pointers.get(event.pointerId);
      const next = { x: event.clientX, y: event.clientY };
      crop.pointers.set(event.pointerId, next);
      if (crop.pointers.size >= 2) {
        const distance = pinchDistance();
        if (crop.pinchDistance) setCropZoom(crop.zoom * (distance / crop.pinchDistance));
        crop.pinchDistance = distance;
        return;
      }
      const scale = getCropScale();
      crop.centerX -= (next.x - last.x) / scale;
      crop.centerY -= (next.y - last.y) / scale;
      renderCrop();
      return;
    }
    if (textDrag && textDrag.pointerId === event.pointerId) {
      event.preventDefault();
      moveText(event);
      return;
    }
    if (!drawing || drawing.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const points = drawing.stroke.points;
    const last = points[points.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.003) return;
    points.push(point);
    queueRender();
  });

  const endPointer = (event) => {
    if (crop) {
      crop.pointers.delete(event.pointerId);
      crop.pinchDistance = 0;
      return;
    }
    if (textDrag && textDrag.pointerId === event.pointerId) {
      textDrag = null;
      textEl.classList.remove("is-dragging");
      guideX.hidden = true;
      guideY.hidden = true;
      pushHistory();
      return;
    }
    if (drawing && drawing.pointerId === event.pointerId) {
      drawing = null;
      pushHistory();
      syncControls();
    }
  };
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener(
    "wheel",
    (event) => {
      if (!crop) return;
      event.preventDefault();
      setCropZoom(crop.zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08));
    },
    { passive: false },
  );

  cropZoomInput.addEventListener("input", () => setCropZoom(Number(cropZoomInput.value) || 1));
  root.querySelector("#photoCropApplyBtn").addEventListener("click", applyCrop);
  root.querySelector("#photoCropCancelBtn").addEventListener("click", endCrop);

  const requireSource = () => {
    if (source) return true;
    if (sourceLoading) return false;
    notify(
      sourceUrl && !imageCleared ? "choose the photo again to edit it ♡" : "choose a photo first ♡",
    );
    return false;
  };

  const actions = {
    pick: () => fileInput.click(),
    undo: () => {
      if (historyIndex > 0) {
        historyIndex -= 1;
        restore(history[historyIndex]);
      }
    },
    redo: () => {
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        restore(history[historyIndex]);
      }
    },
    "rotate-left": () => {
      if (!requireSource()) return;
      edits.turns = (edits.turns + 3) % 4;
      queueRender();
      pushHistory();
    },
    "rotate-right": () => {
      if (!requireSource()) return;
      edits.turns = (edits.turns + 1) % 4;
      queueRender();
      pushHistory();
    },
    "flip-x": () => {
      if (!requireSource()) return;
      edits.flipX = !edits.flipX;
      queueRender();
      pushHistory();
    },
    "flip-y": () => {
      if (!requireSource()) return;
      edits.flipY = !edits.flipY;
      queueRender();
      pushHistory();
    },
    recrop: () => {
      if (!requireSource()) return;
      const copy = document.createElement("canvas");
      copy.width = source.width;
      copy.height = source.height;
      copy.getContext("2d").drawImage(source, 0, 0);
      startCrop(copy, copy.width, copy.height, false);
    },
    clear: () => {
      if (!source && !sourceUrl && !text.value && !crop) return;
      const doClear = () => {
        if (crop) endCrop();
        source = null;
        sourceUrl = "";
        sourceIsNew = false;
        editable = true;
        imageCleared = true;
        edits = defaultEdits();
        Object.assign(text, {
          value: "",
          color: "#ffffff",
          size: 22,
          x: 50,
          y: 86,
          font: normalizePhotoTextFont(""),
          effect: normalizePhotoTextEffect(""),
        });
        field("photoWidgetImageData").value = "";
        field("photoWidgetOriginal").value = "";
        field("photoWidgetRotate").value = "0";
        syncText();
        syncStage();
        syncControls();
        resetHistory();
        notify("pin cleared ♡");
      };
      if (options.confirm) {
        options.confirm({
          title: "delete everything?",
          message: "the photo, its text and every edit will be removed.",
          confirmLabel: "delete",
          pendingLabel: "deleting...",
          onConfirm: doClear,
        });
      } else {
        doClear();
      }
    },
    "undo-stroke": () => {
      if (!edits.strokes.length) return;
      edits.strokes.pop();
      queueRender();
      pushHistory();
    },
    "clear-drawing": () => {
      if (!edits.strokes.length) return;
      edits.strokes = [];
      queueRender();
      pushHistory();
    },
  };

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-pe]")?.dataset.pe;
    if (action) {
      actions[action]?.();
      return;
    }
    const tab = event.target.closest("[data-pe-tab]");
    if (tab) {
      activeTab = tab.dataset.peTab;
      openPop = "";
      syncControls();
      return;
    }
    const pop = event.target.closest("[data-pe-pop]");
    if (pop) {
      openPop = openPop === pop.dataset.pePop ? "" : pop.dataset.pePop;
      syncControls();
      return;
    }
    const brushButton = event.target.closest("[data-pe-brush]");
    if (brushButton) {
      brush.brush = brushButton.dataset.peBrush;
      syncControls();
      return;
    }
    const swatch = event.target.closest(".pe-swatch");
    if (swatch) {
      const target = swatch.closest("[data-pe-swatches]").dataset.peSwatches;
      if (target === "brush") {
        brush.color = swatch.dataset.color;
        if (brush.brush === "eraser") brush.brush = "pen";
      } else {
        text.color = swatch.dataset.color;
        syncText();
        pushHistory();
      }
      syncControls();
      return;
    }
    const font = event.target.closest("[data-pe-font]");
    if (font) {
      text.font = font.dataset.peFont;
      syncText();
      syncControls();
      pushHistory();
      return;
    }
    const effect = event.target.closest("[data-pe-effect]");
    if (effect) {
      text.effect = effect.dataset.peEffect;
      syncText();
      syncControls();
      pushHistory();
    }
  });

  root.addEventListener("input", (event) => {
    const input = event.target;
    const kind = input.dataset.peInput;
    const value = Number(input.value);
    if (kind === "straighten") {
      if (crop) {
        crop.straighten = value;
        showCropStraighten();
        renderCrop();
        return;
      }
      if (!source) return;
      edits.straighten = value;
      root.querySelector('[data-pe-out="straighten"]').textContent = `${value}°`;
      queueRender();
    } else if (kind === "brush") {
      brush.size = value;
      root.querySelector('[data-pe-out="brush"]').textContent = String(value);
    } else if (kind === "text-size") {
      text.size = value;
      root.querySelector('[data-pe-out="text-size"]').textContent = String(value);
      syncText();
    } else if (input.dataset.peColor === "brush") {
      brush.color = normalizeHex(input.value, brush.color);
      if (brush.brush === "eraser") brush.brush = "pen";
      syncControls();
    } else if (input.dataset.peColor === "text") {
      text.color = normalizeHex(input.value, text.color);
      syncText();
      syncControls();
    } else if (input === textInput) {
      text.value = textInput.value;
      syncText();
    }
  });

  root.addEventListener("change", (event) => {
    const input = event.target;
    if (input.dataset.peInput === "straighten" && crop) return;
    if (input.dataset.peInput && input.dataset.peInput !== "brush") pushHistory();
    if (input.dataset.peColor === "text" || input === textInput) pushHistory();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const dataUrl = options.loadImageFile
        ? await options.loadImageFile(file)
        : await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
      const image = await loadImage(dataUrl);
      startCrop(image, image.naturalWidth, image.naturalHeight, true);
    } catch (error) {
      console.error(error);
      endCrop();
      notify("could not load photo ♡");
    }
  });

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => (crop ? renderCrop() : queueRender()))
      : null;
  resizeObserver?.observe(stage);

  syncText();
  syncControls();
  syncStage();
  initialSignature = startSignature();
  history.push(snapshot());
  historyIndex = 0;
  syncHistoryButtons();
  if (sourceUrl) {
    fallbackImage.src = String(data.image || sourceUrl);
    fallbackImage.style.transform = Number(data.rotate) ? `rotate(${Number(data.rotate)}deg)` : "";
  }
  const loadTimer = window.setTimeout(() => void loadExisting(), 600);

  return {
    commit() {
      if (crop) applyCrop();
      syncText();
      if (imageCleared && !source) {
        field("photoWidgetImageData").value = "";
        field("photoWidgetOriginal").value = "";
        field("photoWidgetEdits").value = "";
        field("photoWidgetRotate").value = "0";
        return;
      }
      if (!source || !editable) {
        field("photoWidgetEdits").value = data.edits ? JSON.stringify(data.edits) : "";
        return;
      }
      const imageChanged =
        sourceIsNew || JSON.stringify(edits) !== JSON.stringify(JSON.parse(initialSignature).edits);
      if (!imageChanged) {
        field("photoWidgetEdits").value = data.edits ? JSON.stringify(data.edits) : "";
        return;
      }
      const size = Math.min(OUTPUT_MAX, source.width);
      const output = renderEdits(document.createElement("canvas"), source, edits, size);
      field("photoWidgetImageData").value = output.toDataURL("image/jpeg", 0.9);
      field("photoWidgetRotate").value = "0";
      if (isDefaultEdits(edits)) {
        field("photoWidgetOriginal").value = "";
        field("photoWidgetEdits").value = "";
      } else {
        field("photoWidgetOriginal").value = sourceIsNew
          ? source.toDataURL("image/jpeg", 0.92)
          : sourceUrl;
        field("photoWidgetEdits").value = JSON.stringify(edits);
      }
    },
    fit: fitTextInput,
    destroy() {
      window.clearTimeout(loadTimer);
      resizeObserver?.disconnect();
    },
  };
}
