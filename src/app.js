import DOMPurify from "dompurify";
import { animateGifImage, forgetGifs } from "./gif-player.js";
import {
  getPhotoTextClasses,
  mountPhotoEditor,
  normalizePhotoTextEffect,
  normalizePhotoTextFont,
} from "./photo-editor.js";
import {
  APP_NAME,
  APP_TAGLINE,
  DEFAULT_DATES,
  GIPHY_API_KEY,
  PEOPLE,
  SAMPLE_WIDGETS,
  TOGETHER_SINCE,
  WEATHER_LOCATIONS,
} from "./app-config.js";
import { createLocalStore } from "./local-store.js";

const dataStore = createLocalStore();
const CUSTOM_WIDGET_ID_PREFIX = "custom-";
const STICKER_MIME_TYPE = "application/x-tandem-sticker";
const ENTRY_IMAGE_BUCKET = "profile-pictures";
const GIPHY_CLIENT_KEY = "tandem_sticker_box";
const GIPHY_SEARCH_ENDPOINT = "https://api.giphy.com/v1/gifs/search";
const GIPHY_STICKER_SEARCH_ENDPOINT = "https://api.giphy.com/v1/stickers/search";
const OPEN_METEO_FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const PROFILE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const PROFILE_PRESENCE_HEARTBEAT_MS = 60 * 1000;
const THINKING_OF_YOU_NOTIFICATION_GROUP_MS = 5 * 60 * 1000;
const THINKING_OF_YOU_STREAK_GAP_MS = 5 * 1000;

const RECENT_GIF_STORAGE_KEY = "recentGifStickers";
const RECENT_GIPHY_STICKER_STORAGE_KEY = "recentGiphyStickers";
const PLACED_GIF_SIZE_STORAGE_KEY = "placedGifStickerSizes";
const PLACED_STICKER_POSITION_STORAGE_KEY = "placedStickerPositions";
const PROFILE_BIO_STORAGE_KEY = "profileBioByUser";
const WIDGET_COMMENT_SEEN_STORAGE_KEY = "widgetCommentSeenAtByUser";
const WIDGET_LAYOUT_STORAGE_KEY = "widgetLayouts";
const PROFILE_BIO_WIDGET_ID = "__profile-bios";
const PROFILE_BIO_WIDGET_TITLE = "profile bios";
const PROFILE_DIRECTORY_SELECT = "id, nickname, username, avatar_url, created_at, bio";
const APP_ZOOM_STORAGE_KEY = "appZoom";
const DEFAULT_APP_ZOOM = 1;
const MIN_APP_ZOOM = 0.25;
const MAX_APP_ZOOM = 2;
const APP_ZOOM_STEP = 0.05;
const DEFAULT_GIF_STICKER_SIZE = 72;
const MIN_GIF_STICKER_SIZE = 44;
const MAX_GIF_STICKER_SIZE = 200;
let hasRenderedEmojiPicker = false;
let gifSearchResults = [];
let gifSearchQuery = "";
let activeGiphySearchType = "gif";
let activeStickerSize = null;
const STICKER_PICKER_GROUPS = [
  {
    label: "hearts + symbols",
    emojis:
      "♡ ♥ ❤ 💕 💖 💗 💘 💙 💚 💛 💜 🖤 🤍 🤎 💔 ❣️ 💞 💓 💟 ☀️ ⭐ 🌟 ✨ ⚡ 💫 🔥 🌈 ☁️ 🌙 🌻 🌸 🌷 🪷 🍀 🎀 🎁 🎈 🫧 💌 📸 🎵 🎶".split(
        " ",
      ),
  },
  {
    label: "smileys",
    emojis:
      "😀 😃 😄 😁 😆 😅 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜 🤪 😝 🫠 🤗 🤭 🫢 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 😵 😵‍💫 🤯 🥴 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👻 👽 🤖".split(
        " ",
      ),
  },
  {
    label: "people",
    emojis:
      "👋 🤚 🖐️ ✋ 🖖 🫶 🫰 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫡 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 👀 👁️ 👄 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 👵 👴".split(
        " ",
      ),
  },
  {
    label: "animals + nature",
    emojis:
      "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🐣 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪲 🦋 🐌 🐞 🐢 🐍 🦎 🦂 🦀 🐙 🐠 🐟 🐬 🐳 🐋 🦭 🪼 🌱 🌿 ☘️ 🍃 🍂 🍁 🌵 🌴 🌳 🌲 🌹 🌺 🌼 🌸 🌞 🌝 🌛 🌜 ⭐ 🌎 🌍 🌏".split(
        " ",
      ),
  },
  {
    label: "food + drink",
    emojis:
      "🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🫒 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🍄 🥜 🫘 🍞 🥐 🥖 🫓 🥨 🥯 🧀 🍳 🧈 🥞 🧇 🥓 🍔 🍟 🍕 🌭 🌮 🌯 🥪 🥙 🧆 🍝 🍜 🍲 🍛 🍣 🍱 🍤 🍙 🍚 🍘 🍥 🍡 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 ☕ 🍵 🧃 🥤 🧋".split(
        " ",
      ),
  },
  {
    label: "activities + travel",
    emojis:
      "⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🪀 🏓 🏸 🥅 🥊 🎳 🎮 🕹️ 🎲 ♟️ 🎯 🎨 🎭 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🪕 🎻 🛼 🛹 🛴 🚲 🛵 🏎️ 🚗 🚕 🚙 🚌 🚎 🚓 🚑 🚒 🚚 🚲 ✈️ 🛫 🛬 🚀 🛸 🚁 ⛵ 🚤 🚢 🗺️ 🧭 ⛺ 🏕️ 🗽 🗼 🏰 🎡 🎢 🎠 🌋 🏝️ 🏖️ 🏜️ 🏞️".split(
        " ",
      ),
  },
  {
    label: "objects",
    emojis:
      "⌚ 📱 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💾 💿 📷 📹 🎥 📞 ☎️ 📺 📻 🎙️ ⏰ ⌛ ⏳ 🔋 🔌 💡 🔦 🕯️ 🧯 🪞 🚿 🛁 🧼 🪥 🧽 🧸 🛍️ 💎 🔑 🗝️ 🔒 🔓 🧰 🧲 🪜 ⚙️ 🪛 🔧 🔨 ⚒️ 🧱 🪵 🧪 🧫 🧬 💊 💉 🩹 🩺 📚 📖 📝 ✏️ 📌 📍 ✂️ 📎 📐 📏 💰 💳 💵 💴 💶 💷 ⚖️ 🔔 🛎️".split(
        " ",
      ),
  },
  {
    label: "symbols",
    emojis:
      "➕ ➖ ✖️ ➗ 🟰 ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 〰️ 💱 💲 ⚜️ 🔱 📛 🔰 ⭕ ✅ ☑️ ✔️ ❌ ❎ ➰ ➿ 〽️ ✳️ ✴️ ❇️ ©️ ®️ ™️ #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 ⏺️ ⏹️ ⏸️ ▶️ ⏯️ ◀️ 🔼 🔽 ⏫ ⏬ ◾ ◽ ▪️ ▫️ ⬛ ⬜ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 🔺 🔻 🔶 🔷 🔸 🔹".split(
        " ",
      ),
  },
];
const floatingDecor = [
  { icon: "✦", top: "4%", left: "5%", size: "22px", delay: "0s" },
  { icon: "♡", top: "8%", right: "8%", size: "28px", delay: "0.6s" },
  { icon: "☁", top: "16%", left: "18%", size: "34px", delay: "1.2s" },
  { icon: "ᰔ", top: "14%", right: "20%", size: "28px", delay: "1.8s" },
  { icon: "✦", top: "26%", left: "10%", size: "20px", delay: "0.9s" },
  { icon: "♡", top: "34%", right: "10%", size: "24px", delay: "1.4s" },
  { icon: "☁", top: "48%", left: "4%", size: "34px", delay: "2.2s" },
  { icon: "✦", top: "57%", right: "18%", size: "22px", delay: "0.3s" },
  { icon: "ᰔ", top: "70%", left: "14%", size: "28px", delay: "1.7s" },
  { icon: "♡", top: "78%", right: "5%", size: "28px", delay: "2.5s" },
  { icon: "☁", top: "86%", left: "24%", size: "34px", delay: "0.8s" },
  { icon: "✦", top: "90%", right: "24%", size: "20px", delay: "1.9s" },
  { icon: "♡", top: "18%", left: "48%", size: "18px", delay: "1.3s" },
  { icon: "✦", top: "64%", left: "52%", size: "18px", delay: "2.1s" },
  { icon: "☁", top: "8%", left: "72%", size: "26px", delay: "0.5s" },
];
const sparkleDecor = Array.from({ length: 42 }, (_, index) => ({
  icon: "✦",
  top: `${((index * 37) % 96) + 1}%`,
  left: `${((index * 53) % 96) + 1}%`,
  size: `${30 + (index % 4)}px`,
  delay: `${(index % 14) * 0.32}s`,
  duration: `${3.4 + (index % 6) * 0.45}s`,
}));
const fadingEmojiIcons = ["♡", "ᰔ", "✧", "☾", "☁", "✿", "✉", "∘", "❀", "⋆", "♥", "✦", "♡", "✧"];
const fadingEmojiDecor = Array.from({ length: 72 }, (_, index) => ({
  icon: fadingEmojiIcons[index % fadingEmojiIcons.length],
  top: `${((index * 61.803 + 7) % 96) + 1}%`,
  left: `${((index * 38.197 + 23) % 96) + 1}%`,
  size: `${16 + (index % 5) * 2}px`,
  delay: `${((index * 0.53) % 7).toFixed(2)}s`,
  duration: `${3.6 + (index % 7) * 0.5}s`,
}));

let widgets = [
  {
    id: "song",
    title: "₊˚⊹ on repeat ♫",
    side: "left",
    x: 8,
    y: 20,
    data: {
      spotifyUrl: "",
      spotifyUri: "",
      ...SAMPLE_WIDGETS.song,
      accent: 38,
    },
  },
  {
    id: "⋆𐙚₊quick note˚⊹♡",
    title: "⋆𐙚₊quick note˚⊹♡",
    side: "left",
    x: 16,
    y: 442,
    data: {
      text: SAMPLE_WIDGETS.note,
    },
  },

  {
    id: ". ݁₊ ⊹ . ݁ dates ݁ . ⊹ ₊ ݁.",
    title: "⊹ ࣪ ˖dates to remember⊹ ࣪ ˖",
    side: "right",
    x: 8,
    y: 34,
    data: {
      items: DEFAULT_DATES.map((item) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : item.title,
        ...item,
      })),
    },
  },

  {
    id: "𓂃˖˳·˖ ִֶָ ⋆bucket list⋆ ִֶָ˖·˳˖𓂃",
    title: "𓂃˖˳·˖ ִֶָ ⋆bucket list⋆ ִֶָ˖·˳˖𓂃",
    side: "left",
    x: 4,
    y: 585,
    data: {
      items: SAMPLE_WIDGETS.bucketList.map((text, index) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `wish${index}`,
        text,
        done: false,
      })),
    },
  },

  {
    id: "weather",
    title: "☁ ˚｡ sky watch ₊˚",
    side: "left",
    x: 8,
    y: 862,
    data: {
      locations: [],
      status: "idle",
      message: SAMPLE_WIDGETS.weather,
    },
  },

  {
    id: "thinking-of-you",
    title: "˚₊‧ thinking of you ‧₊˚",
    side: "right",
    x: 8,
    y: 462,
    data: {
      countsByUser: {},
      totalCountsByUser: {},
      lastResetDate: "",
      message: SAMPLE_WIDGETS.thinkingOfYou,
    },
  },

  {
    id: "together",
    title: "｡ ₊°༺ days together ༻°₊ ｡",
    side: "right",
    x: 28,
    y: 262,
    data: {
      startDate: TOGETHER_SINCE,
      message: SAMPLE_WIDGETS.together,
    },
  },

  {
    id: "keepsake",
    title: "₊˚⊹ keepsake ♡",
    side: "left",
    x: 12,
    y: 1162,
    data: {
      ...SAMPLE_WIDGETS.keepsakes[0],
      textColor: "#ffffff",
      textSize: 22,
      textX: 50,
      textY: 86,
      rotate: 0,
    },
  },

  {
    id: "keepsake-right",
    title: "♡ keepsake ⊹˚₊",
    side: "right",
    x: 12,
    y: 768,
    data: {
      ...SAMPLE_WIDGETS.keepsakes[1],
      textColor: "#ffffff",
      textSize: 22,
      textX: 50,
      textY: 86,
      rotate: 0,
    },
  },
];

function isCustomWidget(widget) {
  return String(widget?.id || "").startsWith(CUSTOM_WIDGET_ID_PREFIX);
}

function getWidgetDataObject(widget) {
  if (widget?.data && typeof widget.data === "object" && !Array.isArray(widget.data)) {
    return widget.data;
  }

  return {};
}

function getWidgetMobileOrder(widget, fallbackOrder = 0) {
  const mobileOrder = getWidgetDataObject(widget).mobileOrder;
  return Number.isFinite(mobileOrder) ? mobileOrder : fallbackOrder;
}

function setWidgetMobileOrder(widget, order) {
  widget.data = {
    ...getWidgetDataObject(widget),
    mobileOrder: order,
  };
}

function normalizeWidgetMobileOrders(widgetList = widgets) {
  const sideOrders = {
    left: new Set(),
    right: new Set(),
  };

  const needsReset = widgetList.some((widget) => {
    const side = widget?.side === "right" ? "right" : "left";
    const mobileOrder = getWidgetDataObject(widget).mobileOrder;

    if (!Number.isFinite(mobileOrder) || sideOrders[side].has(mobileOrder)) {
      return true;
    }

    sideOrders[side].add(mobileOrder);
    return false;
  });

  if (!needsReset) {
    return [];
  }

  const sideCounts = {
    left: 0,
    right: 0,
  };
  const changedWidgets = [];

  widgetList.forEach((widget) => {
    const side = widget?.side === "right" ? "right" : "left";
    const nextOrder = sideCounts[side];
    sideCounts[side] += 1;

    if (getWidgetMobileOrder(widget, -1) !== nextOrder) {
      setWidgetMobileOrder(widget, nextOrder);
      changedWidgets.push(widget);
    }
  });

  return changedWidgets;
}

function getWidgetsForSideInMobileOrder(side) {
  return [...widgets]
    .filter((widget) => (widget?.side === "right" ? "right" : "left") === side)
    .sort((a, b) => {
      const orderDifference = getWidgetMobileOrder(a, 0) - getWidgetMobileOrder(b, 0);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (a.zIndex || 0) - (b.zIndex || 0);
    });
}

const MOBILE_WIDGET_LAYOUT = {
  right: ["keepsake", "keepsake-right", "thinking-of-you", "song", "note"],
  left: ["bucketlist", "weather", "dates", "together"],
};

function getWidgetMobileTabOrders(widget) {
  const data = getWidgetDataObject(widget);
  return data.mobileTabOrders && typeof data.mobileTabOrders === "object"
    ? data.mobileTabOrders
    : {};
}

function getWidgetMobileTabOrder(widget, side, fallbackOrder = 0) {
  const order = Number(getWidgetMobileTabOrders(widget)[side]);
  return Number.isFinite(order) ? order : fallbackOrder;
}

function setWidgetMobileTabOrder(widget, side, order) {
  const data = getWidgetDataObject(widget);
  widget.data = {
    ...data,
    mobileTabOrders: {
      ...(data.mobileTabOrders && typeof data.mobileTabOrders === "object"
        ? data.mobileTabOrders
        : {}),
      [side]: order,
    },
  };
}

function getWidgetMobileRole(widget) {
  const normalizedId = String(widget?.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget?.title || "").toLowerCase();

  if (normalizedId === "song") return "song";
  if (normalizedId === "weather" || normalizedTitle.includes("sky watch")) return "weather";
  if (normalizedId === "thinking-of-you" || normalizedTitle.includes("thinking of you"))
    return "thinking-of-you";
  if (normalizedId === "together") return "together";
  if (normalizedId === "bucketlist" || normalizedTitle.includes("bucket list")) return "bucketlist";
  if (normalizedId === "dates" || normalizedTitle.includes("dates to remember")) return "dates";
  if (normalizedId === "note" || normalizedTitle.includes("quick note")) return "note";
  if (normalizedId === "keepsake" || normalizedId === "keepsake-right") return normalizedId;
  if (normalizedTitle.includes("keepsake")) return "keepsake";

  return "";
}

function getMobileWidgetForRole(role) {
  return widgets.find((widget) => getWidgetMobileRole(widget) === role);
}

function getMobileWidgetRenderItems() {
  const builtInItems = Object.entries(MOBILE_WIDGET_LAYOUT).flatMap(([side, roles]) =>
    roles.flatMap((role, order) => {
      const widget = getMobileWidgetForRole(role);
      if (!widget) return [];

      return {
        widget,
        renderId: widget.id,
        sourceId: widget.id,
        side,
        order: getWidgetMobileTabOrder(widget, side, order),
      };
    }),
  );

  const customItems = widgets.filter(isCustomWidget).map((widget, index) => {
    const side = widget.side === "right" ? "right" : "left";
    return {
      widget,
      renderId: widget.id,
      sourceId: widget.id,
      side,
      order: getWidgetMobileTabOrder(widget, side, MOBILE_WIDGET_LAYOUT[side].length + index),
    };
  });

  return [...builtInItems, ...customItems];
}

function sortMobileRenderItems(items) {
  return [...items].sort((a, b) => {
    const orderDifference = a.order - b.order;
    if (orderDifference !== 0) return orderDifference;
    return (
      MOBILE_WIDGET_LAYOUT[a.side].indexOf(a.renderId) -
      MOBILE_WIDGET_LAYOUT[b.side].indexOf(b.renderId)
    );
  });
}

async function moveMobileWidgetInOrder(renderId, direction) {
  const renderItems = getMobileWidgetRenderItems();
  const currentItem = renderItems.find((item) => item.renderId === renderId);
  if (!currentItem) return;

  const sideItems = sortMobileRenderItems(
    renderItems.filter((item) => item.side === currentItem.side),
  );
  const currentIndex = sideItems.findIndex((item) => item.renderId === renderId);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : direction === "down" ? currentIndex + 1 : currentIndex;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= sideItems.length) {
    return;
  }

  [sideItems[currentIndex], sideItems[targetIndex]] = [
    sideItems[targetIndex],
    sideItems[currentIndex],
  ];

  const changedWidgets = [];
  sideItems.forEach((item, index) => {
    const sourceWidget = widgets.find((widget) => widget.id === item.sourceId);
    if (!sourceWidget) return;

    if (getWidgetMobileTabOrder(sourceWidget, item.side, -1) !== index) {
      setWidgetMobileTabOrder(sourceWidget, item.side, index);
      changedWidgets.push(sourceWidget);
    }
  });

  renderWidgets();

  const uniqueChangedWidgets = changedWidgets.filter(
    (widget, index, list) => list.findIndex((item) => item.id === widget.id) === index,
  );
  uniqueChangedWidgets.forEach((item) =>
    queueWidgetSave(item, { changedKeys: ["mobileTabOrders"], recordHistory: false }),
  );
}

async function moveWidgetInMobileOrder(widgetId, direction) {
  if (isTabbedLayoutActive()) {
    await moveMobileWidgetInOrder(widgetId, direction);
    return;
  }

  const widget = widgets.find((item) => item.id === widgetId);
  if (!widget) return;

  const side = widget.side === "right" ? "right" : "left";
  const orderedWidgets = getWidgetsForSideInMobileOrder(side);
  const currentIndex = orderedWidgets.findIndex((item) => item.id === widgetId);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : direction === "down" ? currentIndex + 1 : currentIndex;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= orderedWidgets.length) {
    return;
  }

  [orderedWidgets[currentIndex], orderedWidgets[targetIndex]] = [
    orderedWidgets[targetIndex],
    orderedWidgets[currentIndex],
  ];

  const changedWidgets = [];

  orderedWidgets.forEach((item, index) => {
    if (getWidgetMobileOrder(item, -1) !== index) {
      setWidgetMobileOrder(item, index);
      changedWidgets.push(item);
    }
  });

  renderWidgets();

  changedWidgets.forEach((item) =>
    queueWidgetSave(item, { changedKeys: ["mobileOrder"], recordHistory: false }),
  );
}

normalizeWidgetMobileOrders(widgets);

let posts = [];

const TIMELINE_PAGE_SIZE = 12;
const POST_CONTENT_CHUNK_SIZE = 40;
let timelineVisibleCount = TIMELINE_PAGE_SIZE;
const timelineFilters = { query: "", from: "", to: "", onThisDay: false };
let timelineSearchMatchIds = null;
let timelineSearchToken = 0;
let timelineSearchTimer = 0;
let timelineToolsEl = null;
let timelineSearchOpen = false;
let timelinePagerObserver = null;
let timelineLoadMoreInFlight = false;
let timelineScrubberDragging = false;
let timelineScrubberQuietUntil = 0;
let timelineLoadAfterScrub = false;
const postContentRequests = new Map();
let stickerTargetPostId = null;
let entryDraftTimer = 0;
let entryDraftSuppressed = 0;
let sessionExpiredNoticeShown = false;
let userInitiatedLogout = false;
let sessionRecoveryPromise = null;
let bootPaintedFromSnapshot = false;
const AUTH_EXPIRED_PATTERN =
  /jwt expired|invalid jwt|jwt.*(malformed|invalid)|refresh token|session (not found|missing|expired)|auth session missing|not authenticated/i;
const ENTRY_DRAFT_STORAGE_KEY = "entryDraftsV1";

let placedStickers = [];
let notifications = [];
let notificationSourceData = {
  postsData: [],
  commentsData: [],
  likesData: [],
  stickersData: [],
  profilesData: [],
};
let popupScrollLockTop = 0;
let popupScrollLockLeft = 0;
let popupScrollLockBodyStyles = null;
let activeSticker = null;
let dragWidget = null;
let draggingPlacedSticker = null;
let knownProfiles = [];
let activeProfilePopupUserId = "";
let profilePopupEditMode = false;
const visibleGifStickerControlTimers = new Map();
const minimizedWidgetIds = new Set();
const previousMobileWidgetRects = new Map();
let liveUpdatesChannel = null;
let liveRefreshTimer = 0;
let liveRefreshInFlight = false;
let liveRefreshQueued = false;
let liveRefreshIncludeWidgets = false;
let entrySaveInFlight = false;
let widgetSaveInFlight = false;
let commentWritesInFlight = 0;
let timelineEditVersion = 0;
let timelineWritesInFlight = 0;
let profileSaveInFlight = false;
let profilePresenceHeartbeatId = 0;
let profileLastSeenFieldSupported = null;
let lastPresenceSyncAt = 0;
let currentCommentsPostId = null;
let replyingToCommentId = null;
let replyingToItemId = null;
let pendingCommentFocusId = "";
let pendingWidgetCommentFocusId = "";
let openWidgetCommentsId = "";
const activePhotoWidgetReplyTargets = new Map();
const activePhotoWidgetReplyItems = new Map();
let editingWidgetId = null;
let editingPostId = null;
let pendingConfirmation = null;
let pendingWidgetDrag = null;
let currentUser = null;
let entryQuill = null;
let sharedProfileBios = {};
let sharedProfileBiosFetchPromise = null;
const likeWrites = new Map();
const pendingLocalWidgetUpdates = new Map();
const widgetLocalSaveTimes = new Map();
const widgetPositionSaves = new Map();
const WIDGET_POSITION_SAVE_TRIES = 3;
const widgetServerData = new Map();
const PENDING_POST_ID_PREFIX = "pending-";
let pendingSaves = [];
const pendingLocalProfileFetches = new Map();
const recentLocalRealtimeTables = new Map();

const floatingDecorEl = document.getElementById("floatingDecor");
const leftZone = document.getElementById("leftZone");
const rightZone = document.getElementById("rightZone");
const timelineEl = document.getElementById("timeline");
const mobileViewSwitcher = document.getElementById("mobileViewSwitcher");
const mobileViewButtons = Array.from(
  document.querySelectorAll(".mobile-view-btn[data-mobile-view]"),
);
const launchSplash = document.getElementById("launchSplash");
const stickerPopup = document.getElementById("stickerPopup");
const stickerTabs = document.getElementById("stickerTabs");
const stickerInput = document.getElementById("stickerInput");
const typedStickerPreviewWrap = document.getElementById("typedStickerPreviewWrap");
const typedStickerPreview = document.getElementById("typedStickerPreview");
const emojiPickerGrid = document.getElementById("emojiPickerGrid");
const gifPickerGrid = document.getElementById("gifPickerGrid");
const gifSearchInput = document.getElementById("gifSearchInput");
const gifSearchBtn = document.getElementById("gifSearchBtn");
const gifSearchStatus = document.getElementById("gifSearchStatus");
const closeStickerPopup = document.getElementById("closeStickerPopup");
const appToolbar = document.getElementById("appToolbar");
const newEntryBtn = document.getElementById("newEntryBtn");
const layoutEl = document.querySelector(".layout");
const headerEl = document.querySelector(".toolbar");
const notificationsMenu = document.getElementById("notificationsMenu");
const notificationsBtn = document.getElementById("notificationsBtn");
const notificationsBadge = document.getElementById("notificationsBadge");
const notificationsPanel = document.getElementById("notificationsPanel");
const notificationsList = document.getElementById("notificationsList");
const clearNotificationsBtn = document.getElementById("clearNotificationsBtn");
const closeNotificationsBtn = document.getElementById("closeNotificationsBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const zoomValueLabel = document.getElementById("zoomValueLabel");
const themeToggle = document.getElementById("themeToggle");
const entryPopup = document.getElementById("entryPopup");
const entryPopupTitle = entryPopup?.querySelector(".popup-title");
const entryPopupLabel = entryPopup?.querySelector(".popup-label");
const closeEntryPopup = document.getElementById("closeEntryPopup");
const entryEditor = document.getElementById("entryEditor");
const entryContentFallback = document.getElementById("entryContentFallback");
const entryImageInput = document.getElementById("entryImageInput");
const entryImageData = document.getElementById("entryImageData");
const entryImagePreview = document.getElementById("entryImagePreview");
const removeEntryImageBtn = document.getElementById("removeEntryImageBtn");
const saveEntryBtn = document.getElementById("saveEntryBtn");
const commentsPopup = document.getElementById("commentsPopup");
const closeCommentsPopup = document.getElementById("closeCommentsPopup");
const commentsListLabel = document.getElementById("commentsListLabel");
const commentsList = document.getElementById("commentsList");
const commentInput = document.getElementById("commentInput");
const saveCommentBtn = document.getElementById("saveCommentBtn");
const commentContextEl = document.getElementById("commentContext");
const deleteEntryPopup = document.getElementById("deleteEntryPopup");
const confirmPopupTitle = document.getElementById("confirmPopupTitle");
const confirmPopupText = document.getElementById("confirmPopupText");
const cancelDeleteEntryBtn = document.getElementById("cancelDeleteEntryBtn");
const confirmDeleteEntryBtn = document.getElementById("confirmDeleteEntryBtn");
const widgetPopup = document.getElementById("widgetPopup");
const closeWidgetPopup = document.getElementById("closeWidgetPopup");
const widgetPopupTitle = document.getElementById("widgetPopupTitle");
const headerSaveWidgetBtn = document.getElementById("headerSaveWidgetBtn");
const widgetEditorFields = document.getElementById("widgetEditorFields");
const saveWidgetBtn = document.getElementById("saveWidgetBtn");
const clearWidgetHistoryBtn = document.getElementById("clearWidgetHistoryBtn");
const widgetPopupCard = widgetPopup?.querySelector(".popup-card") || null;
const widgetCommentsPopup = document.getElementById("widgetCommentsPopup");
const closeWidgetCommentsPopup = document.getElementById("closeWidgetCommentsPopup");
const widgetCommentsPopupTitle = document.getElementById("widgetCommentsPopupTitle");
const widgetCommentsPopupFields = document.getElementById("widgetCommentsPopupFields");
let lastScrollY = window.scrollY || 0;
let floatingEntryVisibilityFrame = 0;
let mobileViewSwitcherFrame = 0;
const THEME_STORAGE_KEY = "tandemTheme";
const PHONE_LAYOUT_QUERY = "(max-width: 720px)";
const phoneLayoutMedia = window.matchMedia?.(PHONE_LAYOUT_QUERY);
const reducedMotionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const MOTION_EASING = "cubic-bezier(0.33, 0, 0.2, 1)";
const MOBILE_VIEW_ORDER = ["left", "timeline", "right"];
const MOBILE_VIEW_SLOTS = { left: -1, timeline: 0, right: 1 };
const MOBILE_LAYOUT_END_SPACE = 64;
const MOBILE_SWIPE_MIN_DISTANCE = 44;
const MOBILE_SWIPE_AXIS_RATIO = 1.12;
const MOBILE_SWIPE_LOCK_DISTANCE = 14;
const MOBILE_SWIPE_MIN_FLICK_DISTANCE = 30;
const MOBILE_SWIPE_VERTICAL_LOCK_RATIO = 1.28;
const MOBILE_SWIPE_COMMIT_VELOCITY = 0.32;
const MOBILE_SWIPE_VELOCITY_WINDOW_MS = 100;
const MOBILE_SWIPE_VELOCITY_STALE_MS = 60;
const MOBILE_SLIDE_EASE_X = 0.33;
const BOOT_SPLASH_MIN_MS = 1600;
const BOOT_SPLASH_FADE_MS = 450;
const INITIAL_TIMELINE_IMAGE_COUNT = 8;
const LIVE_REFRESH_DEBOUNCE_MS = 450;
const bootStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
let activeMobileView = "timeline";
let wasTabbedLayoutActive = isTabbedLayoutActive();
let mobileViewSwipeGesture = null;
let mobileViewSlide = null;
let mobileViewSwipeClickBlockUntil = 0;
const mobileViewScrollTops = {};
let mobileLayoutFloorScroll = 0;

function decoratedLabelMarkup(prefix, label, suffix = "") {
  return `${prefix ? `<span aria-hidden="true">${escapeHtml(prefix)}</span>` : ""}${escapeHtml(label)}${
    suffix ? `<span aria-hidden="true">${escapeHtml(suffix)}</span>` : ""
  }`;
}

function normalizeChromeSymbols() {
  const chromeLabels = [
    [".site-title", "˗ˏˋ ⁺ ‧ ₊ ˚ ཐི ⋆ ", APP_NAME.toUpperCase(), " ⋆ ཋྀ ˚ ₊ ‧ ⁺ ˎˊ˗"],
    [".quote-pill", "⊹˚₊ ", APP_TAGLINE, " ₊˚⊹"],
    [".notifications-title", "", "inbox", " ♡"],
    ["#profilePopup .popup-title", "", "my profile", " ♡"],
    ["#entryPopup .popup-title", "", "new entry", " ✎"],
    ["#entryPopup .popup-label", "", "write something", " ♡"],
    ["#commentsPopup .popup-title", "", "comments", " ♡"],
    ["#stickerPopup .popup-title", "˚୨୧⋆｡˚ ⋆", "reactions", "₍ᐢ. .ᐢ₎ ₊˚⊹♡"],
  ];

  chromeLabels.forEach(([selector, prefix, label, suffix]) => {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = decoratedLabelMarkup(prefix, label, suffix);
  });
}

function setHeaderWidgetSaveVisibility(isVisible) {
  if (!headerSaveWidgetBtn) return;
  headerSaveWidgetBtn.hidden = !isVisible;
  headerSaveWidgetBtn.style.display = isVisible ? "inline-flex" : "none";
}

function markPendingLocalWidgetUpdate(widgetId, updatedAt) {
  const normalizedWidgetId = String(widgetId || "").trim();
  const normalizedUpdatedAt = String(updatedAt || "").trim();

  if (!normalizedWidgetId || !normalizedUpdatedAt) return;

  pendingLocalWidgetUpdates.set(normalizedWidgetId, normalizedUpdatedAt);
  window.setTimeout(() => {
    if (pendingLocalWidgetUpdates.get(normalizedWidgetId) === normalizedUpdatedAt) {
      pendingLocalWidgetUpdates.delete(normalizedWidgetId);
    }
  }, 7000);
}

function getCachedWidgetLayouts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WIDGET_LAYOUT_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function cacheWidgetLayout(widget, updatedAt = new Date().toISOString()) {
  if (!widget?.id) return;

  const layouts = getCachedWidgetLayouts();
  layouts[widget.id] = {
    side: widget.side === "right" ? "right" : "left",
    x: Math.round(Number(widget.x) || 0),
    y: Math.round(Number(widget.y) || 0),
    zIndex: Number.isFinite(widget.zIndex) ? widget.zIndex : 1,
    updatedAt,
  };

  try {
    localStorage.setItem(WIDGET_LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  } catch (error) {
    console.error(error);
  }
}

function markCachedWidgetLayoutUnsaved(widgetId) {
  const layouts = getCachedWidgetLayouts();
  if (!layouts[widgetId]) return;
  layouts[widgetId].unsaved = true;
  try {
    localStorage.setItem(WIDGET_LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  } catch (error) {
    console.error(error);
  }
}

function applyCachedWidgetLayout(widget, savedUpdatedAt = "") {
  if (!widget?.id) return;

  const cachedLayout = getCachedWidgetLayouts()[widget.id];
  if (!cachedLayout || typeof cachedLayout !== "object") return;

  const cachedTime = new Date(cachedLayout.updatedAt || 0).getTime();
  const savedTime = new Date(savedUpdatedAt || 0).getTime();

  if (savedTime && cachedTime < savedTime && !cachedLayout.unsaved) return;

  if (cachedLayout.side === "left" || cachedLayout.side === "right") {
    widget.side = cachedLayout.side;
  }

  if (Number.isFinite(cachedLayout.x)) {
    widget.x = cachedLayout.x;
  }

  if (Number.isFinite(cachedLayout.y)) {
    widget.y = cachedLayout.y;
  }

  if (Number.isFinite(cachedLayout.zIndex)) {
    widget.zIndex = cachedLayout.zIndex;
  }
}

function isTabbedLayoutActive() {
  return isMobileLayoutActive();
}

function isMobileLayoutActive() {
  return Boolean(phoneLayoutMedia?.matches);
}

function syncMobileViewButtons(view = activeMobileView) {
  mobileViewButtons.forEach((button) => {
    const isActive = button.dataset.mobileView === view;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getMobileViewSection(view) {
  if (view === "left") return leftZone;
  if (view === "right") return rightZone;
  return timelineEl;
}

function getAdjacentMobileView(direction) {
  const currentIndex = MOBILE_VIEW_ORDER.indexOf(activeMobileView);
  const nextIndex = currentIndex + direction;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= MOBILE_VIEW_ORDER.length) {
    return "";
  }

  return MOBILE_VIEW_ORDER[nextIndex];
}

function isHorizontalScrollableElement(el) {
  if (!el || el === document.body || el === document.documentElement) {
    return false;
  }

  const style = window.getComputedStyle(el);
  const canScrollX = /(auto|scroll)/.test(style.overflowX);
  return canScrollX && el.scrollWidth > el.clientWidth + 4;
}

function shouldIgnoreMobileViewSwipe(target) {
  if (!target?.closest) return false;
  if (window.getSelection()?.isCollapsed === false) return true;

  if (
    target.closest(
      [
        ".popup.open",
        ".notifications-panel",
        ".mobile-view-switcher",
        ".sticker-tabs",
        ".reaction-sticker",
        ".timeline-scrubber",
        ".gif-picker-grid",
        ".emoji-picker-grid",
        ".ql-editor",
        "button",
        "a[href]",
        "input",
        "textarea",
        "select",
        "[contenteditable='true']",
      ].join(","),
    )
  ) {
    return true;
  }

  let node = target instanceof Element ? target : target.parentElement;
  while (node && node !== document.body) {
    if (isHorizontalScrollableElement(node)) return true;
    node = node.parentElement;
  }

  return false;
}

function handleMobileViewSwipeStart(event) {
  finishMobileViewSlide();
  mobileViewSwipeClickBlockUntil = 0;

  if (
    !isTabbedLayoutActive() ||
    event.touches.length !== 1 ||
    shouldIgnoreMobileViewSwipe(event.target)
  ) {
    mobileViewSwipeGesture = null;
    return;
  }

  const touch = event.touches[0];
  mobileViewSwipeGesture = {
    startX: touch.clientX,
    startY: touch.clientY,
    samples: [{ x: touch.clientX, time: event.timeStamp }],
    velocityX: 0,
    lockedAxis: "",
    lockX: 0,
    offset: 0,
    dragging: false,
    offsets: {},
    scrollTops: {},
    width: window.innerWidth,
  };
}

function getMobileViewX(view, activeView = activeMobileView) {
  return (MOBILE_VIEW_SLOTS[view] - MOBILE_VIEW_SLOTS[activeView]) * window.innerWidth;
}

function moveMobileView(view, x, y = 0) {
  const transform = `translate3d(${x}px, ${y}px, 0)`;
  const section = getMobileViewSection(view);
  if (section) section.style.transform = transform;
  if (view === "timeline" && newEntryBtn) newEntryBtn.style.transform = transform;
}

function placeMobileViews() {
  const isTabbed = isTabbedLayoutActive();
  MOBILE_VIEW_ORDER.forEach((view) => {
    if (isTabbed) {
      moveMobileView(view, getMobileViewX(view));
    } else {
      const section = getMobileViewSection(view);
      if (section) section.style.transform = "";
      if (view === "timeline" && newEntryBtn) newEntryBtn.style.transform = "";
    }
  });
  if (headerEl) headerEl.style.transform = "";
  if (layoutEl) {
    layoutEl.style.marginTop = "";
    layoutEl.style.paddingTop = "";
  }
  if (isTabbed) placeMobileViewPill();
  syncMobileLayoutHeight();
}

function syncMobileLayoutHeight(minHeight = 0) {
  if (!layoutEl) return;
  if (!isTabbedLayoutActive()) {
    layoutEl.style.height = "";
    return;
  }
  const active = getMobileViewSection(activeMobileView);
  const height = (active?.offsetHeight || 0) + MOBILE_LAYOUT_END_SPACE;
  layoutEl.style.height = `${Math.max(height, minHeight, getMobileLayoutFloorHeight())}px`;
}

function getMobileLayoutFloorHeight() {
  if (!mobileLayoutFloorScroll) return 0;
  const layoutTop = layoutEl.getBoundingClientRect().top + window.scrollY;
  const pageEnd = parseFloat(getComputedStyle(layoutEl.parentElement).paddingBottom) || 0;
  return mobileLayoutFloorScroll + window.innerHeight - layoutTop - pageEnd;
}

function placeNewEntryButton() {
  if (!newEntryBtn || !layoutEl) return;
  const isTabbed = isTabbedLayoutActive();
  if (isTabbed && newEntryBtn.parentElement !== layoutEl) {
    layoutEl.prepend(newEntryBtn);
  } else if (!isTabbed && newEntryBtn.parentElement === layoutEl) {
    layoutEl.before(newEntryBtn);
  }
}

function getMobileViewScrollTop(view) {
  const section = getMobileViewSection(view);
  const layoutTop = layoutEl.getBoundingClientRect().top + window.scrollY;
  const pageEnd = parseFloat(getComputedStyle(layoutEl.parentElement).paddingBottom) || 0;
  const pageHeight = layoutTop + (section?.offsetHeight || 0) + MOBILE_LAYOUT_END_SPACE + pageEnd;
  return Math.max(0, Math.min(mobileViewScrollTops[view] || 0, pageHeight - window.innerHeight));
}

function prepareMobileViews(views) {
  const offsets = {};
  const scrollTops = {};
  let height = layoutEl.offsetHeight;
  let reachUp = 0;
  views.forEach((view) => {
    scrollTops[view] = getMobileViewScrollTop(view);
    offsets[view] = window.scrollY - scrollTops[view];
    reachUp = Math.max(reachUp, -offsets[view]);
    height = Math.max(
      height,
      offsets[view] + (getMobileViewSection(view)?.offsetHeight || 0) + MOBILE_LAYOUT_END_SPACE,
    );
  });
  layoutEl.style.marginTop = `${-reachUp}px`;
  layoutEl.style.paddingTop = `${reachUp}px`;
  layoutEl.style.height = `${height + reachUp}px`;
  return {
    offsets,
    scrollTops,
    startScroll: window.scrollY,
    headerTop: headerEl?.getBoundingClientRect().top || 0,
    headerHeight: headerEl?.offsetHeight || 0,
  };
}

function getMobileHeaderShift(drag, scrollTop, progress) {
  if (scrollTop === undefined) return 0;
  const limit = -(drag.headerHeight + 24);
  const from = Math.max(drag.headerTop, limit);
  const to = Math.max(drag.headerTop + drag.startScroll - scrollTop, limit);
  return from + (to - from) * progress - drag.headerTop;
}

const mobileViewPill = mobileViewSwitcher?.querySelector(".mobile-view-pill");

function getMobileViewPillX(view) {
  const button = mobileViewButtons.find((item) => item.dataset.mobileView === view);
  return button?.offsetLeft || 0;
}

function moveMobileViewPill(x) {
  if (mobileViewPill) mobileViewPill.style.transform = `translate3d(${x}px, 0, 0)`;
}

function placeMobileViewPill() {
  if (!mobileViewPill) return;
  const button = mobileViewButtons.find((item) => item.dataset.mobileView === activeMobileView);
  mobileViewPill.style.width = `${button?.offsetWidth || 0}px`;
  mobileViewPill.style.height = `${button?.offsetHeight || 0}px`;
  mobileViewPill.style.top = `${button?.offsetTop || 0}px`;
  moveMobileViewPill(getMobileViewPillX(activeMobileView));
}

function moveMobileHeader(shift) {
  if (headerEl) headerEl.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
}

function hideTimelineScrubberForTabChange() {
  document.querySelector(".timeline-scrubber")?.classList.remove("is-visible");
}

function moveMobileViewDrag(gesture, clientX) {
  if (reducedMotionMedia?.matches || !layoutEl) return;

  if (!gesture.dragging) {
    gesture.dragging = true;
    hideTimelineScrubberForTabChange();
    mobileViewScrollTops[activeMobileView] = window.scrollY;
    const others = MOBILE_VIEW_ORDER.filter((view) => view !== activeMobileView);
    Object.assign(gesture, prepareMobileViews(others));
    gesture.offsets[activeMobileView] = 0;
  }

  const delta = clientX - gesture.lockX;
  const nextView = getAdjacentMobileView(delta < 0 ? 1 : -1);
  gesture.offset = nextView ? delta : delta * 0.2;
  MOBILE_VIEW_ORDER.forEach((view) => {
    moveMobileView(view, getMobileViewX(view) + gesture.offset, gesture.offsets[view]);
  });
  const progress = Math.min(1, Math.abs(gesture.offset) / gesture.width);
  gesture.headerShift = getMobileHeaderShift(gesture, gesture.scrollTops[nextView], progress);
  moveMobileHeader(gesture.headerShift);
  const from = getMobileViewPillX(activeMobileView);
  gesture.pillX = nextView ? from + (getMobileViewPillX(nextView) - from) * progress : from;
  moveMobileViewPill(gesture.pillX);
}

function finishMobileViewSlide() {
  mobileViewSlide?.finish();
}

function commitMobileView(view, scrollTop) {
  activeMobileView = view;
  if (scrollTop !== undefined) mobileLayoutFloorScroll = 0;
  applyMobileView();
  if (scrollTop !== undefined) {
    timelineScrubberQuietUntil = performance.now() + 300;
    window.scrollTo({ top: scrollTop, behavior: "instant" });
  }
}

function getMobileSlideTiming(travel, velocity) {
  const distance = Math.abs(travel);
  const speed = distance ? Math.max(0, velocity * Math.sign(travel)) : 0;
  const steepest = 1 / MOBILE_SLIDE_EASE_X;
  let duration = Math.min(300, 180 + distance * 0.3);
  if (speed) duration = Math.max(160, Math.min(duration, (steepest * distance) / speed));
  const slope = distance ? (speed * duration) / distance : 0;
  const lift = Math.min(1, slope * MOBILE_SLIDE_EASE_X);
  return {
    duration,
    easing: `cubic-bezier(${MOBILE_SLIDE_EASE_X}, ${lift.toFixed(3)}, 0.2, 1)`,
  };
}

function slideMobileViews({
  nextView,
  offset = 0,
  offsets = {},
  scrollTop,
  velocity = 0,
  headerFrom = 0,
  headerTo = 0,
  pillFrom = getMobileViewPillX(activeMobileView),
}) {
  const fromView = activeMobileView;
  const toView = nextView || fromView;
  const { duration, easing } = getMobileSlideTiming(
    getMobileViewX(fromView, toView) - offset,
    velocity,
  );
  const options = { duration, easing, fill: "forwards" };
  const animations = [];

  MOBILE_VIEW_ORDER.forEach((view) => {
    const y = offsets[view] || 0;
    const keyframes = [
      { transform: `translate3d(${getMobileViewX(view, fromView) + offset}px, ${y}px, 0)` },
      { transform: `translate3d(${getMobileViewX(view, toView)}px, ${y}px, 0)` },
    ];
    const section = getMobileViewSection(view);
    if (section) animations.push(section.animate(keyframes, options));
    if (view === "timeline" && newEntryBtn)
      animations.push(newEntryBtn.animate(keyframes, options));
  });

  if (headerEl && headerFrom !== headerTo) {
    animations.push(
      headerEl.animate(
        [
          { transform: `translate3d(0, ${headerFrom}px, 0)` },
          { transform: `translate3d(0, ${headerTo}px, 0)` },
        ],
        options,
      ),
    );
  }

  if (mobileViewPill) {
    animations.push(
      mobileViewPill.animate(
        [
          { transform: `translate3d(${pillFrom}px, 0, 0)` },
          { transform: `translate3d(${getMobileViewPillX(toView)}px, 0, 0)` },
        ],
        options,
      ),
    );
  }

  syncMobileViewButtons(toView);

  const slide = {
    finish() {
      if (mobileViewSlide !== slide) return;
      mobileViewSlide = null;
      if (toView === fromView) placeMobileViews();
      else commitMobileView(toView, scrollTop);
      animations.forEach((animation) => animation.cancel());
    },
  };
  mobileViewSlide = slide;
  if (animations[0]) animations[0].onfinish = slide.finish;
  window.setTimeout(slide.finish, duration + 120);
}

function settleMobileViewDrag(gesture, nextView) {
  slideMobileViews({
    nextView,
    offset: gesture.offset,
    offsets: gesture.offsets,
    scrollTop: gesture.scrollTops[nextView],
    velocity: gesture.velocityX,
    headerFrom: gesture.headerShift || 0,
    headerTo: nextView ? getMobileHeaderShift(gesture, gesture.scrollTops[nextView], 1) : 0,
    pillFrom: gesture.pillX,
  });
}

function getMobileSwipeVelocity(samples, now) {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.time - first.time;
  if (elapsed < 8 || now - last.time > MOBILE_SWIPE_VELOCITY_STALE_MS) return 0;
  return (last.x - first.x) / elapsed;
}

function handleMobileViewSwipeMove(event) {
  if (!mobileViewSwipeGesture || event.touches.length !== 1) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - mobileViewSwipeGesture.startX;
  const deltaY = touch.clientY - mobileViewSwipeGesture.startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const { samples } = mobileViewSwipeGesture;
  samples.push({ x: touch.clientX, time: event.timeStamp });
  while (
    samples.length > 2 &&
    event.timeStamp - samples[0].time > MOBILE_SWIPE_VELOCITY_WINDOW_MS
  ) {
    samples.shift();
  }
  mobileViewSwipeGesture.velocityX = getMobileSwipeVelocity(samples, event.timeStamp);

  if (
    mobileViewSwipeGesture.lockedAxis !== "x" &&
    absX >= MOBILE_SWIPE_LOCK_DISTANCE &&
    absX > absY * MOBILE_SWIPE_AXIS_RATIO
  ) {
    mobileViewSwipeGesture.lockedAxis = "x";
    mobileViewSwipeGesture.lockX = touch.clientX;
  } else if (
    !mobileViewSwipeGesture.lockedAxis &&
    absY >= MOBILE_SWIPE_LOCK_DISTANCE &&
    absY > absX * MOBILE_SWIPE_VERTICAL_LOCK_RATIO
  ) {
    mobileViewSwipeGesture.lockedAxis = "y";
  }

  if (mobileViewSwipeGesture.lockedAxis === "x") {
    if (dragWidget || pendingWidgetDrag || draggingPlacedSticker) {
      handleMobileViewSwipeCancel();
      return;
    }
    if (event.cancelable) event.preventDefault();
    moveMobileViewDrag(mobileViewSwipeGesture, touch.clientX);
  }
}

function handleMobileViewSwipeEnd(event) {
  const gesture = mobileViewSwipeGesture;
  if (!gesture) return;
  mobileViewSwipeGesture = null;
  gesture.velocityX = getMobileSwipeVelocity(gesture.samples, event.timeStamp);

  const touch = event.changedTouches?.[0];
  let nextView = "";

  if (touch && isTabbedLayoutActive() && gesture.lockedAxis === "x") {
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const movingTowardRelease =
      !gesture.velocityX || Math.sign(gesture.velocityX) === Math.sign(deltaX);
    const hasCommitVelocity =
      movingTowardRelease &&
      absX >= MOBILE_SWIPE_MIN_FLICK_DISTANCE &&
      Math.abs(gesture.velocityX) >= MOBILE_SWIPE_COMMIT_VELOCITY;
    const passedDistance =
      absX >= MOBILE_SWIPE_MIN_DISTANCE && (movingTowardRelease || absX >= gesture.width / 2);

    if (absX > absY * MOBILE_SWIPE_AXIS_RATIO && (passedDistance || hasCommitVelocity)) {
      nextView = getAdjacentMobileView(deltaX < 0 ? 1 : -1);
    }

    if (absX >= MOBILE_SWIPE_MIN_FLICK_DISTANCE) {
      mobileViewSwipeClickBlockUntil = performance.now() + 400;
    }
  }

  if (gesture.dragging) settleMobileViewDrag(gesture, nextView);
  else if (nextView) setMobileView(nextView);
}

function handleMobileViewSwipeCancel() {
  const gesture = mobileViewSwipeGesture;
  mobileViewSwipeGesture = null;
  if (gesture?.dragging) settleMobileViewDrag(gesture, "");
}

function applyMobileView() {
  const pageEl = document.querySelector(".page");
  if (!pageEl) return;

  if (!["timeline", "left", "right"].includes(activeMobileView)) {
    activeMobileView = "timeline";
  }

  pageEl.dataset.mobileView = activeMobileView;
  syncMobileViewButtons();
  syncNewEntryButtonVisibility();
  placeMobileViews();
  MOBILE_VIEW_ORDER.forEach((view) => {
    getMobileViewSection(view)?.toggleAttribute("aria-hidden", view !== activeMobileView);
  });
}

function setMobileView(nextView, options = {}) {
  if (mobileViewSwipeGesture?.dragging) placeMobileViews();
  mobileViewSwipeGesture = null;
  finishMobileViewSlide();

  const { animate = true } = options;
  const allowedViews = new Set(["timeline", "left", "right"]);
  const view = allowedViews.has(nextView) ? nextView : "timeline";
  const isTabbed = isTabbedLayoutActive();

  if (
    view === activeMobileView ||
    !isTabbed ||
    !layoutEl ||
    document.body.classList.contains("popup-scroll-locked")
  ) {
    commitMobileView(view);
    return;
  }

  mobileViewScrollTops[activeMobileView] = window.scrollY;
  hideTimelineScrubberForTabChange();
  const drag = prepareMobileViews([view]);
  const { offsets, scrollTops } = drag;

  if (animate && !reducedMotionMedia?.matches) {
    slideMobileViews({
      nextView: view,
      offsets,
      scrollTop: scrollTops[view],
      headerTo: getMobileHeaderShift(drag, scrollTops[view], 1),
    });
  } else {
    commitMobileView(view, scrollTops[view]);
  }
}

function syncMobileViewSwitcherVisibility() {
  if (!mobileViewSwitcher) return;

  const isTabbed = isTabbedLayoutActive();
  const layoutChanged = isTabbed !== wasTabbedLayoutActive;
  wasTabbedLayoutActive = isTabbed;
  mobileViewSwitcher.hidden = !isTabbed;
  placeNewEntryButton();

  if (!isTabbed) {
    const pageEl = document.querySelector(".page");
    if (pageEl) {
      pageEl.dataset.mobileView = "all";
    }
    placeMobileViews();
    MOBILE_VIEW_ORDER.forEach((view) => {
      getMobileViewSection(view)?.removeAttribute("aria-hidden");
    });
  } else {
    applyMobileView();
  }

  if (layoutChanged && currentUser) {
    renderWidgets({ animateMobileReorder: false });
  }
}

function getThemeChromeColor(nextTheme) {
  const styles = window.getComputedStyle(document.documentElement);
  const overscrollBg = styles.getPropertyValue("--overscroll-bg").trim();
  if (overscrollBg && !overscrollBg.startsWith("var(")) {
    return overscrollBg;
  }

  return styles.getPropertyValue("--bg-3").trim() || THEME_CHROME_FALLBACKS[nextTheme] || "#fffdfd";
}

function normalizeAppZoom(value) {
  if (value === null || value === undefined || value === "") {
    return DEFAULT_APP_ZOOM;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_APP_ZOOM;

  const steppedValue = Math.round(numericValue / APP_ZOOM_STEP) * APP_ZOOM_STEP;
  return Math.min(MAX_APP_ZOOM, Math.max(MIN_APP_ZOOM, steppedValue));
}

function getStoredAppZoomPreference() {
  try {
    return normalizeAppZoom(localStorage.getItem(APP_ZOOM_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_ZOOM;
  }
}

function getCurrentAppZoom() {
  return normalizeAppZoom(
    getComputedStyle(document.documentElement).getPropertyValue("--app-zoom"),
  );
}

function setAppZoom(zoom, options = {}) {
  const { persist = false } = options;
  const nextZoom = normalizeAppZoom(zoom);
  document.documentElement.style.setProperty("--app-zoom", nextZoom.toFixed(2));

  if (zoomValueLabel) {
    zoomValueLabel.textContent = `${Math.round(nextZoom * 100)}%`;
  }

  if (zoomOutBtn) {
    zoomOutBtn.disabled = nextZoom <= MIN_APP_ZOOM;
    zoomOutBtn.setAttribute("aria-disabled", String(zoomOutBtn.disabled));
  }

  if (zoomInBtn) {
    zoomInBtn.disabled = nextZoom >= MAX_APP_ZOOM;
    zoomInBtn.setAttribute("aria-disabled", String(zoomInBtn.disabled));
  }

  if (zoomResetBtn) {
    zoomResetBtn.disabled = nextZoom === DEFAULT_APP_ZOOM;
    zoomResetBtn.setAttribute("aria-disabled", String(zoomResetBtn.disabled));
  }

  if (persist) {
    try {
      localStorage.setItem(APP_ZOOM_STORAGE_KEY, nextZoom.toFixed(2));
    } catch (error) {
      console.error(error);
    }
  }
}

function adjustAppZoom(delta) {
  const currentZoom = getCurrentAppZoom();
  setAppZoom(currentZoom + delta, { persist: true });
  fitWidgetsInViewport();
}

const DEFAULT_THEME = "nebula";
const AVAILABLE_THEMES = ["ember", "dusk", "pine", "nebula", "blossom"];
const THEME_CHROME_FALLBACKS = {
  dusk: "#17101c",
  pine: "#0f1c1d",
  blossom: "#fff8fb",
  ember: "#070607",
  nebula: "#0d0b1c",
};
const themeStylesheetLoads = new Map();

function loadThemeStylesheet(theme) {
  const href = window.__THEME_CSS__?.[theme];
  if (!href) return Promise.resolve();
  if (themeStylesheetLoads.has(theme)) return themeStylesheetLoads.get(theme);

  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(
    (link) => link.getAttribute("href") === href,
  );
  if (existing?.sheet) {
    themeStylesheetLoads.set(theme, Promise.resolve());
    return themeStylesheetLoads.get(theme);
  }

  const promise = new Promise((resolve) => {
    const link = existing || document.createElement("link");
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    if (!existing) {
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  });
  themeStylesheetLoads.set(theme, promise);
  return promise;
}
const themeMenu = document.getElementById("themeMenu");
const themeMenuWrap = document.getElementById("themeMenuWrap");

function setTheme(theme) {
  const nextTheme = AVAILABLE_THEMES.includes(theme) ? theme : DEFAULT_THEME;
  document.documentElement.dataset.theme = nextTheme;
  const themeColorMeta =
    document.getElementById("themeColorMeta") || document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", getThemeChromeColor(nextTheme));
  }
  document.querySelectorAll("link[data-theme-icon]").forEach((link) => {
    const folder = nextTheme === DEFAULT_THEME ? "./icons/" : `./themes/${nextTheme}/`;
    const href = folder + link.dataset.themeIcon;
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  });

  themeMenu?.querySelectorAll("[data-theme-option]").forEach((option) => {
    option.setAttribute("aria-checked", String(option.dataset.themeOption === nextTheme));
  });
  if (renderedDecorTheme && (renderedDecorTheme === "ember") !== (nextTheme === "ember")) {
    renderDecor();
    if (posts.length) renderTimeline();
  }
}

function rememberThemeOnDevice(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error(error);
  }
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(theme)}; max-age=157680000; path=/; SameSite=Lax`;
}

function saveThemeToProfile(theme) {
  const userId = currentProfile?.id || currentUser?.id;
  if (!userId || !currentProfile || !("theme" in currentProfile)) return;
  if (currentProfile.theme === theme) return;
  currentProfile = { ...currentProfile, theme };
  void dataStore
    .from("profiles")
    .update({ theme })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.error(error);
    });
}

function canMeltTheme() {
  return Boolean(document.startViewTransition) && !reducedMotionMedia?.matches;
}

async function chooseTheme(theme, options = {}) {
  await loadThemeStylesheet(theme);
  if (canMeltTheme() && !options.fromProfile) {
    const transition = document.startViewTransition(() => {
      setTheme(theme);
      options.onSwap?.();
    });
    transition.ready.catch(() => {});
    await transition.updateCallbackDone;
  } else {
    setTheme(theme);
    options.onSwap?.();
  }
  const chosen = document.documentElement.dataset.theme;
  rememberThemeOnDevice(chosen);
  if (!options.fromProfile) saveThemeToProfile(chosen);
}

function applyProfileTheme(profile) {
  const theme = profile?.theme;
  if (!theme || !AVAILABLE_THEMES.includes(theme)) {
    if (profile && "theme" in profile) saveThemeToProfile(document.documentElement.dataset.theme);
    return;
  }
  if (theme !== document.documentElement.dataset.theme) {
    void chooseTheme(theme, { fromProfile: true });
  } else {
    rememberThemeOnDevice(theme);
  }
}

let themeMenuChoosing = false;

function setThemeMenuOpen(isOpen) {
  if (!themeMenu || !themeToggle) return;
  themeMenu.hidden = !isOpen;
  themeToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    const checked =
      themeMenu.querySelector('[aria-checked="true"]') ||
      themeMenu.querySelector("[data-theme-option]");
    checked?.focus();
  }
}

function toggleTheme() {
  setThemeMenuOpen(Boolean(themeMenu?.hidden));
}

themeMenu?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-theme-option]");
  if (!option || themeMenuChoosing) return;
  themeMenuChoosing = true;
  themeMenu.querySelectorAll("[data-theme-option]").forEach((item) => {
    item.setAttribute("aria-checked", String(item === option));
  });
  void chooseTheme(option.dataset.themeOption, { onSwap: closeThemeMenuWithSwap });
});

function closeThemeMenuWithSwap() {
  themeMenuChoosing = false;
  const melting = canMeltTheme();
  if (melting) themeMenu.classList.add("is-instant");
  setThemeMenuOpen(false);
  themeToggle?.focus();
  if (melting) {
    void themeMenu.offsetHeight;
    themeMenu.classList.remove("is-instant");
  }
}

themeMenu?.addEventListener("keydown", (event) => {
  const options = Array.from(themeMenu.querySelectorAll("[data-theme-option]"));
  const index = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setThemeMenuOpen(false);
    themeToggle?.focus();
  } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    options[(index + 1) % options.length]?.focus();
  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    options[(index - 1 + options.length) % options.length]?.focus();
  }
});

document.addEventListener("click", (event) => {
  if (themeMenu && !themeMenu.hidden && !themeMenuWrap?.contains(event.target)) {
    setThemeMenuOpen(false);
  }
});

function syncNewEntryButtonVisibility(scrollHidden = false) {
  if (!newEntryBtn) return;

  const shouldHide = !currentUser || (!isTabbedLayoutActive() && scrollHidden);

  newEntryBtn.classList.toggle("is-hidden", shouldHide);
}

function updateFloatingEntryButtonVisibility() {
  const setFloatingControlsHidden = (isHidden) => {
    mobileViewSwitcher?.classList.toggle("is-hidden", isHidden);
    syncNewEntryButtonVisibility(isHidden);
  };

  if (!currentUser) {
    setFloatingControlsHidden(true);
    return;
  }

  const currentScrollY = window.scrollY || 0;
  const scrollDelta = currentScrollY - lastScrollY;
  const shouldHide =
    currentScrollY > 140 && scrollDelta > 8 && !entryPopup?.classList.contains("open");

  if (shouldHide) {
    setFloatingControlsHidden(true);
  } else if (scrollDelta < -8 || currentScrollY <= 80 || entryPopup?.classList.contains("open")) {
    setFloatingControlsHidden(false);
  }

  lastScrollY = currentScrollY;
}

function requestFloatingEntryButtonVisibilityUpdate() {
  if (floatingEntryVisibilityFrame) return;

  floatingEntryVisibilityFrame = requestAnimationFrame(() => {
    floatingEntryVisibilityFrame = 0;
    updateFloatingEntryButtonVisibility();
  });
}

function requestMobileViewSwitcherVisibilitySync() {
  if (mobileViewSwitcherFrame) return;

  mobileViewSwitcherFrame = requestAnimationFrame(() => {
    mobileViewSwitcherFrame = 0;
    syncMobileViewSwitcherVisibility();
  });
}

function getViewportScrollSnapshot() {
  if (document.body.classList.contains("popup-scroll-locked")) {
    return null;
  }

  return {
    left: window.scrollX || window.pageXOffset || 0,
    top: window.scrollY || window.pageYOffset || 0,
  };
}

function restoreViewportScroll(snapshot) {
  if (!snapshot || document.body.classList.contains("popup-scroll-locked")) {
    return;
  }

  timelineScrubberQuietUntil = performance.now() + 300;
  window.scrollTo({
    left: snapshot.left,
    top: snapshot.top,
    behavior: "auto",
  });
  lastScrollY = snapshot.top;
}

function getSkeletonLine(className = "", style = "") {
  const classes = ["skeleton-line", className].filter(Boolean).join(" ");
  return `<span class="${classes}" aria-hidden="true" style="${style}"></span>`;
}

function getWidgetSkeletonMarkup(index = 0) {
  const lineWidth = index % 2 === 0 ? "72%" : "58%";
  return `
    <div class="widget widget-skeleton" aria-hidden="true">
      <div class="widget-bar skeleton-widget-bar">
        ${getSkeletonLine("skeleton-title", `width:${lineWidth};`)}
      </div>
      <div class="widget-content skeleton-widget-content">
        ${getSkeletonLine("", "width:86%;")}
        ${getSkeletonLine("", "width:64%;")}
        ${getSkeletonLine("skeleton-line-short", "width:42%;")}
      </div>
    </div>
  `;
}

function renderWidgetSkeletons() {
  if (!leftZone || !rightZone) return;

  leftZone.innerHTML = [0, 1, 2]
    .map((index) => {
      const top = 20 + index * 190;
      return getWidgetSkeletonMarkup(index).replace(
        'class="widget widget-skeleton"',
        `class="widget widget-skeleton" style="left:${index % 2 ? 12 : 8}px;top:${top}px;"`,
      );
    })
    .join("");
  rightZone.innerHTML = [0, 1, 2]
    .map((index) => {
      const top = 34 + index * 190;
      return getWidgetSkeletonMarkup(index + 3).replace(
        'class="widget widget-skeleton"',
        `class="widget widget-skeleton" style="left:${index % 2 ? 18 : 8}px;top:${top}px;"`,
      );
    })
    .join("");
}

function getPostSkeletonMarkup(index = 0) {
  const textWidth = index % 2 === 0 ? "92%" : "78%";
  return `
    <article class="post post-skeleton" aria-hidden="true">
      <div class="post-header skeleton-post-header">
        ${getSkeletonLine("skeleton-title", "width:48%;")}
        ${getSkeletonLine("skeleton-line-short", "width:72px;")}
      </div>
      <div class="post-body">
        <div class="post-meta">
          <span class="skeleton-avatar"></span>
          <div class="skeleton-meta-lines">
            ${getSkeletonLine("", "width:110px;")}
            ${getSkeletonLine("skeleton-line-short", "width:72px;")}
          </div>
        </div>
        <div class="skeleton-text-block">
          ${getSkeletonLine("", `width:${textWidth};`)}
          ${getSkeletonLine("", "width:86%;")}
          ${getSkeletonLine("", "width:68%;")}
        </div>
        <div class="skeleton-actions">
          ${getSkeletonLine("skeleton-pill", "width:82px;")}
          ${getSkeletonLine("skeleton-pill", "width:112px;")}
          ${getSkeletonLine("skeleton-pill", "width:96px;")}
        </div>
      </div>
    </article>
  `;
}

function renderTimelineSkeleton(count = 3) {
  if (!timelineEl) return;
  timelineEl.innerHTML = Array.from({ length: count }, (_, index) =>
    getPostSkeletonMarkup(index),
  ).join("");
}

function renderNotificationSkeleton() {
  if (!notificationsList) return;
  notificationsList.innerHTML = `
    <div class="notification-skeleton" aria-hidden="true">
      ${getSkeletonLine("", "width:86%;")}
      ${getSkeletonLine("skeleton-line-short", "width:54%;")}
    </div>
    <div class="notification-skeleton" aria-hidden="true">
      ${getSkeletonLine("", "width:72%;")}
      ${getSkeletonLine("skeleton-line-short", "width:46%;")}
    </div>
  `;
}

function renderAppSkeleton(options = {}) {
  const { timeline = true, widgets = true, notifications = true } = options;

  if (timeline) renderTimelineSkeleton();
  if (widgets) renderWidgetSkeletons();
  if (notifications) renderNotificationSkeleton();
}

function renderCommentsSkeleton() {
  if (!commentsList) return;
  commentsList.innerHTML = Array.from(
    { length: 3 },
    (_, index) => `
    <div class="comment-item comment-skeleton" aria-hidden="true">
      ${getSkeletonLine("", `width:${index % 2 ? "92px" : "124px"};`)}
      ${getSkeletonLine("", "width:88%;")}
      ${getSkeletonLine("skeleton-line-short", "width:58%;")}
    </div>
  `,
  ).join("");
}

function isGifSticker(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  return normalizedValue.startsWith("http") && normalizedValue.includes(".gif");
}

function createStickerVisual(value, options = {}) {
  const { size = DEFAULT_GIF_STICKER_SIZE } = options;

  if (isGifSticker(value)) {
    const media = document.createElement("span");
    media.className = "reaction-sticker-media gif-media";
    media.setAttribute("role", "img");
    media.setAttribute("aria-label", "gif sticker");
    media.style.width = `${size}px`;
    media.style.height = `${size}px`;
    const image = document.createElement("img");
    image.src = value;
    image.alt = "";
    image.loading = "lazy";
    image.draggable = false;
    media.appendChild(image);
    animateGifImage(image);
    return media;
  }

  const text = document.createElement("span");
  text.className = "reaction-sticker-emoji";
  text.textContent = value;
  return text;
}

function setGifSearchStatus(message) {
  if (gifSearchStatus) {
    gifSearchStatus.textContent = message;
  }
}

function escapeQueryParam(value) {
  return encodeURIComponent(String(value || "").trim());
}

function getGiphyStickerUrl(gifObject) {
  return (
    gifObject?.images?.fixed_height?.url ||
    gifObject?.images?.downsized?.url ||
    gifObject?.images?.original?.url ||
    ""
  );
}

function getGiphyTypeLabel(type = activeGiphySearchType) {
  return type === "giphy-sticker" ? "sticker" : "gif";
}

function getGiphyTypePlural(type = activeGiphySearchType) {
  return type === "giphy-sticker" ? "stickers" : "gifs";
}

function getGiphySearchEndpoint(type = activeGiphySearchType) {
  return type === "giphy-sticker" ? GIPHY_STICKER_SEARCH_ENDPOINT : GIPHY_SEARCH_ENDPOINT;
}

function getRecentGiphyStorageKey(type = activeGiphySearchType) {
  return type === "giphy-sticker" ? RECENT_GIPHY_STICKER_STORAGE_KEY : RECENT_GIF_STORAGE_KEY;
}

function getRecentGiphyItems(type = activeGiphySearchType) {
  try {
    const raw = localStorage.getItem(getRecentGiphyStorageKey(type));
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.url) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getRecentGifStickers() {
  return getRecentGiphyItems("gif");
}

function saveRecentGiphyItem(gifItem, type = activeGiphySearchType) {
  if (!gifItem?.url) return;

  try {
    const nextItems = [
      { ...gifItem, type },
      ...getRecentGiphyItems(type).filter((item) => item.url !== gifItem.url),
    ].slice(0, 6);
    localStorage.setItem(getRecentGiphyStorageKey(type), JSON.stringify(nextItems));
    markCloudPrefChanged(type === "giphy-sticker" ? "recentGiphyStickers" : "recentGifs");
  } catch (error) {
    console.error(error);
  }
}

function saveRecentGifSticker(gifItem, type = activeGiphySearchType) {
  saveRecentGiphyItem(gifItem, type);
}

function getPlacedGifSizeMap() {
  try {
    const raw = localStorage.getItem(PLACED_GIF_SIZE_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function clampGifStickerSize(size) {
  const number = Number(size);
  if (!Number.isFinite(number) || number <= 0) return DEFAULT_GIF_STICKER_SIZE;
  return Math.max(MIN_GIF_STICKER_SIZE, Math.min(MAX_GIF_STICKER_SIZE, Math.round(number)));
}

function getPlacedGifSize(stickerId) {
  const sticker = placedStickers.find((item) => item.id === stickerId);
  const syncedSize = Number(sticker?.size);
  if (Number.isFinite(syncedSize) && syncedSize > 0) {
    return clampGifStickerSize(syncedSize);
  }

  const sizeMap = getPlacedGifSizeMap();
  const size = Number(sizeMap?.[stickerId]);
  return Number.isFinite(size) ? size : DEFAULT_GIF_STICKER_SIZE;
}

function selectPostStickerRows() {
  return dataStore
    .from("post_stickers")
    .select("id, post_id, user_id, emoji, x, y, created_at, size");
}

function mapPostStickerRow(row) {
  const pendingPosition =
    row.user_id && row.user_id === (currentProfile?.id || currentUser?.id)
      ? getSavedPlacedStickerPosition(row.id)
      : null;
  const syncedSize = Number(row.size);

  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    sticker: row.emoji,
    x: pendingPosition?.x ?? row.x,
    y: pendingPosition?.y ?? row.y,
    size: Number.isFinite(syncedSize) && syncedSize > 0 ? clampGifStickerSize(syncedSize) : null,
    hasPendingPosition: Boolean(
      pendingPosition &&
      (pendingPosition.x !== clampStickerPercent(row.x) ||
        pendingPosition.y !== clampStickerPercent(row.y)),
    ),
  };
}

let pendingStickerFlushInFlight = false;

async function flushPendingStickerChanges() {
  if (pendingStickerFlushInFlight || !currentUser) return;
  pendingStickerFlushInFlight = true;

  try {
    const pendingMoves = placedStickers.filter((item) => item.hasPendingPosition);
    for (const item of pendingMoves) {
      item.hasPendingPosition = false;
      await updatePlacedStickerPosition(item.id, item.x, item.y, { quiet: true });
    }

    const localSizes = getPlacedGifSizeMap();
    for (const [stickerId, size] of Object.entries(localSizes)) {
      const item = placedStickers.find((sticker) => sticker.id === stickerId);
      if (!item || item.userId !== currentUser.id) continue;
      if (item.size && Number(item.size) === Number(size)) {
        clearPlacedGifSize(stickerId);
        continue;
      }
      await persistPlacedGifSize(stickerId, size, { quiet: true });
    }
  } catch (error) {
    console.error(error);
  } finally {
    pendingStickerFlushInFlight = false;
  }
}

async function persistPlacedGifSize(stickerId, size, options = {}) {
  const { quiet = false } = options;
  const nextSize = clampGifStickerSize(size);
  const item = placedStickers.find((sticker) => sticker.id === stickerId);
  if (item) item.size = nextSize;

  if (!stickerId || String(stickerId).startsWith("local-sticker-")) {
    savePlacedGifSize(stickerId, nextSize);
    return false;
  }

  const { data, error } = await trackTimelineWrite(
    dataStore
      .from("post_stickers")
      .update({ size: nextSize })
      .eq("id", stickerId)
      .select("id")
      .maybeSingle(),
  );

  if (error) {
    console.error(error);
    savePlacedGifSize(stickerId, nextSize);
    if (!quiet) showMessage("size saved on this device ♡");
    return false;
  }

  if (!data) {
    savePlacedGifSize(stickerId, nextSize);
    if (!quiet) showMessage("size saved on this device ♡");
    return false;
  }

  markLocalRealtimeTable("post_stickers");
  clearPlacedGifSize(stickerId);
  return true;
}

function savePlacedGifSize(stickerId, size) {
  if (!stickerId) return;

  try {
    const sizeMap = getPlacedGifSizeMap();
    sizeMap[stickerId] = Math.max(
      MIN_GIF_STICKER_SIZE,
      Math.min(MAX_GIF_STICKER_SIZE, Math.round(size)),
    );
    localStorage.setItem(PLACED_GIF_SIZE_STORAGE_KEY, JSON.stringify(sizeMap));
  } catch (error) {
    console.error(error);
  }
}

function clearPlacedGifSize(stickerId) {
  if (!stickerId) return;

  try {
    const sizeMap = getPlacedGifSizeMap();
    delete sizeMap[stickerId];
    localStorage.setItem(PLACED_GIF_SIZE_STORAGE_KEY, JSON.stringify(sizeMap));
  } catch (error) {
    console.error(error);
  }
}

function clampStickerPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getPlacedStickerPositionMap() {
  try {
    const raw = localStorage.getItem(PLACED_STICKER_POSITION_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function getSavedPlacedStickerPosition(stickerId) {
  if (!stickerId) return null;
  const positionMap = getPlacedStickerPositionMap();
  const savedPosition = positionMap[stickerId];
  if (!savedPosition || typeof savedPosition !== "object") return null;

  const x = Number(savedPosition.x);
  const y = Number(savedPosition.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    x: clampStickerPercent(x),
    y: clampStickerPercent(y),
  };
}

function savePlacedStickerPosition(stickerId, x, y) {
  if (!stickerId) return;

  try {
    const positionMap = getPlacedStickerPositionMap();
    positionMap[stickerId] = {
      x: clampStickerPercent(x),
      y: clampStickerPercent(y),
    };
    localStorage.setItem(PLACED_STICKER_POSITION_STORAGE_KEY, JSON.stringify(positionMap));
  } catch (error) {
    console.error(error);
  }
}

function clearPlacedStickerPosition(stickerId) {
  if (!stickerId) return;

  try {
    const positionMap = getPlacedStickerPositionMap();
    delete positionMap[stickerId];
    localStorage.setItem(PLACED_STICKER_POSITION_STORAGE_KEY, JSON.stringify(positionMap));
  } catch (error) {
    console.error(error);
  }
}

function isPercentStickerPosition(item) {
  const x = Number(item?.x);
  const y = Number(item?.y);
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

function getStickerPositionFromPointer(event, layer, stickerRadius = 16) {
  const rect = layer.getBoundingClientRect();
  const xPx = Math.max(
    stickerRadius,
    Math.min(rect.width - stickerRadius, event.clientX - rect.left),
  );
  const yPx = Math.max(
    stickerRadius,
    Math.min(rect.height - stickerRadius, event.clientY - rect.top),
  );

  return {
    x: Math.round((xPx / rect.width) * 100),
    y: Math.round((yPx / rect.height) * 100),
    rect,
  };
}

function getSafeLinkUrl(url) {
  const link = String(url || "").trim();
  return /^https?:\/\//i.test(link) ? link : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const BREAKUP_EASTER_EGG_PATTERNS = [
  /\bbreak[\s-]*up\b/i,
  /\bsplit[\s-]*up\b/i,
  /\bwe(?:['’]re|\s+are)\s+over\b/i,
  /\bit(?:['’]s|\s+is)\s+over\b/i,
  /\bleave\s+(?:me|you)\b/i,
  /\bleaving\s+you\b/i,
  /\bdivorc(?:e|ed|ing)\b/i,
];

const BREAKUP_GUARD_IGNORED_INPUT_TYPES = new Set([
  "checkbox",
  "color",
  "date",
  "email",
  "file",
  "hidden",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "time",
  "url",
  "week",
]);

function hasBreakupWords(value) {
  const text = String(value || "");
  return BREAKUP_EASTER_EGG_PATTERNS.some((pattern) => pattern.test(text));
}

function showBreakupEasterEgg() {
  showMessage("no breakup words allowed here ♡");
  document.body.classList.add("word-guard");
  window.clearTimeout(showBreakupEasterEgg.timeout);
  showBreakupEasterEgg.timeout = window.setTimeout(() => {
    document.body.classList.remove("word-guard");
  }, 520);
}

function areBreakupWordsAllowed(...values) {
  if (!values.some((value) => hasBreakupWords(value))) {
    return true;
  }

  showBreakupEasterEgg();
  return false;
}

function getBreakupGuardEditable(target) {
  const el = target?.closest?.("input, textarea, [contenteditable='true']");
  if (!el) return null;

  if (el instanceof HTMLInputElement) {
    const type = String(el.type || "text").toLowerCase();
    if (BREAKUP_GUARD_IGNORED_INPUT_TYPES.has(type)) return null;
  }

  return el;
}

function getBreakupGuardEditableText(el) {
  if (!el) return "";
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value || "";
  }
  return el.textContent || "";
}

function getBreakupGuardNextText(el, insertedText = "") {
  const value = getBreakupGuardEditableText(el);

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = Number.isFinite(el.selectionStart) ? el.selectionStart : value.length;
    const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : start;
    return `${value.slice(0, start)}${insertedText}${value.slice(end)}`;
  }

  return `${value}${insertedText}`;
}

function handleBreakupGuardBeforeInput(event) {
  if (!event.inputType?.startsWith("insert")) return;

  const el = getBreakupGuardEditable(event.target);
  if (!el) return;

  const insertedText = String(event.data || "");
  if (!insertedText) return;

  if (hasBreakupWords(getBreakupGuardNextText(el, insertedText))) {
    event.preventDefault();
    showBreakupEasterEgg();
  }
}

function handleBreakupGuardPaste(event) {
  const el = getBreakupGuardEditable(event.target);
  if (!el) return;

  const pastedText = String(event.clipboardData?.getData("text") || "");
  if (!pastedText) return;

  if (hasBreakupWords(getBreakupGuardNextText(el, pastedText))) {
    event.preventDefault();
    showBreakupEasterEgg();
  }
}

function normalizeHexColor(value, fallback = "#ffffff") {
  const fallbackHex = String(fallback || "#ffffff")
    .trim()
    .toLowerCase();
  const raw = String(value || "").trim();
  const matchThree = raw.match(/^#?([0-9a-fA-F]{3})$/);
  if (matchThree) {
    const [r, g, b] = matchThree[1].toLowerCase().split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const matchSix = raw.match(/^#?([0-9a-fA-F]{6})$/);
  if (matchSix) {
    return `#${matchSix[1].toLowerCase()}`;
  }

  return /^#[0-9a-f]{6}$/.test(fallbackHex) ? fallbackHex : "#ffffff";
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\w:-]*(?:\s[^<>]*?)?>/i.test(String(value || ""));
}

function sanitizePostHtml(html) {
  if (DOMPurify?.sanitize) {
    return DOMPurify.sanitize(String(html || ""), {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["style", "class", "target", "rel"],
      FORBID_TAGS: ["style", "script"],
    });
  }

  return escapeHtml(htmlToInertPlainText(html)).replaceAll("\n", "<br>");
}

function htmlToInertPlainText(html) {
  const source = String(html || "");
  if (!source) return "";

  try {
    const doc = new DOMParser().parseFromString(
      source.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n"),
      "text/html",
    );
    return String(doc.body?.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return source.replace(/<[^>]*>/g, "");
  }
}

function toSafeHtmlFromPlainText(text) {
  return sanitizePostHtml(escapeHtml(text).replaceAll("\n", "<br>"));
}

function isEmptyEntrySpacingNode(node) {
  if (node?.nodeType === Node.TEXT_NODE) {
    return !String(node.textContent || "")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  if (!(node instanceof HTMLElement)) return false;
  if (node.tagName === "BR") return true;
  if (!["DIV", "P"].includes(node.tagName)) return false;
  if (node.querySelector("img, video, audio, iframe, canvas, svg, hr, table")) {
    return false;
  }

  return !String(node.textContent || "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function tightenEntryAttachmentSpacing(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  template.content.querySelectorAll(".entry-attachment").forEach((attachment) => {
    let previousNode = attachment.previousSibling;
    while (previousNode && isEmptyEntrySpacingNode(previousNode)) {
      previousNode.remove();
      previousNode = attachment.previousSibling;
    }
  });

  return template.innerHTML.trim();
}

function preparePostHtmlForDisplay(html) {
  return tightenEntryAttachmentSpacing(reviveLiteralHtmlFragments(sanitizePostHtml(html)));
}

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");
  return textarea.value;
}

function decodeStoredHtml(value, maxPasses = 4) {
  let currentValue = String(value || "");

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const nextValue = decodeHtmlEntities(currentValue);
    if (nextValue === currentValue) {
      break;
    }
    currentValue = nextValue;
  }

  return currentValue;
}

function reviveLiteralHtmlFragments(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowedLiteralTagPattern =
    /<\/?(?:p|h[1-6]|strong|em|u|blockquote|ul|ol|li|figure|img|br|a|span)\b/i;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((textNode) => {
    const rawText = String(textNode.textContent || "");
    if (!allowedLiteralTagPattern.test(rawText) || !rawText.includes("<")) {
      return;
    }

    const revivedHtml = sanitizePostHtml(rawText);
    if (!looksLikeHtml(revivedHtml)) {
      return;
    }

    const fragmentTemplate = document.createElement("template");
    fragmentTemplate.innerHTML = revivedHtml;
    textNode.replaceWith(fragmentTemplate.content.cloneNode(true));
  });

  return template.innerHTML;
}

function isInlineImageDataUrl(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(String(value || "").trim());
}

async function uploadEntryImageData(userId, imageDataUrl, folder = "entry-images") {
  const normalizedImage = String(imageDataUrl || "").trim();
  if (!userId || !isInlineImageDataUrl(normalizedImage)) {
    return normalizedImage;
  }

  const response = await fetch(normalizedImage);
  const blob = await response.blob();
  const extension = blob.type === "image/png" ? "png" : "jpg";
  const filePath = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}.${extension}`;

  const { error: uploadError } = await dataStore.storage
    .from(ENTRY_IMAGE_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = dataStore.storage.from(ENTRY_IMAGE_BUCKET).getPublicUrl(filePath);

  return data?.publicUrl || normalizedImage;
}

function extractEntryAttachment(content) {
  const template = document.createElement("template");
  template.innerHTML = sanitizePostHtml(String(content || ""));
  const attachmentImage = template.content.querySelector("img.entry-attachment-image");
  const image = attachmentImage?.getAttribute("src") || "";
  attachmentImage?.closest(".entry-attachment")?.remove();
  return {
    content: template.innerHTML.trim(),
    image,
  };
}

function composeEntryContentWithAttachment(content, image) {
  const normalizedContent = sanitizePostHtml(String(content || "")).trim();
  const normalizedImage = String(image || "").trim();

  if (!normalizedImage) {
    return normalizedContent;
  }

  const attachmentHtml = `
          <figure class="entry-attachment">
            <img class="entry-attachment-image" src="${escapeHtml(normalizedImage)}" alt="entry attachment" loading="eager" decoding="async" fetchpriority="high" />
          </figure>
        `;

  return tightenEntryAttachmentSpacing(
    normalizedContent ? `${normalizedContent}${attachmentHtml}` : attachmentHtml,
  );
}

function renderEntryImagePreview(image) {
  if (!entryImagePreview || !removeEntryImageBtn || !entryImageData) return;

  const normalizedImage = String(image || "").trim();
  entryImageData.value = normalizedImage;
  entryImagePreview.hidden = !normalizedImage;
  removeEntryImageBtn.hidden = !normalizedImage;
  entryImagePreview.innerHTML = normalizedImage
    ? `<img src="${escapeHtml(normalizedImage)}" alt="entry attachment preview" />`
    : "";
  scheduleEntryDraftSave();
}

function compressImageFile(file, options = {}) {
  const { maxSize = 900, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("could not read image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("could not load image"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getPostDisplayHtml(content) {
  const value = String(content || "");
  if (!value) return "";

  const containsEscapedHtml = /&lt;\s*\/?[a-z]/i.test(value);

  if (looksLikeHtml(value)) {
    if (containsEscapedHtml) {
      const decodedHtmlValue = decodeStoredHtml(value);
      if (decodedHtmlValue !== value && looksLikeHtml(decodedHtmlValue)) {
        return preparePostHtmlForDisplay(decodedHtmlValue);
      }
    }

    return preparePostHtmlForDisplay(value);
  }

  if (!/&(?:lt|gt|quot|#39|amp);/i.test(value)) {
    return toSafeHtmlFromPlainText(value);
  }

  const decodedValue = decodeStoredHtml(value);
  if (decodedValue !== value && looksLikeHtml(decodedValue)) {
    return preparePostHtmlForDisplay(decodedValue);
  }

  return toSafeHtmlFromPlainText(value);
}

function prioritizeEntryImages(root, options = {}) {
  const { eager = false } = options;
  if (!root) return;

  root.querySelectorAll?.(".entry-attachment-image").forEach((image) => {
    if (!(image instanceof HTMLImageElement)) return;

    image.decoding = "async";
    if (eager) {
      image.loading = "eager";
      image.setAttribute("fetchpriority", "high");
    } else if (!image.getAttribute("loading")) {
      image.loading = "lazy";
    }
  });
}

function getUrlsFromPostText(postTextEl) {
  const urls = new Set();

  postTextEl.querySelectorAll("a[href]").forEach((link) => {
    if (/^https?:/i.test(link.href)) {
      urls.add(link.href);
    }
  });

  return [...urls];
}

function cleanDetectedUrl(url) {
  return String(url || "").replace(/[),.;!?]+$/g, "");
}

function linkifyPlainUrls(root) {
  if (!root) return;

  const urlPattern = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest("a, button, input, textarea, script, style")) {
      continue;
    }
    if (urlPattern.test(node.textContent || "")) {
      textNodes.push(node);
    }
    urlPattern.lastIndex = 0;
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || "";
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    urlPattern.lastIndex = 0;
    while ((match = urlPattern.exec(text)) !== null) {
      const rawUrl = match[0];
      const cleanUrl = cleanDetectedUrl(rawUrl);
      const trailingText = rawUrl.slice(cleanUrl.length);

      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      try {
        const parsedUrl = new URL(cleanUrl);
        const link = document.createElement("a");
        link.href = parsedUrl.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = cleanUrl;
        fragment.appendChild(link);
      } catch {
        fragment.appendChild(document.createTextNode(cleanUrl));
      }

      if (trailingText) {
        fragment.appendChild(document.createTextNode(trailingText));
      }

      lastIndex = match.index + rawUrl.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  });
}

function getYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      return "";
    }

    if (parsedUrl.pathname === "/watch") {
      return parsedUrl.searchParams.get("v") || "";
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(parts[0])) {
      return parts[1] || "";
    }
  } catch {
    return "";
  }

  return "";
}

const LINK_SITE_NAMES = [
  [/(^|\.)spotify\.com$/, "Spotify"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest"],
  [/(^|\.)music\.apple\.com$/, "Apple Music"],
  [/(^|\.)maps\.app\.goo\.gl$|(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)netflix\.com$/, "Netflix"],
  [/(^|\.)amazon\.[a-z.]+$/, "Amazon"],
  [/(^|\.)wikipedia\.org$/, "Wikipedia"],
  [/(^|\.)letterboxd\.com$/, "Letterboxd"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)snapchat\.com$/, "Snapchat"],
  [/(^|\.)github\.com$/, "GitHub"],
];

function getLinkSiteName(hostname) {
  const match = LINK_SITE_NAMES.find(([pattern]) => pattern.test(hostname));
  if (match) return match[1];
  const base = hostname.split(".").slice(-2, -1)[0] || hostname;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function looksLikeOpaqueId(segment) {
  return (
    /^[A-Za-z0-9_-]{8,}$/.test(segment) && !/[-_]/.test(segment.slice(1, -1)) && /\d/.test(segment)
  );
}

function getLinkPreviewDetails(url) {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.replace(/^www\./, "");
  const siteName = getLinkSiteName(hostname);
  const pathParts = decodeURIComponent(parsedUrl.pathname)
    .split("/")
    .filter(Boolean)
    .filter((part) => !/^intl-[a-z]+$/i.test(part));
  const lastPart = pathParts[pathParts.length - 1] || "";
  const readable = lastPart
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[-_+]+/g, " ")
    .trim();
  const KIND_NAMES = {
    p: "post",
    reel: "reel",
    reels: "reel",
    tv: "video",
    status: "post",
    pin: "pin",
    watch: "video",
    video: "video",
    track: "song",
    album: "album",
    playlist: "playlist",
  };
  const rawKind = pathParts.length > 1 ? pathParts[pathParts.length - 2].toLowerCase() : "";
  const kind = KIND_NAMES[rawKind] || (rawKind.length >= 3 ? rawKind.replace(/[-_]+/g, " ") : "");

  let title;
  if (!lastPart) {
    title = siteName;
  } else if (looksLikeOpaqueId(lastPart)) {
    title = kind && kind.length < 20 ? `${siteName} ${kind}` : `${siteName} link`;
  } else {
    title = readable.length > 70 ? `${readable.slice(0, 67)}...` : readable;
  }

  return {
    hostname,
    siteName,
    title: title || siteName,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsedUrl.hostname)}&sz=64`,
  };
}

function createGenericLinkPreview(sourceUrl) {
  const preview = document.createElement("a");
  preview.className = "link-preview link-card";
  preview.href = sourceUrl;
  preview.target = "_blank";
  preview.rel = "noopener noreferrer";
  preview.draggable = false;

  let details;
  try {
    details = getLinkPreviewDetails(sourceUrl);
  } catch {
    details = { hostname: sourceUrl, siteName: "link", title: sourceUrl, faviconUrl: "" };
  }

  preview.setAttribute("aria-label", `open ${details.title} on ${details.siteName}`);
  preview.innerHTML = `
          <span class="link-card-icon" aria-hidden="true">
            ${details.faviconUrl ? `<img src="${escapeHtml(details.faviconUrl)}" alt="" loading="lazy" decoding="async" />` : ""}
            <span class="link-card-letter">${escapeHtml(details.siteName.charAt(0))}</span>
          </span>
          <span class="link-card-text">
            <span class="link-card-title">${escapeHtml(details.title)}</span>
            <span class="link-card-url">${escapeHtml(details.siteName)} · ${escapeHtml(details.hostname)}</span>
          </span>
          <span class="link-card-arrow" aria-hidden="true">↗</span>
        `;
  const icon = preview.querySelector(".link-card-icon img");
  icon?.addEventListener("error", () => icon.remove(), { once: true });
  icon?.addEventListener("load", () => icon.parentElement?.classList.add("has-favicon"), {
    once: true,
  });

  return preview;
}

function getSpotifyEmbed(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.replace(/^www\./, "") !== "open.spotify.com") return null;
    const parts = parsedUrl.pathname
      .split("/")
      .filter(Boolean)
      .filter((part) => !/^intl-[a-z]+$/i.test(part));
    const [type, id] = parts;
    if (!["track", "album", "playlist", "episode", "show", "artist"].includes(type) || !id)
      return null;
    return { type, id };
  } catch {
    return null;
  }
}

function createSpotifyPreview(embed) {
  const card = document.createElement("div");
  card.className = "link-preview spotify-card";
  const player = document.createElement("iframe");
  player.className = "spotify-preview-player";
  player.src = `https://open.spotify.com/embed/${embed.type}/${encodeURIComponent(embed.id)}?utm_source=generator`;
  player.title = "Spotify player";
  const isShortPlayer = embed.type === "track" || embed.type === "episode";
  player.height = isShortPlayer ? "100" : "352";
  if (isShortPlayer) player.scrolling = "no";
  player.loading = "lazy";
  player.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  card.appendChild(player);
  return card;
}

function canUseYouTubeEmbed() {
  return (
    ["http:", "https:"].includes(window.location.protocol) &&
    Boolean(window.location.origin) &&
    window.location.origin !== "null"
  );
}

function getYouTubeWatchUrl(videoId, sourceUrl) {
  return sourceUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function createYouTubeLinkPreview(videoId, sourceUrl) {
  const preview = document.createElement("a");
  preview.className = "link-preview youtube-preview youtube-preview-link";
  preview.href = getYouTubeWatchUrl(videoId, sourceUrl);
  preview.target = "_blank";
  preview.rel = "noopener noreferrer";
  preview.draggable = false;
  preview.setAttribute("aria-label", "watch video on YouTube");

  preview.innerHTML = `
          <img
            class="youtube-preview-thumbnail"
            src="https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <span class="youtube-preview-vignette" aria-hidden="true"></span>
          <span class="youtube-preview-play" aria-hidden="true">▶</span>
          <span class="youtube-preview-label">Watch on YouTube</span>
        `;

  return preview;
}

function createYouTubePreview(videoId, sourceUrl) {
  if (!canUseYouTubeEmbed()) {
    return createYouTubeLinkPreview(videoId, sourceUrl);
  }

  const preview = document.createElement("div");
  preview.className = "link-preview youtube-preview";

  const embedParams = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (window.location.origin && window.location.origin !== "null") {
    embedParams.set("origin", window.location.origin);
  }

  const player = document.createElement("iframe");
  player.className = "youtube-preview-player";
  player.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${embedParams.toString()}`;
  player.title = "YouTube video player";
  player.referrerPolicy = "strict-origin-when-cross-origin";
  player.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  player.allowFullscreen = true;

  preview.appendChild(player);
  return preview;
}

function renderLinkPreviews(postTextEl, previewContainer) {
  if (!previewContainer) return;

  linkifyPlainUrls(postTextEl);
  previewContainer.innerHTML = "";
  const seenVideos = new Set();
  const seenGenericUrls = new Set();
  const previewItems = getUrlsFromPostText(postTextEl)
    .map((url) => ({
      url,
      videoId: getYouTubeVideoId(url),
    }))
    .slice(0, 3);

  previewItems.forEach((item) => {
    if (item.videoId) {
      if (seenVideos.has(item.videoId)) return;
      seenVideos.add(item.videoId);
      previewContainer.appendChild(createYouTubePreview(item.videoId, item.url));
      return;
    }

    if (seenGenericUrls.has(item.url)) return;
    seenGenericUrls.add(item.url);
    const spotifyEmbed = canUseYouTubeEmbed() ? getSpotifyEmbed(item.url) : null;
    previewContainer.appendChild(
      spotifyEmbed ? createSpotifyPreview(spotifyEmbed) : createGenericLinkPreview(item.url),
    );
  });

  previewContainer.hidden = !previewContainer.children.length;
}

function renderTextWithLinkPreviews(textEl, previewContainer, text) {
  if (!textEl) return;

  textEl.textContent = text || "";
  renderLinkPreviews(textEl, previewContainer);
  textEl.querySelectorAll("a").forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function htmlToPlainText(html) {
  const container = document.createElement("div");
  container.innerHTML = sanitizePostHtml(html);
  return (container.textContent || "").replace(/\u00a0/g, " ");
}

let entryEditorPromise = null;

function ensureEntryEditor() {
  if (entryQuill || !entryEditor) return Promise.resolve(entryQuill);
  if (!entryEditorPromise) {
    entryEditorPromise = import("quill")
      .then((module) => {
        window.Quill = module.default || module;
      })
      .catch((error) => {
        console.error("could not load the rich text editor", error);
      })
      .then(() => {
        initEntryEditor();
        return entryQuill;
      });
  }
  return entryEditorPromise;
}

function prefetchEntryEditor() {
  const run = () => void ensureEntryEditor();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 6000 });
  } else {
    window.setTimeout(run, 1500);
  }
}

function initEntryEditor() {
  if (!entryEditor || entryQuill) return;

  if (!window.Quill || !DOMPurify?.sanitize) {
    document.body.classList.add("no-quill");
    entryQuill = null;
    return;
  }

  document.body.classList.remove("no-quill");

  const Font = window.Quill.import("formats/font");
  Font.whitelist = [
    "quicksand",
    "fredoka",
    "lora",
    "caveat",
    "dancing",
    "noto-sans",
    "nunito",
    "serif",
    "merriweather",
    "playfair",
    "monospace",
  ];
  window.Quill.register(Font, true);

  const SizeStyle = window.Quill.import("attributors/style/size");
  SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];
  window.Quill.register(SizeStyle, true);

  const addEntryColorSelector = () => {
    const toolbar = entryQuill?.getModule("toolbar")?.container;
    if (!toolbar || toolbar.querySelector("#entryTextColorPicker")) return;

    const colorGroup = document.createElement("span");
    colorGroup.className = "ql-formats entry-color-format";
    colorGroup.innerHTML = `
             <input
               class="photo-color-trigger entry-color-trigger"
               id="entryTextColorPicker"
               type="color"
               value="#446360"
               aria-label="choose text color"
               title="choose text color"
             />
           `;

    const formatGroups = toolbar.querySelectorAll(".ql-formats");
    const insertBefore = formatGroups[2] || formatGroups[formatGroups.length - 1];
    insertBefore?.before(colorGroup);

    const colorInput = colorGroup.querySelector("#entryTextColorPicker");
    colorInput?.addEventListener("input", () => {
      const color = normalizeHexColor(colorInput.value, "#446360");
      colorInput.value = color;
      entryQuill?.format("color", color);
      entryQuill?.focus();
    });
  };

  entryQuill = new window.Quill(entryEditor, {
    theme: "snow",
    placeholder: "write something ♡",
    modules: {
      toolbar: [
        [
          {
            font: ["quicksand", "fredoka", "lora", "caveat", "dancing"],
          },
        ],
        [
          {
            size: ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"],
          },
        ],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote"],
        ["link"],
        ["clean"],
      ],
    },
  });

  addEntryColorSelector();
  entryQuill.on("text-change", (_delta, _oldDelta, source) => {
    if (source === "user") scheduleEntryDraftSave();
  });
}

function clearEntryComposer() {
  if (entryQuill) {
    entryQuill.setContents([]);
  } else if (entryContentFallback) {
    entryContentFallback.value = "";
  }

  if (entryImageInput) {
    entryImageInput.value = "";
  }

  renderEntryImagePreview("");
}

function focusEntryComposerToEnd() {
  if (entryQuill) {
    entryQuill.focus();
    entryQuill.setSelection(entryQuill.getLength(), 0);
    return;
  }

  if (entryContentFallback) entryContentFallback.focus();
}

function setEntryComposerFromStoredContent(content) {
  const { content: textContent, image } = extractEntryAttachment(getPostDisplayHtml(content));
  const html = textContent;

  if (entryQuill) {
    entryQuill.clipboard.dangerouslyPasteHTML(html || "");
  } else if (entryContentFallback) {
    entryContentFallback.value = htmlToPlainText(html);
  }

  if (entryImageInput) {
    entryImageInput.value = "";
  }

  renderEntryImagePreview(image);
}

const EMBER_DECOR_SWAP = {
  "♡": "♥",
  ᰔ: "⛓",
  "✧": "✧",
  "☾": "☾",
  "☁": "☠",
  "✿": "✕",
  "✉": "♥",
  "∘": "⛓",
  "❀": "☠",
  "⋆": "✦",
  "♥": "♡",
  "✦": "✦",
};

function getLikedHeart() {
  return `♥${TEXT_PRESENTATION}`;
}

const TEXT_PRESENTATION = "\uFE0E";

function getDecorIcon(icon) {
  const glyph =
    document.documentElement.dataset.theme === "ember" ? EMBER_DECOR_SWAP[icon] || icon : icon;
  return `${glyph}${TEXT_PRESENTATION}`;
}

let renderedDecorTheme = "";

function renderDecor() {
  renderedDecorTheme = document.documentElement.dataset.theme;
  floatingDecorEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const reduceMotion = Boolean(reducedMotionMedia?.matches);
  const isPhone = Boolean(phoneLayoutMedia?.matches);
  const sparkleItems = reduceMotion ? [] : isPhone ? sparkleDecor.slice(0, 6) : sparkleDecor;
  const fadingItems = reduceMotion
    ? []
    : isPhone
      ? fadingEmojiDecor.slice(0, 18)
      : fadingEmojiDecor;

  floatingDecor.forEach((item) => {
    const node = document.createElement("div");
    node.className = "decor";
    node.textContent = getDecorIcon(item.icon);
    node.style.top = item.top;
    if (item.left) node.style.left = item.left;
    if (item.right) node.style.right = item.right;
    node.style.fontSize = item.size;
    node.style.animationDelay = item.delay;
    fragment.appendChild(node);
  });

  const addDecor = (className, item) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = getDecorIcon(item.icon);
    node.style.top = item.top;
    node.style.left = item.left;
    node.style.fontSize = item.size;
    node.style.animationDelay = item.delay;
    node.style.animationDuration = item.duration;
    fragment.appendChild(node);
  };
  sparkleItems.forEach((item) => addDecor("decor sparkle-decor", item));
  fadingItems.forEach((item) => addDecor("decor sparkle-decor fading-emoji-decor", item));

  floatingDecorEl.appendChild(fragment);
}

function getItemsInDisplayOrder(items = []) {
  return [...items]
    .map((item, index) => ({
      ...item,
      order: Number.isFinite(item?.order) ? item.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

function getNextItemOrder(items = []) {
  return (
    items.reduce((maxOrder, item, index) => {
      const itemOrder = Number.isFinite(item?.order) ? item.order : index;
      return Math.max(maxOrder, itemOrder);
    }, -1) + 1
  );
}

function reorderDisplayItem(widget, itemId, direction) {
  if (!widget?.data?.items?.length) return false;

  const items = getItemsInDisplayOrder(widget.data.items);
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : direction === "down" ? currentIndex + 1 : currentIndex;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
    return false;
  }

  [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];
  widget.data.items = items.map((item, index) => ({
    ...item,
    order: index,
  }));

  return true;
}

const EDITOR_ROWS = {
  bucketlist: {
    selector: ".bucketlist-item-row[data-wish-id]",
    id: "wishId",
    direction: "data-wish-direction",
  },
  dates: {
    selector: ".date-edit-item[data-date-id]",
    id: "dateId",
    direction: "data-date-direction",
  },
};

function getEditorRowRects(list, { selector, id }) {
  const rects = new Map();
  list?.querySelectorAll?.(selector).forEach((row) => {
    rects.set(row.dataset[id], row.getBoundingClientRect());
  });
  return rects;
}

function animateEditorRows(list, previousRects, { selector, id }) {
  if (!list || !previousRects?.size) return;

  list.querySelectorAll(selector).forEach((row) => {
    const previousRect = previousRects.get(row.dataset[id]);
    if (!previousRect) return;

    const deltaY = previousRect.top - row.getBoundingClientRect().top;
    if (Math.abs(deltaY) < 1) return;

    row.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], {
      duration: 340,
      easing: MOTION_EASING,
    });
  });
}

function syncEditorReorderButtons(list, { selector, direction }) {
  const rows = Array.from(list?.querySelectorAll?.(selector) || []);
  rows.forEach((row, index) => {
    row.querySelector(`[${direction}="up"]`)?.toggleAttribute("disabled", index === 0);
    row
      .querySelector(`[${direction}="down"]`)
      ?.toggleAttribute("disabled", index === rows.length - 1);
  });
}

function ensureWidgetStackOrder() {
  widgets.forEach((widget, index) => {
    if (!Number.isFinite(widget?.zIndex)) {
      widget.zIndex = index + 1;
    }
  });
}

function bringWidgetToFront(widget) {
  ensureWidgetStackOrder();
  const topZIndex = widgets.reduce((maxZIndex, item) => {
    const itemZIndex = Number.isFinite(item?.zIndex) ? item.zIndex : 0;
    return Math.max(maxZIndex, itemZIndex);
  }, 0);

  widget.zIndex = topZIndex + 1;
}

function getWeatherDescription(weatherCode, isDay) {
  const weatherMap = {
    0: isDay ? "clear sky" : "clear night",
    1: isDay ? "mostly sunny" : "mostly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "foggy",
    48: "rime fog",
    51: "light drizzle",
    53: "drizzle",
    55: "heavy drizzle",
    56: "freezing drizzle",
    57: "heavy freezing drizzle",
    61: "light rain",
    63: "rain",
    65: "heavy rain",
    66: "freezing rain",
    67: "heavy freezing rain",
    71: "light snow",
    73: "snow",
    75: "heavy snow",
    77: "snow grains",
    80: "rain showers",
    81: "heavy showers",
    82: "violent showers",
    85: "snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "storm with hail",
    99: "heavy hail storm",
  };

  return weatherMap[weatherCode] || "weather update";
}

function getWeatherWidget() {
  return widgets.find(
    (widget) =>
      String(widget.id || "")
        .toLowerCase()
        .trim() === "weather",
  );
}

function getThinkingOfYouWidget() {
  return widgets.find(
    (widget) =>
      String(widget.id || "")
        .toLowerCase()
        .trim() === "thinking-of-you",
  );
}

function getTodayDateKey() {
  return getDateKeyFromDate(new Date());
}

function getDateKeyFromDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getThinkingOfYouNotificationWindowKey(value) {
  const timestamp = new Date(value || Date.now()).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";

  const windowStart =
    Math.floor(timestamp / THINKING_OF_YOU_NOTIFICATION_GROUP_MS) *
    THINKING_OF_YOU_NOTIFICATION_GROUP_MS;
  return new Date(windowStart).toISOString();
}

function parseDisplayDate(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatDurationLabel(durationMs) {
  const totalSeconds = Math.max(0, Math.round((Number(durationMs) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function normalizeSpotifyTrackUrl(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;

  const spotifyUriMatch = rawValue.match(/^spotify:track:([a-zA-Z0-9]+)$/i);
  if (spotifyUriMatch) {
    const trackId = spotifyUriMatch[1];
    return {
      trackId,
      spotifyUrl: `https://open.spotify.com/track/${trackId}`,
      spotifyUri: `spotify:track:${trackId}`,
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawValue);
  } catch (error) {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const trackIndex = pathParts.findIndex((part) => part.toLowerCase() === "track");

  if (hostname === "spotify.link") {
    return {
      trackId: "",
      spotifyUrl: parsedUrl.toString(),
      spotifyUri: "",
    };
  }

  if (hostname !== "open.spotify.com" || trackIndex === -1 || !pathParts[trackIndex + 1]) {
    return null;
  }

  const trackId = pathParts[trackIndex + 1];
  return {
    trackId,
    spotifyUrl: `https://open.spotify.com/track/${trackId}`,
    spotifyUri: `spotify:track:${trackId}`,
  };
}

function normalizeSongWidget(widget) {
  if (!widget) return false;

  const rawData = widget.data && typeof widget.data === "object" ? widget.data : {};
  let changed = widget.data !== rawData;
  const normalizedTrack = normalizeSpotifyTrackUrl(rawData.spotifyUrl || rawData.note || "");
  const accentValue = Number(rawData.accent);
  const durationLabel =
    typeof rawData.durationLabel === "string" && rawData.durationLabel.trim()
      ? rawData.durationLabel.trim()
      : Number.isFinite(rawData.durationMs)
        ? formatDurationLabel(rawData.durationMs)
        : "";
  const normalizedComments = getPhotoWidgetComments({
    id: widget.id,
    data: rawData,
  });

  const nextData = {
    spotifyUrl:
      normalizedTrack?.spotifyUrl ||
      (typeof rawData.spotifyUrl === "string" ? rawData.spotifyUrl.trim() : ""),
    spotifyUri:
      normalizedTrack?.spotifyUri ||
      (typeof rawData.spotifyUri === "string" ? rawData.spotifyUri.trim() : ""),
    songName:
      typeof rawData.songName === "string" && rawData.songName.trim()
        ? rawData.songName.trim()
        : typeof rawData.title === "string"
          ? rawData.title.trim()
          : "",
    durationLabel,
    coverUrl:
      typeof rawData.coverUrl === "string" && rawData.coverUrl.trim()
        ? rawData.coverUrl.trim()
        : typeof rawData.image === "string"
          ? rawData.image.trim()
          : "",
    accent: Math.max(6, Math.min(94, Number.isFinite(accentValue) ? accentValue : 38)),
    likes: getWidgetLikeUserIds({ data: rawData }),
    likeTimestamps: getWidgetLikeTimestamps({ data: rawData }),
    profileLikeCredits: getWidgetProfileLikeCredits({ data: rawData }),
    comments: normalizedComments,
  };
  if (rawData.lastUpdatedBy) nextData.lastUpdatedBy = rawData.lastUpdatedBy;
  if (rawData.lastUpdatedAt) nextData.lastUpdatedAt = rawData.lastUpdatedAt;
  const legacyKeys = ["title", "image", "note", "durationMs"];
  Object.keys(rawData).forEach((key) => {
    if (!legacyKeys.includes(key) && !(key in nextData)) nextData[key] = rawData[key];
  });

  const keysToCheck = [
    "spotifyUrl",
    "spotifyUri",
    "songName",
    "durationLabel",
    "coverUrl",
    "accent",
    "likes",
    "likeTimestamps",
    "profileLikeCredits",
    "comments",
    "lastUpdatedBy",
    "lastUpdatedAt",
  ];
  const hasLegacyShape =
    legacyKeys.some((key) => key in rawData) ||
    keysToCheck.some((key) => JSON.stringify(rawData[key]) !== JSON.stringify(nextData[key]));

  if (hasLegacyShape) {
    changed = true;
  }

  widget.data = nextData;
  return changed;
}

async function fetchSpotifyTrackCardData(value) {
  const normalizedTrack = normalizeSpotifyTrackUrl(value);
  if (!normalizedTrack) {
    throw new Error("please paste a Spotify track link ♡");
  }

  const response = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(normalizedTrack.spotifyUrl)}`,
  );

  if (!response.ok) {
    throw new Error("could not fetch this Spotify track ♡");
  }

  const data = await response.json();
  const iframeUrl = String(data?.iframe_url || "");
  const isTrackEmbed = iframeUrl.includes("/embed/track/");
  const iframeTrackMatch = iframeUrl.match(/\/embed\/track\/([a-zA-Z0-9]+)/i);
  const iframeTrackId = iframeTrackMatch?.[1] || normalizedTrack.trackId || "";

  if (!isTrackEmbed) {
    throw new Error("that link is not a Spotify track ♡");
  }

  return {
    spotifyUrl: iframeTrackId
      ? `https://open.spotify.com/track/${iframeTrackId}`
      : normalizedTrack.spotifyUrl,
    spotifyUri: iframeTrackId ? `spotify:track:${iframeTrackId}` : normalizedTrack.spotifyUri,
    songName: String(data?.title || "").trim(),
    coverUrl: String(data?.thumbnail_url || "").trim(),
    durationLabel: "",
    accent: 38,
  };
}

function normalizeThinkingOfYouWidget(widget) {
  if (!widget) return false;

  const todayKey = getTodayDateKey();
  let changed = !widget.data || typeof widget.data !== "object" || Array.isArray(widget.data);
  widget.data = changed ? {} : widget.data;

  if (!widget.data.countsByUser || typeof widget.data.countsByUser !== "object") {
    const migratedCounts = {};
    const legacyCount = Number.isFinite(widget.data.count) ? widget.data.count : 0;
    const currentUserId = currentProfile?.id || currentUser?.id || "";

    if (legacyCount > 0 && currentUserId) {
      migratedCounts[currentUserId] = legacyCount;
    }

    widget.data.countsByUser = migratedCounts;
    changed = true;
  }

  if (!widget.data.totalCountsByUser || typeof widget.data.totalCountsByUser !== "object") {
    const migratedTotals = {};

    Object.entries(widget.data.countsByUser || {}).forEach(([userId, count]) => {
      if (Number.isFinite(count) && count > 0) {
        migratedTotals[userId] = count;
      }
    });

    widget.data.totalCountsByUser = migratedTotals;
    changed = true;
  }

  if (widget.data.lastResetDate !== todayKey) {
    widget.data.countsByUser = {};
    widget.data.lastResetDate = todayKey;
    changed = true;
  }

  if (normalizeCountMap(widget.data.countsByUser)) changed = true;
  if (normalizeCountMap(widget.data.totalCountsByUser)) changed = true;

  if (!Array.isArray(widget.data.thinkingOfYouEvents)) {
    widget.data.thinkingOfYouEvents = [];
    changed = true;
  } else {
    const groupedEventsByKey = new Map();

    widget.data.thinkingOfYouEvents
      .map((event) => {
        const createdAt = String(event?.createdAt || event?.created_at || "").trim();
        const actorId = String(event?.actorId || event?.userId || "").trim();
        const dateKey = String(event?.dateKey || getDateKeyFromDate(createdAt)).trim();
        const windowKey = String(
          event?.windowKey || getThinkingOfYouNotificationWindowKey(createdAt),
        ).trim();

        return {
          actorId,
          createdAt,
          dateKey,
          windowKey,
          count: Math.max(1, Number(event?.count) || 1),
        };
      })
      .filter(
        (event) => event.actorId && event.windowKey && getNotificationTimestamp(event.createdAt),
      )
      .forEach((event) => {
        const groupKey = `${event.actorId}:${event.windowKey}`;
        const existing = groupedEventsByKey.get(groupKey);

        if (!existing) {
          groupedEventsByKey.set(groupKey, {
            id: `thinking-of-you-${event.actorId}-${event.windowKey}`,
            actorId: event.actorId,
            createdAt: event.createdAt,
            dateKey: event.dateKey,
            windowKey: event.windowKey,
            count: event.count,
            eventCount: 1,
          });
          return;
        }

        existing.eventCount += 1;
        existing.count = Math.max(existing.count, event.count);

        if (
          getNotificationTimestamp(event.createdAt) > getNotificationTimestamp(existing.createdAt)
        ) {
          existing.createdAt = event.createdAt;
        }
      });

    const normalizedEvents = [...groupedEventsByKey.values()]
      .map((event) => ({
        id: event.id,
        actorId: event.actorId,
        createdAt: event.createdAt,
        dateKey: event.dateKey,
        windowKey: event.windowKey,
        count: Math.max(event.count, event.eventCount),
      }))
      .sort(
        (left, right) =>
          getNotificationTimestamp(left.createdAt) - getNotificationTimestamp(right.createdAt),
      )
      .slice(-60);

    if (JSON.stringify(normalizedEvents) !== JSON.stringify(widget.data.thinkingOfYouEvents)) {
      widget.data.thinkingOfYouEvents = normalizedEvents;
      changed = true;
    }
  }

  if ("count" in widget.data) {
    delete widget.data.count;
    changed = true;
  }

  return changed;
}

function normalizeCountMap(counts) {
  let changed = false;
  Object.keys(counts).forEach((userId) => {
    const count = counts[userId];
    const numericCount = Number(count);

    if (!Number.isFinite(numericCount) || numericCount < 0) {
      counts[userId] = 0;
      changed = true;
    } else if (count !== numericCount) {
      counts[userId] = numericCount;
      changed = true;
    }
  });
  return changed;
}

function addThinkingOfYouStreakTap(widget, actorId) {
  const now = Date.now();
  const streaks =
    widget.data.thinkingOfYouStreaks && typeof widget.data.thinkingOfYouStreaks === "object"
      ? widget.data.thinkingOfYouStreaks
      : {};
  const previous = streaks[actorId];
  const continuing =
    now - (Date.parse(previous?.lastAt || "") || 0) < THINKING_OF_YOU_STREAK_GAP_MS;
  streaks[actorId] = {
    count: continuing ? Math.max(0, Number(previous.count) || 0) + 1 : 1,
    lastAt: new Date(now).toISOString(),
  };
  widget.data.thinkingOfYouStreaks = streaks;
}

function addThinkingOfYouNotificationEvent(widget, actorId) {
  if (!widget?.data || !actorId) return;

  addThinkingOfYouStreakTap(widget, actorId);
  const createdAt = new Date().toISOString();
  const dateKey = getDateKeyFromDate(createdAt);
  const windowKey = getThinkingOfYouNotificationWindowKey(createdAt);
  const eventId = `thinking-of-you-${actorId}-${windowKey}`;
  const existingEvents = Array.isArray(widget.data.thinkingOfYouEvents)
    ? widget.data.thinkingOfYouEvents
    : [];
  const existingEvent = existingEvents.find(
    (event) =>
      String(event?.actorId || event?.userId || "").trim() === actorId &&
      String(
        event?.windowKey ||
          getThinkingOfYouNotificationWindowKey(event?.createdAt || event?.created_at),
      ).trim() === windowKey,
  );

  if (existingEvent) {
    existingEvent.id = eventId;
    existingEvent.actorId = actorId;
    existingEvent.createdAt = createdAt;
    existingEvent.dateKey = dateKey;
    existingEvent.windowKey = windowKey;
    existingEvent.count = Math.max(1, Number(existingEvent.count) || 1) + 1;
    return;
  }

  widget.data.thinkingOfYouEvents = [
    ...existingEvents,
    {
      id: eventId,
      actorId,
      createdAt,
      dateKey,
      windowKey,
      count: 1,
    },
  ].slice(-60);
}

function findWidgetByAlias(widgetId) {
  return widgets.find((item) => {
    const itemId = String(item.id || "")
      .toLowerCase()
      .trim();
    const itemTitle = String(item.title || "").toLowerCase();

    if (itemId === widgetId) return true;
    if (widgetId === "dates" && itemTitle.includes("dates to remember")) return true;
    if (widgetId === "bucketlist" && itemTitle.includes("bucket list")) return true;
    if (widgetId === "note" && itemTitle.includes("quick note")) return true;
    if (widgetId === "keepsake" && itemTitle.includes("keepsake")) return true;

    return false;
  });
}

function isLikeableWidget(widget) {
  const normalizedId = String(widget?.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget?.title || "").toLowerCase();

  return (
    normalizedId === "song" ||
    normalizedId === "note" ||
    normalizedTitle.includes("quick note") ||
    normalizedId.startsWith("keepsake") ||
    normalizedTitle.includes("keepsake")
  );
}

function isCommentableWidget(widget) {
  return isLikeableWidget(widget);
}

function getWidgetLikeUserIds(widget) {
  const widgetData = widget?.data && typeof widget.data === "object" ? widget.data : {};
  const rawLikes = Array.isArray(widgetData.likes)
    ? widgetData.likes
    : Array.isArray(widgetData.likedUserIds)
      ? widgetData.likedUserIds
      : [];

  return [...new Set(rawLikes.map((userId) => String(userId || "").trim()).filter(Boolean))];
}

function getWidgetLikeTimestamps(widget) {
  const widgetData = widget?.data && typeof widget.data === "object" ? widget.data : {};
  return widgetData.likeTimestamps && typeof widgetData.likeTimestamps === "object"
    ? widgetData.likeTimestamps
    : {};
}

function getWidgetProfileLikeCredits(widget) {
  const widgetData = widget?.data && typeof widget.data === "object" ? widget.data : {};
  const rawCredits =
    widgetData.profileLikeCredits && typeof widgetData.profileLikeCredits === "object"
      ? widgetData.profileLikeCredits
      : {};
  const credits = {};

  Object.entries(rawCredits).forEach(([userId, count]) => {
    const normalizedUserId = String(userId || "").trim();
    const normalizedCount = Math.max(0, Math.floor(Number(count) || 0));
    if (normalizedUserId && normalizedCount > 0) {
      credits[normalizedUserId] = normalizedCount;
    }
  });

  getWidgetLikeUserIds(widget).forEach((userId) => {
    credits[userId] = Math.max(credits[userId] || 0, 1);
  });

  return credits;
}

function normalizeWidgetLikesData(widget) {
  if (!widget || !isLikeableWidget(widget)) return false;

  const rawData = widget.data && typeof widget.data === "object" ? widget.data : {};
  const normalizedLikes = getWidgetLikeUserIds({ data: rawData });
  const rawTimestamps =
    rawData.likeTimestamps && typeof rawData.likeTimestamps === "object"
      ? rawData.likeTimestamps
      : {};
  const normalizedLikeSet = new Set(normalizedLikes);
  const normalizedTimestamps = {};
  const normalizedProfileLikeCredits = getWidgetProfileLikeCredits({
    data: rawData,
  });

  Object.entries(rawTimestamps).forEach(([userId, timestamp]) => {
    const normalizedUserId = String(userId || "").trim();
    const normalizedTimestamp = String(timestamp || "").trim();
    if (normalizedUserId && normalizedLikeSet.has(normalizedUserId) && normalizedTimestamp) {
      normalizedTimestamps[normalizedUserId] = normalizedTimestamp;
    }
  });

  const hadLegacyLikesKey = Object.prototype.hasOwnProperty.call(rawData, "likedUserIds");
  const timestampsAlreadyNormalized =
    Object.keys(rawTimestamps).length === Object.keys(normalizedTimestamps).length &&
    Object.entries(normalizedTimestamps).every(
      ([userId, timestamp]) => rawTimestamps[userId] === timestamp,
    );
  const likesAlreadyNormalized =
    Array.isArray(rawData.likes) &&
    rawData.likes.length === normalizedLikes.length &&
    rawData.likes.every((userId, index) => String(userId || "").trim() === normalizedLikes[index]);
  const rawProfileLikeCredits =
    rawData.profileLikeCredits && typeof rawData.profileLikeCredits === "object"
      ? rawData.profileLikeCredits
      : {};
  const profileLikeCreditsAlreadyNormalized =
    Object.keys(rawProfileLikeCredits).length ===
      Object.keys(normalizedProfileLikeCredits).length &&
    Object.entries(normalizedProfileLikeCredits).every(
      ([userId, count]) => Number(rawProfileLikeCredits[userId]) === count,
    );

  if (
    widget.data === rawData &&
    likesAlreadyNormalized &&
    timestampsAlreadyNormalized &&
    profileLikeCreditsAlreadyNormalized &&
    !hadLegacyLikesKey
  ) {
    return false;
  }

  const nextData = {
    ...rawData,
    likes: normalizedLikes,
    likeTimestamps: normalizedTimestamps,
    profileLikeCredits: normalizedProfileLikeCredits,
  };
  delete nextData.likedUserIds;
  widget.data = nextData;
  return true;
}

function getWidgetCommentCreatedTimestamp(comment) {
  return getCommentCreatedTimestamp(comment);
}

function getWidgetCommentSeenMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WIDGET_COMMENT_SEEN_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getWidgetCommentSeenAt(widgetId) {
  const userId = getSignedInUserId();
  if (!userId || !widgetId) return "";

  const seenMap = getWidgetCommentSeenMap();
  return String(seenMap[userId]?.[widgetId] || "");
}

function setWidgetCommentSeenAt(widgetId, seenAt) {
  const userId = getSignedInUserId();
  if (!userId || !widgetId || !seenAt) return;

  const seenMap = getWidgetCommentSeenMap();
  seenMap[userId] = {
    ...(seenMap[userId] && typeof seenMap[userId] === "object" ? seenMap[userId] : {}),
    [widgetId]: seenAt,
  };

  try {
    localStorage.setItem(WIDGET_COMMENT_SEEN_STORAGE_KEY, JSON.stringify(seenMap));
    markCloudPrefChanged("widgetCommentSeen");
  } catch (error) {
    console.error(error);
  }
}

function getLatestWidgetCommentCreatedAt(widget) {
  if (!widget || !isCommentableWidget(widget)) return "";

  let latestTimestamp = 0;
  let latestCreatedAt = "";
  getPhotoWidgetComments(widget).forEach((comment) => {
    [comment, ...(comment.replies || [])].forEach((item) => {
      const timestamp = getWidgetCommentCreatedTimestamp(item);
      if (Number.isFinite(timestamp) && timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestCreatedAt = String(item?.createdAt || item?.created_at || "");
      }
    });
  });

  return latestCreatedAt;
}

function getWidgetCommentBaselineTimestamp(widget) {
  const seenTimestamp = Math.max(
    getNotificationTimestamp(getWidgetCommentSeenAt(widget?.id || "")),
    getNotificationTimestamp(getNotificationsSeenAt()),
  );
  if (seenTimestamp) return seenTimestamp;

  const latestCreatedAt = getLatestWidgetCommentCreatedAt(widget);
  const latestTimestamp = getWidgetCommentCreatedTimestamp({
    createdAt: latestCreatedAt,
  });
  return Number.isFinite(latestTimestamp) ? latestTimestamp : 0;
}

function getUnreadWidgetCommentCount(widget) {
  if (!widget || !isCommentableWidget(widget)) return 0;

  const userId = getSignedInUserId();
  if (!userId) return 0;

  const seenTimestamp = getWidgetCommentBaselineTimestamp(widget);
  return getPhotoWidgetComments(widget).reduce((total, comment) => {
    return (
      total +
      [comment, ...(comment.replies || [])].filter((item) => {
        const actorId = String(item?.userId || item?.user_id || "");
        if (!actorId || actorId === userId) return false;

        const createdAt = getWidgetCommentCreatedTimestamp(item);
        return Number.isFinite(createdAt) && createdAt > seenTimestamp;
      }).length
    );
  }, 0);
}

function markWidgetCommentsSeen(widget) {
  const latestCreatedAt = getLatestWidgetCommentCreatedAt(widget);
  if (!latestCreatedAt) return;

  setWidgetCommentSeenAt(widget.id, latestCreatedAt);
  syncWidgetCommentButton(widget.id);
}

function getLikeButtonMarkup(likedByMe, likesCount) {
  return `
    <span class="post-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20.4 5.2a5.2 5.2 0 0 0-7.4 0L12 6.2l-1-1a5.2 5.2 0 0 0-7.4 7.4l1 1L12 21l7.4-7.4 1-1a5.2 5.2 0 0 0 0-7.4Z" /></svg></span>
    <span class="post-btn-label">${likedByMe ? "liked" : "like"}</span>
    <span class="post-btn-count">(${likesCount || 0})</span>
  `;
}

const WIDGET_ICON_PATHS = {
  up: '<path d="M12 19V5" /><path d="m6 11 6-6 6 6" />',
  down: '<path d="M12 5v14" /><path d="m6 13 6 6 6-6" />',
  minimize: '<path d="M5 12h14" />',
  restore: '<path d="M12 5v14" /><path d="M5 12h14" />',
  heart:
    '<path d="M20.4 5.2a5.2 5.2 0 0 0-7.4 0L12 6.2l-1-1a5.2 5.2 0 0 0-7.4 7.4l1 1L12 21l7.4-7.4 1-1a5.2 5.2 0 0 0 0-7.4Z" />',
  history: '<circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" />',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" />',
};

function getWidgetIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${WIDGET_ICON_PATHS[name]}</svg>`;
}

function getWidgetLikeButtonMarkup(widget) {
  const likes = getWidgetLikeUserIds(widget);
  return `
    <span class="post-btn-icon" aria-hidden="true">${getWidgetIcon("heart")}</span>
    <span class="post-btn-count">${likes.length || 0}</span>
  `;
}

function getCommentIconMarkup() {
  return `
    <span class="post-btn-icon comment-btn-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M7.8 18.6 4 21l1.1-4.3A7.7 7.7 0 0 1 3 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5S17 20 12 20a9.8 9.8 0 0 1-4.2-1.4Z" />
        <path d="M8 10.3h8M8 13.5h5.4" />
      </svg>
    </span>
  `;
}

function getWidgetCommentButtonMarkup(widget) {
  const unreadCount = getUnreadWidgetCommentCount(widget);
  return `
    ${getCommentIconMarkup()}
    ${unreadCount > 0 ? `<span class="post-btn-count">${unreadCount}</span>` : ""}
  `;
}

function getWidgetHeaderLikeButtonMarkup(widget) {
  if (!widget || !isLikeableWidget(widget)) return "";

  const currentUserId = currentUser?.id || currentProfile?.id || "";
  const likes = getWidgetLikeUserIds(widget);
  const likedByMe = Boolean(currentUserId && likes.includes(currentUserId));
  const className = ["widget-header-like-btn", "widget-like-btn", likedByMe ? "liked" : ""]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      class="${className}"
      type="button"
      data-widget-like-id="${escapeHtml(widget.id)}"
      aria-label="${likedByMe ? "liked widget" : "like widget"}"
      aria-pressed="${String(likedByMe)}"
    >
      ${getWidgetLikeButtonMarkup(widget)}
    </button>
  `;
}

function getWidgetHeaderCommentButtonMarkup(widget) {
  if (!widget || !isCommentableWidget(widget)) return "";

  const unreadCount = getUnreadWidgetCommentCount(widget);
  const className = [
    "widget-header-comment-btn",
    "widget-comment-btn",
    unreadCount > 0 ? "is-unread" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <button
      class="${className}"
      type="button"
      data-widget-comment-id="${escapeHtml(widget.id)}"
      aria-label="${unreadCount > 0 ? `open ${unreadCount} new widget comments` : "open widget comments"}"
    >
      ${getWidgetCommentButtonMarkup(widget)}
    </button>
  `;
}

function syncWidgetCommentButton(widgetId) {
  const widget = widgets.find((item) => item.id === widgetId);
  const buttons = Array.from(
    document.querySelectorAll(`.widget-comment-btn[data-widget-comment-id="${widgetId}"]`),
  );

  if (!widget || !buttons.length || !isCommentableWidget(widget)) return;

  buttons.forEach((btn) => {
    const unreadCount = getUnreadWidgetCommentCount(widget);
    btn.innerHTML = getWidgetCommentButtonMarkup(widget);
    btn.classList.toggle("is-unread", unreadCount > 0);
    btn.setAttribute(
      "aria-label",
      unreadCount > 0 ? `open ${unreadCount} new widget comments` : "open widget comments",
    );
  });
}

function syncWidgetCommentButtons() {
  widgets.forEach((widget) => {
    if (isCommentableWidget(widget)) {
      syncWidgetCommentButton(widget.id);
    }
  });
}

function getWidgetLikeContentSignature(widget) {
  if (!widget || !isLikeableWidget(widget)) return "";

  const normalizedId = String(widget.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget.title || "").toLowerCase();
  const data = widget.data && typeof widget.data === "object" ? widget.data : {};

  if (normalizedId === "song") {
    return JSON.stringify({
      spotifyUrl: data.spotifyUrl || "",
      spotifyUri: data.spotifyUri || "",
      songName: data.songName || "",
      durationLabel: data.durationLabel || "",
      coverUrl: data.coverUrl || "",
    });
  }

  if (normalizedId === "note" || normalizedTitle.includes("quick note")) {
    return JSON.stringify({
      text: data.text || "",
    });
  }

  return JSON.stringify({
    image: data.image || "",
    text: data.text || "",
    textColor: normalizeHexColor(data.textColor, "#ffffff"),
    textSize: Math.max(12, Math.min(46, Number(data.textSize) || 22)),
    textX: Math.max(
      0,
      Math.min(100, Number.isFinite(Number(data.textX)) ? Number(data.textX) : 50),
    ),
    textY: Math.max(
      0,
      Math.min(100, Number.isFinite(Number(data.textY)) ? Number(data.textY) : 86),
    ),
    rotate: Number(data.rotate) || 0,
    textFont: normalizePhotoTextFont(data.textFont),
    textEffect: normalizePhotoTextEffect(data.textEffect),
  });
}

function syncWidgetLikeButton(widgetId) {
  const widget = widgets.find((item) => item.id === widgetId);
  const buttons = Array.from(
    document.querySelectorAll(`.widget-like-btn[data-widget-like-id="${widgetId}"]`),
  );

  if (!widget || !buttons.length || !isLikeableWidget(widget)) return;

  const currentUserId = currentUser?.id || currentProfile?.id || "";
  const likes = getWidgetLikeUserIds(widget);
  const likedByMe = Boolean(currentUserId && likes.includes(currentUserId));

  buttons.forEach((btn) => {
    btn.innerHTML = getWidgetLikeButtonMarkup(widget);
    btn.classList.toggle("liked", likedByMe);
    btn.setAttribute("aria-label", likedByMe ? "liked widget" : "like widget");
    btn.setAttribute("aria-pressed", String(likedByMe));
  });
}

function getProfileDisplayName(profile, fallback) {
  if (!profile || typeof profile !== "object") return fallback;
  const name = String(profile.nickname || profile.username || "").trim();
  return name || fallback;
}

function getProfileBioFromAuthUser(user) {
  const metadata = user?.user_metadata || {};
  if (Object.prototype.hasOwnProperty.call(metadata, "profile_bio")) {
    return String(metadata.profile_bio || "");
  }
  if (Object.prototype.hasOwnProperty.call(metadata, "bio")) {
    return String(metadata.bio || "");
  }
  return null;
}

function getStoredProfileBio(userId) {
  if (!userId) return null;

  try {
    const storedBioMap = JSON.parse(localStorage.getItem(PROFILE_BIO_STORAGE_KEY) || "{}");

    if (
      storedBioMap &&
      typeof storedBioMap === "object" &&
      Object.prototype.hasOwnProperty.call(storedBioMap, userId)
    ) {
      return String(storedBioMap[userId] || "");
    }
  } catch (error) {
    console.error(error);
  }

  return null;
}

function saveStoredProfileBio(userId, bio) {
  if (!userId) return;

  try {
    const storedBioMap = JSON.parse(localStorage.getItem(PROFILE_BIO_STORAGE_KEY) || "{}");
    const nextBioMap = storedBioMap && typeof storedBioMap === "object" ? storedBioMap : {};

    nextBioMap[userId] = String(bio || "");
    localStorage.setItem(PROFILE_BIO_STORAGE_KEY, JSON.stringify(nextBioMap));
  } catch (error) {
    console.error(error);
  }
}

function normalizeSharedProfileBios(value) {
  const source =
    value && typeof value === "object" && value.bios && typeof value.bios === "object"
      ? value.bios
      : value && typeof value === "object"
        ? value
        : {};
  const normalized = {};

  Object.entries(source).forEach(([userId, bio]) => {
    const normalizedUserId = String(userId || "").trim();
    if (!normalizedUserId) return;
    normalized[normalizedUserId] = String(bio || "");
  });

  return normalized;
}

function getSharedProfileBio(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (
    !normalizedUserId ||
    !Object.prototype.hasOwnProperty.call(sharedProfileBios, normalizedUserId)
  ) {
    return null;
  }

  return String(sharedProfileBios[normalizedUserId] || "");
}

let sharedProfileBiosLoadedAt = 0;

async function loadSharedProfileBios(options = {}) {
  const { force = false } = options;

  if (sharedProfileBiosFetchPromise && !force) {
    return sharedProfileBiosFetchPromise;
  }

  if (!force && Date.now() - sharedProfileBiosLoadedAt < 60000) {
    return sharedProfileBios;
  }

  sharedProfileBiosFetchPromise = (async () => {
    const { data, error } = await dataStore
      .from("widgets")
      .select("data")
      .eq("id", PROFILE_BIO_WIDGET_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      return sharedProfileBios;
    }

    sharedProfileBios = normalizeSharedProfileBios(data?.data || {});
    sharedProfileBiosLoadedAt = Date.now();
    return sharedProfileBios;
  })();

  try {
    return await sharedProfileBiosFetchPromise;
  } finally {
    sharedProfileBiosFetchPromise = null;
  }
}

async function saveSharedProfileBio(userId, bio) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return false;

  await loadSharedProfileBios({ force: true });

  const nextBios = {
    ...sharedProfileBios,
    [normalizedUserId]: String(bio || ""),
  };
  const now = new Date().toISOString();
  const payload = {
    title: PROFILE_BIO_WIDGET_TITLE,
    side: "left",
    x: 0,
    y: 0,
    data: {
      bios: nextBios,
      updatedAt: now,
      updatedBy: normalizedUserId,
    },
    content: null,
    updated_at: now,
  };

  markPendingLocalWidgetUpdate(PROFILE_BIO_WIDGET_ID, payload.updated_at);

  const { data: updatedRows, error: updateError } = await dataStore
    .from("widgets")
    .update(payload)
    .eq("id", PROFILE_BIO_WIDGET_ID)
    .select("id");

  if (updateError) {
    console.error(updateError);
    return false;
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await dataStore.from("widgets").insert({
      id: PROFILE_BIO_WIDGET_ID,
      ...payload,
    });

    if (insertError) {
      console.error(insertError);
      return false;
    }
  }

  sharedProfileBios = nextBios;
  return true;
}

const CLOUD_PREFS_WIDGET_PREFIX = "__prefs:";
const CLOUD_PREFS_STAMP_STORAGE_KEY = "cloudPrefsStampsV1";
let cloudPrefsLoadedFor = "";
let cloudPrefsLoadedAt = 0;
let cloudPrefsSaveTimer = 0;
let cloudPrefsDirty = false;
let applyingCloudPrefs = false;
let removedDraftKeys = {};

function getCloudPrefsUserId() {
  return currentProfile?.id || currentUser?.id || "";
}

function getCloudPrefsWidgetId(userId = getCloudPrefsUserId()) {
  return userId ? `${CLOUD_PREFS_WIDGET_PREFIX}${userId}` : "";
}

function readCloudPrefStamps() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLOUD_PREFS_STAMP_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCloudPrefStamp(name, stamp) {
  const stamps = readCloudPrefStamps();
  stamps[name] = stamp;
  try {
    localStorage.setItem(CLOUD_PREFS_STAMP_STORAGE_KEY, JSON.stringify(stamps));
  } catch {}
}

function laterTimestamp(a, b) {
  const timeA = new Date(a || "").getTime() || 0;
  const timeB = new Date(b || "").getTime() || 0;
  return timeB > timeA ? b : a;
}

function getOwnEntryDrafts() {
  const prefix = `${getCloudPrefsUserId()}:`;
  const own = {};
  Object.entries(readEntryDrafts()).forEach(([key, draft]) => {
    if (!key.startsWith(prefix) || !draft || typeof draft !== "object") return;
    own[key] = isInlineImageDataUrl(draft.image) ? { ...draft, image: "" } : draft;
  });
  return own;
}

const CLOUD_PREF_HANDLERS = {
  editedPostIds: {
    read: () => getEditedPostIds(),
    apply: (value) => {
      if (!Array.isArray(value)) return;
      const ids = [...new Set([...getEditedPostIds(), ...value])];
      localStorage.setItem("editedPostIds", JSON.stringify(ids));
    },
  },
  notificationsSeenAt: {
    read: () => getNotificationsSeenAt(),
    apply: (value) => {
      if (value) setNotificationsSeenAt(String(value));
    },
  },
  notificationsClearedAt: {
    read: () => getNotificationsClearedAt(),
    apply: (value) => {
      if (!value) return;
      const current = getNotificationsClearedAt();
      if (laterTimestamp(current, String(value)) !== current) {
        setNotificationsClearedAt(String(value));
      }
    },
  },
  widgetCommentSeen: {
    read: () => getWidgetCommentSeenMap()[getSignedInUserId()] || {},
    apply: (value) => {
      if (!value || typeof value !== "object") return;
      Object.entries(value).forEach(([widgetId, seenAt]) => {
        const current = getWidgetCommentSeenAt(widgetId);
        if (laterTimestamp(current, seenAt) !== current) {
          setWidgetCommentSeenAt(widgetId, String(seenAt));
        }
      });
    },
  },
  recentGifs: {
    stamped: true,
    read: () => getRecentGiphyItems("gif"),
    apply: (value) => {
      if (Array.isArray(value)) {
        localStorage.setItem(getRecentGiphyStorageKey("gif"), JSON.stringify(value));
      }
    },
  },
  recentGiphyStickers: {
    stamped: true,
    read: () => getRecentGiphyItems("giphy-sticker"),
    apply: (value) => {
      if (Array.isArray(value)) {
        localStorage.setItem(getRecentGiphyStorageKey("giphy-sticker"), JSON.stringify(value));
      }
    },
  },
  entryDrafts: {
    read: () => getOwnEntryDrafts(),
    apply: (value) => {
      if (!value || typeof value !== "object") return;
      const drafts = readEntryDrafts();
      Object.entries(value).forEach(([key, draft]) => {
        if (key === "__removed" || !draft || typeof draft !== "object") return;
        const local = drafts[key];
        if (local && laterTimestamp(local.savedAt, draft.savedAt) === local.savedAt) return;
        drafts[key] = { ...draft, image: draft.image || local?.image || "" };
      });
      const removed = value.__removed && typeof value.__removed === "object" ? value.__removed : {};
      Object.entries(removed).forEach(([key, removedAt]) => {
        if (drafts[key] && laterTimestamp(drafts[key].savedAt, removedAt) === removedAt) {
          delete drafts[key];
        }
      });
      writeEntryDrafts(drafts);
    },
  },
};

function noteEntryDraftRemoved(key) {
  if (key) removedDraftKeys[key] = new Date().toISOString();
}

function collectCloudPrefs() {
  const values = {};
  Object.entries(CLOUD_PREF_HANDLERS).forEach(([name, handler]) => {
    try {
      values[name] = handler.read();
    } catch (error) {
      console.error(error);
    }
  });
  if (Object.keys(removedDraftKeys).length) {
    values.entryDrafts = { ...values.entryDrafts, __removed: { ...removedDraftKeys } };
  }
  return values;
}

function applyCloudPrefsData(data) {
  const values = data?.values && typeof data.values === "object" ? data.values : {};
  const stamps = data?.stamps && typeof data.stamps === "object" ? data.stamps : {};
  const localStamps = readCloudPrefStamps();
  const before = JSON.stringify(collectCloudPrefs());

  applyingCloudPrefs = true;
  try {
    Object.entries(CLOUD_PREF_HANDLERS).forEach(([name, handler]) => {
      if (!(name in values)) return;
      if (handler.stamped) {
        const localStamp = localStamps[name] || "";
        const cloudStamp = stamps[name] || "";
        if (localStamp && laterTimestamp(cloudStamp, localStamp) === localStamp) return;
        if (cloudStamp) writeCloudPrefStamp(name, cloudStamp);
      }
      try {
        handler.apply(values[name]);
      } catch (error) {
        console.error(error);
      }
    });
    if (values.entryDrafts?.__removed) {
      removedDraftKeys = { ...values.entryDrafts.__removed, ...removedDraftKeys };
    }
  } finally {
    applyingCloudPrefs = false;
  }

  return before !== JSON.stringify(collectCloudPrefs());
}

function scheduleCloudPrefsSave() {
  cloudPrefsDirty = true;
  window.clearTimeout(cloudPrefsSaveTimer);
  cloudPrefsSaveTimer = window.setTimeout(() => void saveCloudPrefs(), 1500);
}

function markCloudPrefChanged(name) {
  if (applyingCloudPrefs || !getCloudPrefsUserId()) return;
  if (CLOUD_PREF_HANDLERS[name]?.stamped) {
    writeCloudPrefStamp(name, new Date().toISOString());
  }
  scheduleCloudPrefsSave();
}

async function saveCloudPrefs() {
  window.clearTimeout(cloudPrefsSaveTimer);
  const widgetId = getCloudPrefsWidgetId();
  if (!widgetId || !cloudPrefsDirty) return false;
  cloudPrefsDirty = false;

  const now = new Date().toISOString();
  const payload = {
    title: "__prefs",
    side: "left",
    x: 0,
    y: 0,
    data: {
      values: collectCloudPrefs(),
      stamps: readCloudPrefStamps(),
      updatedAt: now,
    },
    content: null,
    updated_at: now,
  };

  markPendingLocalWidgetUpdate(widgetId, now);

  const { data: updatedRows, error: updateError } = await dataStore
    .from("widgets")
    .update(payload)
    .eq("id", widgetId)
    .select("id");

  if (updateError) {
    console.error(updateError);
    cloudPrefsDirty = true;
    return false;
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await dataStore
      .from("widgets")
      .insert({ id: widgetId, ...payload });
    if (insertError) {
      console.error(insertError);
      cloudPrefsDirty = true;
      return false;
    }
  }

  return true;
}

async function loadCloudPrefs({ force = false } = {}) {
  const userId = getCloudPrefsUserId();
  const widgetId = getCloudPrefsWidgetId(userId);
  if (!widgetId) return false;
  if (!force && cloudPrefsLoadedFor === userId && Date.now() - cloudPrefsLoadedAt < 60000) {
    return false;
  }

  const { data, error } = await dataStore
    .from("widgets")
    .select("data")
    .eq("id", widgetId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return false;
  }

  cloudPrefsLoadedFor = userId;
  cloudPrefsLoadedAt = Date.now();
  const changed = data?.data ? applyCloudPrefsData(data.data) : false;

  if (
    !data?.data ||
    JSON.stringify(collectCloudPrefs()) !== JSON.stringify(data.data.values || {})
  ) {
    scheduleCloudPrefsSave();
  }

  return changed;
}

function redrawAfterCloudPrefs() {
  renderTimeline();
  renderNotifications();
  refreshNotificationsFromCurrentData();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && cloudPrefsDirty) void saveCloudPrefs();
});

function getProfileBio(profile, userId = "", user = currentUser) {
  const resolvedUserId = userId || profile?.id || "";

  const source =
    profile && Object.prototype.hasOwnProperty.call(profile, "bio")
      ? profile
      : getKnownProfileById(resolvedUserId);
  if (source && Object.prototype.hasOwnProperty.call(source, "bio")) {
    return String(source.bio || "").trim();
  }

  if (
    profile &&
    typeof profile === "object" &&
    Object.prototype.hasOwnProperty.call(profile, "bio")
  ) {
    const profileBio = String(profile.bio || "").trim();
    if (profileBio) return profileBio;
  }

  const sharedBio = getSharedProfileBio(resolvedUserId);
  if (sharedBio !== null && sharedBio.trim()) {
    return sharedBio.trim();
  }

  const metadataBio = getProfileBioFromAuthUser(user);
  if (metadataBio !== null && metadataBio.trim()) {
    return metadataBio.trim();
  }

  const storedBio = getStoredProfileBio(resolvedUserId);
  return storedBio === null ? "" : storedBio.trim();
}

function persistProfileBioBackup(user, bio) {
  const userId = user?.id || currentProfile?.id || "";
  const nextBio = String(bio || "");

  saveStoredProfileBio(userId, nextBio);
}

function mergeProfileRecords(existingProfile = {}, incomingProfile = {}) {
  const nextProfile = {
    ...(existingProfile && typeof existingProfile === "object" ? existingProfile : {}),
  };

  if (!incomingProfile || typeof incomingProfile !== "object") {
    return nextProfile;
  }

  Object.entries(incomingProfile).forEach(([key, value]) => {
    if (value !== undefined) {
      nextProfile[key] = value;
    }
  });

  return nextProfile;
}

const warmedAvatarUrls = new Set();

function warmAvatar(url) {
  const avatarUrl = String(url || "").trim();
  if (!avatarUrl || warmedAvatarUrls.has(avatarUrl)) return;
  warmedAvatarUrls.add(avatarUrl);
  const image = new Image();
  image.decoding = "async";
  image.src = avatarUrl;
}

function upsertKnownProfile(profile) {
  if (!profile?.id) return;
  warmAvatar(profile.avatar_url);

  const existingProfile = knownProfiles.find((item) => item?.id === profile.id);
  const nextProfile = mergeProfileRecords(existingProfile, profile);

  knownProfiles = existingProfile
    ? knownProfiles.map((item) => (item?.id === profile.id ? nextProfile : item))
    : [nextProfile, ...knownProfiles];
}

function replaceKnownProfiles(profiles = []) {
  const profileMap = new Map(
    knownProfiles.filter((profile) => profile?.id).map((profile) => [profile.id, profile]),
  );

  profiles.forEach((profile) => {
    if (!profile?.id) return;
    profileMap.set(profile.id, mergeProfileRecords(profileMap.get(profile.id), profile));
  });

  if (currentProfile?.id) {
    profileMap.set(
      currentProfile.id,
      mergeProfileRecords(profileMap.get(currentProfile.id), currentProfile),
    );
  }

  knownProfiles = [...profileMap.values()];
}

function getKnownProfileById(userId, fallbackProfile = null) {
  if (!userId) {
    return fallbackProfile && typeof fallbackProfile === "object" ? { ...fallbackProfile } : null;
  }

  const matchingKnownProfile = knownProfiles.find((profile) => profile?.id === userId);
  const matchingCurrentProfile = currentProfile?.id === userId ? currentProfile : null;
  const mergedProfile = mergeProfileRecords(
    mergeProfileRecords(fallbackProfile, matchingKnownProfile),
    matchingCurrentProfile,
  );

  return mergedProfile?.id ? mergedProfile : null;
}

function isCurrentUsersProfile(userId) {
  if (!userId) return false;
  return userId === (currentProfile?.id || currentUser?.id || "");
}

function getProfileHandle(profile, fallbackUserId = "") {
  const username = String(profile?.username || "").trim();
  if (username) return `@${username}`;
  return fallbackUserId ? `id ${fallbackUserId.slice(0, 8)}` : "@someone";
}

function formatProfileDurationShort(dateString) {
  const timestamp = new Date(dateString).getTime();
  if (!timestamp) return "new";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return "today";
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${Math.max(1, diffMonths)}mo`;

  return `${Math.floor(diffDays / 365)}y`;
}

function getProfileJoinedInfo(userId, profile = null) {
  const directCreatedAt = String(profile?.created_at || "").trim();
  if (directCreatedAt && Number.isFinite(new Date(directCreatedAt).getTime())) {
    return {
      date: directCreatedAt,
      value: formatProfileDurationShort(directCreatedAt),
      label: "since signup",
      summary: `joined ${formatEntryDate(directCreatedAt)}`,
    };
  }

  const activityDates = [];

  posts.forEach((post) => {
    if (post?.userId === userId && post?.created_at) {
      activityDates.push(post.created_at);
    }
  });

  (notificationSourceData.likesData || []).forEach((like) => {
    if (like?.user_id === userId && like?.created_at) {
      activityDates.push(like.created_at);
    }
  });

  (notificationSourceData.commentsData || []).forEach((comment) => {
    if (comment?.user_id === userId && comment?.created_at) {
      activityDates.push(comment.created_at);
    }
  });

  (notificationSourceData.stickersData || []).forEach((sticker) => {
    if (sticker?.user_id === userId && sticker?.created_at) {
      activityDates.push(sticker.created_at);
    }
  });

  widgets.forEach((widget) => {
    if (!isLikeableWidget(widget)) return;
    normalizeWidgetLikesData(widget);
    const likeTimestamps = getWidgetLikeTimestamps(widget);
    const createdAt = likeTimestamps[userId];
    if (createdAt) {
      activityDates.push(createdAt);
    }
  });

  const earliestActivity = activityDates
    .filter((value) => Number.isFinite(new Date(value).getTime()))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

  if (earliestActivity) {
    return {
      date: earliestActivity,
      value: formatProfileDurationShort(earliestActivity),
      label: "at least",
      summary: `around here since ${formatEntryDate(earliestActivity)}`,
    };
  }

  return {
    date: "",
    value: "new",
    label: "time here",
    summary: "signup date hidden",
  };
}

function recordLocalLikeChange(like, isLiked) {
  const rows = Array.isArray(notificationSourceData.likesData)
    ? notificationSourceData.likesData
    : [];
  const matches = (row) =>
    row?.user_id === like.user_id &&
    (like.post_id ? row.post_id === like.post_id : row.comment_id === like.comment_id);

  notificationSourceData.likesData = isLiked
    ? [
        ...rows.filter((row) => !matches(row)),
        { id: `local-like-${Date.now()}`, created_at: new Date().toISOString(), ...like },
      ]
    : rows.filter((row) => !matches(row));

  if (profilePopup?.classList.contains("open") && activeProfilePopupUserId) {
    renderProfilePopup(getKnownProfileById(activeProfilePopupUserId));
  }
}

function getProfileLikeCount(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return 0;

  const postAndCommentLikes = new Set(
    (notificationSourceData.likesData || [])
      .filter((like) => like?.user_id === normalizedUserId)
      .map((like) => like.id || `${like.post_id || ""}:${like.comment_id || ""}`),
  ).size;

  const widgetLikes = widgets.reduce((total, widget) => {
    if (!isLikeableWidget(widget)) return total;
    return total + (getWidgetLikeUserIds(widget).includes(normalizedUserId) ? 1 : 0);
  }, 0);

  const widgetCommentLikes = widgets.reduce((total, widget) => {
    if (!isCommentableWidget(widget)) return total;
    return (
      total +
      getPhotoWidgetComments(widget).reduce((commentTotal, comment) => {
        const ownLikes = [comment, ...(comment.replies || [])].filter((item) =>
          getWidgetCommentLikeUserIds(item).includes(normalizedUserId),
        ).length;
        return commentTotal + ownLikes;
      }, 0)
    );
  }, 0);

  return postAndCommentLikes + widgetLikes + widgetCommentLikes;
}

function getProfileThinkingOfYouCount(userId) {
  if (!userId) return 0;

  const thinkingOfYouWidget = getThinkingOfYouWidget();
  if (!thinkingOfYouWidget) return 0;

  normalizeThinkingOfYouWidget(thinkingOfYouWidget);
  const totalCountsByUser =
    thinkingOfYouWidget.data?.totalCountsByUser &&
    typeof thinkingOfYouWidget.data.totalCountsByUser === "object"
      ? thinkingOfYouWidget.data.totalCountsByUser
      : {};
  const countsByUser =
    thinkingOfYouWidget.data?.countsByUser &&
    typeof thinkingOfYouWidget.data.countsByUser === "object"
      ? thinkingOfYouWidget.data.countsByUser
      : {};

  const total = totalCountsByUser[userId] ?? countsByUser[userId];
  return Number.isFinite(total) && total > 0 ? total : 0;
}

function getProfileLatestActivityTimestamp(userId, profile = null) {
  if (!userId) return 0;

  const candidateTimestamps = [];
  const pushTimestamp = (value) => {
    const timestamp = new Date(value || "").getTime();
    if (Number.isFinite(timestamp) && timestamp > 0) {
      candidateTimestamps.push(timestamp);
    }
  };

  pushTimestamp(profile?.last_seen_at);

  (notificationSourceData.postsData || []).forEach((post) => {
    if (post?.user_id !== userId) return;
    pushTimestamp(post.created_at);
    pushTimestamp(post.updated_at);
  });

  (notificationSourceData.likesData || []).forEach((like) => {
    if (like?.user_id === userId) {
      pushTimestamp(like.created_at);
    }
  });

  (notificationSourceData.commentsData || []).forEach((comment) => {
    if (comment?.user_id === userId) {
      pushTimestamp(comment.created_at);
    }
  });

  (notificationSourceData.stickersData || []).forEach((sticker) => {
    if (sticker?.user_id === userId) {
      pushTimestamp(sticker.created_at);
    }
  });

  widgets.forEach((widget) => {
    const widgetData = getWidgetDataForNotifications(widget);

    if (widgetData.lastUpdatedBy === userId) {
      pushTimestamp(widgetData.lastUpdatedAt);
    }

    if (!isLikeableWidget(widget)) return;

    normalizeWidgetLikesData(widget);
    pushTimestamp(getWidgetLikeTimestamps(widget)[userId]);
  });

  return candidateTimestamps.length ? Math.max(...candidateTimestamps) : 0;
}

function getProfilePresenceInfo(userId, profile = null) {
  const lastSeenTimestamp = new Date(profile?.last_seen_at || "").getTime();
  const latestActivityTimestamp =
    Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? lastSeenTimestamp
      : getProfileLatestActivityTimestamp(userId, profile);

  if (!latestActivityTimestamp) {
    return {
      state: "unknown",
      summary: "last seen hidden",
      timestamp: 0,
    };
  }

  const diffMs = Math.max(0, Date.now() - latestActivityTimestamp);

  if (diffMs <= PROFILE_ACTIVE_WINDOW_MS) {
    return {
      state: "active",
      summary: "active now",
      timestamp: latestActivityTimestamp,
    };
  }

  return {
    state: "away",
    summary: `last seen ${formatNotificationRelativeTime(
      new Date(latestActivityTimestamp).toISOString(),
    )}`,
    timestamp: latestActivityTimestamp,
  };
}

function getProfileStats(userId, profile = null) {
  return {
    postsCount: posts.filter((post) => post?.userId === userId).length,
    likesCount: getProfileLikeCount(userId),
    thinkingOfYouCount: getProfileThinkingOfYouCount(userId),
    joined: getProfileJoinedInfo(userId, profile),
    presence: getProfilePresenceInfo(userId, profile),
  };
}

function renderProfilePopupAvatar(profile) {
  if (!profileSummaryAvatar) return;

  const avatarUrl = String(profile?.avatar_url || "").trim();
  const displayName = getProfileDisplayName(profile, "someone");

  if (avatarUrl) {
    profileSummaryAvatar.innerHTML = `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" loading="eager" decoding="async" fetchpriority="high" />`;
    return;
  }

  profileSummaryAvatar.textContent = displayName.charAt(0).toUpperCase() || "♡";
}

function isProfilePopupEditing() {
  return Boolean(profilePopupEditMode);
}

function setProfilePopupEditMode(isEditing) {
  const viewingOwnProfile = isCurrentUsersProfile(activeProfilePopupUserId);
  const shouldEdit = Boolean(viewingOwnProfile && isEditing);
  const popupBody = profilePopup?.querySelector(".popup-body");
  const previousPopupScrollTop = popupBody?.scrollTop || 0;
  const activeElement = document.activeElement;
  const shouldBlurEditField =
    !shouldEdit &&
    activeElement instanceof HTMLElement &&
    Boolean(profileEditSection?.contains(activeElement));

  profilePopupEditMode = shouldEdit;

  if (shouldBlurEditField) {
    activeElement.blur();
  }

  if (profileEditSection) {
    profileEditSection.hidden = !shouldEdit;
  }

  if (editProfileBtn) {
    editProfileBtn.hidden = !viewingOwnProfile || shouldEdit;
  }

  if (cancelProfileEditBtn) {
    cancelProfileEditBtn.hidden = !shouldEdit;
  }

  if (logoutBtn) {
    logoutBtn.hidden = !viewingOwnProfile || shouldEdit;
  }

  if (saveProfileBtn) {
    saveProfileBtn.hidden = !shouldEdit;
  }

  if (popupBody) {
    popupBody.scrollTop = previousPopupScrollTop;
  }
}

function closeProfileDetailsPopup() {
  activeProfilePopupUserId = "";
  if (profilePopup) {
    profilePopup.classList.remove("open");
  }
}

function renderProfilePopup(profile, options = {}) {
  const resolvedProfile = profile || {};
  const profileUserId = String(
    resolvedProfile.id || activeProfilePopupUserId || currentProfile?.id || currentUser?.id || "",
  );
  const isOwnProfile = isCurrentUsersProfile(profileUserId);
  const hasExplicitEditMode = Object.prototype.hasOwnProperty.call(options, "startEditing");
  const shouldEditProfile =
    isOwnProfile && (hasExplicitEditMode ? Boolean(options.startEditing) : isProfilePopupEditing());
  const popupBody = profilePopup?.querySelector(".popup-body");
  const previousPopupScrollTop = popupBody?.scrollTop || 0;
  const activeElement = document.activeElement;
  const shouldRestoreFocus =
    shouldEditProfile &&
    activeElement instanceof HTMLElement &&
    Boolean(profilePopup?.contains(activeElement));
  const displayName = getProfileDisplayName(resolvedProfile, isOwnProfile ? "you" : "someone");
  const profileTitleEl = document.querySelector("#profilePopup .popup-title");
  const profileStats = getProfileStats(profileUserId, resolvedProfile);
  const bio = getProfileBio(resolvedProfile, profileUserId, isOwnProfile ? currentUser : null);

  activeProfilePopupUserId = profileUserId;

  if (profileTitleEl) {
    profileTitleEl.textContent = isOwnProfile ? "my profile ♡" : `${displayName}'s profile ♡`;
  }

  renderProfilePopupAvatar(resolvedProfile);

  if (profileSummaryName) {
    profileSummaryName.textContent = displayName;
  }

  if (profileSummaryHandle) {
    profileSummaryHandle.textContent = getProfileHandle(resolvedProfile, profileUserId);
  }

  if (profileSummaryJoined) {
    profileSummaryJoined.textContent = profileStats.presence.summary;
    profileSummaryJoined.dataset.presenceState = profileStats.presence.state;
  }

  if (profileSummaryBio) {
    profileSummaryBio.textContent = bio || "no bio yet ♡";
  }

  if (profilePostsStat) {
    profilePostsStat.textContent = String(profileStats.postsCount);
  }

  if (profileLikesStat) {
    profileLikesStat.textContent = String(profileStats.likesCount);
  }

  if (profileThinkingOfYouStat) {
    profileThinkingOfYouStat.textContent = String(profileStats.thinkingOfYouCount);
  }

  if (profileThinkingOfYouStatLabel) {
    profileThinkingOfYouStatLabel.textContent = "thoughts";
  }

  if (profileJoinedStat) {
    profileJoinedStat.textContent = profileStats.joined.value;
  }

  if (profileJoinedStatLabel) {
    profileJoinedStatLabel.textContent = profileStats.joined.label;
  }

  if (isOwnProfile) {
    if (nicknameInput && !shouldEditProfile) {
      nicknameInput.value = String(currentProfile?.nickname || resolvedProfile.nickname || "");
    }
    if (bioInput && !shouldEditProfile) {
      bioInput.value = getProfileBio(currentProfile || resolvedProfile, profileUserId, currentUser);
    }
    if (pfpInput && !shouldEditProfile) {
      pfpInput.value = "";
    }
  }

  setProfilePopupEditMode(shouldEditProfile);

  if (popupBody) {
    popupBody.scrollTop = previousPopupScrollTop;
  }

  if (shouldRestoreFocus && document.contains(activeElement) && !activeElement.hidden) {
    activeElement.focus({ preventScroll: true });
  }
}

function applyLocalProfilePresence(userId, lastSeenAt) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedLastSeenAt = String(lastSeenAt || "").trim();

  if (!normalizedUserId || !normalizedLastSeenAt) return;

  if (currentProfile?.id === normalizedUserId) {
    currentProfile = {
      ...currentProfile,
      last_seen_at: normalizedLastSeenAt,
    };
  }

  upsertKnownProfile({
    id: normalizedUserId,
    last_seen_at: normalizedLastSeenAt,
  });

  if (activeProfilePopupUserId === normalizedUserId) {
    renderProfilePopup(getKnownProfileById(normalizedUserId, currentProfile));
  }
}

async function touchCurrentUserPresence(options = {}) {
  const { force = false } = options;
  const user = await getCurrentUser();

  if (!user?.id) return;

  const now = Date.now();
  if (!force && now - lastPresenceSyncAt < PROFILE_PRESENCE_HEARTBEAT_MS / 2) {
    return;
  }

  lastPresenceSyncAt = now;
  const lastSeenAt = new Date(now).toISOString();
  applyLocalProfilePresence(user.id, lastSeenAt);

  if (profileLastSeenFieldSupported === false) {
    return;
  }

  const { data, error } = await dataStore
    .from("profiles")
    .update({ last_seen_at: lastSeenAt })
    .eq("id", user.id)
    .select("id, last_seen_at")
    .maybeSingle();

  if (error) {
    if (
      String(error.message || "")
        .toLowerCase()
        .includes("last_seen_at")
    ) {
      profileLastSeenFieldSupported = false;
      return;
    }

    console.error(error);
    return;
  }

  profileLastSeenFieldSupported = true;
  applyLocalProfilePresence(user.id, data?.last_seen_at || lastSeenAt);
}

function stopProfilePresenceHeartbeat() {
  if (!profilePresenceHeartbeatId) return;

  window.clearInterval(profilePresenceHeartbeatId);
  profilePresenceHeartbeatId = 0;
}

function startProfilePresenceHeartbeat() {
  stopProfilePresenceHeartbeat();

  if (!currentUser) return;

  void touchCurrentUserPresence({ force: true });
  profilePresenceHeartbeatId = window.setInterval(() => {
    if (document.visibilityState === "hidden" || !currentUser) return;
    void touchCurrentUserPresence();
  }, PROFILE_PRESENCE_HEARTBEAT_MS);
}

async function openProfilePopupForUser(userId, fallbackProfile = null) {
  const user = await getCurrentUser();
  const resolvedUserId = String(userId || currentProfile?.id || user?.id || "").trim();

  if (!resolvedUserId) {
    showMessage("please log in first ♡");
    return;
  }

  if (user?.id === resolvedUserId && !currentProfile) {
    await loadProfile(user);
  }

  const resolvedProfile =
    getKnownProfileById(resolvedUserId, fallbackProfile) ||
    mergeProfileRecords(fallbackProfile, { id: resolvedUserId });

  renderProfilePopup(resolvedProfile);
  profilePopup?.classList.add("open");

  void refreshProfilePopup(resolvedUserId);
}

function bindProfilePopupTrigger(element, openProfilePopup) {
  if (!element || typeof openProfilePopup !== "function") return;

  element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openProfilePopup();
  });

  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    void openProfilePopup();
  });
}

async function fetchProfilesDirectory() {
  return dataStore.from("profiles").select(PROFILE_DIRECTORY_SELECT);
}

async function fetchProfileById(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return { data: null, error: null };
  }

  return dataStore
    .from("profiles")
    .select(PROFILE_DIRECTORY_SELECT)
    .eq("id", normalizedUserId)
    .maybeSingle();
}

async function refreshProfilePopup(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return;

  const existingFetch = pendingLocalProfileFetches.get(normalizedUserId);
  if (existingFetch) {
    await existingFetch;
    return;
  }

  const fetchPromise = (async () => {
    const [{ data, error }] = await Promise.all([
      fetchProfileById(normalizedUserId),
      loadSharedProfileBios(),
    ]);

    if (error) {
      console.error(error);
      return;
    }

    if (!data?.id) return;

    upsertKnownProfile(data);

    if (currentProfile?.id === data.id) {
      currentProfile = mergeProfileRecords(currentProfile, data);
    }

    applyProfileToTimeline(data);

    if (profilePopup?.classList.contains("open") && activeProfilePopupUserId === normalizedUserId) {
      renderProfilePopup(getKnownProfileById(normalizedUserId));
    }
  })();

  pendingLocalProfileFetches.set(normalizedUserId, fetchPromise);

  try {
    await fetchPromise;
  } finally {
    pendingLocalProfileFetches.delete(normalizedUserId);
  }
}

function getThinkingOfYouCounterLabels() {
  const activeUserId = currentProfile?.id || currentUser?.id || "";
  const myLabel = getProfileDisplayName(currentProfile, "mine");
  const otherProfile = knownProfiles.find((profile) => profile?.id && profile.id !== activeUserId);
  const partnerLabel = getProfileDisplayName(otherProfile, "theirs");

  return {
    myLabel: escapeHtml(myLabel),
    partnerLabel: escapeHtml(partnerLabel),
  };
}

async function incrementThinkingOfYouWidget() {
  const widget = getThinkingOfYouWidget();
  if (!widget) return;

  const activeUserId = currentProfile?.id || currentUser?.id;
  if (!activeUserId) return;

  normalizeThinkingOfYouWidget(widget);
  widget.data.countsByUser[activeUserId] = (widget.data.countsByUser[activeUserId] || 0) + 1;
  widget.data.totalCountsByUser[activeUserId] =
    (widget.data.totalCountsByUser[activeUserId] || 0) + 1;
  widget.data.lastResetDate = getTodayDateKey();
  addThinkingOfYouNotificationEvent(widget, activeUserId);

  refreshThinkingOfYouWidgetDom(widget);
  if (activeProfilePopupUserId === activeUserId) {
    renderProfilePopup(getKnownProfileById(activeUserId, currentProfile));
  }
  queueWidgetSave(widget, { notifyUpdate: true, ownThinkingOfYouTap: true, recordHistory: false });
}

function stopPress(element) {
  ["mousedown", "pointerdown"].forEach((eventName) => {
    element.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
}

function bindThinkingOfYouWidgetButtons(root) {
  root.querySelectorAll("[data-thinking-of-you-widget-id]").forEach((btn) => {
    stopPress(btn);

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (btn.hasAttribute("disabled")) return;
      incrementThinkingOfYouWidget();
    });
  });
}

function isFirstPartner() {
  return (currentUser?.id || currentProfile?.id) === PEOPLE[0].id;
}

function isSecondPartner() {
  return (currentUser?.id || currentProfile?.id) === PEOPLE[1].id;
}

function canEditKeepsakeWidget(widgetOrId) {
  const normalizedId = String(typeof widgetOrId === "string" ? widgetOrId : widgetOrId?.id || "")
    .toLowerCase()
    .trim();

  if (normalizedId === "keepsake-right") {
    return isSecondPartner();
  }

  if (normalizedId === "keepsake") {
    return isFirstPartner();
  }

  return false;
}

function getRenderedWidgetEls(widget) {
  return Array.from(document.querySelectorAll(".widget")).filter(
    (widgetEl) =>
      (widgetEl.dataset.widgetSourceId || widgetEl.dataset.widgetId || "") === widget.id,
  );
}

function refreshThinkingOfYouWidgetDom(widget) {
  const matchingWidgets = getRenderedWidgetEls(widget);

  if (!matchingWidgets.length) {
    renderWidgets({ animateMobileReorder: false });
    return;
  }

  matchingWidgets.forEach((widgetEl) => {
    const content = widgetEl.querySelector(".widget-content");
    if (!content) return;

    content.innerHTML = getWidgetContent(widget);
    bindThinkingOfYouWidgetButtons(content);
  });
}

function refreshThinkingOfYouNames() {
  const widget = getThinkingOfYouWidget();
  if (widget && getRenderedWidgetEls(widget).length) refreshThinkingOfYouWidgetDom(widget);
}

function refreshWidgetContentDom(widget) {
  if (!widget?.id) return false;

  const matchingWidgets = getRenderedWidgetEls(widget);

  if (!matchingWidgets.length) return false;

  matchingWidgets.forEach((widgetEl) => {
    const content = widgetEl.querySelector(".widget-content");
    if (!content) return;

    content.innerHTML = getWidgetContent(widget);
    bindThinkingOfYouWidgetButtons(content);

    content.querySelectorAll(".widget-wish-toggle").forEach((btn) => {
      stopPress(btn);

      btn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await toggleWidgetBucketlistItem(widget.id, btn.dataset.widgetWishId);
      });
    });
  });

  syncWidgetLikeButton(widget.id);
  return true;
}

const WEATHER_MAX_AGE_MS = 15 * 60 * 1000;
const WEATHER_STORAGE_KEY = "weatherCacheV1";
let weatherCache = null;
let weatherRequest = null;

try {
  const storedWeather = JSON.parse(localStorage.getItem(WEATHER_STORAGE_KEY) || "null");
  if (storedWeather && Array.isArray(storedWeather.locations)) weatherCache = storedWeather;
} catch {
  weatherCache = null;
}

function applyWeatherCache(widget) {
  if (!widget || !weatherCache) return false;
  widget.data = {
    ...(widget.data || {}),
    locations: weatherCache.locations,
    fetchedAt: weatherCache.fetchedAt,
    status: "ready",
    error: "",
  };
  return true;
}

async function fetchWeatherLocations() {
  return Promise.all(
    WEATHER_LOCATIONS.map(async (location) => {
      const response = await fetch(
        `${OPEN_METEO_FORECAST_ENDPOINT}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`,
      );

      if (!response.ok) {
        throw new Error(`Weather request failed with ${response.status}`);
      }

      const payload = await response.json();
      const currentWeather = payload?.current;

      if (!currentWeather) {
        throw new Error("Weather data is unavailable right now.");
      }

      return {
        label: location.label,
        temperature: currentWeather.temperature_2m,
        apparentTemperature: currentWeather.apparent_temperature,
        weatherCode: currentWeather.weather_code,
        windSpeed: currentWeather.wind_speed_10m,
        isDay: Boolean(currentWeather.is_day),
      };
    }),
  );
}

function renderWeatherWidgetInPlace(widget, animateWidgets = false) {
  const scrollSnapshot = getViewportScrollSnapshot();
  const updatedInline = refreshWidgetContentDom(widget);
  if (!updatedInline) {
    renderWidgets({ animateMobileReorder: animateWidgets });
  }
  restoreViewportScroll(scrollSnapshot);
}

async function refreshWeatherWidget(options = {}) {
  const { render = true, animateWidgets = false, force = false } = options;
  const widget = getWeatherWidget();
  if (!widget) return;

  const cacheAge = weatherCache
    ? Date.now() - new Date(weatherCache.fetchedAt).getTime()
    : Infinity;

  if (applyWeatherCache(widget) && render) renderWeatherWidgetInPlace(widget, animateWidgets);
  if (!force && cacheAge < WEATHER_MAX_AGE_MS) return;

  if (!weatherRequest) {
    weatherRequest = fetchWeatherLocations()
      .then((locations) => {
        weatherCache = { locations, fetchedAt: new Date().toISOString() };
        try {
          localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weatherCache));
        } catch {}
        return true;
      })
      .catch((error) => {
        console.error(error);
        return false;
      })
      .finally(() => {
        weatherRequest = null;
      });
  }

  const ok = await weatherRequest;
  const currentWidget = getWeatherWidget() || widget;
  if (ok) {
    applyWeatherCache(currentWidget);
  } else if (!weatherCache) {
    currentWidget.data = {
      ...(currentWidget.data || {}),
      status: "error",
      error: "weather unavailable",
    };
  }

  if (render) renderWeatherWidgetInPlace(currentWidget, animateWidgets);
}

function getWidgetContent(widget) {
  const normalizedId = String(widget.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget.title || "").toLowerCase();

  const isDatesWidget = normalizedId === "dates" || normalizedTitle.includes("dates to remember");

  if (isCustomWidget(widget)) {
    return `<div class="note-widget-text">${escapeHtml(widget.data?.text || "")}</div>`;
  }

  if (normalizedId === "song") {
    normalizeWidgetLikesData(widget);
    const songData = widget.data || {};
    const songName = escapeHtml(
      songData.songName || "drop a spotify track into the widget editor ♡",
    );
    const durationLabel = escapeHtml(songData.durationLabel || "--:--");
    const spotifyUrl = escapeHtml(getSafeLinkUrl(songData.spotifyUrl));
    const coverUrl = escapeHtml(songData.coverUrl || "");
    const accent = Math.max(6, Math.min(94, Number(songData.accent) || 38));

    return `
      <div class="song-widget-card">
        ${
          coverUrl
            ? `<img class="song-widget-cover" src="${coverUrl}" alt="Spotify cover art" loading="eager" decoding="sync" />`
            : '<div class="song-widget-art-placeholder">paste a Spotify track link to fill this card ♡</div>'
        }
        <div class="song-widget-meta">
          <div class="song-widget-name">${songName}</div>
          <div class="song-widget-time${songData.durationLabel ? " is-glowing" : ""}">${durationLabel}</div>
        </div>
        <div class="song-widget-progress" aria-hidden="true">
          <span style="width:${accent}%"></span>
        </div>
        <div class="song-widget-controls" aria-hidden="true">
          <span class="song-widget-skip">⏮&#xFE0E;</span>
          <span class="song-widget-play"><span class="song-widget-pause-icon"></span></span>
          <span class="song-widget-skip">⏭&#xFE0E;</span>
        </div>
        <div class="song-widget-volume" aria-hidden="true">
          <span class="song-widget-volume-icon">♪</span>
          <div class="song-widget-volume-bar"><span style="width:68%"></span></div>
        </div>
        ${
          spotifyUrl
            ? `<a class="song-widget-link" href="${spotifyUrl}" target="_blank" rel="noreferrer noopener">open in spotify</a>`
            : ""
        }
      </div>
    `;
  }

  const isNoteWidget = normalizedId === "note" || normalizedTitle.includes("quick note");

  if (isNoteWidget) {
    normalizeWidgetLikesData(widget);
    return `<div class="note-widget-text">${escapeHtml(widget.data?.text || "")}</div>`;
  }

  if (isDatesWidget) {
    const items = getItemsInDisplayOrder(widget.data?.items || []);

    if (!items.length) {
      return `<div style="font-size:0.92rem;opacity:0.75;">no dates to remember yet ♡</div>`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const html = items
      .map((item) => {
        const target = new Date(item.date);
        target.setHours(0, 0, 0, 0);

        const diffMs = target - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let countdownText = "";
        if (diffDays > 0) {
          countdownText = `${diffDays} days left`;
        } else if (diffDays === 0) {
          countdownText = "today ♡";
        } else {
          countdownText = `${Math.abs(diffDays)} days ago`;
        }

        return `
      <div style="padding:8px 0;border-bottom:1px solid rgba(222, 235, 230, 0.7);">
        <div style="font-size:0.95rem;font-weight:700;">${escapeHtml(item.title)}</div>
        <div style="margin-top:4px;font-size:0.82rem;opacity:0.75;">${countdownText}</div>
      </div>
    `;
      })
      .join("");

    return `<div style="display:grid;gap:2px;">${html}</div>`;
  }

  if (normalizedId === "bucketlist" || normalizedTitle.includes("bucket list")) {
    const items = getItemsInDisplayOrder(widget.data?.items || []);
    const visibleItems = items.filter((item) => !item.done);

    if (!visibleItems.length) {
      return `<div style="font-size:0.92rem;opacity:0.75;">nothing on the bucket list yet ⋆˙⟡</div>`;
    }

    const html = visibleItems
      .map(
        (item) => `
    <div class="widget-bucketlist-row">
      <button
        class="widget-wish-toggle"
        type="button"
        data-widget-wish-id="${escapeHtml(item.id)}"
        aria-pressed="${item.done ? "true" : "false"}"
        aria-label="${item.done ? "mark bucket list item incomplete" : "mark bucket list item complete"}"
      >
        ${item.done ? "☑&#xFE0E;" : "☐"}
      </button>
      <div class="widget-wish-text${item.done ? " is-done" : ""}">
        ${escapeHtml(item.text)}
      </div>
    </div>
  `,
      )
      .join("");

    return `<div class="widget-bucketlist-list">${html}</div>`;
  }

  if (normalizedId === "weather" || normalizedTitle.includes("sky watch")) {
    const weatherData = widget.data || {};

    if (weatherData.status === "error") {
      return "";
    }

    if (weatherData.status !== "ready") {
      return `
      <div class="widget-inline-skeleton" aria-label="loading weather">
        ${getSkeletonLine("", "width:74%;")}
        ${getSkeletonLine("", "width:92%;")}
        ${getSkeletonLine("skeleton-line-short", "width:54%;")}
      </div>
    `;
    }

    const locationHtml = (weatherData.locations || [])
      .map((location) => {
        const conditionLabel = getWeatherDescription(location.weatherCode, location.isDay);

        return `
    <div style="padding:8px 0;border-bottom:1px solid rgba(222, 235, 230, 0.7);">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:nowrap;">
        <div style="font-size:0.96rem;font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${location.label}</div>
        <div style="font-size:1.2rem;font-weight:700;line-height:1;flex:0 0 auto;">${Math.round(location.temperature)}°</div>
      </div>
      <div style="margin-top:4px;font-size:0.86rem;font-weight:700;opacity:0.88;">now: ${conditionLabel}</div>
      <div style="margin-top:4px;font-size:0.8rem;opacity:0.72;">feels like ${Math.round(location.apparentTemperature)}° • wind ${Math.round(location.windSpeed)} km/h</div>
    </div>
  `;
      })
      .join("");

    return `
    <div style="display:grid;gap:10px;">
      <div style="display:grid;gap:2px;">${locationHtml}${widget.data?.message ? `<p style="margin:8px 0 0;font-size:0.84rem;opacity:0.8;">${escapeHtml(widget.data.message)}</p>` : ""}</div>
    </div>
  `;
  }

  if (normalizedId === "thinking-of-you" || normalizedTitle.includes("thinking of you")) {
    normalizeThinkingOfYouWidget(widget);
    const activeUserId = currentProfile?.id || currentUser?.id || "";
    const countsByUser = widget.data?.countsByUser || {};
    const myCount = activeUserId ? countsByUser[activeUserId] || 0 : 0;
    const { myLabel, partnerLabel } = getThinkingOfYouCounterLabels();
    const partnerCount = Object.entries(countsByUser).reduce((total, [userId, count]) => {
      if (userId === activeUserId) return total;
      return total + (Number.isFinite(count) ? count : 0);
    }, 0);
    const isMineClickable = Boolean(activeUserId);

    return `
    <div style="display:grid;gap:12px;">
      ${widget.data?.message ? `<p style="margin:8px 0 0;font-size:0.84rem;opacity:0.8;">${escapeHtml(widget.data.message)}</p>` : ""}
      <div style="font-size:0.84rem;opacity:0.76;">daily count resets at midnight ♡</div>
      <div style="display:grid;gap:8px;padding-top:4px;border-top:1px solid var(--entry-outline);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="font-size:0.92rem;font-weight:700;">${escapeHtml(partnerLabel)}</div>
          <div style="font-size:1.55rem;font-weight:700;line-height:1;">${partnerCount}</div>
        </div>
      </div>
      <div style="display:grid;gap:10px;padding-top:4px;border-top:1px solid var(--entry-outline);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="font-size:0.92rem;font-weight:700;">${escapeHtml(myLabel)}</div>
          <div style="font-size:1.55rem;font-weight:700;line-height:1;">${myCount}</div>
        </div>
        <button class="soft-btn widget-thinking-of-you-btn" type="button" data-thinking-of-you-widget-id="${widget.id}" ${isMineClickable ? "" : "disabled"}>thinking of you</button>
      </div>
    </div>
  `;
  }

  if (normalizedId.startsWith("keepsake") || normalizedTitle.includes("keepsake")) {
    normalizeWidgetLikesData(widget);
    const photoData = widget.data || {};
    const overlayText = escapeHtml(photoData.text || "");
    const textColor = escapeHtml(photoData.textColor || "#ffffff");
    const textSize = Math.max(12, Math.min(46, Number(photoData.textSize) || 22));
    const textXValue = Number(photoData.textX);
    const textYValue = Number(photoData.textY);
    const textX = Math.max(0, Math.min(100, Number.isFinite(textXValue) ? textXValue : 50));
    const textY = Math.max(0, Math.min(100, Number.isFinite(textYValue) ? textYValue : 86));
    const rotate = Number(photoData.rotate) || 0;
    const imageStyle = `transform:rotate(${rotate}deg);`;
    const canEditPhoto = canEditKeepsakeWidget(widget);

    if (!photoData.image) {
      return `
      <button
        class="soft-btn widget-photo-empty widget-thinking-of-you-btn"
        type="button"
        data-photo-widget-id="${widget.id}"
      >
        ${canEditPhoto ? "+ add photo" : "open keepsake ♡"}
      </button>
    `;
    }

    return `
    <div
      class="widget-photo-card widget-photo-open"
      role="button"
      tabindex="0"
      data-photo-widget-id="${widget.id}"
      aria-label="${canEditPhoto ? "open keepsake editor" : "open keepsake"}"
    >
      <div class="widget-photo-frame">
        <img class="widget-photo-image" src="${escapeHtml(photoData.image)}" alt="keepsake" style="${imageStyle}" loading="eager" decoding="sync" fetchpriority="high" />
        ${overlayText ? `<div class="widget-photo-text ${getPhotoTextClasses(photoData)}" style="left:${textX}%;top:${textY}%;color:${textColor};--photo-text-size:${textSize};--photo-text-translate-x:-${textX}%;--photo-text-translate-y:-${textY}%;">${overlayText}</div>` : ""}
      </div>
    </div>
  `;
  }

  if (normalizedId === "together") {
    const start = new Date(widget.data.startDate);
    const today = new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffMs = today - start;
    const diffDays = diffMs >= 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

    return `
      <div style="font-size:0.96rem;font-weight:700;">${diffDays} days together ᰔᩚ</div>
      ${widget.data?.message ? `<p style="margin:8px 0 0;font-size:0.84rem;opacity:0.8;">${escapeHtml(widget.data.message)}</p>` : ""}
      <p style="margin:8px 0 0;font-size:0.82rem;opacity:0.75;">since ${escapeHtml(widget.data.startDate)}</p>
    `;
  }

  return sanitizePostHtml(widget.content);
}

function syncCustomWidgets(rows, loadStartedAt) {
  const saved = rows.filter(isCustomWidget);
  const savedIds = new Set(saved.map((row) => row.id));
  const kept = widgets.filter(
    (widget) =>
      !isCustomWidget(widget) ||
      savedIds.has(widget.id) ||
      (widgetLocalSaveTimes.get(widget.id) || 0) >= loadStartedAt,
  );
  const keptIds = new Set(kept.map((widget) => widget.id));
  const added = saved
    .filter((row) => !keptIds.has(row.id))
    .map((row) => {
      const widget = { ...row };
      widgetServerData.set(widget.id, JSON.stringify(widget.data ?? null));
      applyCachedWidgetLayout(widget, widget.updated_at);
      return widget;
    });
  widgets = [...kept, ...added];
}

async function loadWidgets(options = {}) {
  const { render = true, showSkeleton = render } = options;
  if (showSkeleton) {
    renderWidgetSkeletons();
  }

  const loadStartedAt = performance.now();
  const { data, error } = await dataStore
    .from("widgets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }

  if (data && data.length) {
    const widgetsNeedingNormalization = [];
    const latestSavedWidgets = new Map();

    data.forEach((row) => {
      if (!latestSavedWidgets.has(row.id)) {
        latestSavedWidgets.set(row.id, row);
      }
    });

    widgets = widgets.map((defaultWidget) => {
      const savedWidget = latestSavedWidgets.get(defaultWidget.id);

      if (!savedWidget) {
        applyCachedWidgetLayout(defaultWidget);
        return defaultWidget;
      }

      if ((widgetLocalSaveTimes.get(defaultWidget.id) || 0) >= loadStartedAt) {
        return defaultWidget;
      }

      if (!getPendingWidgetSave(defaultWidget.id)) {
        widgetServerData.set(defaultWidget.id, JSON.stringify(savedWidget.data ?? null));
      }

      const mergedWidget = {
        ...defaultWidget,
        title: savedWidget.title ?? defaultWidget.title,
        side: savedWidget.side ?? defaultWidget.side,
        x: savedWidget.x ?? defaultWidget.x,
        y: savedWidget.y ?? defaultWidget.y,
        data: savedWidget.data ?? defaultWidget.data,
        content: savedWidget.content ?? defaultWidget.content,
        updated_at: savedWidget.updated_at ?? defaultWidget.updated_at,
        ...getPendingWidgetSave(defaultWidget.id)?.snapshot,
      };

      applyCachedWidgetLayout(mergedWidget, savedWidget.updated_at);

      const normalizedId = String(mergedWidget.id || "")
        .toLowerCase()
        .trim();
      const normalizedTitle = String(mergedWidget.title || "").toLowerCase();
      const isBucketlistWidget =
        normalizedId === "bucketlist" || normalizedTitle.includes("bucket list");
      const isThinkingOfYouWidget =
        normalizedId === "thinking-of-you" || normalizedTitle.includes("thinking of you");
      const isSongWidget = normalizedId === "song";
      const isLikeable = isLikeableWidget(mergedWidget);

      if (isBucketlistWidget && Array.isArray(mergedWidget.data?.items)) {
        const normalizedItems = getItemsInDisplayOrder(mergedWidget.data.items).map(
          (item, index) => ({
            ...item,
            order: Number.isFinite(item?.order) ? item.order : index,
          }),
        );

        const bucketlistChanged = normalizedItems.some((item, index) => {
          const originalItem = mergedWidget.data.items[index];
          return !originalItem || item.order !== originalItem.order;
        });

        if (bucketlistChanged) {
          mergedWidget.data = {
            ...mergedWidget.data,
            items: normalizedItems,
          };
          widgetsNeedingNormalization.push(mergedWidget);
        }
      }

      if (isThinkingOfYouWidget) {
        const thinkingOfYouChanged = normalizeThinkingOfYouWidget(mergedWidget);
        const shouldMoveThinkingOfYouWidget =
          mergedWidget.side === "left" ||
          (Number.isFinite(mergedWidget.x) &&
            Number.isFinite(mergedWidget.y) &&
            mergedWidget.x === 12 &&
            mergedWidget.y === 770);

        if (shouldMoveThinkingOfYouWidget) {
          mergedWidget.side = "right";
          mergedWidget.x = 8;
          mergedWidget.y = 610;
          void saveWidgetPosition(mergedWidget);
        }

        if (thinkingOfYouChanged || shouldMoveThinkingOfYouWidget) {
          widgetsNeedingNormalization.push(mergedWidget);
        }
      }

      if (isSongWidget && normalizeSongWidget(mergedWidget)) {
        widgetsNeedingNormalization.push(mergedWidget);
      }

      if (isLikeable && normalizeWidgetLikesData(mergedWidget)) {
        widgetsNeedingNormalization.push(mergedWidget);
      }

      if (isCommentableWidget(mergedWidget) && normalizePhotoWidgetComments(mergedWidget)) {
        widgetsNeedingNormalization.push(mergedWidget);
      }

      const titleChanged = mergedWidget.title !== defaultWidget.title;

      if (titleChanged) {
        mergedWidget.title = defaultWidget.title;
        widgetsNeedingNormalization.push(mergedWidget);
      }

      if (normalizedId === "keepsake-right" && mergedWidget.title !== defaultWidget.title) {
        mergedWidget.title = defaultWidget.title;
        widgetsNeedingNormalization.push(mergedWidget);
      }

      return mergedWidget;
    });

    syncCustomWidgets(data, loadStartedAt);
    widgetsNeedingNormalization.push(...normalizeWidgetMobileOrders(widgets));

    const uniqueWidgetsNeedingNormalization = widgetsNeedingNormalization.filter(
      (widget, index, array) =>
        array.findIndex((item) => item.id === widget.id) === index &&
        !getPendingWidgetSave(widget.id),
    );

    if (uniqueWidgetsNeedingNormalization.length) {
      void Promise.allSettled(
        uniqueWidgetsNeedingNormalization.map((widget) =>
          saveWidget(widget, {
            recordHistory: false,
            suppressErrorMessage: true,
          }),
        ),
      );
    }
  }

  refreshNotificationsFromCurrentData(render);
  refreshOpenWidgetComments();

  if (render) {
    renderWidgets({ animateMobileReorder: false });
  }
}

function syncWidgetZoneHeights() {
  [leftZone, rightZone].forEach((zone) => {
    zone.style.position = "";
    zone.style.height = "";
    zone.style.maxHeight = "";
    if (isTabbedLayoutActive()) return;

    const bottom = Math.max(
      0,
      ...Array.from(zone.children).map((el) => el.offsetTop + el.offsetHeight),
    );
    if (bottom + 24 <= zone.clientHeight) return;

    zone.style.position = "relative";
    zone.style.height = `${bottom + 24}px`;
    zone.style.maxHeight = "none";
  });
}

const widgetZoneObserver =
  typeof ResizeObserver === "function" ? new ResizeObserver(() => syncWidgetZoneHeights()) : null;

function renderWidgets(options = {}) {
  const { animateMobileReorder = true } = options;
  const shouldAnimateMobileReorder = animateMobileReorder && isTabbedLayoutActive();
  const prefersReducedMotion = reducedMotionMedia?.matches;

  previousMobileWidgetRects.clear();
  if (shouldAnimateMobileReorder) {
    document.querySelectorAll(".widget[data-widget-id]").forEach((widgetEl) => {
      previousMobileWidgetRects.set(widgetEl.dataset.widgetId, widgetEl.getBoundingClientRect());
    });
  }

  leftZone.innerHTML = "";
  rightZone.innerHTML = "";

  ensureWidgetStackOrder();

  const isMobileWidgetOrderActive = isTabbedLayoutActive();
  const mobileRenderItems = isMobileWidgetOrderActive ? getMobileWidgetRenderItems() : null;
  const mobileWidgetOrderLookup = new Map();

  if (isMobileWidgetOrderActive) {
    ["left", "right"].forEach((side) => {
      const orderedWidgets = sortMobileRenderItems(
        (mobileRenderItems || []).filter((item) => item.side === side),
      );
      orderedWidgets.forEach((item, index) => {
        mobileWidgetOrderLookup.set(item.renderId, {
          index,
          count: orderedWidgets.length,
        });
      });
    });
  }

  const widgetsToRender = isMobileWidgetOrderActive
    ? mobileRenderItems
    : widgets.map((widget) => ({
        widget,
        renderId: widget.id,
        sourceId: widget.id,
        side: widget.side === "right" ? "right" : "left",
        order: getWidgetMobileOrder(widget, 0),
      }));

  widgetsToRender
    .sort((a, b) => {
      if (isMobileWidgetOrderActive) {
        const sideDifference = a.side === b.side ? 0 : a.side === "left" ? -1 : 1;
        if (sideDifference !== 0) {
          return sideDifference;
        }

        const orderDifference = a.order - b.order;

        if (orderDifference !== 0) {
          return orderDifference;
        }
      }

      return (a.widget.zIndex || 0) - (b.widget.zIndex || 0);
    })
    .forEach((renderItem) => {
      const widget = renderItem.widget;
      const renderId = renderItem.renderId;
      const renderSide = renderItem.side;
      const normalizedId = String(widget.id || "")
        .toLowerCase()
        .trim();
      const normalizedTitle = String(widget.title || "").toLowerCase();

      const isDatesWidget =
        normalizedId === "dates" || normalizedTitle.includes("dates to remember");

      const isBucketlistWidget =
        normalizedId === "bucketlist" || normalizedTitle.includes("bucket list");

      const isNoteWidget = normalizedId === "note" || normalizedTitle.includes("quick note");

      const isStickerWidget =
        normalizedId.includes("stickers") || normalizedTitle.includes("stickers");
      const isPhotoWidget =
        normalizedId.startsWith("keepsake") || normalizedTitle.includes("keepsake");
      const canEditPhotoWidget = !isPhotoWidget || canEditKeepsakeWidget(widget);
      const hasHistory = normalizedId === "song" || isNoteWidget || isPhotoWidget;

      const isEditable =
        ["song", "together"].includes(normalizedId) ||
        isCustomWidget(widget) ||
        isNoteWidget ||
        isDatesWidget ||
        isBucketlistWidget ||
        (isPhotoWidget && canEditPhotoWidget);

      const editTargetId = isDatesWidget
        ? "dates"
        : isBucketlistWidget
          ? "bucketlist"
          : isPhotoWidget
            ? widget.id
            : isNoteWidget
              ? "note"
              : normalizedId;
      const isMinimized = minimizedWidgetIds.has(widget.id);
      const mobileOrderState = mobileWidgetOrderLookup.get(renderId);
      const canMoveWidgetUp = Boolean(mobileOrderState && mobileOrderState.index > 0);
      const canMoveWidgetDown = Boolean(
        mobileOrderState && mobileOrderState.index < mobileOrderState.count - 1,
      );
      const showMobileOrderControls = isMobileWidgetOrderActive;

      const el = document.createElement("div");
      el.className = "widget";
      el.classList.toggle("is-minimized", isMinimized);
      el.dataset.widgetId = renderId;
      el.dataset.widgetSourceId = renderItem.sourceId;
      if (isStickerWidget) {
        el.classList.add("sticker-widget");
      }
      if (normalizedId === "song") {
        el.classList.add("song-widget");
      }
      if (isPhotoWidget) {
        el.classList.add("photo-widget");
      }
      el.style.left = widget.x + "px";
      el.dataset.layoutX = String(widget.x);
      el.style.top = widget.y + "px";
      el.style.zIndex = String(widget.zIndex || 1);

      el.innerHTML = `
      <div class="widget-bar" data-widget-id="${widget.id}">
        <span>${isCustomWidget(widget) ? escapeHtml(widget.data?.heading || "") : widget.title}</span>
        <div class="widget-bar-actions">
          ${
            showMobileOrderControls
              ? `
            <button
              class="widget-order-btn"
              type="button"
              data-widget-move-id="${renderId}"
              data-widget-move-direction="up"
              aria-label="move widget up"
              ${canMoveWidgetUp ? "" : "disabled"}
            >
              ${getWidgetIcon("up")}
            </button>
            <button
              class="widget-order-btn"
              type="button"
              data-widget-move-id="${renderId}"
              data-widget-move-direction="down"
              aria-label="move widget down"
              ${canMoveWidgetDown ? "" : "disabled"}
            >
              ${getWidgetIcon("down")}
            </button>
          `
              : ""
          }
          <button
            class="widget-minimize-btn"
            type="button"
            data-widget-minimize-id="${widget.id}"
            aria-label="${isMinimized ? "restore widget" : "minimize widget"}"
            aria-pressed="${isMinimized ? "true" : "false"}"
          >
            ${getWidgetIcon(isMinimized ? "restore" : "minimize")}
          </button>
          ${getWidgetHeaderLikeButtonMarkup(widget)}
          ${getWidgetHeaderCommentButtonMarkup(widget)}
          ${hasHistory ? `<button class="widget-history-btn" type="button" aria-label="widget history">${getWidgetIcon("history")}</button>` : ""}
          ${isEditable ? `<button class="widget-edit-btn" type="button" data-widget-id="${widget.id}" aria-label="edit widget">${getWidgetIcon("edit")}</button>` : ""}
        </div>
      </div>
      <div class="widget-content">${getWidgetContent(widget)}</div>
    `;

      const bar = el.querySelector(".widget-bar");
      const editBtn = el.querySelector(".widget-edit-btn");
      const historyBtn = el.querySelector(".widget-history-btn");
      const minimizeBtn = el.querySelector(".widget-minimize-btn");
      const moveButtons = Array.from(el.querySelectorAll(".widget-order-btn"));

      moveButtons.forEach((button) => {
        stopPress(button);

        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (button.disabled) {
            return;
          }

          await moveWidgetInMobileOrder(
            button.dataset.widgetMoveId || widget.id,
            button.dataset.widgetMoveDirection,
          );
        });
      });

      if (minimizeBtn) {
        stopPress(minimizeBtn);

        minimizeBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleWidgetMinimized(widget.id);
        });
      }

      if (historyBtn) {
        historyBtn.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        historyBtn.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        historyBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          openWidgetHistory(widget.id);
        });
      }

      if (isBucketlistWidget) {
        el.querySelectorAll(".widget-wish-toggle").forEach((btn) => {
          btn.addEventListener("mousedown", (event) => {
            event.preventDefault();
            event.stopPropagation();
          });

          btn.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
          });

          btn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await toggleWidgetBucketlistItem(widget.id, btn.dataset.widgetWishId);
          });
        });
      }

      if (isPhotoWidget) {
        el.querySelectorAll(".widget-photo-empty, .widget-photo-open").forEach((btn) => {
          stopPress(btn);

          btn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const targetId =
              btn.dataset.photoWidgetId || btn.getAttribute("data-photo-widget-id") || widget.id;
            openWidgetEditor(targetId);
          });

          if (!btn.matches("button")) {
            btn.addEventListener("keydown", (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              const targetId =
                btn.dataset.photoWidgetId || btn.getAttribute("data-photo-widget-id") || widget.id;
              openWidgetEditor(targetId);
            });
          }
        });
      }

      if (isLikeableWidget(widget)) {
        el.querySelectorAll(".widget-like-btn").forEach((btn) => {
          stopPress(btn);

          btn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWidgetLike(btn.dataset.widgetLikeId || widget.id);
          });
        });
      }

      if (isCommentableWidget(widget)) {
        el.querySelectorAll(".widget-comment-btn").forEach((btn) => {
          stopPress(btn);

          btn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openWidgetComments(btn.dataset.widgetCommentId || widget.id);
          });
        });
      }

      if (normalizedId === "thinking-of-you") {
        bindThinkingOfYouWidgetButtons(el);
      }

      if (editBtn && isEditable) {
        editBtn.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        editBtn.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        editBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          openWidgetEditor(editTargetId);
        });
      }

      bar.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        startWidgetDrag(event, widget, el);
      });

      if (renderSide === "left") {
        leftZone.appendChild(el);
      } else {
        rightZone.appendChild(el);
      }
      widgetZoneObserver?.observe(el);
    });
  syncWidgetZoneHeights();

  if (shouldAnimateMobileReorder && !prefersReducedMotion) {
    requestAnimationFrame(() => {
      document.querySelectorAll(".widget[data-widget-id]").forEach((widgetEl) => {
        const previousRect = previousMobileWidgetRects.get(widgetEl.dataset.widgetId);
        if (!previousRect) return;

        const nextRect = widgetEl.getBoundingClientRect();
        const deltaX = previousRect.left - nextRect.left;
        const deltaY = previousRect.top - nextRect.top;

        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          return;
        }

        widgetEl.classList.add("widget-mobile-reordering");
        widgetEl.getAnimations?.().forEach((animation) => animation.cancel());
        const [reorderAnimation] = playWhenFramesCalm([
          widgetEl.animate(
            [
              {
                transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.985)`,
                opacity: 0.82,
              },
              {
                transform: "translate3d(0, 0, 0) scale(1)",
                opacity: 1,
              },
            ],
            {
              duration: 460,
              easing: MOTION_EASING,
            },
          ),
        ]);

        reorderAnimation.addEventListener(
          "finish",
          () => {
            widgetEl.classList.remove("widget-mobile-reordering");
          },
          { once: true },
        );

        reorderAnimation.addEventListener(
          "cancel",
          () => {
            widgetEl.classList.remove("widget-mobile-reordering");
          },
          { once: true },
        );
      });
    });
  }

  fitWidgetsInViewport();
}

function fitWidgetsInViewport() {
  if (isTabbedLayoutActive()) return;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const appZoom = getCurrentAppZoom();
  const gutter = 8;

  [leftZone, rightZone].forEach((zone) => {
    if (!zone) return;
    const zoneLeft = zone.getBoundingClientRect().left;
    zone.querySelectorAll(":scope > .widget[data-layout-x]").forEach((el) => {
      const layoutX = Number(el.dataset.layoutX) || 0;
      const maxX = (viewportWidth - zoneLeft) / appZoom - el.offsetWidth - gutter;
      const minX = (0 - zoneLeft) / appZoom + gutter;
      const x = Math.round(Math.max(minX, Math.min(maxX, layoutX)));
      el.style.left = `${x}px`;
    });
  });
}

let fitWidgetsFrame = 0;
window.addEventListener("resize", () => {
  if (fitWidgetsFrame) return;
  fitWidgetsFrame = requestAnimationFrame(() => {
    fitWidgetsFrame = 0;
    fitWidgetsInViewport();
  });
});

function toggleWidgetMinimized(widgetId) {
  const minimize = !minimizedWidgetIds.has(widgetId);
  if (minimize) {
    minimizedWidgetIds.add(widgetId);
  } else {
    minimizedWidgetIds.delete(widgetId);
  }

  const buttons = document.querySelectorAll(
    `.widget-minimize-btn[data-widget-minimize-id="${CSS.escape(widgetId)}"]`,
  );
  if (!buttons.length) {
    renderWidgets({ animateMobileReorder: false });
    return;
  }

  buttons.forEach((button) => {
    button.innerHTML = getWidgetIcon(minimize ? "restore" : "minimize");
    button.setAttribute("aria-label", minimize ? "restore widget" : "minimize widget");
    button.setAttribute("aria-pressed", String(minimize));
    animateWidgetMinimize(button.closest(".widget"), minimize);
  });
}

function animateWidgetMinimize(widgetEl, minimize) {
  const content = widgetEl?.querySelector(".widget-content");
  if (!content) return;

  if (reducedMotionMedia?.matches) {
    widgetEl.classList.toggle("is-minimized", minimize);
    return;
  }

  if (isTabbedLayoutActive()) {
    foldStackedWidget(widgetEl, content, minimize);
    return;
  }

  const readBox = () => {
    const { height, paddingTop, paddingBottom } = getComputedStyle(content);
    return { height, paddingTop, paddingBottom };
  };
  const closedBox = { height: "0px", paddingTop: "0px", paddingBottom: "0px" };

  const startsClosed = widgetEl.classList.contains("is-minimized");
  const fromBox = startsClosed ? closedBox : readBox();
  const fromOpacity = startsClosed ? "0" : getComputedStyle(content).opacity;
  content.getAnimations().forEach((animation) => animation.cancel());
  widgetEl.classList.remove("is-minimized");
  widgetEl.classList.add("is-folding");

  const fold = content.animate([fromBox, minimize ? closedBox : readBox()], {
    duration: 560,
    easing: MOTION_EASING,
  });
  content.animate([{ opacity: fromOpacity }, { opacity: minimize ? "0" : "1" }], {
    duration: minimize ? 380 : 460,
    delay: minimize ? 0 : 160,
    easing: MOTION_EASING,
    fill: "both",
  });
  fold.addEventListener("finish", () => {
    widgetEl.classList.remove("is-folding");
    if (minimize) widgetEl.classList.add("is-minimized");
  });
}

const widgetFolds = new WeakMap();

function foldStackedWidget(widgetEl, content, minimize) {
  const running = widgetFolds.get(widgetEl);
  if (running) {
    running.minimize = minimize;
    running.animations.forEach((animation) => animation.reverse());
    return;
  }

  widgetEl.classList.remove("is-minimized");
  const barHeight = widgetEl.querySelector(".widget-bar")?.offsetHeight || 0;
  const foldHeight = Math.max(0, widgetEl.offsetHeight - barHeight);
  const top = widgetEl.getBoundingClientRect().top;
  const followers = Array.from(widgetEl.parentElement?.children || []).filter(
    (item) => item !== widgetEl && item.getBoundingClientRect().top > top,
  );

  const options = { duration: 560, easing: MOTION_EASING, fill: "both" };
  const open = { clipPath: "inset(0 0 0px 0 round 20px)", transform: "translate3d(0, 0, 0)" };
  const shut = {
    clipPath: `inset(0 0 ${foldHeight}px 0 round 20px)`,
    transform: `translate3d(0, ${-foldHeight}px, 0)`,
  };
  const [from, to] = minimize ? [open, shut] : [shut, open];
  const fold = { minimize, animations: [] };
  const wipe = widgetEl.animate([{ clipPath: from.clipPath }, { clipPath: to.clipPath }], options);
  fold.animations.push(
    wipe,
    content.animate(
      minimize
        ? [{ opacity: 1 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }],
      { duration: options.duration, fill: "both" },
    ),
    ...followers.map((item) =>
      item.animate([{ transform: from.transform }, { transform: to.transform }], options),
    ),
  );
  widgetFolds.set(widgetEl, fold);

  wipe.onfinish = () => {
    widgetFolds.delete(widgetEl);
    mobileLayoutFloorScroll = Math.max(mobileLayoutFloorScroll, window.scrollY);
    widgetEl.classList.toggle("is-minimized", fold.minimize);
    fold.animations.forEach((animation) => animation.cancel());
  };
}

function animateHeightChange(el, change) {
  if (reducedMotionMedia?.matches) {
    change();
    return;
  }
  const from = el.getBoundingClientRect().height;
  el.getAnimations().forEach((animation) => animation.cancel());
  change();
  const to = el.getBoundingClientRect().height;
  el.animate(
    [
      { height: `${from}px`, overflow: "hidden" },
      { height: `${to}px`, overflow: "hidden" },
    ],
    { duration: 420, easing: MOTION_EASING },
  );
}

function openWidgetEditor(widgetId) {
  dragWidget = null;
  pendingWidgetDrag = null;
  widgetPopupCard?.classList.remove("photo-history-popup-card");
  if (clearWidgetHistoryBtn) {
    clearWidgetHistoryBtn.style.display = "none";
    delete clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode;
  }

  const normalizedId = String(widgetId || "")
    .toLowerCase()
    .trim();

  if (normalizedId.startsWith(CUSTOM_WIDGET_ID_PREFIX)) {
    openCustomWidgetPopup(normalizedId);
    return;
  }

  const widget = findWidgetByAlias(normalizedId);

  widgetPopup?.classList.toggle("together-widget-popup", normalizedId === "together");

  if (!widget) return;

  editingWidgetId = normalizedId;

  if (normalizedId === "together") {
    widgetPopupTitle.textContent = "｡ ₊°༺ days together ༻°₊ ｡";
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(false);

    widgetEditorFields.innerHTML = `
      <div class="small-note together-note-text">every day counts ᰔᩚ</div>
    `;
  } else if (normalizedId === "song") {
    normalizeSongWidget(widget);
    widgetPopupTitle.textContent = widget.title;
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(true);

    widgetEditorFields.innerHTML = `
      <div class="song-editor-layout">
        <div class="song-editor-preview" id="songEditorPreview">
          ${
            widget.data?.coverUrl
              ? `<img class="song-editor-preview-cover" src="${escapeHtml(widget.data.coverUrl)}" alt="Spotify cover preview" />`
              : '<div class="song-editor-preview-empty">cover preview will show here ♡</div>'
          }
        </div>

        <label class="popup-label">spotify track link</label>
        <div class="song-editor-fetch-row">
          <input
            class="popup-input"
            id="widgetFieldSpotifyUrl"
            type="url"
            placeholder="https://open.spotify.com/track/..."
            value="${escapeHtml(widget.data?.spotifyUrl || "")}"
          />
          <button class="soft-btn" id="fetchSpotifySongBtn" type="button">fetch</button>
        </div>

        <label class="popup-label" style="margin-top:12px;">caption</label>
        <textarea
          class="popup-input song-caption-input"
          id="widgetFieldSongDuration"
          rows="1"
        >${escapeHtml(widget.data?.durationLabel || "")}</textarea>

        <input id="widgetFieldSongCover" type="hidden" value="${escapeHtml(widget.data?.coverUrl || "")}" />
        <input id="widgetFieldSongUri" type="hidden" value="${escapeHtml(widget.data?.spotifyUri || "")}" />
        <input id="widgetFieldSongName" type="hidden" value="${escapeHtml(widget.data?.songName || "")}" />
      </div>
    `;

    const spotifyUrlInput = document.getElementById("widgetFieldSpotifyUrl");
    const songDurationInput = document.getElementById("widgetFieldSongDuration");
    const fitSongCaption = () => {
      if (!songDurationInput) return;
      songDurationInput.style.height = "auto";
      if (!songDurationInput.scrollHeight) return;
      const border = songDurationInput.offsetHeight - songDurationInput.clientHeight;
      songDurationInput.style.height = `${songDurationInput.scrollHeight + border}px`;
    };
    songDurationInput?.addEventListener("input", fitSongCaption);
    requestAnimationFrame(fitSongCaption);
    const songCoverInput = document.getElementById("widgetFieldSongCover");
    const songUriInput = document.getElementById("widgetFieldSongUri");
    const songNameInput = document.getElementById("widgetFieldSongName");
    const fetchSpotifySongBtn = document.getElementById("fetchSpotifySongBtn");
    const songEditorPreview = document.getElementById("songEditorPreview");

    const renderSongEditorPreview = () => {
      if (!songEditorPreview) return;

      const coverUrl = String(songCoverInput?.value || "").trim();
      songEditorPreview.classList.toggle("has-cover", Boolean(coverUrl));
      songEditorPreview.innerHTML = coverUrl
        ? `<img class="song-editor-preview-cover" src="${escapeHtml(coverUrl)}" alt="Spotify cover preview" />`
        : '<div class="song-editor-preview-empty">cover preview will show here ♡</div>';
    };

    songCoverInput?.addEventListener("input", renderSongEditorPreview);

    fetchSpotifySongBtn?.addEventListener("click", async () => {
      const rawUrl = spotifyUrlInput?.value || "";

      if (!rawUrl.trim()) {
        showMessage("paste a Spotify track link first ♡");
        return;
      }

      fetchSpotifySongBtn.disabled = true;
      fetchSpotifySongBtn.textContent = "fetching...";

      try {
        const spotifyData = await fetchSpotifyTrackCardData(rawUrl);
        if (!areBreakupWordsAllowed(spotifyData.songName, spotifyData.durationLabel)) {
          return;
        }

        if (spotifyUrlInput) spotifyUrlInput.value = spotifyData.spotifyUrl;
        if (songUriInput) songUriInput.value = spotifyData.spotifyUri;
        if (songCoverInput) songCoverInput.value = spotifyData.coverUrl;
        if (songNameInput) songNameInput.value = spotifyData.songName;
        widget.data.songName = spotifyData.songName;
        if (songDurationInput && !songDurationInput.value.trim()) {
          songDurationInput.value = spotifyData.durationLabel;
          fitSongCaption();
        }
        renderSongEditorPreview();
        showMessage("Spotify track loaded ♡");
      } catch (error) {
        console.error(error);
        showMessage(error.message || "could not fetch this Spotify track ♡");
      } finally {
        fetchSpotifySongBtn.disabled = false;
        fetchSpotifySongBtn.textContent = "fetch";
      }
    });
  } else if (normalizedId === "note") {
    normalizeWidgetLikesData(widget);
    widgetPopupTitle.textContent = "⋆𐙚₊quick note˚⊹♡";
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(true);

    widgetEditorFields.innerHTML = `
      <label class="popup-label">write something ♡</label>
      <textarea class="popup-input" id="widgetFieldText" rows="5" style="resize: vertical; min-height: 110px;">${escapeHtml(widget.data?.text || "")}</textarea>
    `;
  } else if (normalizedId === "dates") {
    const items = getItemsInDisplayOrder(widget.data?.items || []);

    widgetPopupTitle.textContent = "⊹ ࣪ ˖dates to remember⊹ ࣪ ˖";
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(false);

    const itemsHtml = items
      .map(
        (item, index) => `
      <div class="date-edit-item" data-date-id="${escapeHtml(item.id)}">
        <div style="font-weight:700;margin-bottom:8px;">${escapeHtml(item.title)}</div>
        <div style="font-size:0.88rem;opacity:0.75;margin-bottom:10px;">${formatDisplayDate(item.date)}</div>
        <div class="date-edit-actions">
          <button class="reorder-date-btn" type="button" data-date-id="${escapeHtml(item.id)}" data-date-direction="up" aria-label="move date up" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="reorder-date-btn" type="button" data-date-id="${escapeHtml(item.id)}" data-date-direction="down" aria-label="move date down" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
          <button
            class="edit-date-btn"
            type="button"
            data-date-id="${escapeHtml(item.id)}"
            aria-label="edit ${escapeHtml(item.title)}"
            title="edit date"
          >
            <span aria-hidden="true">✎</span>
          </button>
          <button class="delete-date-btn" type="button" data-date-id="${escapeHtml(item.id)}">delete</button>
        </div>
      </div>
    `,
      )
      .join("");

    widgetEditorFields.innerHTML = `
      <div style="display:grid;gap:12px;">
        <label class="popup-label">title</label>
        <input class="popup-input" id="dateTitleInput" type="text" placeholder="birthday" />

        <label class="popup-label">date</label>
        <input class="popup-input" id="dateValueInput" type="text" inputmode="numeric" placeholder="dd/mm/yyyy" />

        <div class="popup-actions" style="margin-top:4px;">
          <button class="soft-btn" id="addDateBtn" type="button">add date</button>
          <button class="soft-btn" id="cancelDateEditBtn" type="button" hidden>cancel</button>
        </div>

        <div class="date-editor-list">
          ${itemsHtml || `<div class="small-note">no dates yet ♡</div>`}
        </div>
      </div>
    `;

    const addDateBtn = document.getElementById("addDateBtn");
    const cancelDateEditBtn = document.getElementById("cancelDateEditBtn");
    const titleInput = document.getElementById("dateTitleInput");
    const dateInput = document.getElementById("dateValueInput");

    const resetDateForm = () => {
      if (titleInput) titleInput.value = "";
      if (dateInput) dateInput.value = "";
      if (addDateBtn) {
        addDateBtn.textContent = "add date";
        delete addDateBtn.dataset.editingDateId;
      }
      if (cancelDateEditBtn) cancelDateEditBtn.hidden = true;
    };

    if (addDateBtn) {
      addDateBtn.addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const date = parseDisplayDate(dateInput.value);

        if (!title || !date) {
          showMessage("add a title and date as dd/mm/yyyy ♡");
          return;
        }

        if (!areBreakupWordsAllowed(title)) {
          return;
        }

        if (!widget.data) widget.data = { items: [] };
        if (!widget.data.items) widget.data.items = [];

        const editingDateId = addDateBtn.dataset.editingDateId || "";
        const editingDateItem = widget.data.items.find((item) => item.id === editingDateId);

        if (editingDateItem) {
          editingDateItem.title = title;
          editingDateItem.date = date;
        } else {
          widget.data.items.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            title,
            date,
            order: getNextItemOrder(widget.data.items),
          });
        }

        queueWidgetSave(widget, { notifyUpdate: true });
        renderWidgets({ animateMobileReorder: false });
        openWidgetEditor("dates");
        showMessage(editingDateItem ? "date updated ♡" : "date added ♡");
      });
    }

    if (cancelDateEditBtn) {
      cancelDateEditBtn.addEventListener("click", resetDateForm);
    }

    document.querySelectorAll(".edit-date-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dateId = btn.dataset.dateId;
        const selectedDate = (widget.data.items || []).find((item) => item.id === dateId);

        if (!selectedDate) return;

        titleInput.value = selectedDate.title || "";
        dateInput.value = formatDisplayDate(selectedDate.date);
        addDateBtn.dataset.editingDateId = selectedDate.id;
        addDateBtn.textContent = "save date";
        if (cancelDateEditBtn) cancelDateEditBtn.hidden = false;
        titleInput.focus();
      });
    });

    document.querySelectorAll(".reorder-date-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.hasAttribute("disabled")) return;

        const dateId = btn.dataset.dateId;
        const direction = btn.dataset.dateDirection;
        const currentRow = btn.closest(".date-edit-item");
        const list = currentRow?.closest(".date-editor-list");
        const swapRow =
          direction === "up" ? currentRow?.previousElementSibling : currentRow?.nextElementSibling;
        const previousRects = getEditorRowRects(list, EDITOR_ROWS.dates);

        if (!reorderDisplayItem(widget, dateId, direction)) return;

        if (list && currentRow && swapRow?.classList.contains("date-edit-item")) {
          if (direction === "up") {
            list.insertBefore(currentRow, swapRow);
          } else {
            list.insertBefore(swapRow, currentRow);
          }

          syncEditorReorderButtons(list, EDITOR_ROWS.dates);
          animateEditorRows(list, previousRects, EDITOR_ROWS.dates);
        }

        queueWidgetSave(widget, { notifyUpdate: true });
        refreshWidgetContentDom(widget);
        showMessage("dates reordered ♡");
      });
    });

    document.querySelectorAll(".delete-date-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dateId = btn.dataset.dateId;
        const deletedDate = (widget.data.items || []).find((item) => item.id === dateId);
        const dateTitle = deletedDate?.title || "this date";

        openConfirmationDialog({
          title: "delete date?",
          message: `${dateTitle} will be removed from dates to remember.`,
          confirmLabel: "delete",
          pendingLabel: "deleting...",
          onConfirm: async () => {
            widget.data.items = (widget.data.items || []).filter((item) => item.id !== dateId);
            queueWidgetSave(widget, { notifyUpdate: true });

            renderWidgets({ animateMobileReorder: false });
            openWidgetEditor("dates");
            showMessage("date deleted ♡");
          },
        });
      });
    });
  } else if (normalizedId === "bucketlist") {
    const items = getItemsInDisplayOrder(widget.data?.items || []);

    widgetPopupTitle.textContent = "𓂃˖˳·˖ ִֶָ ⋆bucket list⋆ ִֶָ˖·˳˖𓂃";
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(false);

    const itemsHtml = items
      .map(
        (item, index) => `
      <div class="bucketlist-item-row" data-wish-id="${escapeHtml(item.id)}">
        <div class="bucketlist-item-main">
          <button class="toggle-wish-btn" type="button" data-wish-id="${escapeHtml(item.id)}">
            ${item.done ? "☑&#xFE0E;" : "☐"}
          </button>
          <div class="bucketlist-item-text${item.done ? " is-done" : ""}">${escapeHtml(item.text)}</div>
        </div>
        <div class="bucketlist-item-actions">
          <button class="reorder-wish-btn" type="button" data-wish-id="${escapeHtml(item.id)}" data-wish-direction="up" aria-label="move bucket list item up" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="reorder-wish-btn" type="button" data-wish-id="${escapeHtml(item.id)}" data-wish-direction="down" aria-label="move bucket list item down" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="delete-wish-btn" type="button" data-wish-id="${escapeHtml(item.id)}">delete</button>
        </div>
      </div>
    `,
      )
      .join("");

    widgetEditorFields.innerHTML = `
      <div style="display:grid;gap:12px;">
        <label class="popup-label">add to bucket list</label>
        <input class="popup-input" id="wishTextInput" type="text" placeholder="picnic date" />

        <div class="popup-actions" style="margin-top:4px;">
          <button class="soft-btn" id="addWishBtn" type="button">add item</button>
        </div>

        <div class="bucketlist-editor-list">
          ${itemsHtml || `<div class="small-note">nothing on the bucket list yet ♡</div>`}
        </div>
      </div>
    `;

    const addWishBtn = document.getElementById("addWishBtn");

    if (addWishBtn) {
      addWishBtn.addEventListener("click", async () => {
        const wishInput = document.getElementById("wishTextInput");
        const text = wishInput.value.trim();

        if (!text) {
          showMessage("write something for the bucket list");
          return;
        }

        if (!areBreakupWordsAllowed(text)) {
          return;
        }

        if (!widget.data) widget.data = { items: [] };
        if (!widget.data.items) widget.data.items = [];

        widget.data.items.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          text,
          done: false,
          order: getNextItemOrder(widget.data.items),
        });

        queueWidgetSave(widget, { notifyUpdate: true });
        refreshWidgetContentDom(widget);
        openWidgetEditor("bucketlist");
        showMessage("added to bucket list ♡");
      });
    }

    document.querySelectorAll(".delete-wish-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wishId = btn.dataset.wishId;
        const deletedWish = (widget.data.items || []).find((item) => item.id === wishId);
        const wishText = deletedWish?.text || "this bucket list item";

        openConfirmationDialog({
          title: "delete bucket list item?",
          message: `${wishText} will be removed from the bucket list.`,
          confirmLabel: "delete",
          pendingLabel: "deleting...",
          onConfirm: async () => {
            widget.data.items = (widget.data.items || []).filter((item) => item.id !== wishId);
            queueWidgetSave(widget, { notifyUpdate: true });

            refreshWidgetContentDom(widget);
            openWidgetEditor("bucketlist");
            showMessage("bucket list item deleted ♡");
          },
        });
      });
    });

    document.querySelectorAll(".reorder-wish-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.hasAttribute("disabled")) return;

        const wishId = btn.dataset.wishId;
        const direction = btn.dataset.wishDirection;
        const currentRow = btn.closest(".bucketlist-item-row");
        const list = currentRow?.closest(".bucketlist-editor-list");
        const swapRow =
          direction === "up" ? currentRow?.previousElementSibling : currentRow?.nextElementSibling;
        const previousRects = getEditorRowRects(list, EDITOR_ROWS.bucketlist);

        if (!reorderDisplayItem(widget, wishId, direction)) return;

        if (list && currentRow && swapRow?.classList.contains("bucketlist-item-row")) {
          if (direction === "up") {
            list.insertBefore(currentRow, swapRow);
          } else {
            list.insertBefore(swapRow, currentRow);
          }

          syncEditorReorderButtons(list, EDITOR_ROWS.bucketlist);
          animateEditorRows(list, previousRects, EDITOR_ROWS.bucketlist);
        }

        queueWidgetSave(widget, { notifyUpdate: true });
        refreshWidgetContentDom(widget);
        showMessage("bucket list updated ♡");
      });
    });

    document.querySelectorAll(".toggle-wish-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const wishId = btn.dataset.wishId;

        widget.data.items = (widget.data.items || []).map((item) =>
          item.id === wishId ? { ...item, done: !item.done } : item,
        );

        queueWidgetSave(widget, { notifyUpdate: true });
        refreshWidgetContentDom(widget);
        openWidgetEditor("bucketlist");
        showMessage("bucket list updated ♡");
      });
    });
  } else if (normalizedId.startsWith("keepsake")) {
    if (!widget.data) {
      widget.data = {};
    }
    normalizeWidgetLikesData(widget);
    normalizePhotoWidgetComments(widget);
    const canEditPhoto = canEditKeepsakeWidget(widget);

    widgetPopupTitle.textContent =
      normalizedId === "keepsake-right" ? "♡ keepsake ⊹˚₊" : "₊˚⊹ keepsake ♡";
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(canEditPhoto);

    if (!canEditPhoto) {
      widgetEditorFields.innerHTML = `
        ${getPhotoWidgetCommentPreviewMarkup(widget.data, {
          showLabel: false,
        })}
      `;
      widgetPopup.classList.add("open");
      return;
    }

    activePhotoEditor?.destroy();
    activePhotoEditor = mountPhotoEditor(widgetEditorFields, {
      data: widget.data,
      loadImageFile: (file) => compressImageFile(file, { maxSize: 1800, quality: 0.9 }),
      confirm: openConfirmationDialog,
      message: showMessage,
    });
  } else {
    widgetPopupTitle.textContent = widget.title;
    widgetEditorFields.innerHTML = `<div class="small-note">this widget is not editable yet ♡</div>`;
    saveWidgetBtn.style.display = "none";
    setHeaderWidgetSaveVisibility(false);
  }

  widgetPopup.classList.add("open");
  activePhotoEditor?.fit();
}

let activePhotoEditor = null;

function openWidgetComments(widgetId, { focusCommentId = "" } = {}) {
  const widget = widgets.find((item) => item.id === widgetId);
  if (
    !widget ||
    !isCommentableWidget(widget) ||
    !widgetCommentsPopup ||
    !widgetCommentsPopupFields
  ) {
    return;
  }

  normalizeWidgetLikesData(widget);
  normalizePhotoWidgetComments(widget);
  markWidgetCommentsSeen(widget);

  const prefix = getWidgetCommentDomPrefix(widget);
  const normalizedWidgetId = String(widget.id || "")
    .toLowerCase()
    .trim();
  const normalizedWidgetTitle = String(widget.title || "").toLowerCase();
  const title =
    normalizedWidgetId === "song"
      ? "on repeat comments"
      : normalizedWidgetId === "note" || normalizedWidgetTitle.includes("quick note")
        ? "quick note comments"
        : "keepsake comments";

  if (widgetCommentsPopupTitle) {
    widgetCommentsPopupTitle.textContent = `${title} ♡`;
  }

  widgetPopup?.classList.remove("open", "together-widget-popup");
  widgetPopupCard?.classList.remove("photo-history-popup-card");
  if (saveWidgetBtn) {
    saveWidgetBtn.style.display = "inline-flex";
  }
  setHeaderWidgetSaveVisibility(false);
  if (clearWidgetHistoryBtn) {
    clearWidgetHistoryBtn.style.display = "none";
    delete clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode;
  }

  widgetCommentsPopupFields.innerHTML = `
    ${getWidgetCommentPreviewMarkup(getWidgetCommentPreviewSnapshot(widget), {
      showLabel: false,
    })}
    ${getPhotoWidgetCommentSectionMarkup(widget, {
      prefix,
      title: "comments",
    })}
  `;

  bindPhotoWidgetCommentSection(widget, {
    prefix,
    title: "comments",
  });

  widgetCommentsPopup.classList.add("open");
  openWidgetCommentsId = widget.id;
  pendingWidgetCommentFocusId = "";
  if (focusCommentId) {
    const listEl = document.getElementById(getPhotoWidgetCommentSectionIds(prefix).listId);
    const selector = `[data-photo-widget-comment-row-id="${CSS.escape(focusCommentId)}"]`;
    if (listEl?.querySelector(selector)) {
      revealCommentRow(listEl, selector);
    } else {
      pendingWidgetCommentFocusId = focusCommentId;
    }
  }

  window.requestAnimationFrame(() => {
    const ids = getPhotoWidgetCommentSectionIds(prefix);
    const input = document.getElementById(ids.inputId);
    if (input && !input.disabled && !isMobileLayoutActive()) {
      input.focus({ preventScroll: true });
    }
  });
}

function closeWidgetComments() {
  widgetCommentsPopup?.classList.remove("open");
  openWidgetCommentsId = "";
  pendingWidgetCommentFocusId = "";
  Array.from(activePhotoWidgetReplyTargets.keys()).forEach((prefix) => {
    if (String(prefix).startsWith("widget-comments-popup-")) {
      activePhotoWidgetReplyTargets.delete(prefix);
      activePhotoWidgetReplyItems.delete(prefix);
    }
  });
}

async function saveWidgetChanges() {
  if (widgetSaveInFlight) return;
  widgetSaveInFlight = true;
  if (saveWidgetBtn) saveWidgetBtn.disabled = true;
  if (headerSaveWidgetBtn) headerSaveWidgetBtn.disabled = true;

  try {
    const widget = findWidgetByAlias(editingWidgetId);

    if (!widget) return;

    let beforeLikeContentSignature = "";

    if (isLikeableWidget(widget)) {
      normalizeWidgetLikesData(widget);
      beforeLikeContentSignature = getWidgetLikeContentSignature(widget);
    }

    const beforeSaveState = JSON.stringify({
      title: widget.title || "",
      data: widget.data || null,
    });

    if (editingWidgetId === "song") {
      if (!widget.data) widget.data = {};
      widget.title = widget.title || "₊˚⊹ on repeat ♫";
      const rawSpotifyUrl = document.getElementById("widgetFieldSpotifyUrl")?.value.trim() || "";
      const normalizedTrack = normalizeSpotifyTrackUrl(rawSpotifyUrl);
      const durationLabel = document.getElementById("widgetFieldSongDuration")?.value.trim() || "";
      const songName = document.getElementById("widgetFieldSongName")?.value.trim() || "";

      if (!areBreakupWordsAllowed(songName, durationLabel)) {
        return;
      }

      widget.data.spotifyUrl = normalizedTrack?.spotifyUrl || "";
      widget.data.spotifyUri = widget.data.spotifyUrl
        ? document.getElementById("widgetFieldSongUri")?.value.trim() ||
          normalizedTrack?.spotifyUri ||
          ""
        : "";
      widget.data.durationLabel = durationLabel;
      widget.data.coverUrl = document.getElementById("widgetFieldSongCover")?.value.trim() || "";
      widget.data.songName = songName;
      widget.data.accent = Math.max(6, Math.min(94, Number(widget.data.accent) || 38));
    } else if (editingWidgetId === "note") {
      if (!widget.data) widget.data = {};
      const noteText = document.getElementById("widgetFieldText").value.trim();
      if (!areBreakupWordsAllowed(noteText)) {
        return;
      }
      widget.data.text = noteText;
    } else if (
      String(widget.title || "")
        .toLowerCase()
        .includes("keepsake") ||
      String(editingWidgetId || "")
        .toLowerCase()
        .startsWith("keepsake")
    ) {
      if (!canEditKeepsakeWidget(widget)) {
        showMessage("you can only view, like, and comment on this keepsake ♡");
        return;
      }

      const photoText = document.getElementById("photoWidgetText")?.value.trim() || "";
      if (!areBreakupWordsAllowed(photoText)) {
        return;
      }

      if (!widget.data) widget.data = {};
      activePhotoEditor?.commit();
      widget.data.image = document.getElementById("photoWidgetImageData")?.value || "";
      const originalImage = document.getElementById("photoWidgetOriginal")?.value || "";
      const editsJson = document.getElementById("photoWidgetEdits")?.value || "";
      if (widget.data.image && originalImage && editsJson) {
        widget.data.originalImage = originalImage;
        try {
          widget.data.edits = JSON.parse(editsJson);
        } catch {
          delete widget.data.edits;
        }
      } else {
        delete widget.data.originalImage;
        delete widget.data.edits;
      }
      delete widget.data.caption;
      widget.data.text = photoText;
      widget.data.textColor = normalizeHexColor(
        document.getElementById("photoTextColor")?.value,
        "#ffffff",
      );
      widget.data.textSize = Math.max(
        12,
        Math.min(46, Number(document.getElementById("photoTextSize")?.value) || 22),
      );
      const savedTextX = Number(document.getElementById("photoWidgetTextX")?.value);
      const savedTextY = Number(document.getElementById("photoWidgetTextY")?.value);
      widget.data.textX = Math.max(0, Math.min(100, Number.isFinite(savedTextX) ? savedTextX : 50));
      widget.data.textY = Math.max(0, Math.min(100, Number.isFinite(savedTextY) ? savedTextY : 86));
      widget.data.rotate = Number(document.getElementById("photoWidgetRotate")?.value) || 0;
      widget.data.textFont = normalizePhotoTextFont(
        document.getElementById("photoTextFont")?.value,
      );
      widget.data.textEffect = normalizePhotoTextEffect(
        document.getElementById("photoTextEffect")?.value,
      );
    } else {
      return;
    }

    if (
      beforeLikeContentSignature &&
      getWidgetLikeContentSignature(widget) !== beforeLikeContentSignature
    ) {
      widget.data.likes = [];
      widget.data.likeTimestamps = {};
    }

    const afterSaveState = JSON.stringify({
      title: widget.title || "",
      data: widget.data || null,
    });

    if (beforeSaveState === afterSaveState) {
      showMessage("no changes to save ♡");
      return;
    }

    markWidgetContentUpdated(widget);
    queueWidgetSave(widget, {
      changedKeys: getChangedWidgetDataKeys(JSON.parse(beforeSaveState).data, widget.data),
      showsMeter: true,
    });
    widgetPopup.classList.remove("open");
    renderWidgets({ animateMobileReorder: false });
  } finally {
    widgetSaveInFlight = false;
    if (saveWidgetBtn) saveWidgetBtn.disabled = false;
    if (headerSaveWidgetBtn) headerSaveWidgetBtn.disabled = false;
  }
}

async function writeWidgetPosition(widget) {
  const updatedAt = new Date().toISOString();
  markPendingLocalWidgetUpdate(widget.id, updatedAt);
  cacheWidgetLayout(widget, updatedAt);

  const { data: updatedRows, error } = await dataStore
    .from("widgets")
    .update({
      side: widget.side,
      x: Math.round(widget.x),
      y: Math.round(widget.y),
      updated_at: updatedAt,
    })
    .eq("id", widget.id)
    .select("id");

  if (error) {
    console.error(error);
    return false;
  }

  if (!updatedRows?.length) {
    return saveWidget(widget, {
      recordHistory: false,
      suppressErrorMessage: true,
    });
  }

  widget.updated_at = updatedAt;
  widgetLocalSaveTimes.set(widget.id, performance.now());
  return true;
}

async function saveWidgetPosition(widget) {
  const running = widgetPositionSaves.get(widget.id);
  if (running) {
    running.widget = widget;
    running.again = true;
    return;
  }

  const state = { widget, again: true };
  widgetPositionSaves.set(widget.id, state);
  let failures = 0;

  while (state.again) {
    state.again = false;
    if (await writeWidgetPosition(state.widget)) {
      failures = 0;
      continue;
    }

    failures += 1;
    if (failures >= WIDGET_POSITION_SAVE_TRIES) {
      markCachedWidgetLayoutUnsaved(state.widget.id);
      showMessage("could not save widget position");
      break;
    }
    state.again = true;
    await new Promise((resolve) => setTimeout(resolve, failures * 1000));
  }

  widgetPositionSaves.delete(widget.id);
  scheduleBootSnapshotSave();
}

function resendUnsavedWidgetPositions() {
  if (!currentUser || !pendingSavesReady) return;
  const layouts = getCachedWidgetLayouts();
  widgets.forEach((widget) => {
    if (layouts[widget.id]?.unsaved) void saveWidgetPosition(widget);
  });
}

const WIDGET_SAVE_CONFLICT = "conflict";

async function saveWidget(widget, options = {}) {
  const {
    recordHistory = true,
    suppressErrorMessage = false,
    notifyUpdate = false,
    onlyIfUpdatedAt = "",
  } = options;
  if (notifyUpdate) {
    markWidgetContentUpdated(widget);
  }

  if (recordHistory) {
    recordWidgetHistory(widget);
  }

  const payload = {
    title: widget.title,
    data: widget.data || null,
    content: widget.content || null,
    updated_at: new Date().toISOString(),
  };

  const writtenData = JSON.stringify(payload.data ?? null);

  markPendingLocalWidgetUpdate(widget.id, payload.updated_at);

  let update = dataStore.from("widgets").update(payload).eq("id", widget.id);
  if (onlyIfUpdatedAt) update = update.eq("updated_at", onlyIfUpdatedAt);
  const { data: updatedRows, error: updateError } = await update.select("id");

  if (updateError) {
    console.error(updateError);
    if (!suppressErrorMessage) {
      showMessage(updateError.message);
    }
    return false;
  }

  if (!updatedRows?.length) {
    if (onlyIfUpdatedAt) return WIDGET_SAVE_CONFLICT;

    const { error: insertError } = await dataStore.from("widgets").insert({
      id: widget.id,
      ...payload,
      side: widget.side,
      x: Math.round(widget.x),
      y: Math.round(widget.y),
    });

    if (insertError) {
      console.error(insertError);
      if (!suppressErrorMessage) {
        showMessage(insertError.message);
      }
      return false;
    }
  }

  widget.updated_at = payload.updated_at;
  widgetLocalSaveTimes.set(widget.id, performance.now());
  widgetServerData.set(widget.id, writtenData);
  refreshNotificationsFromCurrentData(false);
  return true;
}

async function toggleWidgetBucketlistItem(widgetId, wishId) {
  const normalizedWidgetId = String(widgetId || "")
    .toLowerCase()
    .trim();
  const widget = widgets.find((item) => {
    const itemId = String(item.id || "")
      .toLowerCase()
      .trim();
    const itemTitle = String(item.title || "").toLowerCase();

    if (itemId === normalizedWidgetId) return true;
    if (normalizedWidgetId === "bucketlist" && itemTitle.includes("bucket list")) return true;
    return false;
  });

  if (!widget?.data?.items?.length) return;

  widget.data.items = getItemsInDisplayOrder(widget.data.items).map((item, index) => ({
    ...item,
    order: Number.isFinite(item?.order) ? item.order : index,
    done: item.id === wishId ? !item.done : item.done,
  }));

  refreshWidgetContentDom(widget);
  queueWidgetSave(widget, { notifyUpdate: true });

  if (widgetPopup?.classList.contains("open") && editingWidgetId === "bucketlist") {
    openWidgetEditor("bucketlist");
  }
}

function formatEntryDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = date.getHours();
  const displayHours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  return `${day}/${month}/${year} ${displayHours}:${minutes} ${period}`;
}

function getEntryHeaderDateMarkup(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return `<time class="post-header-when" datetime="${escapeHtml(date.toISOString())}" title="${escapeHtml(formatEntryDate(dateString))}"><span class="post-header-day">${escapeHtml(day)}</span><span class="post-header-sep" aria-hidden="true"></span><span class="post-header-time">${escapeHtml(time)}</span></time>`;
}

function getCommentCreatedTimestamp(comment) {
  const timestamp = new Date(
    comment?.createdAt ||
      comment?.created_at ||
      comment?.created ||
      comment?.timestamp ||
      comment?.savedAt ||
      comment?.date ||
      "",
  ).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareCommentsNewestFirst(left, right) {
  return getCommentCreatedTimestamp(right) - getCommentCreatedTimestamp(left);
}

function getCommentsNewestFirst(comments = []) {
  return [...(Array.isArray(comments) ? comments : [])].sort(compareCommentsNewestFirst);
}

function getPostLikeButtonMarkup(post) {
  return getLikeButtonMarkup(post.likedByMe, post.likesCount || 0);
}

function syncPostLikeButton(postId) {
  const post = posts.find((item) => item.id === postId);
  const btn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);

  if (!post || !btn) return;

  btn.innerHTML = getPostLikeButtonMarkup(post);
  btn.classList.toggle("liked", Boolean(post.likedByMe));
  btn.setAttribute("aria-label", post.likedByMe ? "liked post" : "like post");
  btn.setAttribute("aria-pressed", String(Boolean(post.likedByMe)));
}

function getPostCommentCount(post) {
  return (post?.comments || []).reduce(
    (total, comment) => total + 1 + (comment.replies || []).length,
    0,
  );
}

function syncPostCommentButton(postId) {
  const post = posts.find((item) => item.id === postId);
  const countEl = document.querySelector(`.comments-btn[data-post-id="${postId}"] .post-btn-count`);

  if (!post || !countEl) return;

  countEl.textContent = `(${getPostCommentCount(post)})`;
}

function getPostCommentById(post, commentId) {
  if (!post) return null;

  for (const comment of post.comments || []) {
    if (comment.id === commentId) return comment;
    const matchingReply = (comment.replies || []).find((reply) => reply.id === commentId);
    if (matchingReply) return matchingReply;
  }

  return null;
}

function syncCommentLikeButton(commentId) {
  const post = posts.find((item) => item.id === currentCommentsPostId);
  const comment = getPostCommentById(post, commentId);
  const button = commentsList?.querySelector(
    `[data-comment-like-id="${CSS.escape(String(commentId))}"]`,
  );

  if (!comment || !button) return;

  const likedByMe = Boolean(comment.likedByMe);
  button.classList.toggle("liked", likedByMe);
  button.setAttribute("aria-pressed", String(likedByMe));
  button.setAttribute("aria-label", `${likedByMe ? "unlike" : "like"} comment`);
  button.innerHTML = getCommentRowLikeInnerMarkup(likedByMe, comment.likesCount || 0);
}

function addCommentToPost(postId, comment) {
  const post = posts.find((item) => item.id === postId);
  if (!post || !comment) return false;

  post.comments = Array.isArray(post.comments) ? post.comments : [];

  if (comment.parent_comment_id) {
    const parent = post.comments.find((item) => item.id === comment.parent_comment_id);

    if (!parent) return false;

    parent.replies = Array.isArray(parent.replies) ? parent.replies : [];
    parent.replies.push(comment);
    parent.replies.sort(compareCommentsNewestFirst);
  } else {
    post.comments.push({
      ...comment,
      replies: Array.isArray(comment.replies) ? comment.replies : [],
    });
    post.comments.sort(compareCommentsNewestFirst);
  }

  return true;
}

function removeCommentFromPost(postId, commentId) {
  const post = posts.find((item) => item.id === postId);
  if (!post?.comments) return null;

  const topLevelIndex = post.comments.findIndex((comment) => comment.id === commentId);

  if (topLevelIndex !== -1) {
    const [removedComment] = post.comments.splice(topLevelIndex, 1);
    return {
      restore() {
        post.comments.splice(topLevelIndex, 0, removedComment);
      },
    };
  }

  for (const comment of post.comments) {
    const replies = comment.replies || [];
    const replyIndex = replies.findIndex((reply) => reply.id === commentId);

    if (replyIndex === -1) continue;

    const [removedReply] = replies.splice(replyIndex, 1);
    return {
      restore() {
        replies.splice(replyIndex, 0, removedReply);
      },
    };
  }

  return null;
}

function updateLocalCommentId(postId, temporaryId, savedComment) {
  const post = posts.find((item) => item.id === postId);
  const comment = getPostCommentById(post, temporaryId);
  if (!comment || !savedComment?.id) return;

  comment.id = savedComment.id;
  comment.created_at = savedComment.created_at || comment.created_at;
}

function applyProfileToTimeline(profile) {
  if (!profile?.id) return;

  const displayName = profile.nickname || profile.username || "someone";
  const avatarUrl = profile.avatar_url || "";

  posts = posts.map((post) =>
    post.userId === profile.id
      ? {
          ...post,
          nickname: displayName,
          avatarUrl,
        }
      : post,
  );

  document.querySelectorAll(`[data-post-id]`).forEach((postEl) => {
    const post = posts.find((item) => item.id === postEl.dataset.postId);
    if (!post || post.userId !== profile.id) return;

    const authorName = postEl.querySelector(".post-author-name");
    if (authorName) {
      authorName.textContent = displayName;
    }

    const avatar = postEl.querySelector(".post-avatar");
    if (!avatar) return;

    const profileAriaLabel = `open ${displayName || "profile"} profile`;
    avatar.setAttribute("aria-label", profileAriaLabel);
    avatar.setAttribute("title", "open profile");

    if (avatarUrl && avatar.tagName === "IMG") {
      avatar.src = avatarUrl;
      avatar.alt = displayName || "profile";
    }
  });
}

function createTimelinePostElement(post, postIndex) {
  const isOwner = currentProfile && post.userId === currentProfile.id;
  const profileAriaLabel = `open ${post.nickname || "profile"} profile`;
  const shouldPrioritizePostImages = postIndex < INITIAL_TIMELINE_IMAGE_COUNT;
  const avatarHtml = post.avatarUrl
    ? `<img class="post-avatar profile-trigger" src="${escapeHtml(post.avatarUrl)}" alt="${escapeHtml(post.nickname || "profile")}" role="button" tabindex="0" aria-label="${escapeHtml(profileAriaLabel)}" title="open profile" loading="eager" decoding="async"${shouldPrioritizePostImages ? ' fetchpriority="high"' : ""} />`
    : `<div class="post-avatar profile-trigger" role="button" tabindex="0" aria-label="${escapeHtml(profileAriaLabel)}" title="open profile"></div>`;

  const postEl = document.createElement("article");
  postEl.className = "post";
  postEl.dataset.postId = post.id;
  postEl.innerHTML = `
    <div class="post-header">
      <span class="post-header-title"><span aria-hidden="true">˚₊‧ </span>entry<span aria-hidden="true"> ❤︎‧₊˚</span></span>
      ${getEntryHeaderDateMarkup(post.created_at)}
      ${post.isEdited ? `<span class="post-edited-badge">edited</span>` : ""}
    </div>
    <div class="post-body">
      <div class="post-meta">
        ${avatarHtml}
        <div class="post-author-text">
          <span class="post-author-name profile-trigger" role="button" tabindex="0" aria-label="${escapeHtml(profileAriaLabel)}" title="open profile">${escapeHtml(post.nickname || post.author)}</span>
          <span>${post.author}</span>
        </div>
     </div>
      <div class="post-text ql-editor"></div>
      <div class="link-preview-list" hidden></div>
      <div class="post-actions">
        <button
          class="post-btn like-btn${post.likedByMe ? " liked" : ""}"
          type="button"
          data-post-id="${post.id}"
          aria-label="${post.likedByMe ? "liked post" : "like post"}"
          aria-pressed="${post.likedByMe ? "true" : "false"}"
        >
          ${getPostLikeButtonMarkup(post)}
        </button>
        <button
          class="post-btn comments-btn"
          type="button"
          data-post-id="${post.id}"
          aria-label="open comments"
        >
          ${getCommentIconMarkup()}
          <span class="post-btn-label">comments</span>
          <span class="post-btn-count">(${getPostCommentCount(post)})</span>
        </button>
        <button
          class="post-btn stickers-btn"
          type="button"
          data-post-id="${post.id}"
          aria-label="open stickers"
          aria-pressed="false"
        >
          <span class="post-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8.5" /><path d="M8.8 14.2a4 4 0 0 0 6.4 0" /><path d="M9.3 9.8h.01M14.7 9.8h.01" /></svg></span>
          <span class="post-btn-label">stickers</span>
        </button>
        ${isOwner ? `<button class="post-btn edit-entry-btn" type="button" data-post-id="${post.id}" aria-label="edit entry"><span class="post-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg></span><span class="post-btn-label">edit</span></button>` : ""}
        ${isOwner ? `<button class="post-btn delete-entry-btn" type="button" data-post-id="${post.id}" aria-label="delete entry"><span class="post-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg></span><span class="post-btn-label">delete</span></button>` : ""}
      </div>
      <div class="reaction-layer"></div>
    </div>
  `;

  const pendingSave = getPendingEntrySave(post.id);
  if (pendingSave) {
    postEl.classList.add("is-saving");
    postEl
      .querySelector(".post-header")
      .insertAdjacentHTML(
        "beforeend",
        `<span class="post-edited-badge post-saving-badge">${pendingSave.failed ? "not saved yet" : "saving…"}</span>`,
      );
    postEl.querySelectorAll(".post-btn").forEach((button) => {
      button.disabled = !(pendingSave.failed && button.classList.contains("delete-entry-btn"));
    });
  }

  const postTextEl = postEl.querySelector(".post-text");
  postTextEl.innerHTML = getPostDisplayHtml(post.text);
  prioritizeEntryImages(postTextEl, { eager: shouldPrioritizePostImages });
  makeEntryImagesInteractive(postTextEl);
  postTextEl.querySelectorAll("a").forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  renderLinkPreviews(postTextEl, postEl.querySelector(".link-preview-list"));

  const postBody = postEl.querySelector(".post-body");
  const avatarEl = postEl.querySelector(".post-avatar");
  const authorNameEl = postEl.querySelector(".post-author-name");
  const openProfileDetails = () =>
    openProfilePopupForUser(post.userId, {
      id: post.userId,
      nickname: post.nickname,
      avatar_url: post.avatarUrl || "",
    });

  bindProfilePopupTrigger(avatarEl, openProfileDetails);
  bindProfilePopupTrigger(authorNameEl, openProfileDetails);

  postBody.addEventListener("dragenter", (event) => {
    if (!isStickerDragEvent(event)) return;
    event.preventDefault();
    postBody.classList.add("sticker-drop-ready");
  });

  postBody.addEventListener("dragover", (event) => {
    if (!isStickerDragEvent(event)) return;
    event.preventDefault();
    postBody.classList.add("sticker-drop-ready");
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });

  postBody.addEventListener("dragleave", (event) => {
    if (!postBody.contains(event.relatedTarget)) {
      postBody.classList.remove("sticker-drop-ready");
    }
  });

  postBody.addEventListener("drop", (event) => {
    if (!isStickerDragEvent(event)) return;
    event.stopPropagation();
    handleStickerDrop(event, post.id);
  });

  postEl.addEventListener("dragover", (event) => {
    if (!isStickerDragEvent(event)) return;
    event.preventDefault();
    const dropBody = getDropBodyFromTarget(event.target) || postBody;
    dropBody.classList.add("sticker-drop-ready");
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });

  postEl.addEventListener("drop", (event) => {
    if (!isStickerDragEvent(event)) return;
    handleStickerDrop(event, post.id);
  });

  return postEl;
}

function getPostRenderSignature(post) {
  return JSON.stringify([
    post.text,
    post.isEdited,
    post.nickname,
    post.author,
    post.avatarUrl,
    post.likesCount,
    post.likedByMe,
    getPostCommentCount(post),
    Boolean(currentProfile && post.userId === currentProfile.id),
    getLikedHeart(),
    getPendingEntrySave(post.id) ? Boolean(getPendingEntrySave(post.id).failed) : null,
  ]);
}

function makeTimelineNote(className, html) {
  const note = document.createElement("div");
  note.className = className;
  note.innerHTML = html;
  return note;
}

function renderTimeline() {
  ensureTimelineTools();
  disconnectTimelinePager();

  const existingCards = new Map();
  timelineEl.querySelectorAll(":scope > article.post[data-post-id]").forEach((card) => {
    existingCards.set(card.dataset.postId, card);
  });

  const desired = [];
  const missingContentIds = [];
  let pager = null;

  if (!posts.length) {
    desired.push(
      makeTimelineNote(
        "post",
        `<div class="post-header"> </div><div class="post-body"><div class="post-text ql-editor">no entries yet. write your first one ♡</div></div>`,
      ),
    );
    syncTimelineToolsSummary(0, 0);
  } else {
    const filteredPosts = getFilteredTimelinePosts();
    const visiblePosts = filteredPosts.slice(0, timelineVisibleCount);
    syncTimelineToolsSummary(filteredPosts.length, posts.length);

    if (!filteredPosts.length) {
      desired.push(
        makeTimelineNote(
          "timeline-empty-note",
          timelineFilters.onThisDay
            ? "nothing happened on this day yet ♡ come back next year"
            : "no entries match that ♡",
        ),
      );
    }

    visiblePosts.forEach((post, postIndex) => {
      if (post.contentMissing) return;
      const existingCard = existingCards.get(post.id);

      if (!post.contentLoaded && post.text === undefined) {
        if (existingCard) {
          desired.push(existingCard);
        } else {
          missingContentIds.push(post.id);
          const holder = document.createElement("div");
          holder.innerHTML = getPostSkeletonMarkup();
          desired.push(...holder.children);
        }
        return;
      }

      const signature = getPostRenderSignature(post);
      if (existingCard && existingCard.dataset.renderSignature === signature) {
        desired.push(existingCard);
        return;
      }

      const card = createTimelinePostElement(post, postIndex);
      card.dataset.renderSignature = signature;
      if (existingCard) card.classList.add("post-no-enter");
      desired.push(card);
    });

    if (filteredPosts.length > visiblePosts.length) {
      pager = makeTimelineNote(
        "timeline-pager",
        `<button class="soft-btn timeline-load-more" type="button">show older entries <span aria-hidden="true">♡</span> <span class="timeline-load-more-count">(${filteredPosts.length - visiblePosts.length} more)</span></button>`,
      );
      desired.push(pager);
    }
  }

  const keep = new Set(desired);
  Array.from(timelineEl.children).forEach((child) => {
    if (child !== timelineToolsEl && !keep.has(child)) child.remove();
  });
  let cursor = timelineToolsEl.nextSibling;
  desired.forEach((node) => {
    if (node === cursor) {
      cursor = cursor.nextSibling;
    } else {
      timelineEl.insertBefore(node, cursor);
    }
  });

  if (missingContentIds.length) {
    void ensurePostContent(missingContentIds).then((loaded) => {
      if (loaded) renderTimeline();
    });
  }

  if (pager) observeTimelinePager(pager);
  renderPlacedStickers();
}

function getDropBodyFromTarget(target) {
  if (!target) return null;
  if (target.classList?.contains("post-body")) return target;
  return target.closest?.(".post-body") || null;
}

function isStickerDragEvent(event) {
  if (activeSticker) return true;

  const types = Array.from(event?.dataTransfer?.types || []);
  return types.includes(STICKER_MIME_TYPE);
}

function switchStickerTab(nextTab) {
  let activeTabButton = null;
  const nextGiphyType = nextTab === "giphy-sticker" ? "giphy-sticker" : "gif";
  const isGiphyTab = nextTab === "gif" || nextTab === "giphy-sticker";

  if (isGiphyTab && activeGiphySearchType !== nextGiphyType) {
    activeGiphySearchType = nextGiphyType;
    gifSearchResults = [];
    gifSearchQuery = "";
    if (gifSearchInput) {
      gifSearchInput.value = "";
    }
  }

  document.querySelectorAll(".sticker-tab").forEach((button) => {
    const isActive = button.dataset.stickerTab === nextTab;
    button.classList.toggle("active", isActive);
    if (isActive) {
      activeTabButton = button;
    }
  });

  const typePanel = document.getElementById("stickerTypePanel");
  const pickPanel = document.getElementById("stickerPickPanel");
  const gifPanel = document.getElementById("stickerGifPanel");

  if (typePanel) {
    typePanel.classList.toggle("active", nextTab === "type");
  }

  if (pickPanel) {
    pickPanel.classList.toggle("active", nextTab === "pick");
  }

  if (gifPanel) {
    gifPanel.classList.toggle("active", isGiphyTab);
  }

  if (gifSearchInput) {
    gifSearchInput.placeholder =
      activeGiphySearchType === "giphy-sticker" ? "Search GIPHY Stickers" : "Search GIPHY GIFs";
  }

  if (nextTab === "type") {
    renderTypedStickerPreview();
  }

  if (nextTab === "pick") {
    renderEmojiPicker();
  }

  if (isGiphyTab) {
    if (!gifSearchQuery && !gifSearchResults.length) {
      setGifSearchStatus(
        GIPHY_API_KEY ? "" : "add your GIPHY API key in script.js to enable GIPHY search",
      );
    }
    renderGifPicker();
  }

  activeTabButton?.scrollIntoView({
    behavior: getScrollBehavior(),
    block: "nearest",
    inline: "center",
  });
}

function renderEmojiPicker() {
  if (!emojiPickerGrid || hasRenderedEmojiPicker) return;

  emojiPickerGrid.innerHTML = "";

  STICKER_PICKER_GROUPS.forEach((group) => {
    const section = document.createElement("section");
    section.className = "emoji-picker-section";

    const heading = document.createElement("div");
    heading.className = "emoji-picker-heading";
    heading.textContent = group.label;
    section.appendChild(heading);

    const sectionGrid = document.createElement("div");
    sectionGrid.className = "emoji-picker-section-grid";

    group.emojis.forEach((emojiValue) => {
      const button = document.createElement("button");
      button.className = "emoji-picker-btn";
      button.type = "button";
      button.draggable = true;
      button.textContent = emojiValue;
      button.setAttribute("aria-label", `choose ${emojiValue}`);
      button.addEventListener("click", () => {
        if (stickerTargetPostId) {
          void placeStickerOnTargetPost(emojiValue);
          return;
        }
        stickerInput.value = emojiValue;
        switchStickerTab("type");
      });
      button.addEventListener("dragstart", (event) => {
        activeSticker = emojiValue;
        activeStickerSize = null;
        requestAnimationFrame(() => {
          stickerPopup.classList.remove("open");
        });
        document.body.classList.add("sticker-dragging");

        if (event.dataTransfer) {
          event.dataTransfer.setData(STICKER_MIME_TYPE, emojiValue);
          event.dataTransfer.setData("text/plain", emojiValue);
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.dropEffect = "copy";
        }
      });
      button.addEventListener("dragend", () => {
        endStickerDrag();
      });
      sectionGrid.appendChild(button);
    });

    section.appendChild(sectionGrid);
    emojiPickerGrid.appendChild(section);
  });

  hasRenderedEmojiPicker = true;
}

function endStickerDrag() {
  activeSticker = null;
  activeStickerSize = null;
  document.body.classList.remove("sticker-dragging");
  document
    .querySelectorAll(".post-body.sticker-drop-ready")
    .forEach((node) => node.classList.remove("sticker-drop-ready"));
}

let gifPickerObserver = null;
let gifPickerPlayedUrls = new Set();

function playGifPickerImageWhenSeen(image) {
  if (!("IntersectionObserver" in window)) {
    animateGifImage(image);
    return;
  }
  gifPickerObserver ||= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        gifPickerObserver.unobserve(entry.target);
        gifPickerPlayedUrls.add(entry.target.src);
        animateGifImage(entry.target);
      });
    },
    { rootMargin: "120px" },
  );
  gifPickerObserver.observe(image);
}

function renderGifPicker() {
  if (!gifPickerGrid) return;
  gifPickerObserver?.disconnect();
  forgetGifs(gifPickerPlayedUrls);
  gifPickerPlayedUrls = new Set();
  gifPickerGrid.innerHTML = "";
  const giphyTypeLabel = getGiphyTypeLabel();
  const giphyTypePlural = getGiphyTypePlural();
  const recentGifStickers = getRecentGiphyItems();
  const gifItems = gifSearchResults.length ? gifSearchResults : recentGifStickers;

  if (!gifSearchResults.length) {
    setGifSearchStatus(recentGifStickers.length ? `recently used ${giphyTypePlural} ♡` : "");
  }

  gifItems.forEach((gifItem) => {
    const button = document.createElement("button");
    button.className = "gif-picker-card";
    button.type = "button";
    button.draggable = true;
    button.setAttribute("aria-label", `choose ${gifItem.label} ${giphyTypeLabel}`);

    const media = document.createElement("span");
    media.className = "gif-media gif-picker-media";
    const image = document.createElement("img");
    image.src = gifItem.url;
    image.alt = gifItem.label;
    image.loading = "lazy";
    media.appendChild(image);

    const label = document.createElement("span");
    label.textContent = gifItem.label;

    button.append(media, label);
    playGifPickerImageWhenSeen(image);
    button.addEventListener("click", () => {
      if (stickerTargetPostId) {
        void placeStickerOnTargetPost(gifItem.url, DEFAULT_GIF_STICKER_SIZE);
        return;
      }
      gifPickerGrid.querySelectorAll(".gif-picker-card").forEach((card) => {
        card.classList.toggle("active", card === button);
      });
    });

    button.addEventListener("dragstart", (event) => {
      activeSticker = gifItem.url;
      activeStickerSize = DEFAULT_GIF_STICKER_SIZE;
      requestAnimationFrame(() => {
        stickerPopup.classList.remove("open");
      });
      document.body.classList.add("sticker-dragging");

      if (event.dataTransfer) {
        event.dataTransfer.setData(STICKER_MIME_TYPE, gifItem.url);
        event.dataTransfer.setData("text/plain", gifItem.url);
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.dropEffect = "copy";
      }
    });

    button.addEventListener("dragend", () => {
      endStickerDrag();
    });

    gifPickerGrid.appendChild(button);
  });
}

function renderTypedStickerPreview() {
  if (!typedStickerPreviewWrap || !typedStickerPreview) return;

  const typedValue = String(stickerInput?.value || "").trim();
  const hasValue = Boolean(typedValue);

  typedStickerPreviewWrap.hidden = !hasValue;
  typedStickerPreview.textContent = typedValue;
  typedStickerPreview.dataset.hint = hasValue
    ? ""
    : stickerTargetPostId
      ? "tap to add"
      : "click & drag";
  typedStickerPreview.setAttribute(
    "aria-label",
    hasValue ? `use typed sticker ${typedValue}` : "typed sticker preview",
  );
  typedStickerPreview.classList.toggle("is-ready", hasValue);
}

async function searchPublicGifs() {
  if (!gifSearchInput) return;

  const query = gifSearchInput.value.trim();
  const giphyType = activeGiphySearchType;
  const giphyTypePlural = getGiphyTypePlural(giphyType);
  gifSearchQuery = query;

  if (!query) {
    gifSearchResults = [];
    setGifSearchStatus("");
    renderGifPicker();
    return;
  }

  if (!GIPHY_API_KEY) {
    gifSearchResults = [];
    setGifSearchStatus("add your GIPHY API key in script.js to enable GIPHY search");
    renderGifPicker();
    return;
  }

  setGifSearchStatus(`searching ${giphyTypePlural} for "${query}"...`);

  try {
    const endpoint = getGiphySearchEndpoint(giphyType);
    const searchUrl =
      `${endpoint}?api_key=${encodeURIComponent(GIPHY_API_KEY)}` +
      `&q=${escapeQueryParam(query)}&limit=12&rating=g&bundle=messaging_non_clips`;
    const response = await fetch(searchUrl, {
      headers: {
        "X-Requested-With": GIPHY_CLIENT_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`GIF search failed with ${response.status}`);
    }

    const payload = await response.json();
    if (activeGiphySearchType !== giphyType) return;

    gifSearchResults = (payload?.data || [])
      .map((gifItem) => ({
        label: gifItem?.title || query,
        url: getGiphyStickerUrl(gifItem),
        type: giphyType,
      }))
      .filter((gifItem) => gifItem.url);

    if (gifSearchResults.length) {
      setGifSearchStatus(`showing GIPHY ${giphyTypePlural} for "${query}"`);
    } else {
      setGifSearchStatus(`no GIPHY ${giphyTypePlural} found for "${query}"`);
    }
    renderGifPicker();
  } catch (error) {
    console.error(error);
    gifSearchResults = [];
    setGifSearchStatus(`could not load GIPHY ${giphyTypePlural} right now`);
    renderGifPicker();
  }
}

async function handleStickerDrop(event, postId, { onPlaced } = {}) {
  event.preventDefault();

  let droppedSticker = activeSticker;

  if (!droppedSticker && event.dataTransfer) {
    droppedSticker = event.dataTransfer.getData(STICKER_MIME_TYPE);
  }

  if (!droppedSticker) {
    showMessage("no sticker selected ♡");
    return;
  }

  if (!isGifSticker(droppedSticker) && !areBreakupWordsAllowed(droppedSticker)) {
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    showMessage("please log in first ♡");
    return;
  }

  const body = getDropBodyFromTarget(event.currentTarget) || getDropBodyFromTarget(event.target);

  if (!body) {
    showMessage("could not find the post area ♡");
    return;
  }

  body.classList.remove("sticker-drop-ready");
  const stickerRadius = isGifSticker(droppedSticker)
    ? Math.max(16, (activeStickerSize || DEFAULT_GIF_STICKER_SIZE) / 2)
    : 16;
  const { x, y } = getStickerPositionFromPointer(event, body, stickerRadius);
  const temporaryStickerId = `local-sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const optimisticSticker = {
    id: temporaryStickerId,
    postId,
    userId: user.id,
    sticker: droppedSticker,
    x,
    y,
  };

  const droppedGifSize = isGifSticker(droppedSticker)
    ? clampGifStickerSize(activeStickerSize || DEFAULT_GIF_STICKER_SIZE)
    : null;
  optimisticSticker.size = droppedGifSize;

  placedStickers.push(optimisticSticker);
  renderPlacedStickers();
  onPlaced?.();

  const stickerInsertPayload = {
    post_id: postId,
    user_id: user.id,
    emoji: droppedSticker,
    x,
    y,
  };
  const insertedWithSize = Boolean(droppedGifSize);
  const insertResult = await trackTimelineWrite(
    dataStore
      .from("post_stickers")
      .insert(
        droppedGifSize ? { ...stickerInsertPayload, size: droppedGifSize } : stickerInsertPayload,
      )
      .select("id")
      .single(),
  );

  const { data: savedSticker, error } = insertResult;

  if (error) {
    console.error("POST STICKER INSERT ERROR:", error);
    showMessage(error.message);
    placedStickers = placedStickers.filter((item) => item.id !== temporaryStickerId);
    clearPlacedGifSize(temporaryStickerId);
    renderPlacedStickers();
    return;
  }

  if (isGifSticker(droppedSticker)) {
    const gifItem = gifSearchResults.find((item) => item.url === droppedSticker) ||
      getRecentGiphyItems(activeGiphySearchType).find((item) => item.url === droppedSticker) ||
      getRecentGifStickers().find((item) => item.url === droppedSticker) || {
        label: activeGiphySearchType === "giphy-sticker" ? "GIPHY sticker" : "gif sticker",
        url: droppedSticker,
        type: activeGiphySearchType,
      };
    saveRecentGifSticker(gifItem, gifItem.type || activeGiphySearchType);
  }

  activeSticker = null;
  document.body.classList.remove("sticker-dragging");
  showMessage("sticker placed ♡");

  if (savedSticker?.id) {
    markLocalRealtimeTable("post_stickers");
    const localSticker = placedStickers.find((item) => item.id === temporaryStickerId);
    if (localSticker) {
      localSticker.id = savedSticker.id;
      clearPlacedStickerPosition(temporaryStickerId);
      if (localSticker.x !== x || localSticker.y !== y) {
        void updatePlacedStickerPosition(savedSticker.id, localSticker.x, localSticker.y, {
          quiet: true,
        });
      }
    }

    if (isGifSticker(droppedSticker)) {
      const gifSize = droppedGifSize || DEFAULT_GIF_STICKER_SIZE;
      clearPlacedGifSize(temporaryStickerId);
      if (!insertedWithSize) {
        savePlacedGifSize(savedSticker.id, gifSize);
      }
    }

    renderPlacedStickers();
  }

  activeStickerSize = null;
}

function getStickerLayerSignature(items) {
  return JSON.stringify([
    currentProfile?.id || "",
    items.map((item) => [
      item.id,
      item.sticker,
      item.x,
      item.y,
      isGifSticker(item.sticker) ? getPlacedGifSize(item.id) : 0,
      visibleGifStickerControlTimers.has(item.id),
    ]),
  ]);
}

function renderPlacedStickers() {
  const stickersByPost = new Map();
  placedStickers.forEach((item) => {
    const list = stickersByPost.get(item.postId) || [];
    list.push(item);
    stickersByPost.set(item.postId, list);
  });

  const layersToRebuild = new Set();
  document.querySelectorAll("article.post[data-post-id] .reaction-layer").forEach((layer) => {
    const postId = layer.closest("article.post").dataset.postId;
    const signature = getStickerLayerSignature(stickersByPost.get(postId) || []);
    if (layer.dataset.stickerSignature === signature) return;
    layer.dataset.stickerSignature = signature;
    layer.innerHTML = "";
    layersToRebuild.add(layer);
  });

  placedStickers.forEach((item) => {
    const layer = document.querySelector(
      `article.post[data-post-id="${CSS.escape(item.postId)}"] .reaction-layer`,
    );
    if (!layer || !layersToRebuild.has(layer)) return;
    const isGif = isGifSticker(item.sticker);
    const gifSize = isGif ? getPlacedGifSize(item.id) : DEFAULT_GIF_STICKER_SIZE;

    const el = document.createElement("div");
    el.className = "reaction-sticker";
    el.dataset.stickerId = item.id;
    if (visibleGifStickerControlTimers.has(item.id)) {
      el.classList.add("show-controls");
    }
    if (isPercentStickerPosition(item)) {
      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
    } else {
      const layerWidth = layer.clientWidth || layer.getBoundingClientRect().width;
      const layerHeight = layer.clientHeight || layer.getBoundingClientRect().height;
      const stickerRadius = Math.max(16, gifSize / 2);
      const xPx = Math.max(
        stickerRadius,
        Math.min(layerWidth - stickerRadius, Number(item.x) || stickerRadius),
      );
      const yPx = Math.max(
        stickerRadius,
        Math.min(layerHeight - stickerRadius, Number(item.y) || stickerRadius),
      );
      el.style.left = `${Math.round(xPx)}px`;
      el.style.top = `${Math.round(yPx)}px`;
    }

    const stickerVisual = createStickerVisual(item.sticker, { size: gifSize });
    el.appendChild(stickerVisual);

    if (currentProfile?.id === item.userId) {
      const controlRow = document.createElement("div");
      controlRow.className = "sticker-control-row";

      stickerVisual.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        showGifStickerControls(item.id);

        const layerRect = layer.getBoundingClientRect();
        draggingPlacedSticker = {
          stickerId: item.id,
          sticker: item,
          element: el,
          layer,
          layerRect,
          pointerId: event.pointerId,
        };

        el.classList.add("is-dragging");
        document.body.classList.add("sticker-repositioning");
        stickerVisual.setPointerCapture?.(event.pointerId);
      });

      stickerVisual.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showGifStickerControls(item.id);
      });

      if (isGif) {
        const resizeControls = document.createElement("div");
        resizeControls.className = "sticker-size-controls";

        const shrinkBtn = document.createElement("button");
        shrinkBtn.className = "sticker-size-btn";
        shrinkBtn.type = "button";
        shrinkBtn.textContent = "-";
        shrinkBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          hideGifStickerControls(item.id);
          void persistPlacedGifSize(item.id, gifSize - 12);
          renderPlacedStickers();
          showGifStickerControls(item.id);
        });

        const growBtn = document.createElement("button");
        growBtn.className = "sticker-size-btn";
        growBtn.type = "button";
        growBtn.textContent = "+";
        growBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          hideGifStickerControls(item.id);
          void persistPlacedGifSize(item.id, gifSize + 12);
          renderPlacedStickers();
          showGifStickerControls(item.id);
        });

        resizeControls.append(shrinkBtn, growBtn);
        controlRow.appendChild(resizeControls);
      }

      const undoBtn = document.createElement("button");
      undoBtn.className = "sticker-undo-btn";
      undoBtn.type = "button";
      undoBtn.textContent = "undo";
      undoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        hideGifStickerControls(item.id);
        openDeletePlacedStickerConfirmation(item.id);
      });
      controlRow.appendChild(undoBtn);

      el.appendChild(controlRow);
    }

    layer.appendChild(el);
  });
}

function hideGifStickerControls(stickerId) {
  const stickerEl = document.querySelector(`.reaction-sticker[data-sticker-id="${stickerId}"]`);
  if (stickerEl) {
    stickerEl.classList.remove("show-controls");
  }

  const timer = visibleGifStickerControlTimers.get(stickerId);
  if (timer) {
    clearTimeout(timer);
    visibleGifStickerControlTimers.delete(stickerId);
  }
}

function showGifStickerControls(stickerId) {
  const stickerEl = document.querySelector(`.reaction-sticker[data-sticker-id="${stickerId}"]`);
  if (!stickerEl) return;

  const existingTimer = visibleGifStickerControlTimers.get(stickerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  stickerEl.classList.add("show-controls");
  const timer = window.setTimeout(() => hideGifStickerControls(stickerId), 2000);
  visibleGifStickerControlTimers.set(stickerId, timer);
}

function startWidgetDrag(event, widget, element) {
  if (
    isTabbedLayoutActive() ||
    window.matchMedia("(pointer: coarse), (max-width: 980px)").matches
  ) {
    return;
  }

  const zone = widget.side === "left" ? leftZone : rightZone;
  bringWidgetToFront(widget);
  element.style.zIndex = String(widget.zIndex);
  event.target?.setPointerCapture?.(event.pointerId);

  pendingWidgetDrag = {
    widget,
    element,
    zone,
    startX: event.clientX,
    startY: event.clientY,
    originX: parseFloat(element.style.left) || widget.x,
    originY: widget.y,
    pointerId: event.pointerId,
    latestClientX: event.clientX,
    latestClientY: event.clientY,
    frameId: null,
  };
}

function updateDraggedWidgetPosition() {
  if (!dragWidget) return;

  dragWidget.frameId = null;

  const { widget, zone, element, startX, startY, originX, originY, latestClientX, latestClientY } =
    dragWidget;

  const pageRect =
    document.querySelector(".page")?.getBoundingClientRect() ||
    document.documentElement.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const appZoom = getCurrentAppZoom();
  const toLayoutPx = (visualPx) => visualPx / appZoom;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth || pageRect.right;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight || pageRect.bottom;
  const widgetWidth = element.offsetWidth || 240;
  const widgetHeight = element.offsetHeight || 100;
  const nextX = originX + toLayoutPx(latestClientX - startX);
  const nextY = originY + toLayoutPx(latestClientY - startY);
  const gutter = 8;
  const midpoint = pageRect.left + pageRect.width / 2;
  const minX =
    widget.side === "left"
      ? toLayoutPx(0 - zoneRect.left) + gutter
      : toLayoutPx(midpoint - zoneRect.left) + gutter;
  const maxX =
    widget.side === "left"
      ? toLayoutPx(midpoint - zoneRect.left) - widgetWidth - gutter
      : toLayoutPx(viewportWidth - zoneRect.left) - widgetWidth - gutter;
  const minY = Math.max(toLayoutPx(0 - zoneRect.top) + gutter, 0);
  const maxY = Math.max(minY, toLayoutPx(viewportHeight - zoneRect.top) - widgetHeight - gutter);

  widget.x = Math.round(Math.max(minX, Math.min(maxX, nextX)));
  widget.y = Math.round(Math.max(minY, Math.min(maxY, nextY)));

  element.style.left = `${widget.x}px`;
  element.dataset.layoutX = String(widget.x);
  element.style.top = `${widget.y}px`;
}

function scheduleDraggedWidgetPositionUpdate() {
  if (!dragWidget || dragWidget.frameId) return;
  dragWidget.frameId = window.requestAnimationFrame(updateDraggedWidgetPosition);
}

window.addEventListener("pointermove", (event) => {
  if (draggingPlacedSticker) {
    event.preventDefault();
    const { element, layerRect, stickerId, sticker } = draggingPlacedSticker;
    const isGif = isGifSticker(sticker.sticker);
    const stickerSize = isGif ? getPlacedGifSize(stickerId) : 32;
    const stickerRadius = Math.max(16, stickerSize / 2);
    const nextXpx = Math.round(
      Math.max(
        stickerRadius,
        Math.min(layerRect.width - stickerRadius, event.clientX - layerRect.left),
      ),
    );
    const nextYpx = Math.round(
      Math.max(
        stickerRadius,
        Math.min(layerRect.height - stickerRadius, event.clientY - layerRect.top),
      ),
    );
    const nextX = Math.round((nextXpx / layerRect.width) * 100);
    const nextY = Math.round((nextYpx / layerRect.height) * 100);

    draggingPlacedSticker.nextX = nextX;
    draggingPlacedSticker.nextY = nextY;
    element.style.left = `${nextX}%`;
    element.style.top = `${nextY}%`;
    return;
  }

  if (!dragWidget && pendingWidgetDrag) {
    const dx = event.clientX - pendingWidgetDrag.startX;
    const dy = event.clientY - pendingWidgetDrag.startY;
    const distance = Math.hypot(dx, dy);

    if (distance > 6) {
      dragWidget = { ...pendingWidgetDrag };
      dragWidget.element.classList.add("dragging");
      document.body.classList.add("dragging-widget");
      pendingWidgetDrag = null;
    }
  }

  if (!dragWidget) return;

  dragWidget.latestClientX = event.clientX;
  dragWidget.latestClientY = event.clientY;
  scheduleDraggedWidgetPositionUpdate();
});

window.addEventListener("pointerup", async () => {
  if (draggingPlacedSticker) {
    const finishedStickerDrag = draggingPlacedSticker;
    draggingPlacedSticker = null;
    document.body.classList.remove("sticker-repositioning");

    finishedStickerDrag.element.classList.remove("is-dragging");

    if (
      Number.isFinite(finishedStickerDrag.nextX) &&
      Number.isFinite(finishedStickerDrag.nextY) &&
      (finishedStickerDrag.nextX !== finishedStickerDrag.sticker.x ||
        finishedStickerDrag.nextY !== finishedStickerDrag.sticker.y)
    ) {
      const didSave = await updatePlacedStickerPosition(
        finishedStickerDrag.stickerId,
        finishedStickerDrag.nextX,
        finishedStickerDrag.nextY,
      );

      if (didSave) {
        finishedStickerDrag.sticker.x = finishedStickerDrag.nextX;
        finishedStickerDrag.sticker.y = finishedStickerDrag.nextY;
      } else {
        renderPlacedStickers();
      }
    }

    return;
  }

  const finishedDrag = dragWidget;

  if (dragWidget?.frameId) {
    window.cancelAnimationFrame(dragWidget.frameId);
    dragWidget.frameId = null;
    updateDraggedWidgetPosition();
  }

  if (dragWidget?.element) {
    dragWidget.element.classList.remove("dragging");
  }

  document.body.classList.remove("dragging-widget");
  document.body.classList.remove("sticker-repositioning");

  dragWidget = null;
  pendingWidgetDrag = null;

  if (finishedDrag) {
    const positionChanged =
      finishedDrag.widget.x !== finishedDrag.originX ||
      finishedDrag.widget.y !== finishedDrag.originY;

    if (positionChanged) {
      const { widget } = finishedDrag;
      const liveWidget = widgets.find((item) => item.id === widget.id) || widget;
      liveWidget.x = widget.x;
      liveWidget.y = widget.y;
      void saveWidgetPosition(liveWidget);
      if (!finishedDrag.element.isConnected) renderWidgets({ animateMobileReorder: false });
    }
  }
});

window.addEventListener("pointercancel", () => {
  if (dragWidget?.frameId) {
    window.cancelAnimationFrame(dragWidget.frameId);
  }

  if (dragWidget?.element) {
    dragWidget.element.classList.remove("dragging");
  }

  dragWidget = null;
  pendingWidgetDrag = null;
  document.body.classList.remove("dragging-widget");

  if (draggingPlacedSticker?.element) {
    draggingPlacedSticker.element.classList.remove("is-dragging");
  }

  draggingPlacedSticker = null;
  document.body.classList.remove("sticker-repositioning");
});
if (stickerTabs) {
  stickerTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sticker-tab]");
    if (!button) return;
    switchStickerTab(button.dataset.stickerTab);
  });
}

if (gifSearchBtn) {
  gifSearchBtn.addEventListener("click", searchPublicGifs);
}

if (gifSearchInput) {
  gifSearchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchPublicGifs();
  });
}

if (stickerInput) {
  stickerInput.addEventListener("input", () => {
    renderTypedStickerPreview();
  });
}

if (typedStickerPreview) {
  typedStickerPreview.addEventListener("click", () => {
    const typedValue = String(stickerInput?.value || "").trim();
    if (!typedValue) return;
    if (stickerTargetPostId) {
      void placeStickerOnTargetPost(typedValue);
      return;
    }
    activeSticker = typedValue;
    activeStickerSize = null;
    typedStickerPreview.classList.add("is-active");
    showMessage("drag it onto a diary entry ♡");
  });

  typedStickerPreview.addEventListener("dragstart", (event) => {
    const typedValue = String(stickerInput?.value || "").trim();
    if (!typedValue) {
      event.preventDefault();
      return;
    }

    activeSticker = typedValue;
    activeStickerSize = null;
    requestAnimationFrame(() => {
      stickerPopup.classList.remove("open");
    });
    document.body.classList.add("sticker-dragging");

    if (event.dataTransfer) {
      event.dataTransfer.setData(STICKER_MIME_TYPE, typedValue);
      event.dataTransfer.setData("text/plain", typedValue);
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.dropEffect = "copy";
    }
  });

  typedStickerPreview.addEventListener("dragend", () => {
    endStickerDrag();
    typedStickerPreview.classList.remove("is-active");
  });
}

closeStickerPopup.addEventListener("click", () => {
  if (typedStickerPreview) {
    typedStickerPreview.classList.remove("is-active");
  }
  stickerPopup.classList.remove("open");
});

stickerPopup.addEventListener("click", (event) => {
  if (event.target === stickerPopup && !popupPointerStartedInsideCard) {
    if (typedStickerPreview) {
      typedStickerPreview.classList.remove("is-active");
    }
    stickerPopup.classList.remove("open");
  }
});

if (newEntryBtn) {
  newEntryBtn.addEventListener("click", () => {
    void openNewEntryComposer();
  });
}

timelineEl.addEventListener("dragstart", (event) => {
  const { target } = event;
  const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
  if (element?.closest(".post-text")) event.preventDefault();
});

closeEntryPopup.addEventListener("click", () => {
  dismissEntryPopup();
});

if (entryImageInput) {
  entryImageInput.addEventListener("change", async () => {
    const file = entryImageInput.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imageData = await compressImageFile(file, {
        maxSize: 1200,
        quality: 0.84,
      });
      renderEntryImagePreview(imageData);
    } catch (error) {
      console.error(error);
      showMessage(error.message || "could not load image ♡");
      entryImageInput.value = "";
      renderEntryImagePreview("");
    }
  });
}

if (removeEntryImageBtn) {
  removeEntryImageBtn.addEventListener("click", () => {
    openConfirmationDialog({
      title: "remove image?",
      message: "this image will be removed from the entry draft.",
      confirmLabel: "remove",
      pendingLabel: "removing...",
      onConfirm: () => {
        if (entryImageInput) {
          entryImageInput.value = "";
        }

        renderEntryImagePreview("");
        showMessage("image removed ♡");
      },
    });
  });
}

entryPopup.addEventListener("click", (event) => {
  if (event.target === entryPopup && !popupPointerStartedInsideCard) {
    dismissEntryPopup();
  }
});

entryPopup.addEventListener("popupclosed", () => resetEntryPopup({ keepDraft: false }));

closeCommentsPopup.addEventListener("click", () => {
  commentsPopup.classList.remove("open");
});

commentsPopup.addEventListener("click", (event) => {
  if (event.target === commentsPopup && !popupPointerStartedInsideCard) {
    commentsPopup.classList.remove("open");
  }
});

commentsPopup.addEventListener("popupclosed", clearEntryReplyTarget);

cancelDeleteEntryBtn?.addEventListener("click", closeDeleteEntryConfirmation);
confirmDeleteEntryBtn?.addEventListener("click", confirmDeleteEntry);
deleteEntryPopup?.addEventListener("click", (event) => {
  if (event.target === deleteEntryPopup) {
    closeDeleteEntryConfirmation();
  }
});

closeWidgetPopup.addEventListener("click", () => {
  widgetPopup.classList.remove("open");
});

widgetPopup.addEventListener("popupclosed", () => {
  activePhotoEditor?.destroy();
  activePhotoEditor = null;
  widgetPopup.classList.remove("together-widget-popup");
  widgetPopupCard?.classList.remove("photo-history-popup-card");
  saveWidgetBtn.style.display = "inline-flex";
  setHeaderWidgetSaveVisibility(false);
  if (clearWidgetHistoryBtn) {
    clearWidgetHistoryBtn.style.display = "none";
    delete clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode;
  }
});

widgetCommentsPopup?.addEventListener("popupclosed", () => {
  if (widgetCommentsPopupFields) widgetCommentsPopupFields.innerHTML = "";
});

profilePopup?.addEventListener("popupclosed", () => setProfilePopupEditMode(false));

widgetPopup.addEventListener("click", (event) => {
  if (event.target === widgetPopup && !popupPointerStartedInsideCard) {
    widgetPopup.classList.remove("open");
  }
});

widgetPopup.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

widgetPopup.addEventListener("mousedown", (event) => {
  event.stopPropagation();
});

closeWidgetCommentsPopup?.addEventListener("click", closeWidgetComments);

widgetCommentsPopup?.addEventListener("click", (event) => {
  if (event.target === widgetCommentsPopup && !popupPointerStartedInsideCard) {
    closeWidgetComments();
  }
});

widgetCommentsPopup?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

widgetCommentsPopup?.addEventListener("mousedown", (event) => {
  event.stopPropagation();
});

saveWidgetBtn.addEventListener("click", saveWidgetChanges);
if (headerSaveWidgetBtn) {
  headerSaveWidgetBtn.addEventListener("click", saveWidgetChanges);
}
if (clearWidgetHistoryBtn) {
  clearWidgetHistoryBtn.addEventListener("click", () => {
    const widgetId = clearWidgetHistoryBtn.dataset.clearWidgetHistoryId;
    const historyMode = clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode;
    const widget = widgets.find((item) => item.id === widgetId);
    if (!widget) return;

    openConfirmationDialog({
      title: "clear history?",
      message:
        historyMode === "photo-combined"
          ? "history for both keepsake widgets will be cleared."
          : `${widget.title} history will be cleared.`,
      confirmLabel: "clear",
      pendingLabel: "clearing...",
      onConfirm: async () => {
        const clearedWidgets =
          historyMode === "photo-combined" ? getAllKeepsakeWidgets() : [widget];
        clearedWidgets.forEach((item) => {
          clearWidgetHistory(item.id);
          queueWidgetSave(item, { recordHistory: false });
        });

        openWidgetHistory(widget.id);
        showMessage("history cleared ♡");
      },
    });
  });
}

const authPopup = document.getElementById("authPopup");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const passwordToggleBtn = document.getElementById("passwordToggleBtn");
const loginBtn = document.getElementById("loginBtn");
const profileBtn = document.getElementById("profileBtn");
const profilePopup = document.getElementById("profilePopup");
const closeProfilePopup = document.getElementById("closeProfilePopup");
const profileSummaryAvatar = document.getElementById("profileSummaryAvatar");
const profileSummaryName = document.getElementById("profileSummaryName");
const profileSummaryHandle = document.getElementById("profileSummaryHandle");
const profileSummaryJoined = document.getElementById("profileSummaryJoined");
const profileSummaryBio = document.getElementById("profileSummaryBio");
const profilePostsStat = document.getElementById("profilePostsStat");
const profileLikesStat = document.getElementById("profileLikesStat");
const profileThinkingOfYouStat = document.getElementById("profileThinkingOfYouStat");
const profileThinkingOfYouStatLabel = document.getElementById("profileThinkingOfYouStatLabel");
const profileJoinedStat = document.getElementById("profileJoinedStat");
const profileJoinedStatLabel = document.getElementById("profileJoinedStatLabel");
const profileEditSection = document.getElementById("profileEditSection");
const editProfileBtn = document.getElementById("editProfileBtn");
const cancelProfileEditBtn = document.getElementById("cancelProfileEditBtn");
const nicknameInput = document.getElementById("nicknameInput");
const bioInput = document.getElementById("bioInput");
const pfpInput = document.getElementById("pfpInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const messageBox = document.getElementById("messageBox");
const logoutBtn = document.getElementById("logoutBtn");

let currentProfile = null;

function showMessage(text) {
  if (isAuthExpiredError(String(text || ""))) {
    void handleExpiredSession();
    text = "reconnecting... ♡";
  }

  if (!messageBox) {
    alert(text);
    return;
  }

  messageBox.textContent = text;
  messageBox.classList.add("show");

  clearTimeout(showMessage.timeout);
  showMessage.timeout = setTimeout(() => {
    messageBox.classList.remove("show");
  }, 2200);
}

function getEditedPostIds() {
  try {
    const raw = localStorage.getItem("editedPostIds");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function markPostAsEdited(postId) {
  try {
    const ids = new Set(getEditedPostIds());
    ids.add(postId);
    localStorage.setItem("editedPostIds", JSON.stringify([...ids]));
    markCloudPrefChanged("editedPostIds");
  } catch (error) {
    console.error(error);
  }
}

function unmarkPostAsEdited(postId) {
  try {
    const ids = getEditedPostIds().filter((id) => id !== postId);
    localStorage.setItem("editedPostIds", JSON.stringify(ids));
    markCloudPrefChanged("editedPostIds");
  } catch (error) {
    console.error(error);
  }
}

function getWidgetHistoryEntries(widgetId) {
  try {
    const widget =
      typeof widgetId === "object" && widgetId
        ? widgetId
        : widgets.find((item) => item.id === widgetId);
    const sharedHistory = Array.isArray(widget?.data?.history) ? widget.data.history : [];

    return [...sharedHistory]
      .filter((entry) => entry && typeof entry === "object")
      .filter(
        (entry, index, entries) =>
          entries.findIndex(
            (candidate) =>
              candidate?.savedAt === entry?.savedAt &&
              candidate?.summary === entry?.summary &&
              candidate?.title === entry?.title &&
              candidate?.actorId === entry?.actorId,
          ) === index,
      )
      .sort((a, b) => new Date(b?.savedAt || 0).getTime() - new Date(a?.savedAt || 0).getTime());
  } catch (error) {
    return [];
  }
}

function createWidgetHistoryEntryId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `widget-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSameWidgetHistoryEntry(entry, targetEntry) {
  const entryId = String(entry?.id || "").trim();
  const targetId = String(targetEntry?.id || "").trim();

  if (entryId && targetId) {
    return entryId === targetId;
  }

  return (
    String(entry?.savedAt || "") === String(targetEntry?.savedAt || "") &&
    String(entry?.summary || "") === String(targetEntry?.summary || "") &&
    String(entry?.title || "") === String(targetEntry?.title || "") &&
    String(entry?.actorId || "") === String(targetEntry?.actorId || "")
  );
}

function serializeWidgetHistoryEntryTarget(entry) {
  try {
    return encodeURIComponent(
      JSON.stringify({
        id: String(entry?.id || "").trim(),
        savedAt: String(entry?.savedAt || ""),
        summary: String(entry?.summary || ""),
        title: String(entry?.title || ""),
        actorId: String(entry?.actorId || ""),
      }),
    );
  } catch (error) {
    console.error(error);
    return "";
  }
}

function parseWidgetHistoryEntryTarget(serializedEntry) {
  try {
    return JSON.parse(decodeURIComponent(String(serializedEntry || "")));
  } catch (error) {
    console.error(error);
    return null;
  }
}

function removeWidgetHistoryEntry(widgetId, targetEntry) {
  if (!widgetId || !targetEntry) return false;

  let removed = false;
  const widget = widgets.find((item) => item.id === widgetId);

  if (widget?.data && typeof widget.data === "object") {
    const currentHistory = Array.isArray(widget.data.history) ? widget.data.history : [];
    const nextHistory = currentHistory.filter((entry) => {
      const shouldKeep = !isSameWidgetHistoryEntry(entry, targetEntry);
      removed = removed || !shouldKeep;
      return shouldKeep;
    });

    widget.data = {
      ...widget.data,
      history: nextHistory,
    };
  }

  try {
    const storageKey = `widgetHistory:${widgetId}`;
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed)) {
      const nextStoredHistory = parsed.filter((entry) => {
        const shouldKeep = !isSameWidgetHistoryEntry(entry, targetEntry);
        removed = removed || !shouldKeep;
        return shouldKeep;
      });

      localStorage.setItem(storageKey, JSON.stringify(nextStoredHistory));
    }
  } catch (error) {
    console.error(error);
  }

  return removed;
}

function isKeepsakeWidget(widget) {
  const normalizedId = String(widget?.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget?.title || "").toLowerCase();

  return normalizedId.startsWith("keepsake") || normalizedTitle.includes("keepsake");
}

function getAllKeepsakeWidgets() {
  return widgets.filter((widget) => isKeepsakeWidget(widget));
}

function getWidgetHistoryActorName(entry) {
  const actorId = String(entry?.actorId || "").trim();
  if (actorId) {
    if (currentProfile?.id === actorId) {
      return getProfileDisplayName(currentProfile, "you");
    }

    const matchingProfile = knownProfiles.find((profile) => profile?.id === actorId);
    if (matchingProfile) {
      return getProfileDisplayName(matchingProfile, "someone");
    }
  }

  const savedName = String(entry?.actorName || "").trim();
  if (savedName) return savedName;

  if (!actorId) {
    return "someone";
  }

  return "someone";
}

function getPhotoHistoryEntries(widget) {
  if (!widget?.data || typeof widget.data !== "object") {
    return [];
  }

  const entries = Array.isArray(widget.data.photoHistory) ? widget.data.photoHistory : [];
  return entries.map((entry) => ({
    ...entry,
    sourceWidgetId: entry?.sourceWidgetId || widget.id,
    sourceWidgetTitle: entry?.sourceWidgetTitle || widget.title || "",
  }));
}

function createPhotoWidgetCommentId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `photo-widget-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getWidgetCommentLikeUserIds(comment) {
  const rawLikes = Array.isArray(comment?.likes)
    ? comment.likes
    : Array.isArray(comment?.likedUserIds)
      ? comment.likedUserIds
      : [];

  return [...new Set(rawLikes.map((userId) => String(userId || "").trim()).filter(Boolean))];
}

function getWidgetCommentLikeTimestamps(comment) {
  return comment?.likeTimestamps && typeof comment.likeTimestamps === "object"
    ? comment.likeTimestamps
    : {};
}

function normalizeWidgetCommentLikeData(comment) {
  const likes = getWidgetCommentLikeUserIds(comment);
  const likeSet = new Set(likes);
  const rawTimestamps = getWidgetCommentLikeTimestamps(comment);
  const likeTimestamps = {};

  Object.entries(rawTimestamps).forEach(([userId, timestamp]) => {
    const normalizedUserId = String(userId || "").trim();
    const normalizedTimestamp = String(timestamp || "").trim();
    if (normalizedUserId && normalizedTimestamp && likeSet.has(normalizedUserId)) {
      likeTimestamps[normalizedUserId] = normalizedTimestamp;
    }
  });

  return { likes, likeTimestamps };
}

function normalizePhotoWidgetCommentRecord(comment, widget, index = 0) {
  const id =
    String(comment?.id || "").trim() || `photo-widget-comment-${widget?.id || "widget"}-${index}`;
  const replies = Array.isArray(comment?.replies)
    ? comment.replies
        .filter((reply) => reply && typeof reply === "object")
        .map((reply, replyIndex) => ({
          id: String(reply.id || "").trim() || `${id}-reply-${replyIndex}`,
          userId: String(reply.userId || reply.user_id || "").trim(),
          actorName: String(reply.actorName || reply.nickname || reply.author || "").trim(),
          text: String(reply.text || reply.content || "").trim(),
          createdAt: String(reply.createdAt || reply.created_at || "").trim(),
          ...normalizeWidgetCommentLikeData(reply),
        }))
        .filter((reply) => reply.text)
        .sort(compareCommentsNewestFirst)
    : [];

  return {
    id,
    userId: String(comment?.userId || comment?.user_id || "").trim(),
    actorName: String(comment?.actorName || comment?.nickname || comment?.author || "").trim(),
    text: String(comment?.text || comment?.content || "").trim(),
    createdAt: String(comment?.createdAt || comment?.created_at || "").trim(),
    preview: getWidgetCommentPreviewData(comment),
    ...normalizeWidgetCommentLikeData(comment),
    replies,
  };
}

function getPhotoWidgetComments(widget) {
  if (!widget?.data || typeof widget.data !== "object") {
    return [];
  }

  const rawComments = Array.isArray(widget.data.comments)
    ? widget.data.comments
    : Array.isArray(widget.data.photoComments)
      ? widget.data.photoComments
      : [];

  return rawComments
    .filter((comment) => comment && typeof comment === "object")
    .map((comment, index) => normalizePhotoWidgetCommentRecord(comment, widget, index))
    .filter((comment) => comment.text)
    .sort(compareCommentsNewestFirst);
}

function normalizePhotoWidgetComments(widget) {
  if (!widget?.data || typeof widget.data !== "object") {
    return false;
  }

  const normalizedComments = getPhotoWidgetComments(widget);
  const existingComments = Array.isArray(widget.data.comments) ? widget.data.comments : [];
  const hadLegacyCommentsKey = Object.prototype.hasOwnProperty.call(widget.data, "photoComments");
  const alreadyNormalized =
    Array.isArray(widget.data.comments) &&
    existingComments.length === normalizedComments.length &&
    existingComments.every((comment, index) => {
      const normalizedComment = normalizedComments[index];
      return (
        String(comment?.id || "").trim() === normalizedComment.id &&
        String(comment?.userId || "").trim() === normalizedComment.userId &&
        String(comment?.actorName || "").trim() === normalizedComment.actorName &&
        String(comment?.text || "").trim() === normalizedComment.text &&
        String(comment?.createdAt || "").trim() === normalizedComment.createdAt &&
        JSON.stringify(getWidgetCommentLikeUserIds(comment)) ===
          JSON.stringify(normalizedComment.likes) &&
        JSON.stringify(getWidgetCommentLikeTimestamps(comment)) ===
          JSON.stringify(normalizedComment.likeTimestamps) &&
        JSON.stringify(Array.isArray(comment?.replies) ? comment.replies : []) ===
          JSON.stringify(normalizedComment.replies) &&
        JSON.stringify(getWidgetCommentPreviewData(comment)) ===
          JSON.stringify(normalizedComment.preview)
      );
    });

  if (alreadyNormalized && !hadLegacyCommentsKey) {
    return false;
  }

  widget.data = {
    ...widget.data,
    comments: normalizedComments,
  };
  delete widget.data.photoComments;
  return true;
}

function getPhotoWidgetCommentSectionIds(prefix) {
  return {
    labelId: `${prefix}Label`,
    listId: `${prefix}List`,
    inputId: `${prefix}Input`,
    buttonId: `${prefix}Button`,
    ownerNoteId: `${prefix}OwnerNote`,
  };
}

function getWidgetCommentDomPrefix(widget) {
  const normalizedId = String(widget?.id || "widget")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `widget-comments-popup-${normalizedId || "widget"}`;
}

function canReplyToPhotoWidgetComment(comment) {
  return Boolean(comment?.id && (currentProfile?.id || currentUser?.id));
}

function getPhotoWidgetCommentPreviewData(source) {
  const previewSource =
    source?.preview && typeof source.preview === "object" ? source.preview : source;
  return {
    kind: "photo",
    image: String(previewSource?.image || "").trim(),
    text: String(previewSource?.text || ""),
    textColor: normalizeHexColor(previewSource?.textColor, "#ffffff"),
    textSize: Math.max(12, Math.min(46, Number(previewSource?.textSize) || 22)),
    textX: Math.max(0, Math.min(100, Number(previewSource?.textX) || 50)),
    textY: Math.max(0, Math.min(100, Number(previewSource?.textY) || 86)),
    rotate: Number(previewSource?.rotate) || 0,
    textFont: normalizePhotoTextFont(previewSource?.textFont),
    textEffect: normalizePhotoTextEffect(previewSource?.textEffect),
  };
}

function getSongWidgetCommentPreviewData(source) {
  const previewSource =
    source?.preview && typeof source.preview === "object" ? source.preview : source;
  return {
    kind: "song",
    spotifyUrl: String(previewSource?.spotifyUrl || "").trim(),
    coverUrl: String(previewSource?.coverUrl || "").trim(),
    songName: String(previewSource?.songName || "").trim(),
    durationLabel: String(previewSource?.durationLabel || "").trim(),
    caption: String(previewSource?.caption || "").trim(),
    accent: Math.max(6, Math.min(94, Number(previewSource?.accent) || 38)),
  };
}

function getNoteWidgetCommentPreviewData(source) {
  const previewSource =
    source?.preview && typeof source.preview === "object" ? source.preview : source;
  return {
    kind: "note",
    text: String(previewSource?.text || "").trim(),
  };
}

function getWidgetCommentPreviewData(source) {
  const previewSource =
    source?.preview && typeof source.preview === "object" ? source.preview : source;
  const previewKind = String(previewSource?.kind || "")
    .trim()
    .toLowerCase();

  if (previewKind === "note") {
    return getNoteWidgetCommentPreviewData(source);
  }

  if (previewKind === "song") {
    return getSongWidgetCommentPreviewData(source);
  }

  if (
    previewKind === "photo" ||
    previewSource?.image ||
    previewSource?.textColor ||
    previewSource?.textSize ||
    previewSource?.textX ||
    previewSource?.textY ||
    previewSource?.rotate
  ) {
    return getPhotoWidgetCommentPreviewData(source);
  }

  if (previewSource?.coverUrl || previewSource?.songName || previewSource?.caption) {
    return getSongWidgetCommentPreviewData(source);
  }

  return getPhotoWidgetCommentPreviewData(source);
}

function getPhotoWidgetCommentPreviewMarkup(source, options = {}) {
  const { showLabel = false, compact = false } = options;
  const preview = getPhotoWidgetCommentPreviewData(source);
  const image = preview.image;
  const overlayText = escapeHtml(preview.text || "");
  const textColor = escapeHtml(normalizeHexColor(preview.textColor, "#ffffff"));
  const textSize = Math.max(12, Math.min(46, Number(preview.textSize) || 22));
  const textXValue = Number(preview.textX);
  const textYValue = Number(preview.textY);
  const textX = Math.max(0, Math.min(100, Number.isFinite(textXValue) ? textXValue : 50));
  const textY = Math.max(0, Math.min(100, Number.isFinite(textYValue) ? textYValue : 86));
  const rotate = Number(preview.rotate) || 0;

  return `
    <div class="photo-widget-comment-preview-card${compact ? " is-inline" : ""}" aria-label="keepsake preview">
      <div class="photo-widget-comment-preview-frame">
        ${
          image
            ? `
          <img
            class="photo-widget-comment-preview-image"
            src="${escapeHtml(image)}"
            alt="keepsake preview"
            style="transform:rotate(${rotate}deg);"
            loading="eager"
            decoding="sync"
          />
          ${
            overlayText
              ? `<div class="photo-widget-comment-preview-text ${getPhotoTextClasses(preview)}" style="left:${textX}%;top:${textY}%;color:${textColor};--photo-text-size:${textSize};--photo-text-translate-x:-${textX}%;--photo-text-translate-y:-${textY}%;">${overlayText}</div>`
              : ""
          }
        `
            : `<div class="photo-widget-comment-preview-empty">no keepsake yet ♡</div>`
        }
      </div>
      ${
        showLabel
          ? '<div class="photo-widget-comment-preview-label">the pin you\'re commenting on ♡</div>'
          : ""
      }
    </div>
  `;
}

function getSongWidgetCommentPreviewMarkup(source, options = {}) {
  const { showLabel = false, compact = false } = options;
  const preview = getSongWidgetCommentPreviewData(source);
  const coverUrl = String(preview.coverUrl || "").trim();
  const spotifyUrl = getSafeLinkUrl(preview.spotifyUrl);
  const songName = escapeHtml(preview.songName || "saved song ♡");
  const caption = escapeHtml(preview.caption || preview.durationLabel || "");
  const accent = Math.max(6, Math.min(94, Number(preview.accent) || 38));

  if (!compact) {
    return `
      <div class="song-widget-comment-preview-card is-full" aria-label="song preview">
        <div class="song-widget-card">
          ${
            coverUrl
              ? `<img class="song-widget-cover" src="${escapeHtml(coverUrl)}" alt="Spotify cover art" loading="eager" decoding="sync" />`
              : '<div class="song-widget-art-placeholder">paste a Spotify track link to fill this card ♡</div>'
          }
          <div class="song-widget-meta">
            <div class="song-widget-name">${songName}</div>
            <div class="song-widget-time">${caption || "--:--"}</div>
          </div>
          <div class="song-widget-progress" aria-hidden="true">
            <span style="width:${accent}%"></span>
          </div>
          <div class="song-widget-controls" aria-hidden="true">
            <span class="song-widget-skip">⏮&#xFE0E;</span>
            <span class="song-widget-play"><span class="song-widget-pause-icon"></span></span>
            <span class="song-widget-skip">⏭&#xFE0E;</span>
          </div>
          <div class="song-widget-volume" aria-hidden="true">
            <span class="song-widget-volume-icon">♪</span>
            <div class="song-widget-volume-bar"><span style="width:68%"></span></div>
          </div>
          ${
            spotifyUrl
              ? `<a class="song-widget-link" href="${escapeHtml(spotifyUrl)}" target="_blank" rel="noreferrer noopener">open in spotify</a>`
              : ""
          }
        </div>
        ${
          showLabel
            ? '<div class="photo-widget-comment-preview-label">the song you\'re commenting on ♡</div>'
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="song-widget-comment-preview-card${compact ? " is-inline" : ""}" aria-label="song preview">
      <div class="song-widget-comment-preview-meta">
        <div class="song-widget-comment-preview-title">${songName}</div>
        ${caption ? `<div class="song-widget-comment-preview-caption">${caption}</div>` : ""}
      </div>
      ${
        showLabel
          ? '<div class="photo-widget-comment-preview-label">the song you\'re commenting on ♡</div>'
          : ""
      }
    </div>
  `;
}

function getNoteWidgetCommentPreviewMarkup(source, options = {}) {
  const { showLabel = false, compact = false } = options;
  const preview = getNoteWidgetCommentPreviewData(source);
  const noteText = escapeHtml(preview.text || "no note yet ♡");

  return `
    <div class="note-widget-comment-preview-card${compact ? " is-inline" : " is-full"}" aria-label="quick note preview">
      <div class="note-widget-comment-preview-text">${noteText}</div>
      ${
        showLabel
          ? '<div class="photo-widget-comment-preview-label">the quick note you\'re commenting on ♡</div>'
          : ""
      }
    </div>
  `;
}

function getWidgetCommentPreviewMarkup(source, options = {}) {
  const preview = getWidgetCommentPreviewData(source);
  if (preview.kind === "note") {
    return getNoteWidgetCommentPreviewMarkup(preview, options);
  }

  if (preview.kind === "song") {
    return getSongWidgetCommentPreviewMarkup(preview, options);
  }

  return getPhotoWidgetCommentPreviewMarkup(preview, options);
}

function getWidgetCommentPreviewSnapshot(widget) {
  const normalizedId = String(widget?.id || "")
    .toLowerCase()
    .trim();

  if (normalizedId === "song") {
    const songData = widget?.data && typeof widget.data === "object" ? widget.data : {};
    return {
      kind: "song",
      spotifyUrl: String(songData.spotifyUrl || "").trim(),
      coverUrl: String(songData.coverUrl || "").trim(),
      songName: String(songData.songName || "").trim(),
      durationLabel: String(songData.durationLabel || "").trim(),
      caption: String(songData.durationLabel || "").trim(),
      accent: Math.max(6, Math.min(94, Number(songData.accent) || 38)),
    };
  }

  if (
    normalizedId === "note" ||
    String(widget?.title || "")
      .toLowerCase()
      .includes("quick note") ||
    String(widget?.title || "")
      .toLowerCase()
      .includes("quick note")
  ) {
    return {
      kind: "note",
      text: String(widget?.data?.text || "").trim(),
    };
  }

  return getPhotoWidgetCommentPreviewData(widget?.data || {});
}

function getPhotoWidgetCommentSectionMarkup(widget, options = {}) {
  const { prefix = `photo-widget-comments-${widget?.id || "widget"}`, title = "comments" } =
    options;
  const comments = getCommentsNewestFirst(getPhotoWidgetComments(widget));
  const ids = getPhotoWidgetCommentSectionIds(prefix);
  const commentCount = comments.reduce(
    (total, comment) => total + 1 + (comment.replies || []).length,
    0,
  );
  const countLabel = commentCount ? ` (${commentCount})` : "";

  return `
    <section class="photo-widget-comments-section">
      <label
        class="popup-label photo-widget-comments-label"
        id="${escapeHtml(ids.labelId)}"
        for="${escapeHtml(ids.inputId)}"
      >
        ${escapeHtml(title)}${countLabel}
      </label>
      <div
        class="photo-widget-comments-list"
        id="${escapeHtml(ids.listId)}"
      ></div>
        <div class="comment-context" id="${escapeHtml(ids.inputId)}-context" hidden></div>
        <textarea
          class="popup-input photo-widget-comment-input"
          id="${escapeHtml(ids.inputId)}"
          rows="3"
          maxlength="240"
        ></textarea>
        <div
          class="photo-widget-owner-comment-note"
          id="${escapeHtml(ids.ownerNoteId)}"
          hidden
        ></div>
        <div class="popup-actions photo-widget-comments-actions">
          <button
            class="soft-btn"
            id="${escapeHtml(ids.buttonId)}"
            type="button"
          >
            post comment
          </button>
        </div>
    </section>
  `;
}

function getPhotoWidgetReplyTarget(widget, prefix) {
  const parentId = activePhotoWidgetReplyTargets.get(prefix) || "";
  if (!parentId) return null;
  const parent = getPhotoWidgetComments(widget).find((comment) => comment.id === parentId);
  if (!parent) return null;
  const itemId = activePhotoWidgetReplyItems.get(prefix) || parentId;
  return (parent.replies || []).find((reply) => reply.id === itemId) || parent;
}

function getPhotoWidgetCommentName(comment) {
  return (
    comment?.actorName || getProfileDisplayName(getKnownProfileById(comment?.userId), "someone")
  );
}

function clearPhotoWidgetReplyTarget(widget, options = {}) {
  const { prefix = `photo-widget-comments-${widget?.id || "widget"}` } = options;
  const input = document.getElementById(getPhotoWidgetCommentSectionIds(prefix).inputId);
  const target = getPhotoWidgetReplyTarget(widget, prefix);
  if (target && input?.value.trim() === `@${getPhotoWidgetCommentName(target)}`) {
    input.value = "";
  }
  activePhotoWidgetReplyTargets.delete(prefix);
  activePhotoWidgetReplyItems.delete(prefix);
}

function getWidgetCommentContext(widget, replyTarget, onCancel) {
  if (replyTarget) {
    return {
      label: `replying to ${getPhotoWidgetCommentName(replyTarget)}`,
      text: replyTarget.text,
      onCancel,
    };
  }
  const snapshot = getWidgetCommentPreviewSnapshot(widget);
  if (snapshot?.kind === "song") {
    return {
      label: snapshot.caption || "commenting on on repeat",
      text: snapshot.songName,
      imageUrl: snapshot.coverUrl,
    };
  }
  if (snapshot?.kind === "note") {
    return { label: "commenting on the quick note", text: snapshot.text };
  }
  return {
    label: "commenting on the keepsake",
    text: snapshot?.text || "",
    imageUrl: snapshot?.image || widget?.data?.image || "",
  };
}

function syncPhotoWidgetCommentComposer(widget, options = {}) {
  const { prefix = `photo-widget-comments-${widget?.id || "widget"}` } = options;
  const ids = getPhotoWidgetCommentSectionIds(prefix);
  const input = document.getElementById(ids.inputId);
  const saveBtn = document.getElementById(ids.buttonId);
  const ownerNoteEl = document.getElementById(ids.ownerNoteId);
  if (!input || !saveBtn) return;

  const replyTarget = getPhotoWidgetReplyTarget(widget, prefix);
  if (!replyTarget) {
    activePhotoWidgetReplyTargets.delete(prefix);
    activePhotoWidgetReplyItems.delete(prefix);
  }

  input.disabled = false;
  saveBtn.disabled = false;
  saveBtn.textContent = replyTarget ? "post reply" : "post comment";
  input.placeholder = replyTarget
    ? `reply to ${getPhotoWidgetCommentName(replyTarget)} ♡`
    : "write a comment ♡";
  renderCommentContext(
    document.getElementById(`${ids.inputId}-context`),
    getWidgetCommentContext(widget, replyTarget, () => {
      clearPhotoWidgetReplyTarget(widget, options);
      syncPhotoWidgetCommentComposer(widget, options);
      input.focus();
    }),
  );

  if (ownerNoteEl) {
    ownerNoteEl.hidden = true;
    ownerNoteEl.textContent = "";
  }
}

function renderPhotoWidgetCommentsSection(widget, options = {}) {
  const { prefix = `photo-widget-comments-${widget?.id || "widget"}`, title = "comments" } =
    options;
  const ids = getPhotoWidgetCommentSectionIds(prefix);
  const listEl = document.getElementById(ids.listId);
  const labelEl = document.getElementById(ids.labelId);
  if (!listEl) return;

  const comments = getPhotoWidgetComments(widget);
  if (labelEl) {
    const commentCount = comments.reduce(
      (total, comment) => total + 1 + (comment.replies || []).length,
      0,
    );
    labelEl.textContent = `${title}${commentCount ? ` (${commentCount})` : ""}`;
  }

  syncPhotoWidgetCommentComposer(widget, options);

  if (!comments.length) {
    listEl.innerHTML = `<div class="comment-empty">no comments yet ♡</div>`;
    return;
  }

  const sortedComments = getCommentsNewestFirst(comments);
  const currentUserId = currentProfile?.id || currentUser?.id || "";
  const toRowItem = (comment, parentId, isReply) => {
    const likes = getWidgetCommentLikeUserIds(comment);
    let attachmentHtml = "";
    if (!isReply) {
      const preview = getWidgetCommentPreviewData(comment);
      const hasPreview =
        preview.kind === "song"
          ? Boolean(
              preview.coverUrl || preview.songName || preview.durationLabel || preview.caption,
            )
          : preview.kind === "note"
            ? Boolean(preview.text)
            : Boolean(preview.image || preview.text);
      attachmentHtml = hasPreview ? getWidgetCommentPreviewMarkup(comment, { compact: true }) : "";
    }
    return {
      id: comment.id,
      parentId,
      userId: comment.userId || "",
      name: getPhotoWidgetCommentName(comment),
      createdAt: comment.createdAt,
      liked: Boolean(currentUserId && likes.includes(currentUserId)),
      likeCount: likes.length,
      canReply: canReplyToPhotoWidgetComment(comment),
      canDelete: Boolean(comment.userId && comment.userId === currentUserId),
      isReply,
      attachmentHtml,
    };
  };

  listEl.innerHTML = sortedComments
    .map((comment) =>
      getCommentThreadMarkup(
        "widget",
        toRowItem(comment, comment.id, false),
        getCommentsNewestFirst(comment.replies)
          .reverse()
          .map((reply) => toRowItem(reply, comment.id, true)),
      ),
    )
    .join("");

  sortedComments
    .flatMap((comment) => [comment, ...(comment.replies || [])])
    .forEach((item) => {
      const textEl = listEl.querySelector(
        `[data-photo-widget-comment-text-id="${CSS.escape(item.id)}"]`,
      );
      if (!textEl) return;
      renderTextWithLinkPreviews(
        textEl,
        listEl.querySelector(`[data-photo-widget-comment-preview-id="${CSS.escape(item.id)}"]`),
        item.text,
      );
      highlightCommentMention(textEl);
    });

  bindCommentThreadToggles(listEl);

  listEl.querySelectorAll("[data-photo-widget-reply-comment-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const parentId = String(button.dataset.photoWidgetReplyCommentId || "").trim();
      if (!parentId) return;
      const itemId = button.dataset.replyToId || parentId;

      activePhotoWidgetReplyTargets.set(prefix, parentId);
      activePhotoWidgetReplyItems.set(prefix, itemId);
      syncPhotoWidgetCommentComposer(widget, options);

      const target = getPhotoWidgetReplyTarget(widget, prefix);
      prefillReplyMention(
        document.getElementById(ids.inputId),
        getPhotoWidgetCommentName(target),
        itemId !== parentId,
        Boolean(target?.userId && target.userId === currentUserId),
      );
    });
  });

  listEl.querySelectorAll("[data-photo-widget-like-comment-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await togglePhotoWidgetCommentLike(
        widget.id,
        button.dataset.photoWidgetLikeCommentId,
        options,
      );
    });
  });

  listEl.querySelectorAll("[data-photo-widget-delete-comment-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openDeletePhotoWidgetCommentConfirmation(
        widget.id,
        button.dataset.photoWidgetDeleteCommentId,
        options,
        button.dataset.isReply === "true",
      );
    });
  });

  listEl.querySelectorAll("[data-photo-widget-comment-profile-id]").forEach((nameEl) => {
    const profileId = String(
      nameEl.getAttribute("data-photo-widget-comment-profile-id") || "",
    ).trim();
    const fallbackProfile = {
      id: profileId,
      nickname: nameEl.dataset.profileName || "someone",
    };
    bindProfilePopupTrigger(nameEl, () => openProfilePopupForUser(profileId, fallbackProfile));
  });
}

function bindPhotoWidgetCommentSection(widget, options = {}) {
  const { prefix = `photo-widget-comments-${widget?.id || "widget"}` } = options;
  const ids = getPhotoWidgetCommentSectionIds(prefix);

  renderPhotoWidgetCommentsSection(widget, options);

  const saveBtn = document.getElementById(ids.buttonId);
  const input = document.getElementById(ids.inputId);

  saveBtn?.addEventListener("click", async () => {
    await savePhotoWidgetComment(widget.id, options);
  });

  input?.addEventListener("keydown", async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      await savePhotoWidgetComment(widget.id, options);
    }
  });
}

async function savePhotoWidgetComment(widgetId, options = {}) {
  const widget = widgets.find((item) => item.id === widgetId);
  if (!widget) return;

  const { prefix = `photo-widget-comments-${widget.id}` } = options;
  const ids = getPhotoWidgetCommentSectionIds(prefix);
  const input = document.getElementById(ids.inputId);
  const content = String(input?.value || "").trim();

  if (!content) {
    showMessage("write something first ♡");
    return;
  }

  if (!areBreakupWordsAllowed(content)) {
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    showMessage("please log in first ♡");
    return;
  }

  normalizePhotoWidgetComments(widget);
  const previousComments = getPhotoWidgetComments(widget);
  const replyTargetId = activePhotoWidgetReplyTargets.get(prefix) || "";
  const replyTarget = previousComments.find((comment) => comment.id === replyTargetId);
  const replyTargetExists = Boolean(replyTarget);

  if (replyTargetExists && !canReplyToPhotoWidgetComment(replyTarget)) {
    showMessage("could not reply to this comment ♡");
    return;
  }

  const nextComment = {
    id: createPhotoWidgetCommentId(),
    userId: user.id,
    actorName: getProfileDisplayName(currentProfile, "someone"),
    text: content,
    createdAt: new Date().toISOString(),
  };
  const nextComments = replyTargetExists
    ? previousComments.map((comment) =>
        comment.id === replyTargetId
          ? {
              ...comment,
              replies: getCommentsNewestFirst([...(comment.replies || []), nextComment]).slice(
                0,
                40,
              ),
            }
          : comment,
      )
    : getCommentsNewestFirst([
        ...previousComments,
        {
          ...nextComment,
          preview: getWidgetCommentPreviewSnapshot(widget),
          replies: [],
        },
      ]).slice(0, 60);

  widget.data = {
    ...(widget.data && typeof widget.data === "object" ? widget.data : {}),
    comments: nextComments,
  };

  if (input) {
    input.value = "";
  }
  if (replyTargetExists) {
    activePhotoWidgetReplyTargets.delete(prefix);
    activePhotoWidgetReplyItems.delete(prefix);
    expandedCommentThreads.add(replyTargetId);
  }
  renderPhotoWidgetCommentsSection(widget, options);
  revealCommentRow(
    document.getElementById(ids.listId),
    `[data-photo-widget-comment-row-id="${CSS.escape(nextComment.id)}"]`,
    { highlight: false },
  );
  syncWidgetCommentButton(widget.id);
  queueWidgetSave(widget, { changedKeys: ["comments"], recordHistory: false });
  showMessage(replyTargetExists ? "reply posted! ♡" : "comment posted! ♡");
}

async function togglePhotoWidgetCommentLike(widgetId, commentId, options = {}) {
  const widget = widgets.find((item) => item.id === widgetId);
  const normalizedCommentId = String(commentId || "").trim();
  if (!widget || !normalizedCommentId) return;

  const user = await getCurrentUser();
  if (!user) {
    showMessage("please log in first ♡");
    return;
  }

  const previousComments = getPhotoWidgetComments(widget);
  let didFindComment = false;
  const nextComments = previousComments.map((comment) => {
    if (comment.id === normalizedCommentId) {
      didFindComment = true;
      return toggleWidgetCommentLikeForItem(comment, user.id);
    }

    return {
      ...comment,
      replies: (comment.replies || []).map((reply) => {
        if (reply.id !== normalizedCommentId) return reply;

        didFindComment = true;
        return toggleWidgetCommentLikeForItem(reply, user.id);
      }),
    };
  });

  if (!didFindComment) return;

  widget.data = {
    ...(widget.data && typeof widget.data === "object" ? widget.data : {}),
    comments: nextComments,
  };
  renderPhotoWidgetCommentsSection(widget, options);
  queueWidgetSave(widget, { changedKeys: ["comments"], recordHistory: false });
}

function toggleWidgetCommentLikeForItem(comment, userId) {
  const likes = getWidgetCommentLikeUserIds(comment);
  const likeTimestamps = {
    ...getWidgetCommentLikeTimestamps(comment),
  };
  const isLiked = likes.includes(userId);
  const nextLikes = isLiked
    ? likes.filter((likedUserId) => likedUserId !== userId)
    : [...likes, userId];

  if (isLiked) {
    delete likeTimestamps[userId];
  } else {
    likeTimestamps[userId] = new Date().toISOString();
  }

  return {
    ...comment,
    likes: nextLikes,
    likeTimestamps,
  };
}

function openDeletePhotoWidgetCommentConfirmation(
  widgetId,
  commentId,
  options = {},
  isReply = false,
) {
  if (!widgetId || !commentId) return;

  openConfirmationDialog({
    title: isReply ? "delete reply?" : "delete comment?",
    message: `this ${isReply ? "reply" : "comment"} will be deleted forever.`,
    confirmLabel: "delete",
    pendingLabel: "deleting...",
    onConfirm: () => deletePhotoWidgetComment(widgetId, commentId, options),
  });
}

async function deletePhotoWidgetComment(widgetId, commentId, options = {}) {
  const widget = widgets.find((item) => item.id === widgetId);
  const normalizedCommentId = String(commentId || "").trim();
  if (!widget || !normalizedCommentId) return false;

  const row = document.querySelector(`[data-photo-widget-comment-row-id="${normalizedCommentId}"]`);
  if (row) {
    row.style.transition = `opacity 0.25s ${MOTION_EASING}, transform 0.25s ${MOTION_EASING}`;
    row.style.opacity = "0";
    row.style.transform = "translateY(6px) scale(0.98)";
  }

  const previousComments = getPhotoWidgetComments(widget);
  widget.data = {
    ...(widget.data && typeof widget.data === "object" ? widget.data : {}),
    comments: previousComments
      .filter((comment) => comment.id !== normalizedCommentId)
      .map((comment) => ({
        ...comment,
        replies: (comment.replies || []).filter((reply) => reply.id !== normalizedCommentId),
      })),
  };
  window.setTimeout(() => renderPhotoWidgetCommentsSection(widget, options), row ? 250 : 0);
  syncWidgetCommentButton(widget.id);
  queueWidgetSave(widget, { changedKeys: ["comments"], recordHistory: false });
  showMessage("comment deleted ♡");
  return true;
}

function getPhotoHistorySnapshotSignature(entry) {
  return JSON.stringify({
    image: entry?.image || "",
    text: entry?.text || "",
    textColor: entry?.textColor || "",
    textSize: Number(entry?.textSize) || 22,
    textX: Number(entry?.textX) || 50,
    textY: Number(entry?.textY) || 86,
    rotate: Number(entry?.rotate) || 0,
  });
}

function recordKeepsakeHistory(widget) {
  if (!isKeepsakeWidget(widget)) return;

  const currentData = widget?.data && typeof widget.data === "object" ? widget.data : {};
  const image = String(currentData.image || "").trim();

  if (!image) return;

  const existing = getPhotoHistoryEntries(widget);
  const nextEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `photo-history-${Date.now()}`,
    savedAt: new Date().toISOString(),
    actorId: currentProfile?.id || currentUser?.id || "",
    actorName: getProfileDisplayName(currentProfile, "someone"),
    sourceWidgetId: widget.id,
    sourceWidgetTitle: widget.title || "",
    image,
    text: String(currentData.text || ""),
    textColor: normalizeHexColor(currentData.textColor, "#ffffff"),
    textSize: Math.max(12, Math.min(46, Number(currentData.textSize) || 22)),
    textX: Math.max(0, Math.min(100, Number(currentData.textX) || 50)),
    textY: Math.max(0, Math.min(100, Number(currentData.textY) || 86)),
    rotate: Number(currentData.rotate) || 0,
  };

  if (
    existing.length &&
    getPhotoHistorySnapshotSignature(existing[0]) === getPhotoHistorySnapshotSignature(nextEntry)
  ) {
    return;
  }

  widget.data = {
    ...currentData,
    photoHistory: [nextEntry, ...existing].slice(0, 36),
  };
}

function getCombinedPhotoHistoryEntries() {
  return getAllKeepsakeWidgets()
    .flatMap((widget) => getPhotoHistoryEntries(widget))
    .sort((a, b) => new Date(b?.savedAt || 0).getTime() - new Date(a?.savedAt || 0).getTime());
}

function groupPhotoHistoryEntries(entries) {
  const groups = [];

  entries.forEach((entry) => {
    const savedAt = entry?.savedAt ? new Date(entry.savedAt) : null;
    const label =
      savedAt && !Number.isNaN(savedAt.getTime())
        ? savedAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "memories";
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === label) {
      lastGroup.entries.push(entry);
      return;
    }

    groups.push({
      label,
      entries: [entry],
    });
  });

  return groups;
}

function renderPhotoHistoryPopup(widget) {
  widgetPopup?.classList.remove("together-widget-popup");
  widgetPopupCard?.classList.add("photo-history-popup-card");
  const photoHistoryEntries = getCombinedPhotoHistoryEntries();
  widgetPopupTitle.textContent = "keepsake history";
  saveWidgetBtn.style.display = "none";
  setHeaderWidgetSaveVisibility(false);

  if (clearWidgetHistoryBtn) {
    clearWidgetHistoryBtn.style.display = photoHistoryEntries.length ? "inline-flex" : "none";
    clearWidgetHistoryBtn.dataset.clearWidgetHistoryId = widget.id;
    clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode = "photo-combined";
  }

  if (!photoHistoryEntries.length) {
    widgetEditorFields.innerHTML = '<div class="small-note">no keepsakes yet ♡</div>';
    widgetPopup.classList.add("open");
    return;
  }

  const groupedEntries = groupPhotoHistoryEntries(photoHistoryEntries);
  widgetEditorFields.innerHTML = `
    <div class="photo-history">
      ${groupedEntries
        .map(
          (group) => `
        <section class="photo-history-group">
          <h4 class="photo-history-heading">${escapeHtml(group.label)}</h4>
          <div class="photo-history-grid">
            ${group.entries
              .map((entry) => {
                const overlayText = escapeHtml(entry.text || "");
                const actorName = escapeHtml(getWidgetHistoryActorName(entry));
                const textColor = escapeHtml(normalizeHexColor(entry.textColor, "#ffffff"));
                const textSize = Math.max(12, Math.min(46, Number(entry.textSize) || 22));
                const textXValue = Number(entry.textX);
                const textYValue = Number(entry.textY);
                const textX = Math.max(
                  0,
                  Math.min(100, Number.isFinite(textXValue) ? textXValue : 50),
                );
                const textY = Math.max(
                  0,
                  Math.min(100, Number.isFinite(textYValue) ? textYValue : 86),
                );
                const rotate = Number(entry.rotate) || 0;

                return `
                  <article class="photo-history-card">
                    <button
                      class="photo-history-delete-btn"
                      type="button"
                      data-photo-history-delete-id="${escapeHtml(entry.id || "")}"
                      data-photo-history-source-widget-id="${escapeHtml(entry.sourceWidgetId || "")}"
                      aria-label="delete keepsake from history"
                      title="delete from history"
                    >
                      ×
                    </button>
                    <div class="photo-history-frame">
                      <img
                        class="photo-history-image"
                        src="${escapeHtml(entry.image || "")}"
                        alt="keepsake history"
                        style="transform:rotate(${rotate}deg);"
                        loading="lazy"
                        decoding="async"
                      />
                      ${
                        overlayText
                          ? `<div class="photo-history-text ${getPhotoTextClasses(entry)}" style="left:${textX}%;top:${textY}%;color:${textColor};--photo-text-size:${textSize};--photo-text-translate-x:-${textX}%;--photo-text-translate-y:-${textY}%;">${overlayText}</div>`
                          : ""
                      }
                    </div>
                    <div class="photo-history-meta">
                      <div class="photo-history-actor">${actorName}</div>
                      <div class="widget-history-time">${formatEntryDate(entry.savedAt)}</div>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>
      `,
        )
        .join("")}
    </div>
  `;

  widgetEditorFields.querySelectorAll("[data-photo-history-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const entryId = String(button.dataset.photoHistoryDeleteId || "").trim();
      const sourceWidgetId = String(button.dataset.photoHistorySourceWidgetId || "").trim();
      const sourceWidget = widgets.find((item) => item.id === sourceWidgetId);
      if (!entryId || !sourceWidget) return;

      openConfirmationDialog({
        title: "delete keepsake?",
        message: "this keepsake will be removed from history.",
        confirmLabel: "delete",
        pendingLabel: "deleting...",
        onConfirm: async () => {
          sourceWidget.data = {
            ...sourceWidget.data,
            photoHistory: getPhotoHistoryEntries(sourceWidget).filter(
              (entry) => entry?.id !== entryId,
            ),
          };
          queueWidgetSave(sourceWidget, { recordHistory: false });

          renderWidgets({ animateMobileReorder: false });
          renderPhotoHistoryPopup(widget);
          showMessage("keepsake deleted ♡");
        },
      });
    });
  });

  widgetPopup.classList.add("open");
}

function summarizeWidgetHistory(widget) {
  const normalizedId = String(widget.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget.title || "").toLowerCase();

  if (normalizedId === "song") {
    return `${widget.data?.songName || "untitled"}\n${widget.data?.durationLabel || ""}`.trim();
  }

  if (normalizedId === "together") {
    return `since ${widget.data?.startDate || ""}`.trim();
  }

  if (normalizedId === "note" || normalizedTitle.includes("quick note")) {
    return widget.data?.text || "quick note";
  }

  if (normalizedId === "dates" || normalizedTitle.includes("dates to remember")) {
    const count = widget.data?.items?.length || 0;
    return `${count} saved date${count === 1 ? "" : "s"}`;
  }

  if (normalizedId === "bucketlist" || normalizedTitle.includes("bucket list")) {
    const count = widget.data?.items?.length || 0;
    return `${count} bucket list item${count === 1 ? "" : "s"}`;
  }

  return widget.content || widget.title || "widget update";
}

function recordWidgetHistory(widget) {
  try {
    recordKeepsakeHistory(widget);
    const existing = getWidgetHistoryEntries(widget.id);
    const summary = summarizeWidgetHistory(widget);
    const previousEntry = existing[0];

    if (previousEntry?.summary === summary && previousEntry?.title === (widget.title || "")) {
      return;
    }

    const nextEntry = {
      id: createWidgetHistoryEntryId(),
      savedAt: new Date().toISOString(),
      summary,
      title: widget.title || "",
      actorId: currentProfile?.id || currentUser?.id || "",
      actorName: getProfileDisplayName(currentProfile, "someone"),
      side: widget.side || "",
      x: widget.x ?? null,
      y: widget.y ?? null,
    };

    widget.data = {
      ...(widget.data && typeof widget.data === "object" ? widget.data : {}),
      history: [nextEntry, ...existing].slice(0, 20),
    };
  } catch (error) {
    console.error(error);
  }
}

function clearWidgetHistory(widgetId) {
  try {
    const widget = widgets.find((item) => item.id === widgetId);
    if (widget) {
      widget.data = {
        ...(widget.data && typeof widget.data === "object" ? widget.data : {}),
        history: [],
        photoHistory: [],
      };
    }
    localStorage.removeItem(`widgetHistory:${widgetId}`);
  } catch (error) {
    console.error(error);
  }
}

function openWidgetHistory(widgetId) {
  const widget = widgets.find((item) => item.id === widgetId);
  if (!widget) return;
  const normalizedId = String(widget.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget.title || "").toLowerCase();

  if (isKeepsakeWidget(widget)) {
    renderPhotoHistoryPopup(widget);
    return;
  }

  widgetPopup?.classList.remove("together-widget-popup");
  widgetPopupCard?.classList.remove("photo-history-popup-card");
  const historyEntries = getWidgetHistoryEntries(widget);
  widgetPopupTitle.textContent =
    normalizedId === "note" || normalizedTitle.includes("quick note")
      ? widget.title
      : `${widget.title} history`;
  saveWidgetBtn.style.display = "none";
  setHeaderWidgetSaveVisibility(false);
  if (clearWidgetHistoryBtn) {
    clearWidgetHistoryBtn.style.display = historyEntries.length ? "inline-flex" : "none";
    clearWidgetHistoryBtn.dataset.clearWidgetHistoryId = widget.id;
    delete clearWidgetHistoryBtn.dataset.clearWidgetHistoryMode;
  }

  widgetEditorFields.innerHTML = historyEntries.length
    ? `
      <div class="widget-history-list">
        ${historyEntries
          .map(
            (entry, index) => `
          <div class="widget-history-item">
            <div class="widget-history-item-top">
              <div class="widget-history-time">${formatEntryDate(entry.savedAt)}</div>
              <button
                class="widget-history-delete-btn"
                type="button"
                data-widget-history-delete-entry="${escapeHtml(serializeWidgetHistoryEntryTarget(entry))}"
                aria-label="delete this history message"
                title="delete this history message"
              >
                ×
              </button>
            </div>
            <div class="widget-history-summary">${escapeHtml(getWidgetHistoryActorName(entry))}</div>
            <div class="widget-history-summary">${escapeHtml(entry.summary || "widget update")}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
    : `<div class="small-note">no widget history yet ♡</div>`;

  widgetEditorFields.querySelectorAll("[data-widget-history-delete-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetEntry = parseWidgetHistoryEntryTarget(button.dataset.widgetHistoryDeleteEntry);
      if (!targetEntry) return;

      openConfirmationDialog({
        title: "delete history message?",
        message: "this history message will be deleted.",
        confirmLabel: "delete",
        pendingLabel: "deleting...",
        onConfirm: async () => {
          const removed = removeWidgetHistoryEntry(widget.id, targetEntry);
          if (!removed) return;
          queueWidgetSave(widget, { recordHistory: false });

          openWidgetHistory(widget.id);
          renderWidgets({ animateMobileReorder: false });
          showMessage("history message deleted ♡");
        },
      });
    });
  });

  widgetPopup.classList.add("open");
}

function dismissEntryPopup() {
  saveEntryDraftNow();
  window.clearTimeout(entryDraftTimer);
  entryPopup.classList.remove("open");
}

function resetEntryPopup(options = {}) {
  const { keepDraft = true } = options;
  if (keepDraft) saveEntryDraftNow();
  window.clearTimeout(entryDraftTimer);
  editingPostId = null;
  if (entryPopupTitle) entryPopupTitle.innerHTML = 'new entry <span aria-hidden="true">✎</span>';
  if (entryPopupLabel)
    entryPopupLabel.innerHTML = 'write something <span aria-hidden="true">♡</span>';
  if (saveEntryBtn) saveEntryBtn.textContent = "post";
  withEntryDraftSuppressed(clearEntryComposer);
  setEntryDraftStatus("");
}

async function openNewEntryComposer() {
  const user = await getCurrentUser();

  if (!user) {
    if (newEntryBtn) {
      newEntryBtn.classList.add("is-hidden");
    }
    showMessage("please log in first ♡");
    return;
  }

  await ensureEntryEditor();
  resetEntryPopup();
  restoreEntryDraft();
  entryPopup.classList.add("open");
  syncNewEntryButtonVisibility();
  focusEntryComposerToEnd();
}

async function openEntryEditor(postId) {
  const post = posts.find((item) => item.id === postId);
  if (!post) return;

  await ensureEntryEditor();
  if (postNeedsContent(post)) {
    await ensurePostContent([postId]);
  }
  if (entryPopup.classList.contains("open")) saveEntryDraftNow();
  editingPostId = postId;
  if (entryPopupTitle) entryPopupTitle.innerHTML = 'edit entry <span aria-hidden="true">✎</span>';
  if (entryPopupLabel)
    entryPopupLabel.innerHTML = 'change some words <span aria-hidden="true">♡</span>';
  if (saveEntryBtn) saveEntryBtn.textContent = "save";
  withEntryDraftSuppressed(() => setEntryComposerFromStoredContent(post.text || ""));
  restoreEntryDraft();
  entryPopup.classList.add("open");
  focusEntryComposerToEnd();
}

function setCurrentUser(user) {
  currentUser = user || null;
  document.body.classList.toggle("app-authenticated", Boolean(currentUser));
  if (appToolbar) {
    appToolbar.dataset.authState = currentUser ? "logged-in" : "logged-out";
  }
  if (!currentUser) {
    stopProfilePresenceHeartbeat();
    stopLiveUpdates();
    closeNotificationsPanel();
  } else {
    startProfilePresenceHeartbeat();
    startLiveUpdates();
  }
  updateFloatingEntryButtonVisibility();
}

function setToolbarAuthState(state) {
  if (appToolbar) {
    appToolbar.dataset.authState = state;
  }
}

function setAppBootingState(isBooting) {
  document.body.classList.toggle("app-booting", isBooting);
}

function hideLaunchSplash() {
  if (!launchSplash) {
    setAppBootingState(false);
    return Promise.resolve();
  }

  setAppBootingState(false);
  launchSplash.classList.add("is-hiding");

  return new Promise((resolve) => {
    window.setTimeout(() => {
      launchSplash.hidden = true;
      resolve();
    }, BOOT_SPLASH_FADE_MS);
  });
}

function waitForAnimationFrames(count = 2) {
  return new Promise((resolve) => {
    const tick = (remaining) => {
      if (remaining <= 0) {
        resolve();
        return;
      }

      requestAnimationFrame(() => tick(remaining - 1));
    };

    tick(count);
  });
}

function withBootTimeout(promise, timeoutMs = 9000) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function renderBootFallbackShell() {
  console.warn("App boot timed out before user data finished loading.");
  currentProfile = null;
  knownProfiles = [];
  posts = [];
  placedStickers = [];
  notifications = [];
  setCurrentUser(null);
  closeProfileDetailsPopup();
  closeNotificationsPanel();
  authPopup?.classList.add("open");
  renderSignedOutShell();
}

function waitForImageLoad(image) {
  if (!image || image.complete) {
    return Promise.resolve();
  }

  image.loading = "eager";

  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function getInitialTimelineImages() {
  return Array.from(timelineEl?.querySelectorAll(".post-avatar, .entry-attachment-image") || [])
    .filter((image) => image instanceof HTMLImageElement)
    .slice(0, INITIAL_TIMELINE_IMAGE_COUNT);
}

async function waitForInitialPageReady() {
  await waitForAnimationFrames(1);

  if (bootPaintedFromSnapshot) return;

  const splashImage = launchSplash?.querySelector("img");
  const readinessTasks = [
    waitForImageLoad(splashImage),
    ...getInitialTimelineImages().map((image) => waitForImageLoad(image)),
  ];

  await withBootTimeout(Promise.allSettled(readinessTasks), 700);
  await waitForAnimationFrames(1);
}

function renderSignedOutShell() {
  timelineEl.innerHTML = "";
  leftZone.innerHTML = "";
  rightZone.innerHTML = "";
  renderNotifications();
}

function getSignedInUserId() {
  return currentUser?.id || currentProfile?.id || "";
}

function getNotificationsSeenStorageKey() {
  const userId = getSignedInUserId();
  return userId ? `notificationsSeenAt:${userId}` : "";
}

function getNotificationsSeenAt() {
  const key = getNotificationsSeenStorageKey();
  if (!key) return "";

  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setNotificationsSeenAt(value) {
  const key = getNotificationsSeenStorageKey();
  if (!key) return;

  try {
    if (!value) return;
    const existingValue = localStorage.getItem(key) || "";
    const existingTimestamp = existingValue ? new Date(existingValue).getTime() : 0;
    const nextTimestamp = new Date(value).getTime();

    if (!nextTimestamp) return;
    if (existingTimestamp && nextTimestamp < existingTimestamp) return;

    localStorage.setItem(key, value);
    markCloudPrefChanged("notificationsSeenAt");
  } catch (error) {
    console.error(error);
  }
}

function getNotificationsClearedStorageKey() {
  const userId = getSignedInUserId();
  return userId ? `notificationsClearedAt:${userId}` : "";
}

function getNotificationsClearedAt() {
  const key = getNotificationsClearedStorageKey();
  if (!key) return "";

  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setNotificationsClearedAt(value) {
  const key = getNotificationsClearedStorageKey();
  if (!key) return;

  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
    markCloudPrefChanged("notificationsClearedAt");
  } catch (error) {
    console.error(error);
  }
}

function getNotificationTimestamp(value) {
  const timestamp = new Date(value || "").getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestNotificationCreatedAt(items = []) {
  const latestItem = [...items].sort(
    (left, right) =>
      getNotificationTimestamp(right?.created_at) - getNotificationTimestamp(left?.created_at),
  )[0];

  return String(latestItem?.created_at || "");
}

function getNotificationDedupKey(item) {
  const explicitId = String(item?.id || "").trim();
  if (explicitId) return explicitId;

  return JSON.stringify({
    type: String(item?.type || ""),
    created_at: String(item?.created_at || ""),
    message: String(item?.message || ""),
    postId: String(item?.postId || ""),
    widgetId: String(item?.widgetId || ""),
    openComments: Boolean(item?.openComments),
  });
}

function normalizeNotifications(items = []) {
  const seenKeys = new Set();

  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => getNotificationTimestamp(item.created_at) > 0)
    .filter((item) => {
      const key = getNotificationDedupKey(item);
      if (!key || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .sort((left, right) => {
      const timestampDifference =
        getNotificationTimestamp(right?.created_at) - getNotificationTimestamp(left?.created_at);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return getNotificationDedupKey(left).localeCompare(getNotificationDedupKey(right));
    });
}

function getVisibleNotifications() {
  const clearedAt = getNotificationsClearedAt();
  const clearedTimestamp = getNotificationTimestamp(clearedAt);

  return notifications.filter((item) => {
    const createdAt = getNotificationTimestamp(item.created_at);
    return !clearedTimestamp || createdAt > clearedTimestamp;
  });
}

function getUnreadNotificationCount(visibleNotifications = getVisibleNotifications()) {
  const seenAt = getNotificationsSeenAt();
  const seenTimestamp = getNotificationTimestamp(seenAt);

  return visibleNotifications.filter((item) => {
    const createdAt = getNotificationTimestamp(item.created_at);
    return createdAt > seenTimestamp;
  }).length;
}

function ensureNotificationsSeenBaseline() {
  const key = getNotificationsSeenStorageKey();
  if (!key || !notifications.length) return;

  const existingSeenAt = getNotificationsSeenAt();
  if (existingSeenAt) return;

  const latestCreatedAt = notifications[0]?.created_at || "";
  if (latestCreatedAt) {
    setNotificationsSeenAt(latestCreatedAt);
  }
}

function formatNotificationRelativeTime(dateString) {
  const timestamp = getNotificationTimestamp(dateString);
  if (!timestamp) return "";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatEntryDate(dateString);
}

function getNotificationTypeLabel(notificationOrType) {
  const notification =
    notificationOrType && typeof notificationOrType === "object"
      ? notificationOrType
      : { type: notificationOrType };
  const { type } = notification;

  if (type === "entry") return "entry";
  if (type === "entry_update") return "entry";
  if (type === "reply") return "reply";
  if (type === "comment") return "comment";
  if (type === "post_like") return "like";
  if (type === "comment_like") return "comment like";
  if (type === "widget_comment") return "comment";
  if (type === "widget_like") return "widget like";
  if (type === "thinking_of_you") return "thinking of you";
  if (type === "widget_update") return "widget";
  if (type === "sticker") return "sticker";
  return "update";
}

function closeNotificationsPanel() {
  if (!notificationsPanel || !notificationsBtn) return;
  notificationsPanel.hidden = true;
  notificationsBtn.setAttribute("aria-expanded", "false");
}

function markNotificationsRead() {
  const visibleNotifications = getVisibleNotifications();
  if (!visibleNotifications.length) {
    renderNotifications();
    syncWidgetCommentButtons();
    return;
  }

  const latestCreatedAt =
    getLatestNotificationCreatedAt(visibleNotifications) || new Date().toISOString();
  setNotificationsSeenAt(latestCreatedAt);
  renderNotifications();
  syncWidgetCommentButtons();
}

function clearNotifications() {
  const visibleNotifications = getVisibleNotifications();
  if (!visibleNotifications.length) {
    renderNotifications();
    return;
  }

  const latestCreatedAt =
    getLatestNotificationCreatedAt(visibleNotifications) || new Date().toISOString();
  setNotificationsClearedAt(latestCreatedAt);
  setNotificationsSeenAt(latestCreatedAt);
  renderNotifications();
  syncWidgetCommentButtons();
}

function openNotificationsPanel() {
  if (!currentUser || !notificationsPanel || !notificationsBtn) return;
  notificationsPanel.hidden = false;
  notificationsBtn.setAttribute("aria-expanded", "true");
  markNotificationsRead();
}

function focusPost(postId, options = {}) {
  const { openComments = false, focusCommentId = "" } = options;
  const target = timelineEl.querySelector(`article.post[data-post-id="${CSS.escape(postId)}"]`);

  if (!target && getPostById(postId) && !options.revealed) {
    void revealPostInTimeline(postId).then(() => focusPost(postId, { ...options, revealed: true }));
    return;
  }

  if (isTabbedLayoutActive()) {
    setMobileView("timeline", { animate: false });
  }

  const scrollToTarget = () => {
    if (!target) return;
    target.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    target.classList.add("post-highlight");
    window.setTimeout(() => target.classList.remove("post-highlight"), 1400);
  };

  if (isTabbedLayoutActive()) {
    requestAnimationFrame(scrollToTarget);
  } else {
    scrollToTarget();
  }

  if (openComments) {
    openCommentsPopup(postId, { focusCommentId });
  }
}

function focusWidget(widgetId) {
  if (!widgetId) return;

  const target = Array.from(
    document.querySelectorAll(".widget[data-widget-id], .widget[data-widget-source-id]"),
  ).find(
    (widgetEl) =>
      widgetEl.dataset.widgetId === widgetId || widgetEl.dataset.widgetSourceId === widgetId,
  );

  if (!target) return;

  if (isTabbedLayoutActive()) {
    if (leftZone?.contains(target)) {
      setMobileView("left", { animate: false });
    } else if (rightZone?.contains(target)) {
      setMobileView("right", { animate: false });
    }
  }

  const scrollToTarget = () => {
    target.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });
    target.classList.add("post-highlight");
    window.setTimeout(() => target.classList.remove("post-highlight"), 1400);
  };

  if (isTabbedLayoutActive()) {
    requestAnimationFrame(scrollToTarget);
  } else {
    scrollToTarget();
  }
}

function renderNotifications() {
  if (!notificationsList || !notificationsBtn || !notificationsBadge) {
    return;
  }

  const visibleNotifications = getVisibleNotifications();
  const seenAt = getNotificationsSeenAt();
  const seenTimestamp = getNotificationTimestamp(seenAt);
  const unreadCount = getUnreadNotificationCount(visibleNotifications);

  notificationsBadge.hidden = unreadCount === 0;
  notificationsBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);

  if (!visibleNotifications.length) {
    notificationsList.innerHTML = `<div class="notification-empty">no little updates yet ♡</div>`;
    return;
  }

  notificationsList.innerHTML = visibleNotifications
    .map((item) => {
      const createdAt = getNotificationTimestamp(item.created_at);
      const isUnread = createdAt > seenTimestamp;

      return `
        <button
          class="notification-item${isUnread ? " is-unread" : ""}"
          type="button"
          data-notification-post-id="${item.postId || ""}"
          data-notification-widget-id="${item.widgetId || ""}"
          data-notification-open-comments="${item.openComments ? "true" : "false"}"
          data-notification-comment-id="${escapeHtml(item.commentId || "")}"
        >
          <div class="notification-topline">
            <span class="notification-type">${getNotificationTypeLabel(item)}</span>
            <span class="notification-time">${formatNotificationRelativeTime(item.created_at)}</span>
          </div>
          <div class="notification-message">${escapeHtml(item.message)}</div>
        </button>
      `;
    })
    .join("");

  notificationsList.querySelectorAll(".notification-item").forEach((button) => {
    button.addEventListener("click", () => {
      const postId = button.dataset.notificationPostId;
      const widgetId = button.dataset.notificationWidgetId;
      const openComments = button.dataset.notificationOpenComments === "true";
      const focusCommentId = button.dataset.notificationCommentId || "";

      closeNotificationsPanel();

      if (postId) {
        focusPost(postId, { openComments, focusCommentId });
      } else if (widgetId) {
        if (openComments) {
          openWidgetComments(widgetId, { focusCommentId });
        } else {
          focusWidget(widgetId);
        }
      }
    });
  });
}

function getWidgetNotificationName(widget) {
  const normalizedId = String(widget?.id || "")
    .toLowerCase()
    .trim();
  const normalizedTitle = String(widget?.title || "").toLowerCase();
  if (normalizedId === "song") return "on repeat";
  if (normalizedId === "note" || normalizedTitle.includes("quick note")) return "quick note";
  if (normalizedId === "dates" || normalizedTitle.includes("dates to remember"))
    return "dates to remember";
  if (normalizedId === "bucketlist" || normalizedTitle.includes("bucket list"))
    return "bucket list";
  if (normalizedId.startsWith("keepsake") || normalizedTitle.includes("keepsake"))
    return "keepsake";
  if (isCustomWidget(widget)) return widget.data?.heading || "a widget";
  return String(widget?.title || "a widget").trim() || "a widget";
}

function getWidgetDataForNotifications(widget) {
  return widget?.data && typeof widget.data === "object" && !Array.isArray(widget.data)
    ? widget.data
    : {};
}

function markWidgetContentUpdated(widget) {
  const actorId = currentProfile?.id || currentUser?.id || "";
  if (!widget || !actorId) return;

  widget.data = {
    ...getWidgetDataForNotifications(widget),
    lastUpdatedBy: actorId,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function getWidgetUpdateNotificationType(widget) {
  return widget?.id === "thinking-of-you" ? "thinking_of_you" : "widget_update";
}

function getWidgetUpdateNotificationMessage(widget, actorName, widgetData) {
  if (widget?.id === "thinking-of-you") {
    return `${actorName} is thinking of you sooo much`;
  }

  return `${actorName} updated ${getWidgetNotificationName(widget)}`;
}

function buildNotifications({
  postsData = [],
  commentsData = [],
  likesData = [],
  stickersData = [],
  widgetsData = widgets,
  profilesData = [],
  render = true,
}) {
  if (!currentProfile?.id) {
    notifications = [];
    if (render) {
      renderNotifications();
    }
    return;
  }

  const myUserId = currentProfile.id;
  const postById = new Map(postsData.map((post) => [post.id, post]));
  const commentById = new Map(commentsData.map((comment) => [comment.id, comment]));
  const profileById = new Map(profilesData.map((profile) => [profile.id, profile]));
  const ownPostIds = new Set(
    postsData.filter((post) => post.user_id === myUserId).map((post) => post.id),
  );
  const ownCommentIds = new Set(
    commentsData.filter((comment) => comment.user_id === myUserId).map((comment) => comment.id),
  );
  const nextNotifications = [];

  postsData.forEach((post) => {
    if (!post.created_at || post.user_id === myUserId) return;

    const actorProfile = profileById.get(post.user_id);
    const actorName =
      post.profiles?.nickname ||
      post.profiles?.username ||
      actorProfile?.nickname ||
      actorProfile?.username ||
      "someone";

    nextNotifications.push({
      id: `entry:${post.id}`,
      type: "entry",
      created_at: post.created_at,
      postId: post.id,
      openComments: false,
      message: `${actorName} posted a new entry`,
    });

    const createdAt = getNotificationTimestamp(post.created_at);
    const updatedAt = getNotificationTimestamp(post.updated_at);
    if (updatedAt && createdAt && updatedAt - createdAt > 1000) {
      nextNotifications.push({
        id: `entry-update:${post.id}:${post.updated_at}`,
        type: "entry_update",
        created_at: post.updated_at,
        postId: post.id,
        openComments: false,
        message: `${actorName} updated an entry`,
      });
    }
  });

  commentsData.forEach((comment) => {
    if (!comment.created_at || comment.user_id === myUserId) return;

    const actorProfile = profileById.get(comment.user_id);
    const actorName =
      comment.profiles?.nickname ||
      comment.profiles?.username ||
      actorProfile?.nickname ||
      actorProfile?.username ||
      "someone";
    const parentComment = comment.parent_comment_id
      ? commentById.get(comment.parent_comment_id)
      : null;
    const post = postById.get(comment.post_id);

    const isInThread =
      parentComment &&
      (parentComment.user_id === myUserId ||
        commentsData.some(
          (other) =>
            other.parent_comment_id === parentComment.id &&
            other.user_id === myUserId &&
            getNotificationTimestamp(other.created_at) <
              getNotificationTimestamp(comment.created_at),
        ));
    if (isInThread) {
      nextNotifications.push({
        id: `reply:${comment.id}`,
        type: "reply",
        created_at: comment.created_at,
        postId: comment.post_id,
        commentId: comment.id,
        openComments: true,
        message: `${actorName} replied to your comment`,
      });
      return;
    }

    if (post?.user_id === myUserId) {
      nextNotifications.push({
        id: `comment:${comment.id}`,
        type: "comment",
        created_at: comment.created_at,
        postId: comment.post_id,
        commentId: comment.id,
        openComments: true,
        message: `${actorName} commented on your entry`,
      });
    }
  });

  likesData.forEach((like) => {
    if (!like.created_at || like.user_id === myUserId) return;

    const actorProfile = profileById.get(like.user_id);
    const actorName = actorProfile?.nickname || actorProfile?.username || "someone";

    if (like.post_id && ownPostIds.has(like.post_id)) {
      nextNotifications.push({
        id: `post-like:${like.id}`,
        type: "post_like",
        created_at: like.created_at,
        postId: like.post_id,
        openComments: false,
        message: `${actorName} liked your entry`,
      });
      return;
    }

    if (like.comment_id && ownCommentIds.has(like.comment_id)) {
      const comment = commentById.get(like.comment_id);
      nextNotifications.push({
        id: `comment-like:${like.id}`,
        type: "comment_like",
        created_at: like.created_at,
        postId: comment?.post_id || "",
        commentId: like.comment_id,
        openComments: Boolean(comment?.post_id),
        message: `${actorName} liked your comment`,
      });
    }
  });

  stickersData.forEach((sticker) => {
    if (!sticker.created_at || sticker.user_id === myUserId || !ownPostIds.has(sticker.post_id))
      return;

    const actorProfile = profileById.get(sticker.user_id);
    const actorName = actorProfile?.nickname || actorProfile?.username || "someone";
    nextNotifications.push({
      id: `sticker:${sticker.id}`,
      type: "sticker",
      created_at: sticker.created_at,
      postId: sticker.post_id,
      openComments: false,
      message: isGifSticker(sticker.emoji)
        ? `${actorName} added a gif sticker to your entry`
        : `${actorName} added ${sticker.emoji} to your entry`,
    });
  });

  (widgetsData || []).forEach((widget) => {
    const widgetName = getWidgetNotificationName(widget);
    const widgetData = getWidgetDataForNotifications(widget);
    const updatedBy = widgetData.lastUpdatedBy || "";
    const lastUpdatedAt = widgetData.lastUpdatedAt || "";
    const isMyWidgetToHearAbout = !updatedBy || updatedBy === myUserId;
    const isThinkingOfYouWidget = widget?.id === "thinking-of-you";
    const thinkingOfYouEvents = Array.isArray(widgetData.thinkingOfYouEvents)
      ? widgetData.thinkingOfYouEvents
      : [];

    if (isThinkingOfYouWidget && thinkingOfYouEvents.length) {
      const groupedThinkingOfYouEvents = new Map();

      thinkingOfYouEvents.forEach((event) => {
        const actorId = String(event?.actorId || event?.userId || "").trim();
        const createdAt = String(event?.createdAt || event?.created_at || "").trim();
        const dateKey = String(event?.dateKey || getDateKeyFromDate(createdAt)).trim();
        const windowKey = String(
          event?.windowKey || getThinkingOfYouNotificationWindowKey(createdAt),
        ).trim();

        if (!actorId || actorId === myUserId || !windowKey || !createdAt) return;

        const groupKey = `${actorId}:${windowKey}`;
        const existing = groupedThinkingOfYouEvents.get(groupKey);
        const count = Math.max(1, Number(event?.count) || 1);

        if (!existing) {
          groupedThinkingOfYouEvents.set(groupKey, {
            actorId,
            createdAt,
            dateKey,
            windowKey,
            count,
            eventCount: 1,
          });
          return;
        }

        existing.eventCount += 1;
        existing.count = Math.max(existing.count, count);

        if (getNotificationTimestamp(createdAt) > getNotificationTimestamp(existing.createdAt)) {
          existing.createdAt = createdAt;
        }
      });

      groupedThinkingOfYouEvents.forEach((event) => {
        const actorProfile = profileById.get(event.actorId);
        const actorName = actorProfile?.nickname || actorProfile?.username || "someone";
        const count = Math.max(event.count, event.eventCount);
        const countText = count === 1 ? "" : ` ${count} times`;

        nextNotifications.push({
          id: `thinking-of-you:${widget.id}:${event.actorId}:${event.windowKey}`,
          type: "thinking_of_you",
          created_at: event.createdAt,
          widgetId: widget.id,
          openComments: false,
          message: `${actorName} thought of you${countText}`,
        });
      });
    }

    if (
      updatedBy &&
      updatedBy !== myUserId &&
      lastUpdatedAt &&
      (!isThinkingOfYouWidget || !thinkingOfYouEvents.length)
    ) {
      const actorProfile = profileById.get(updatedBy);
      const actorName = actorProfile?.nickname || actorProfile?.username || "someone";

      nextNotifications.push({
        id: `widget-update:${widget.id}:${lastUpdatedAt}`,
        type: getWidgetUpdateNotificationType(widget),
        created_at: lastUpdatedAt,
        widgetId: widget.id,
        openComments: false,
        message: getWidgetUpdateNotificationMessage(widget, actorName, widgetData),
      });
    }

    if (Array.isArray(widgetData.comments)) {
      widgetData.comments.forEach((comment) => {
        const actorId = String(comment?.userId || comment?.user_id || "");
        const createdAt = String(comment?.createdAt || comment?.created_at || "");

        if (!actorId || actorId === myUserId || !createdAt) return;
        if (!isMyWidgetToHearAbout) return;

        const actorProfile = profileById.get(actorId);
        const actorName =
          comment?.actorName || actorProfile?.nickname || actorProfile?.username || "someone";
        const commentId = String(comment?.id || createdAt);

        nextNotifications.push({
          id: `widget-comment:${widget.id}:${commentId}:${actorId}`,
          type: "widget_comment",
          created_at: createdAt,
          widgetId: widget.id,
          commentId,
          openComments: true,
          message: `${actorName} commented on ${widgetName}`,
        });
      });

      widgetData.comments.forEach((comment) => {
        const replies = Array.isArray(comment?.replies) ? comment.replies : [];
        replies.forEach((reply) => {
          const actorId = String(reply?.userId || reply?.user_id || "");
          const createdAt = String(reply?.createdAt || reply?.created_at || "");
          if (!actorId || actorId === myUserId || !createdAt) return;

          const replyTime = getNotificationTimestamp(createdAt);
          const isInThread =
            String(comment?.userId || comment?.user_id || "") === myUserId ||
            replies.some(
              (other) =>
                String(other?.userId || other?.user_id || "") === myUserId &&
                getNotificationTimestamp(other?.createdAt || other?.created_at) < replyTime,
            );
          if (!isInThread) return;

          const actorProfile = profileById.get(actorId);
          const actorName =
            reply?.actorName || actorProfile?.nickname || actorProfile?.username || "someone";
          const replyId = String(reply?.id || createdAt);

          nextNotifications.push({
            id: `widget-reply:${widget.id}:${replyId}:${actorId}`,
            type: "reply",
            created_at: createdAt,
            widgetId: widget.id,
            commentId: replyId,
            openComments: true,
            message: `${actorName} replied to your comment on ${widgetName}`,
          });
        });
      });
    }

    if (!isLikeableWidget(widget) || !isMyWidgetToHearAbout) return;

    normalizeWidgetLikesData(widget);
    const likeTimestamps = getWidgetLikeTimestamps(widget);

    getWidgetLikeUserIds(widget).forEach((userId) => {
      if (!userId || userId === myUserId) return;

      const createdAt = likeTimestamps[userId] || "";
      if (!createdAt) return;

      const actorProfile = profileById.get(userId);
      const actorName = actorProfile?.nickname || actorProfile?.username || "someone";

      nextNotifications.push({
        id: `widget-like:${widget.id}:${userId}`,
        type: "widget_like",
        created_at: createdAt,
        widgetId: widget.id,
        openComments: false,
        message: `${actorName} liked ${widgetName}`,
      });
    });
  });

  notifications = normalizeNotifications(nextNotifications);
  ensureNotificationsSeenBaseline();

  if (render) {
    renderNotifications();
  }
}

function refreshNotificationsFromCurrentData(render = true) {
  buildNotifications({
    ...notificationSourceData,
    widgetsData: widgets,
    render,
  });
}

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

function isVisualInteractionActive() {
  return Boolean(
    dragWidget ||
    pendingWidgetDrag ||
    draggingPlacedSticker ||
    document.body.classList.contains("dragging-widget") ||
    document.body.classList.contains("sticker-dragging") ||
    authPopup?.classList.contains("open") ||
    profilePopup?.classList.contains("open") ||
    entryPopup?.classList.contains("open") ||
    widgetPopup?.classList.contains("open") ||
    widgetCommentsPopup?.classList.contains("open") ||
    commentsPopup?.classList.contains("open") ||
    stickerPopup?.classList.contains("open") ||
    customWidgetPopup?.classList.contains("open") ||
    deleteEntryPopup?.classList.contains("open") ||
    likeWrites.size > 0 ||
    entrySaveInFlight ||
    commentWritesInFlight > 0 ||
    widgetSaveInFlight ||
    profileSaveInFlight,
  );
}

function getRealtimeActorUserId(table, payload = {}) {
  const newRow = payload.new || {};
  const oldRow = payload.old || {};

  if (table === "profiles") {
    return String(newRow.id || oldRow.id || "");
  }

  if (table === "widgets") {
    const data = newRow.data && typeof newRow.data === "object" ? newRow.data : {};
    return String(data.lastUpdatedBy || data.updatedBy || "");
  }

  return String(newRow.user_id || oldRow.user_id || "");
}

function markLocalRealtimeTable(table) {
  recentLocalRealtimeTables.set(table, Date.now() + 4000);
  timelineEditVersion += 1;
}

async function trackTimelineWrite(request) {
  timelineEditVersion += 1;
  timelineWritesInFlight += 1;
  try {
    return await request;
  } finally {
    timelineWritesInFlight -= 1;
    timelineEditVersion += 1;
  }
}

function isOwnRealtimeEcho(table, payload = {}) {
  const myUserId = currentUser?.id || currentProfile?.id || "";
  if (!myUserId) return false;

  if (table === "widgets") {
    const row = payload.new || payload.old || {};
    const pendingUpdatedAt = pendingLocalWidgetUpdates.get(row.id);
    return Boolean(pendingUpdatedAt && String(row.updated_at || "") === pendingUpdatedAt);
  }

  const actorId = getRealtimeActorUserId(table, payload);
  if (actorId && actorId !== myUserId) return false;
  return (recentLocalRealtimeTables.get(table) || 0) > Date.now();
}

function handleProfileRealtimeChange(payload = {}) {
  const incomingProfile = payload.new || payload.old || {};
  if (!incomingProfile?.id) return;

  upsertKnownProfile(incomingProfile);

  if (currentProfile?.id === incomingProfile.id) {
    currentProfile = mergeProfileRecords(currentProfile, incomingProfile);
  }

  applyProfileToTimeline(getKnownProfileById(incomingProfile.id, incomingProfile));

  if (profilePopup?.classList.contains("open") && activeProfilePopupUserId === incomingProfile.id) {
    renderProfilePopup(getKnownProfileById(incomingProfile.id));
  }
}

function handleRealtimeChange(table, payload = {}) {
  if (isOwnRealtimeEcho(table, payload)) {
    return;
  }

  if (table === "profiles") {
    handleProfileRealtimeChange(payload);
    return;
  }

  const changedWidgetId = String(payload.new?.id || payload.old?.id || "");
  if (table === "widgets" && changedWidgetId.startsWith(CLOUD_PREFS_WIDGET_PREFIX)) {
    if (changedWidgetId === getCloudPrefsWidgetId() && payload.new?.data) {
      if (applyCloudPrefsData(payload.new.data)) redrawAfterCloudPrefs();
    }
    return;
  }

  if (table === "widgets" && changedWidgetId === PROFILE_BIO_WIDGET_ID) {
    void loadSharedProfileBios({ force: true }).then(() => {
      if (profilePopup?.classList.contains("open") && activeProfilePopupUserId) {
        renderProfilePopup(getKnownProfileById(activeProfilePopupUserId));
      }
    });
    return;
  }

  if (isVisualInteractionActive()) {
    scheduleLiveDataRefresh({
      includeWidgets: table === "widgets",
      debounceMs: 1200,
    });
    return;
  }

  scheduleLiveDataRefresh({ includeWidgets: table === "widgets" });
}

let lastLiveRefreshAt = 0;
let liveRefreshMissed = false;

function scheduleLiveDataRefresh(options = {}) {
  if (!currentUser) return;
  if (document.visibilityState === "hidden" && !options.allowHidden) {
    liveRefreshMissed = true;
    return;
  }
  if (
    options.minIntervalMs &&
    !liveRefreshMissed &&
    Date.now() - lastLiveRefreshAt < options.minIntervalMs
  ) {
    return;
  }
  liveRefreshMissed = false;

  if (!options.force && isVisualInteractionActive()) {
    liveRefreshIncludeWidgets = liveRefreshIncludeWidgets || Boolean(options.includeWidgets);
    if (liveRefreshTimer) {
      window.clearTimeout(liveRefreshTimer);
    }
    liveRefreshTimer = window.setTimeout(
      runScheduledLiveDataRefresh,
      Number.isFinite(options.debounceMs) ? options.debounceMs : 1200,
    );
    return;
  }

  liveRefreshIncludeWidgets = liveRefreshIncludeWidgets || Boolean(options.includeWidgets);

  if (liveRefreshTimer) {
    window.clearTimeout(liveRefreshTimer);
  }

  liveRefreshTimer = window.setTimeout(
    runScheduledLiveDataRefresh,
    Number.isFinite(options.debounceMs) ? options.debounceMs : LIVE_REFRESH_DEBOUNCE_MS,
  );
}

async function runScheduledLiveDataRefresh() {
  liveRefreshTimer = 0;

  if (!currentUser) return;

  if (isVisualInteractionActive()) {
    scheduleLiveDataRefresh({
      includeWidgets: liveRefreshIncludeWidgets,
      debounceMs: 1200,
    });
    return;
  }

  if (liveRefreshInFlight) {
    liveRefreshQueued = true;
    return;
  }

  const includeWidgets = liveRefreshIncludeWidgets;
  liveRefreshIncludeWidgets = false;
  liveRefreshInFlight = true;

  try {
    lastLiveRefreshAt = Date.now();
    await refreshUserData({ includeWidgets });
  } catch (error) {
    console.error(error);
  } finally {
    liveRefreshInFlight = false;

    if (liveRefreshQueued || liveRefreshIncludeWidgets) {
      const queuedIncludeWidgets = liveRefreshIncludeWidgets;
      liveRefreshQueued = false;
      liveRefreshIncludeWidgets = false;
      scheduleLiveDataRefresh({
        includeWidgets: queuedIncludeWidgets,
        debounceMs: LIVE_REFRESH_DEBOUNCE_MS,
      });
    }
  }
}

function stopLiveUpdates() {
  if (liveRefreshTimer) {
    window.clearTimeout(liveRefreshTimer);
    liveRefreshTimer = 0;
  }

  liveRefreshQueued = false;
  liveRefreshIncludeWidgets = false;

  if (liveUpdatesChannel) {
    void liveUpdatesChannel.unsubscribe?.();
    liveUpdatesChannel = null;
  }
}

function startLiveUpdates() {
  stopLiveUpdates();

  if (!currentUser) return;

  const channel = dataStore.channel("tandem-live");

  ["posts", "comments", "likes", "post_stickers", "profiles", "widgets"].forEach((table) => {
    channel.on("change", { table }, (payload) => handleRealtimeChange(table, payload));
  });

  liveUpdatesChannel = channel;
  let subscribedBefore = false;
  channel.subscribe((status) => {
    if (status !== "SUBSCRIBED" || !currentUser?.id) return;

    if (subscribedBefore) scheduleLiveDataRefresh({ includeWidgets: true });
    subscribedBefore = true;
  });
}

function syncPopupScrollLock() {
  const hasOpenPopup = Boolean(document.querySelector(".popup.open")) && !isMobileLayoutActive();

  if (hasOpenPopup) {
    if (!document.body.classList.contains("popup-scroll-locked")) {
      popupScrollLockTop = window.scrollY || window.pageYOffset || 0;
      popupScrollLockLeft = window.scrollX || window.pageXOffset || 0;
      popupScrollLockBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
      };
      document.documentElement.classList.add("popup-scroll-locked");
      document.body.classList.add("popup-scroll-locked");
      document.body.style.position = "fixed";
      document.body.style.top = `-${popupScrollLockTop}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      lastScrollY = popupScrollLockTop;
    }
    return;
  }

  if (!document.body.classList.contains("popup-scroll-locked")) {
    return;
  }

  const restoredScrollTop = popupScrollLockTop;
  const restoredScrollLeft = popupScrollLockLeft;

  document.documentElement.classList.remove("popup-scroll-locked");
  document.body.classList.remove("popup-scroll-locked");
  if (popupScrollLockBodyStyles) {
    document.body.style.position = popupScrollLockBodyStyles.position;
    document.body.style.top = popupScrollLockBodyStyles.top;
    document.body.style.left = popupScrollLockBodyStyles.left;
    document.body.style.right = popupScrollLockBodyStyles.right;
    document.body.style.width = popupScrollLockBodyStyles.width;
  }
  popupScrollLockBodyStyles = null;
  popupScrollLockTop = 0;
  popupScrollLockLeft = 0;
  window.scrollTo({
    left: restoredScrollLeft,
    top: restoredScrollTop,
    behavior: "auto",
  });
  lastScrollY = restoredScrollTop;
}

let popupPointerStartedInsideCard = false;

document.querySelectorAll(".popup-card").forEach((card) => {
  ["click", "mousedown", "pointerdown"].forEach((eventName) => {
    card.addEventListener(eventName, (event) => {
      if (eventName === "mousedown" || eventName === "pointerdown") {
        popupPointerStartedInsideCard = true;
      }
      event.stopPropagation();
    });
  });
});

const POPUP_FADE = { duration: 420, easing: "ease-in-out" };

function whenFramesCalm(callback) {
  let last = performance.now();
  let frames = 0;
  const check = (now) => {
    const gap = now - last;
    last = now;
    frames += 1;
    if ((frames >= 2 && gap < 40) || frames >= 6) callback();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

function playWhenFramesCalm(animations) {
  animations.forEach((animation) => animation.pause());
  whenFramesCalm(() => {
    animations.forEach((animation) => {
      if (animation.playState === "paused") animation.play();
    });
  });
  return animations;
}

const popupCardTops = new WeakMap();

function glideOpenPopups() {
  if (reducedMotionMedia?.matches) return;
  document.querySelectorAll(".popup.open").forEach((popupEl) => {
    const card = popupEl.firstElementChild;
    if (!card) return;
    const top = card.offsetTop;
    const previousTop = popupCardTops.get(card);
    popupCardTops.set(card, top);
    if (previousTop === undefined || Math.abs(previousTop - top) < 2) return;
    card.animate([{ transform: `translateY(${previousTop - top}px)` }, { transform: "none" }], {
      duration: 320,
      easing: MOTION_EASING,
    });
  });
}
window.visualViewport?.addEventListener("resize", glideOpenPopups);
window.addEventListener("resize", glideOpenPopups);

function animatePopupOpen(popupEl, fromOpacity = 0) {
  const card = popupEl.firstElementChild;
  if (!card || reducedMotionMedia?.matches) return [];
  popupCardTops.set(card, card.offsetTop);

  const options = { ...POPUP_FADE, fill: "backwards" };
  return playWhenFramesCalm([
    card.animate([{ opacity: fromOpacity }, { opacity: 1 }], options),
    popupEl.animate([{ backgroundColor: "transparent" }, {}], options),
  ]);
}

const POPUP_PIN_STYLES = ["position", "top", "left", "width", "height", "margin"];

function endPopupClose(popupEl) {
  popupEl.classList.remove("is-closing");
  POPUP_PIN_STYLES.forEach((key) => {
    popupEl.firstElementChild?.style.removeProperty(key);
  });
}

function animatePopupClose(popupEl, fromOpacity = 1) {
  const card = popupEl.firstElementChild;
  if (!card || reducedMotionMedia?.matches) {
    popupEl.dispatchEvent(new Event("popupclosed"));
    return [];
  }

  popupEl.classList.add("is-closing");
  const rect = card.getBoundingClientRect();
  card.getAnimations().forEach((animation) => animation.cancel());
  POPUP_PIN_STYLES.forEach((key) => {
    card.style[key] = key === "position" ? "fixed" : key === "margin" ? "0" : `${rect[key]}px`;
  });
  const options = { ...POPUP_FADE, fill: "forwards" };
  const animations = [
    card.animate([{ opacity: fromOpacity }, { opacity: 0 }], options),
    popupEl.animate([{}, { backgroundColor: "transparent" }], options),
  ];
  animations[0].onfinish = () => {
    endPopupClose(popupEl);
    animations.forEach((animation) => animation.cancel());
    popupEl.dispatchEvent(new Event("popupclosed"));
  };
  return playWhenFramesCalm(animations);
}

document.querySelectorAll(".popup").forEach((popupEl) => {
  let wasOpen = popupEl.classList.contains("open");
  let fadeAnimations = [];
  const observer = new MutationObserver(() => {
    const isOpen = popupEl.classList.contains("open");
    if (isOpen !== wasOpen) {
      wasOpen = isOpen;
      const interrupted = fadeAnimations.some(
        (animation) => animation.playState === "running" || animation.playState === "paused",
      );
      const fromOpacity = interrupted
        ? Number(getComputedStyle(popupEl.firstElementChild).opacity)
        : undefined;
      fadeAnimations.forEach((animation) => animation.cancel());
      endPopupClose(popupEl);
      fadeAnimations = isOpen
        ? animatePopupOpen(popupEl, fromOpacity)
        : animatePopupClose(popupEl, fromOpacity);
    }
    syncPopupScrollLock();
  });

  observer.observe(popupEl, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

syncPopupScrollLock();

function canTouchScroll(target) {
  let node = target instanceof Element ? target : target?.parentElement;
  while (node && !node.classList.contains("popup")) {
    if (node.matches("input, textarea, select, [contenteditable='true']")) return true;
    const { overflowX, overflowY } = getComputedStyle(node);
    if (
      (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1) ||
      (/(auto|scroll)/.test(overflowX) && node.scrollWidth > node.clientWidth + 1)
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

document.addEventListener(
  "touchmove",
  (event) => {
    if (
      event.cancelable &&
      isMobileLayoutActive() &&
      document.querySelector(".popup.open") &&
      !canTouchScroll(event.target)
    ) {
      event.preventDefault();
    }
  },
  { passive: false },
);

window.addEventListener("pointerup", () => {
  requestAnimationFrame(() => {
    popupPointerStartedInsideCard = false;
  });
});

window.addEventListener("mouseup", () => {
  requestAnimationFrame(() => {
    popupPointerStartedInsideCard = false;
  });
});

async function getCurrentUser() {
  if (currentUser) return currentUser;

  const {
    data: { user },
  } = await dataStore.auth.getUser();

  currentUser = user || null;
  if (currentUser) {
    void loadSharedProfileBios();
  }
  return currentUser;
}

function getWidgetsRenderSignature() {
  try {
    return JSON.stringify([
      widgets.map((widget) => [
        widget.id,
        widget.title,
        widget.side,
        widget.x,
        widget.y,
        widget.zIndex,
        widget === getWeatherWidget() ? null : widget.data,
        widget.content,
      ]),
      [...minimizedWidgetIds],
      isTabbedLayoutActive(),
    ]);
  } catch {
    return String(Math.random());
  }
}

async function refreshUserData(options = {}) {
  const { includeWidgets = false, showSkeleton = false } = options;

  if (showSkeleton) {
    renderAppSkeleton({
      timeline: true,
      widgets: includeWidgets,
      notifications: true,
    });
  }

  if (!showSkeleton) {
    renderNotifications();
  }

  const widgetsBefore = includeWidgets ? getWidgetsRenderSignature() : "";

  const widgetsTask = includeWidgets
    ? loadWidgets({ render: false, showSkeleton: false }).then(() => {
        const widgetsChanged =
          showSkeleton ||
          !leftZone.querySelector(".widget") ||
          widgetsBefore !== getWidgetsRenderSignature();
        applyWeatherCache(getWeatherWidget());
        if (widgetsChanged) {
          const scrollSnapshot = getViewportScrollSnapshot();
          renderWidgets({ animateMobileReorder: false });
          restoreViewportScroll(scrollSnapshot);
        }
        void refreshWeatherWidget({ render: true });
        pendingSavesReady = true;
        void runPendingSaves();
        resendUnsavedWidgetPositions();
      })
    : Promise.resolve();

  const postsTask = loadPosts({ render: false, showSkeleton: false }).then(() => {
    const scrollSnapshot = getViewportScrollSnapshot();
    renderTimeline();
    renderNotifications();
    restoreViewportScroll(scrollSnapshot);
  });

  const prefsTask = loadCloudPrefs({ force: includeWidgets }).catch((error) => {
    console.error(error);
    return false;
  });

  const [, , prefsChanged] = await Promise.all([postsTask, widgetsTask, prefsTask]);
  refreshThinkingOfYouNames();
  if (prefsChanged) redrawAfterCloudPrefs();
  else if (includeWidgets) refreshNotificationsFromCurrentData();
  lastLiveRefreshAt = Date.now();
  scheduleBootSnapshotSave();
}

profileBtn.addEventListener("click", () => {
  void openProfilePopupForUser(currentProfile?.id || currentUser?.id || "");
});

closeProfilePopup.addEventListener("click", () => {
  closeProfileDetailsPopup();
});

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    setProfilePopupEditMode(true);
  });
}

if (cancelProfileEditBtn) {
  cancelProfileEditBtn.addEventListener("click", () => {
    renderProfilePopup(getKnownProfileById(activeProfilePopupUserId), {
      startEditing: false,
    });
  });
}

profilePopup.addEventListener("click", (event) => {
  if (event.target === profilePopup && !popupPointerStartedInsideCard) {
    closeProfileDetailsPopup();
  }
});

async function loadProfile(user) {
  await loadSharedProfileBios();

  const { data, error } = await dataStore
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  currentProfile = data;
  applyProfileTheme(currentProfile);

  if (currentProfile) {
    upsertKnownProfile(currentProfile);
    refreshThinkingOfYouNames();
    nicknameInput.value = currentProfile.nickname || "";
    const profileBio = getProfileBio(currentProfile, user.id, user);
    if (bioInput) {
      bioInput.value = profileBio;
    }
  }

  return currentProfile;
}

function openDeletePlacedStickerConfirmation(stickerId) {
  if (!stickerId) return;

  openConfirmationDialog({
    title: "remove sticker?",
    message: "this sticker will be removed from the entry.",
    confirmLabel: "remove",
    pendingLabel: "removing...",
    onConfirm: () => deletePlacedSticker(stickerId),
  });
}

async function deletePlacedSticker(stickerId) {
  if (!stickerId) return false;

  const removedSticker = placedStickers.find((item) => item.id === stickerId);
  placedStickers = placedStickers.filter((item) => item.id !== stickerId);
  clearPlacedGifSize(stickerId);
  clearPlacedStickerPosition(stickerId);
  renderPlacedStickers();

  const { error } = await trackTimelineWrite(
    dataStore.from("post_stickers").delete().eq("id", stickerId),
  );

  if (error) {
    console.error(error);
    showMessage(error.message);
    if (removedSticker) {
      placedStickers.push(removedSticker);
      renderPlacedStickers();
    }
    return false;
  }

  markLocalRealtimeTable("post_stickers");
  showMessage("sticker removed ♡");
  return true;
}

async function updatePlacedStickerPosition(stickerId, x, y, options = {}) {
  const { quiet = false } = options;
  const user = await getCurrentUser();

  if (!user) {
    if (!quiet) showMessage("please log in first ♡");
    return false;
  }

  const nextX = clampStickerPercent(x);
  const nextY = clampStickerPercent(y);
  const localSticker = placedStickers.find((item) => item.id === stickerId);

  savePlacedStickerPosition(stickerId, nextX, nextY);
  if (localSticker) {
    localSticker.x = nextX;
    localSticker.y = nextY;
  }

  if (String(stickerId).startsWith("local-sticker-")) return true;

  const { data: updatedSticker, error } = await trackTimelineWrite(
    dataStore
      .from("post_stickers")
      .update({ x: nextX, y: nextY })
      .eq("id", stickerId)
      .eq("user_id", localSticker?.userId || user.id)
      .select("id")
      .maybeSingle(),
  );

  if (error || !updatedSticker) {
    if (error) console.error(error);
    if (!quiet) {
      showMessage(
        error
          ? "position saved on this device, will sync later ♡"
          : "position saved on this device (run the sync migration to share it) ♡",
      );
    }
    return true;
  }

  markLocalRealtimeTable("post_stickers");
  clearPlacedStickerPosition(stickerId);
  return true;
}

let loginInFlight = false;

async function loginUser() {
  if (loginInFlight) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage("enter your email and password ♡");
    (email ? passwordInput : emailInput)?.focus();
    return;
  }

  loginInFlight = true;
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "logging in...";
  }

  let data;
  let error;
  try {
    ({ data, error } = await dataStore.auth.signInWithPassword({
      email,
      password,
    }));
  } finally {
    loginInFlight = false;
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "login";
    }
  }

  if (error) {
    showMessage(error.message);
    return;
  }

  sessionExpiredNoticeShown = false;
  if (authNote) authNote.hidden = true;

  if (data.user) {
    currentUser = data.user;
    authPopup.classList.remove("open");
    setCurrentUser(data.user);
    renderAppSkeleton();
    try {
      if (!currentProfile) currentProfile = { id: data.user.id };
      await Promise.all([
        loadProfile(data.user),
        refreshUserData({ includeWidgets: true, showSkeleton: true }),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setCurrentUser(data.user);
    }
  }

  showMessage("welcome back ♡");
  authPopup.classList.remove("open");
}

function setPasswordVisibility(isVisible) {
  if (!passwordInput || !passwordToggleBtn) return;

  passwordInput.type = isVisible ? "text" : "password";
  passwordToggleBtn.innerHTML = `<span class="password-toggle-icon" aria-hidden="true">${isVisible ? "◌" : "◉"}</span>`;
  passwordToggleBtn.setAttribute("aria-label", isVisible ? "hide password" : "show password");
  passwordToggleBtn.setAttribute("aria-pressed", String(isVisible));
}

async function updateCurrentUserProfile(profileUpdates = {}, options = {}) {
  const { throwOnError = false } = options;
  const user = await getCurrentUser();

  if (!user) {
    showMessage("please log in first ♡");
    return null;
  }

  const loadedProfile = currentProfile || (await loadProfile(user));
  if (!loadedProfile?.id) {
    showMessage("could not find your profile ♡");
    return null;
  }

  const nextProfilePayload = {
    username: loadedProfile.username,
    nickname: loadedProfile.nickname,
    avatar_url: loadedProfile.avatar_url || null,
    ...profileUpdates,
  };
  const localAvatarUrl = String(nextProfilePayload.avatar_url || "").startsWith("blob:")
    ? nextProfilePayload.avatar_url
    : "";
  if (localAvatarUrl) delete nextProfilePayload.avatar_url;
  const hasBioUpdate = Object.prototype.hasOwnProperty.call(profileUpdates, "bio");
  let { data: savedProfile, error } = await dataStore
    .from("profiles")
    .update(nextProfilePayload)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    if (throwOnError) throw error;
    console.error(error);
    showMessage(error.message);
    return null;
  }

  if (localAvatarUrl) {
    savedProfile = { ...savedProfile, avatar_url: localAvatarUrl };
  }

  if (hasBioUpdate) {
    persistProfileBioBackup(user, nextProfilePayload.bio);
    await saveSharedProfileBio(user.id, nextProfilePayload.bio);
    savedProfile = {
      ...savedProfile,
      bio: String(nextProfilePayload.bio || ""),
    };
  }

  currentProfile = savedProfile;
  nicknameInput.value = currentProfile.nickname || "";
  if (bioInput) {
    bioInput.value = getProfileBio(currentProfile, user.id, currentUser || user);
  }
  upsertKnownProfile(currentProfile);

  return savedProfile;
}

async function uploadProfileAvatarFile(userId, file) {
  const filePath = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await dataStore.storage
    .from("profile-pictures")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = dataStore.storage.from("profile-pictures").getPublicUrl(filePath);

  return data.publicUrl;
}

async function saveProfile() {
  if (profileSaveInFlight) return;
  profileSaveInFlight = true;
  if (saveProfileBtn) saveProfileBtn.disabled = true;

  try {
    const nickname = nicknameInput.value.trim();
    const bio = String(bioInput?.value || "").trim();
    const file = pfpInput.files[0];

    if (!areBreakupWordsAllowed(nickname, bio)) {
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      showMessage("please log in first ♡");
      return;
    }

    const usernameBase = user.email ? user.email.split("@")[0] : `user-${user.id.slice(0, 6)}`;

    const finalNickname = nickname || currentProfile?.nickname || usernameBase;
    const updates = {
      username: currentProfile?.username || usernameBase,
      nickname: finalNickname,
      bio,
    };
    const localAvatarUrl = file ? URL.createObjectURL(file) : "";

    currentProfile = {
      ...currentProfile,
      ...updates,
      ...(localAvatarUrl ? { avatar_url: localAvatarUrl } : {}),
    };
    upsertKnownProfile(currentProfile);
    addPendingSave({
      kind: "profile",
      showsMeter: true,
      file: file || null,
      updates,
      localAvatarUrl,
    });

    applyProfileToTimeline(currentProfile);
    if (localAvatarUrl) renderTimeline();
    pfpInput.value = "";
    renderProfilePopup(currentProfile, { startEditing: false });
  } finally {
    profileSaveInFlight = false;
    if (saveProfileBtn) saveProfileBtn.disabled = false;
  }
}

function getPostsTimelineSelect() {
  return `
        id,
        created_at,
        user_id,
        profiles (
          nickname,
          avatar_url,
          username
        )
      `;
}

async function fetchPostsForTimeline() {
  return dataStore
    .from("posts")
    .select(getPostsTimelineSelect())
    .order("created_at", { ascending: false });
}

function isPostEditedFromTimestamps(post) {
  const createdAt = new Date(post?.created_at || "").getTime();
  const updatedAt = new Date(post?.updated_at || "").getTime();

  return Number.isFinite(createdAt) && Number.isFinite(updatedAt)
    ? updatedAt - createdAt > 1000
    : false;
}

async function loadPosts(options = {}) {
  const { render = true, showSkeleton = render } = options;
  if (showSkeleton) {
    renderTimelineSkeleton();
  }

  const editedPostIds = new Set(getEditedPostIds());
  const myUserId = currentProfile?.id || currentUser?.id || "";
  const editVersionAtStart = timelineEditVersion;
  const firstPageContentRequest = hasActiveTimelineFilters()
    ? Promise.resolve({ data: [], error: null })
    : dataStore
        .from("posts")
        .select("id, content")
        .order("created_at", { ascending: false })
        .limit(Math.max(TIMELINE_PAGE_SIZE, timelineVisibleCount));
  const [
    { data: postsData, error: postsError },
    { data: commentsData, error: commentsError },
    { data: stickersData, error: stickersError },
    likesResult,
    { data: profilesData, error: profilesError },
    firstPageContentResult,
  ] = await Promise.all([
    fetchPostsForTimeline(),
    dataStore
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        parent_comment_id,
        profiles (
          nickname,
          username
        )
      `,
      )
      .order("created_at", { ascending: false }),
    selectPostStickerRows(),
    dataStore.from("likes").select("id, post_id, comment_id, user_id, created_at"),
    fetchProfilesDirectory(),
    firstPageContentRequest,
  ]);

  if (postsError) {
    console.error(postsError);
    showMessage(postsError.message);
    return;
  }

  if (commentsError) {
    console.error(commentsError);
    showMessage(commentsError.message);
    return;
  }

  if (stickersError) {
    console.error(stickersError);
    showMessage(stickersError.message);
    return;
  }

  if (profilesError) {
    console.error(profilesError);
    showMessage(profilesError.message);
    return;
  }

  await loadSharedProfileBios();
  replaceKnownProfiles(profilesData || []);

  const { data: likesData, error: likesError } = likesResult;

  if (likesError) {
    console.error(likesError);
    showMessage(likesError.message);
    return;
  }

  const likesByPostId = new Map();
  const likesByCommentId = new Map();
  const commentsByPostId = new Map();
  const repliesByParentId = new Map();

  (likesData || []).forEach((like) => {
    if (like.post_id) {
      const postLikes = likesByPostId.get(like.post_id) || [];
      postLikes.push(like);
      likesByPostId.set(like.post_id, postLikes);
    }

    if (like.comment_id) {
      const commentLikes = likesByCommentId.get(like.comment_id) || [];
      commentLikes.push(like);
      likesByCommentId.set(like.comment_id, commentLikes);
    }
  });

  const normalizedComments = (commentsData || []).map((comment) => ({
    id: comment.id,
    post_id: comment.post_id,
    userId: comment.user_id,
    text: comment.content,
    created_at: comment.created_at,
    parent_comment_id: comment.parent_comment_id,
    nickname: comment.profiles?.nickname || comment.profiles?.username || "someone",
    likesCount: (likesByCommentId.get(comment.id) || []).length,
    likedByMe: (likesByCommentId.get(comment.id) || []).some((like) => like.user_id === myUserId),
  }));

  normalizedComments.forEach((comment) => {
    const commentsForPost = commentsByPostId.get(comment.post_id) || [];
    commentsForPost.push(comment);
    commentsByPostId.set(comment.post_id, commentsForPost);

    if (comment.parent_comment_id) {
      const replies = repliesByParentId.get(comment.parent_comment_id) || [];
      replies.push(comment);
      repliesByParentId.set(comment.parent_comment_id, replies);
    }
  });

  if (
    !showSkeleton &&
    posts.length &&
    (timelineWritesInFlight > 0 || editVersionAtStart !== timelineEditVersion)
  ) {
    scheduleLiveDataRefresh();
    return;
  }

  const previousPostsById = new Map(posts.map((post) => [post.id, post]));

  posts = (postsData || []).map((row) => {
    const previousPost = previousPostsById.get(row.id);
    const postLikes = likesByPostId.get(row.id) || [];
    const allPostComments = commentsByPostId.get(row.id) || [];

    const topLevelComments = allPostComments
      .filter((comment) => !comment.parent_comment_id)
      .map((comment) => ({
        ...comment,
        replies: getCommentsNewestFirst(repliesByParentId.get(comment.id) || []),
      }))
      .sort(compareCommentsNewestFirst);

    return {
      id: row.id,
      userId: row.user_id,
      text: previousPost?.text,
      contentLoaded: Boolean(previousPost?.contentLoaded),
      contentStale: Boolean(previousPost?.contentLoaded),
      created_at: row.created_at,
      isEdited: editedPostIds.has(row.id) || isPostEditedFromTimestamps(row),
      author: row.user_id === myUserId ? "posted by you" : "posted by them",
      nickname: row.profiles?.nickname || row.profiles?.username || "someone",
      avatarUrl: row.profiles?.avatar_url || "",
      likesCount: postLikes.length,
      likedByMe: postLikes.some((like) => like.user_id === myUserId),
      comments: topLevelComments,
    };
  });

  if (firstPageContentResult?.error) {
    console.error(firstPageContentResult.error);
  }
  (firstPageContentResult?.data || []).forEach((row) => {
    const post = posts.find((item) => item.id === row.id);
    if (!post) return;
    post.text = row.content;
    post.contentLoaded = true;
    post.contentStale = false;
  });
  applyPendingSavesToPosts();

  placedStickers = (stickersData || []).map(mapPostStickerRow);
  void flushPendingStickerChanges();

  notificationSourceData = {
    postsData: postsData || [],
    commentsData: commentsData || [],
    likesData: likesData || [],
    stickersData: stickersData || [],
    profilesData: profilesData || [],
  };

  buildNotifications({
    postsData: postsData || [],
    commentsData: commentsData || [],
    likesData: likesData || [],
    stickersData: stickersData || [],
    widgetsData: widgets,
    profilesData: profilesData || [],
    render,
  });

  if (profilePopup?.classList.contains("open") && activeProfilePopupUserId) {
    renderProfilePopup(getKnownProfileById(activeProfilePopupUserId));
  }

  refreshOpenCommentsPopup();

  if (render) {
    await ensurePostContent(getVisibleTimelinePostIds());
    renderTimeline();
  }
}

async function saveEntry() {
  if (entrySaveInFlight) return;
  entrySaveInFlight = true;
  if (saveEntryBtn) saveEntryBtn.disabled = true;

  try {
    let content = "";
    let plainText = "";

    if (entryQuill) {
      plainText = entryQuill.getText().trim();
      content = sanitizePostHtml(entryQuill.root?.innerHTML || "");
    } else {
      plainText = String(entryContentFallback?.value || "").trim();
      content = toSafeHtmlFromPlainText(plainText);
    }

    if (!areBreakupWordsAllowed(plainText)) {
      return;
    }

    const attachedImage = String(entryImageData?.value || "").trim();
    if (!plainText && !attachedImage) {
      showMessage("write something first ♡");
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      showMessage("please log in first ♡");
      return;
    }

    const existingPost = editingPostId ? getPostById(editingPostId) : null;
    const save = {
      kind: "entry",
      showsMeter: true,
      postId:
        editingPostId ||
        `${PENDING_POST_ID_PREFIX}${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
      isNew: !editingPostId,
      text: content,
      image: attachedImage,
      localContent: composeEntryContentWithAttachment(content, attachedImage),
      createdAt: existingPost?.created_at || new Date().toISOString(),
    };

    if (editingPostId) markPostAsEdited(editingPostId);
    addPendingSave(save);
    applyPendingSavesToPosts();
    renderTimeline();
    clearEntryDraft();
    window.clearTimeout(entryDraftTimer);
    entryPopup.classList.remove("open");
  } finally {
    entrySaveInFlight = false;
    if (saveEntryBtn) saveEntryBtn.disabled = false;
  }
}

function openConfirmationDialog(options = {}) {
  const {
    title = "are you sure?",
    message = "this cannot be undone.",
    confirmLabel = "delete",
    pendingLabel = "deleting...",
    onConfirm,
  } = options;

  if (typeof onConfirm !== "function") return;

  pendingConfirmation = {
    onConfirm,
    confirmLabel,
    pendingLabel,
  };

  if (confirmPopupTitle) {
    confirmPopupTitle.textContent = title;
  }
  if (confirmPopupText) {
    confirmPopupText.textContent = message;
  }
  if (confirmDeleteEntryBtn) {
    confirmDeleteEntryBtn.disabled = false;
    confirmDeleteEntryBtn.textContent = confirmLabel;
  }
  deleteEntryPopup?.classList.add("open");
}

function closeDeleteEntryConfirmation() {
  pendingConfirmation = null;
  deleteEntryPopup?.classList.remove("open");

  if (confirmDeleteEntryBtn) confirmDeleteEntryBtn.disabled = false;
}

deleteEntryPopup?.addEventListener("popupclosed", () => {
  if (confirmDeleteEntryBtn) confirmDeleteEntryBtn.textContent = "delete";
});

async function confirmDeleteEntry() {
  if (!pendingConfirmation) return;

  const { onConfirm } = pendingConfirmation;
  closeDeleteEntryConfirmation();

  try {
    await onConfirm();
  } catch (error) {
    console.error(error);
    showMessage(error.message || "could not complete that action");
  }
}

function openDeleteEntryConfirmation(postId) {
  if (!postId) return;

  openConfirmationDialog({
    title: "delete entry?",
    message: "this entry will be deleted forever.",
    confirmLabel: "delete",
    pendingLabel: "deleting...",
    onConfirm: () => deleteEntry(postId),
  });
}

async function deleteEntry(postId) {
  const pendingSave = getPendingEntrySave(postId);
  if (pendingSave?.running) {
    const savingEl = document.querySelector(`[data-post-id="${postId}"]`);
    if (savingEl) savingEl.style.display = "none";
    while (getPendingEntrySave(postId)?.running) {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    }
    return deleteEntry(pendingSave.savedId || postId);
  }
  if (pendingSave) {
    const landedPost = pendingSave.inserting
      ? await findInsertedPost(pendingSave).catch(() => null)
      : null;
    removePendingSave(pendingSave);
    if (landedPost) {
      posts = posts.filter((post) => post.id !== postId);
      await trackTimelineWrite(dataStore.from("posts").delete().eq("id", landedPost.id));
      markLocalRealtimeTable("posts");
    }
    if (pendingSave.isNew) {
      posts = posts.filter((post) => post.id !== postId);
      renderTimeline();
      showMessage("entry deleted ♡");
      return true;
    }
  }

  const postEl = document.querySelector(`[data-post-id="${postId}"]`);
  const previousPosts = posts;
  const deletedPost = posts.find((post) => post.id === postId);

  if (postEl) {
    postEl.style.transition = `opacity 0.25s ${MOTION_EASING}, transform 0.25s ${MOTION_EASING}`;
    postEl.style.opacity = "0";
    postEl.style.transform = "translateY(10px)";
  }

  posts = posts.filter((post) => post.id !== postId);
  const removeCardTimer = window.setTimeout(() => postEl?.remove(), 250);

  const { error } = await trackTimelineWrite(dataStore.from("posts").delete().eq("id", postId));

  if (error) {
    console.error(error);
    showMessage(error.message);
    window.clearTimeout(removeCardTimer);
    posts = previousPosts;
    if (postEl) {
      ["transition", "opacity", "transform"].forEach((key) => {
        postEl.style[key] = "";
      });
    }
    if (deletedPost || postEl) {
      renderTimeline();
    }
    return false;
  }

  unmarkPostAsEdited(postId);
  markLocalRealtimeTable("posts");
  placedStickers = placedStickers.filter((sticker) => sticker.postId !== postId);
  syncPostCommentButton(postId);
  showMessage("entry deleted ♡");
  return true;
}

async function writeLikeInBackground(key, liked, write, revert) {
  const running = likeWrites.get(key);
  if (running) {
    running.wanted = liked;
    return;
  }

  const state = { wanted: liked, saved: !liked };
  likeWrites.set(key, state);
  try {
    while (state.saved !== state.wanted) {
      const next = state.wanted;
      const { error } = await trackTimelineWrite(write(next));
      if (error) throw error;
      state.saved = next;
    }
  } catch (error) {
    console.error(error);
    revert(state.saved);
    showMessage(error.message);
  } finally {
    likeWrites.delete(key);
  }
}

function toggleLike(postId) {
  if (isPendingPostId(postId)) return;

  const userId = currentUser?.id;
  if (!userId) {
    showMessage("please log in first ♡");
    return;
  }

  const post = posts.find((item) => item.id === postId);
  if (!post) return;

  const setLiked = (liked) => {
    if (liked !== Boolean(post.likedByMe)) {
      post.likesCount = Math.max(0, (post.likesCount || 0) + (liked ? 1 : -1));
    }
    post.likedByMe = liked;
    syncPostLikeButton(postId);
  };

  const liked = !post.likedByMe;
  setLiked(liked);
  void writeLikeInBackground(
    `post:${postId}`,
    liked,
    async (next) => {
      const result = next
        ? await dataStore.from("likes").insert({ post_id: postId, user_id: userId })
        : await dataStore.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
      if (!result.error) {
        markLocalRealtimeTable("likes");
        recordLocalLikeChange({ post_id: postId, user_id: userId }, next);
      }
      return result;
    },
    setLiked,
  );
}

async function fetchLatestWidgetRow(widgetId) {
  const { data, error } = await dataStore
    .from("widgets")
    .select("*")
    .eq("id", widgetId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

function toggleWidgetLike(widgetId) {
  const userId = currentUser?.id;

  if (!userId) {
    showMessage("please log in first ♡");
    return;
  }

  const widget = widgets.find((item) => item.id === widgetId);
  if (!widget || !isLikeableWidget(widget)) return;

  normalizeWidgetLikesData(widget);
  const likes = getWidgetLikeUserIds(widget);
  const wasLiked = likes.includes(userId);
  const likeTimestamps = { ...getWidgetLikeTimestamps(widget) };
  const profileLikeCredits = { ...getWidgetProfileLikeCredits(widget) };

  if (wasLiked) {
    delete likeTimestamps[userId];
    const nextCredit = Math.max(0, (Number(profileLikeCredits[userId]) || 0) - 1);
    if (nextCredit > 0) profileLikeCredits[userId] = nextCredit;
    else delete profileLikeCredits[userId];
  } else {
    likeTimestamps[userId] = new Date().toISOString();
    profileLikeCredits[userId] = (Number(profileLikeCredits[userId]) || 0) + 1;
  }

  widget.data.likes = wasLiked
    ? likes.filter((likedUserId) => likedUserId !== userId)
    : [...likes, userId];
  widget.data.likeTimestamps = likeTimestamps;
  widget.data.profileLikeCredits = profileLikeCredits;

  syncWidgetLikeButton(widgetId);
  queueWidgetSave(widget, {
    changedKeys: ["likes", "likeTimestamps", "profileLikeCredits"],
    ownLikeOnly: true,
    recordHistory: false,
  });
  refreshNotificationsFromCurrentData();
  if (profilePopup?.classList.contains("open") && activeProfilePopupUserId) {
    renderProfilePopup(getKnownProfileById(activeProfilePopupUserId));
  }
}

function toggleCommentLike(commentId) {
  const userId = currentUser?.id;

  if (!userId) {
    showMessage("please log in first ♡");
    return;
  }

  const post = posts.find((item) => item.id === currentCommentsPostId);
  if (!post) return;

  const allComments = [
    ...(post.comments || []),
    ...(post.comments || []).flatMap((comment) => comment.replies || []),
  ];
  const comment = allComments.find((item) => item.id === commentId);

  if (!comment) return;

  const setLiked = (liked) => {
    if (liked !== Boolean(comment.likedByMe)) {
      comment.likesCount = Math.max(0, (comment.likesCount || 0) + (liked ? 1 : -1));
    }
    comment.likedByMe = liked;
    syncCommentLikeButton(commentId);
  };

  const liked = !comment.likedByMe;
  setLiked(liked);
  void writeLikeInBackground(
    `comment:${commentId}`,
    liked,
    async (next) => {
      const result = next
        ? await dataStore.from("likes").insert({ comment_id: commentId, user_id: userId })
        : await dataStore.from("likes").delete().eq("comment_id", commentId).eq("user_id", userId);
      if (!result.error) {
        markLocalRealtimeTable("likes");
        recordLocalLikeChange({ comment_id: commentId, user_id: userId }, next);
      }
      return result;
    },
    setLiked,
  );
}

function openCommentsPopup(postId, { focusCommentId = "" } = {}) {
  currentCommentsPostId = postId;
  replyingToCommentId = null;
  replyingToItemId = null;
  commentInput.value = "";
  renderCommentsList(postId);
  commentsPopup.classList.add("open");
  pendingCommentFocusId = "";
  if (focusCommentId) {
    const selector = `[data-comment-id="${CSS.escape(focusCommentId)}"]`;
    if (commentsList.querySelector(selector)) {
      revealCommentRow(commentsList, selector);
    } else {
      pendingCommentFocusId = focusCommentId;
    }
  }
}

function refreshOpenCommentsPopup() {
  if (!commentsPopup?.classList.contains("open") || !currentCommentsPostId) return;
  const scrollTop = commentsList.scrollTop;
  renderCommentsList(currentCommentsPostId);
  commentsList.scrollTop = scrollTop;

  if (!pendingCommentFocusId) return;
  const selector = `[data-comment-id="${CSS.escape(pendingCommentFocusId)}"]`;
  if (commentsList.querySelector(selector)) {
    pendingCommentFocusId = "";
    revealCommentRow(commentsList, selector);
  }
}

function refreshOpenWidgetComments() {
  if (!widgetCommentsPopup?.classList.contains("open") || !openWidgetCommentsId) return;
  const widget = widgets.find((item) => item.id === openWidgetCommentsId);
  if (!widget) return;
  const prefix = getWidgetCommentDomPrefix(widget);
  const listEl = document.getElementById(getPhotoWidgetCommentSectionIds(prefix).listId);
  if (!listEl) return;
  normalizePhotoWidgetComments(widget);
  const scrollTop = listEl.scrollTop;
  renderPhotoWidgetCommentsSection(widget, { prefix, title: "comments" });
  listEl.scrollTop = scrollTop;

  if (!pendingWidgetCommentFocusId) return;
  const selector = `[data-photo-widget-comment-row-id="${CSS.escape(pendingWidgetCommentFocusId)}"]`;
  if (listEl.querySelector(selector)) {
    pendingWidgetCommentFocusId = "";
    revealCommentRow(listEl, selector);
  }
}

function clearEntryReplyTarget() {
  const post = posts.find((item) => item.id === currentCommentsPostId);
  const target = getEntryReplyTarget(post);
  if (target && commentInput?.value.trim() === `@${getEntryCommentDisplayName(target)}`) {
    commentInput.value = "";
  }
  replyingToCommentId = null;
  replyingToItemId = null;
  syncEntryCommentComposer(post);
}

function prefillReplyMention(input, name, isReply, isMine) {
  if (!input) return;
  const mention = `@${name} `;
  if (isReply && !isMine && !input.value.startsWith(mention)) {
    input.value = `${mention}${input.value.replace(/^@\S+\s*/, "")}`;
  }
  input.focus();
  const end = input.value.length;
  input.setSelectionRange?.(end, end);
}

function getEntryCommentDisplayName(comment) {
  return comment?.nickname || "someone";
}

function getEntryCommentCreatedAt(comment) {
  return comment?.created_at || comment?.createdAt || "";
}

function getEntryReplyTarget(post) {
  if (!post || !replyingToCommentId) return null;

  const parent = (post.comments || []).find((comment) => comment.id === replyingToCommentId);
  if (!parent) return null;
  return getPostCommentById(post, replyingToItemId) || parent;
}

const expandedCommentThreads = new Set();

const COMMENT_THREAD_ATTRS = {
  entry: {
    row: "data-comment-id",
    text: "data-comment-text-id",
    preview: "data-comment-preview-id",
    profile: "data-comment-profile-id",
    like: "data-comment-like-id",
    reply: "data-comment-reply-id",
    remove: "data-comment-delete-id",
  },
  widget: {
    row: "data-photo-widget-comment-row-id",
    text: "data-photo-widget-comment-text-id",
    preview: "data-photo-widget-comment-preview-id",
    profile: "data-photo-widget-comment-profile-id",
    like: "data-photo-widget-like-comment-id",
    reply: "data-photo-widget-reply-comment-id",
    remove: "data-photo-widget-delete-comment-id",
  },
};

function formatCommentAge(dateString) {
  const timestamp = new Date(dateString).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 35) return `${Math.floor(days / 7)}w`;

  const date = new Date(timestamp);
  const year =
    date.getFullYear() === new Date().getFullYear()
      ? ""
      : `/${String(date.getFullYear()).slice(-2)}`;
  return `${date.getDate()}/${date.getMonth() + 1}${year}`;
}

function getCommentRowMarkup(kind, item) {
  const attrs = COMMENT_THREAD_ATTRS[kind];
  const id = escapeHtml(item.id);
  const userId = escapeHtml(item.userId || "");
  const name = escapeHtml(item.name);
  const liked = Boolean(item.liked);

  return `
    <div class="comment-row${item.isReply ? " is-reply" : ""}" ${attrs.row}="${id}">
      <span
        class="comment-row-avatar profile-trigger"
        ${attrs.profile}="${userId}"
        data-profile-name="${name}"
        aria-hidden="true"
      >${getCommentAvatarMarkup(item.userId)}</span>
      <div class="comment-row-body">
        <div class="comment-row-head">
          <span
            class="comment-row-name profile-trigger"
            role="button"
            tabindex="0"
            ${attrs.profile}="${userId}"
            data-profile-name="${name}"
          >${name}</span>
          <time
            class="comment-row-age"
            datetime="${escapeHtml(item.createdAt || "")}"
            title="${escapeHtml(formatEntryDate(item.createdAt))}"
          >${escapeHtml(formatCommentAge(item.createdAt))}</time>
        </div>
        <div class="comment-row-text" ${attrs.text}="${id}"></div>
        <div class="comment-link-preview-list link-preview-list" ${attrs.preview}="${id}" hidden></div>
        ${item.attachmentHtml ? `<div class="comment-row-attachment">${item.attachmentHtml}</div>` : ""}
        <div class="comment-row-actions">
          ${
            item.canReply
              ? `<button
            class="comment-row-action"
            type="button"
            ${attrs.reply}="${escapeHtml(item.parentId || item.id)}"
            data-reply-to-id="${id}"
          >reply</button>`
              : ""
          }
          ${
            item.canDelete
              ? `<button
            class="comment-row-action"
            type="button"
            ${attrs.remove}="${id}"
            data-is-reply="${String(Boolean(item.isReply))}"
          >delete</button>`
              : ""
          }
        </div>
      </div>
      <button
        class="comment-row-like${liked ? " liked" : ""}"
        type="button"
        ${attrs.like}="${id}"
        aria-pressed="${String(liked)}"
        aria-label="${liked ? "unlike" : "like"} comment"
      >${getCommentRowLikeInnerMarkup(liked, item.likeCount)}</button>
    </div>
  `;
}

function getCommentRowLikeInnerMarkup(liked, likeCount) {
  return `<span class="comment-row-heart" aria-hidden="true">${liked ? getLikedHeart() : "♡"}</span><span class="comment-row-like-count">${likeCount > 0 ? likeCount : ""}</span>`;
}

function getCommentThreadMarkup(kind, comment, replies = []) {
  const threadId = escapeHtml(comment.id);
  const count = replies.length;
  const expanded = count > 0 && expandedCommentThreads.has(comment.id);

  return `
    <div class="comment-thread" data-comment-thread-id="${threadId}">
      ${getCommentRowMarkup(kind, comment)}
      ${
        count
          ? `
        <div class="comment-thread-replies"${expanded ? "" : " hidden"}>
          ${replies.map((reply) => getCommentRowMarkup(kind, reply)).join("")}
        </div>
        <button
          class="comment-thread-toggle"
          type="button"
          data-comment-thread-toggle="${threadId}"
          data-reply-count="${count}"
          aria-expanded="${String(expanded)}"
        >${getCommentThreadToggleLabel(expanded, count)}</button>
      `
          : ""
      }
    </div>
  `;
}

function getCommentThreadToggleLabel(expanded, count) {
  const label = expanded ? "hide replies" : `view ${count} ${count === 1 ? "reply" : "replies"}`;
  return `<span class="comment-thread-toggle-line" aria-hidden="true"></span><span>${label}</span>`;
}

function setCommentThreadExpanded(listEl, threadId, expanded) {
  const thread = listEl?.querySelector(`[data-comment-thread-id="${CSS.escape(threadId)}"]`);
  const repliesEl = thread?.querySelector(".comment-thread-replies");
  const toggle = thread?.querySelector("[data-comment-thread-toggle]");
  if (!repliesEl || !toggle) return;

  if (expanded) expandedCommentThreads.add(threadId);
  else expandedCommentThreads.delete(threadId);
  repliesEl.hidden = !expanded;
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.innerHTML = getCommentThreadToggleLabel(expanded, Number(toggle.dataset.replyCount) || 0);
}

function bindCommentThreadToggles(listEl) {
  listEl?.querySelectorAll("[data-comment-thread-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      setCommentThreadExpanded(
        listEl,
        toggle.dataset.commentThreadToggle,
        toggle.getAttribute("aria-expanded") !== "true",
      );
    });
  });
}

function highlightCommentMention(textEl) {
  const first = textEl?.firstChild;
  if (!first || first.nodeType !== Node.TEXT_NODE) return;

  const value = first.nodeValue || "";
  if (!value.startsWith("@")) return;
  const knownName = knownProfiles
    .map((profile) => getProfileDisplayName(profile, ""))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .find((name) => value.slice(1, name.length + 1) === name);
  const length = knownName ? knownName.length + 1 : /^@\S+/.exec(value)?.[0].length || 0;
  if (length < 2) return;

  first.splitText(length);
  const mention = document.createElement("span");
  mention.className = "comment-mention";
  mention.textContent = first.nodeValue;
  first.replaceWith(mention);
}

function revealCommentRow(listEl, rowSelector, { highlight = true } = {}) {
  const row = listEl?.querySelector(rowSelector);
  if (!row) return;

  const thread = row.closest("[data-comment-thread-id]");
  if (row.classList.contains("is-reply") && thread) {
    setCommentThreadExpanded(listEl, thread.dataset.commentThreadId, true);
  }
  window.requestAnimationFrame(() => {
    row.scrollIntoView({ behavior: getScrollBehavior(), block: "nearest" });
    if (!highlight) return;
    row.classList.add("is-focused");
    window.setTimeout(() => row.classList.remove("is-focused"), 1800);
  });
}

function getCommentAvatarMarkup(userId) {
  const profile = getKnownProfileById(userId);
  const avatarUrl = String(profile?.avatar_url || "").trim();
  const name = getProfileDisplayName(profile, "someone");
  return avatarUrl
    ? `<span class="comment-avatar"><img src="${escapeHtml(avatarUrl)}" alt="" loading="eager" decoding="async" /></span>`
    : `<span class="comment-avatar comment-avatar-letter" aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase())}</span>`;
}

function cleanCommentContextText(text) {
  return String(text || "")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderCommentContext(el, { label = "", text = "", imageUrl = "", onCancel = null } = {}) {
  if (!el) return;
  const fullText = cleanCommentContextText(text);
  const contextKey = `${label}\n${fullText}`;
  const keepExpanded = el.dataset.contextKey === contextKey && el.classList.contains("is-expanded");
  el.dataset.contextKey = contextKey;
  el.replaceChildren();
  el.hidden = !label;
  el.classList.toggle("is-reply", Boolean(onCancel));
  el.classList.toggle("is-expanded", keepExpanded);
  if (!label) return;
  if (imageUrl) {
    const thumb = document.createElement("img");
    thumb.className = "comment-context-thumb";
    thumb.src = imageUrl;
    thumb.alt = "";
    thumb.loading = "lazy";
    el.appendChild(thumb);
  }
  const body = document.createElement("div");
  body.className = "comment-context-body";
  const labelEl = document.createElement("span");
  labelEl.className = "comment-context-label";
  labelEl.textContent = label;
  body.appendChild(labelEl);
  if (fullText) {
    const textEl = document.createElement("p");
    textEl.className = "comment-context-text";
    textEl.textContent = fullText;
    body.appendChild(textEl);
    if (fullText.length > 80 || fullText.includes("\n")) {
      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "comment-context-more";
      const syncMoreBtn = (expanded) => {
        moreBtn.textContent = expanded ? "see less" : "see more";
        moreBtn.setAttribute("aria-expanded", String(expanded));
      };
      syncMoreBtn(keepExpanded);
      moreBtn.addEventListener("click", () => {
        const expanded = !el.classList.contains("is-expanded");
        animateHeightChange(el, () => {
          el.classList.toggle("is-expanded", expanded);
          syncMoreBtn(expanded);
          if (!expanded) textEl.scrollTop = 0;
        });
      });
      body.appendChild(moreBtn);
    }
  }
  el.appendChild(body);
  if (onCancel) {
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "comment-context-cancel";
    cancelBtn.setAttribute("aria-label", "cancel reply");
    cancelBtn.textContent = "×";
    cancelBtn.addEventListener("click", onCancel);
    el.appendChild(cancelBtn);
  }
}

function getEntryCommentContext(post, replyTarget) {
  if (!post) return {};
  if (replyTarget) {
    return {
      label: `replying to ${getEntryCommentDisplayName(replyTarget)}`,
      text: replyTarget.text,
      onCancel: () => {
        clearEntryReplyTarget();
        commentInput?.focus();
      },
    };
  }
  const isMine = Boolean(currentProfile && post.userId === currentProfile.id);
  const holder = document.createElement("div");
  holder.innerHTML = post.contentLoaded ? sanitizePostHtml(post.text || "") : "";
  const imageUrl = holder.querySelector("img")?.getAttribute("src") || "";
  holder.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  holder
    .querySelectorAll("p, div, li, h1, h2, h3, blockquote")
    .forEach((block) => block.append("\n"));
  return {
    label: `commenting on ${isMine ? "your" : `${post.nickname || "their"}'s`} entry · ${formatEntryDate(post.created_at)}`,
    text: post.contentLoaded ? (holder.textContent || "").replace(/\u00a0/g, " ") : "",
    imageUrl,
  };
}

function syncEntryCommentComposer(post) {
  const replyTarget = getEntryReplyTarget(post);

  if (!replyTarget && replyingToCommentId) {
    replyingToCommentId = null;
    replyingToItemId = null;
  }

  if (commentInput) {
    commentInput.placeholder = replyTarget
      ? `reply to ${getEntryCommentDisplayName(replyTarget)} ♡`
      : "write a comment ♡";
  }

  if (saveCommentBtn) {
    saveCommentBtn.textContent = replyTarget ? "post reply" : "post comment";
  }

  renderCommentContext(commentContextEl, getEntryCommentContext(post, replyTarget));
}

function renderCommentsList(postId) {
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    renderCommentsSkeleton();
    return;
  }

  if (!post.comments || !post.comments.length) {
    if (commentsListLabel) {
      commentsListLabel.textContent = "comments";
    }
    syncEntryCommentComposer(post);
    commentsList.innerHTML = `<div class="comment-empty">no comments yet ♡</div>`;
    return;
  }

  const commentCount = getPostCommentCount(post);
  if (commentsListLabel) {
    commentsListLabel.textContent = `comments${commentCount ? ` (${commentCount})` : ""}`;
  }
  syncEntryCommentComposer(post);

  const sortedComments = getCommentsNewestFirst(post.comments);
  const toRowItem = (comment, parentId, isReply) => ({
    id: comment.id,
    parentId,
    userId: comment.userId || "",
    name: getEntryCommentDisplayName(comment),
    createdAt: getEntryCommentCreatedAt(comment),
    liked: Boolean(comment.likedByMe),
    likeCount: comment.likesCount || 0,
    canReply: true,
    canDelete: comment.userId === currentProfile?.id,
    isReply,
  });
  const getThreadReplies = (comment) => getCommentsNewestFirst(comment.replies).reverse();

  commentsList.innerHTML = sortedComments
    .map((comment) =>
      getCommentThreadMarkup(
        "entry",
        toRowItem(comment, comment.id, false),
        getThreadReplies(comment).map((reply) => toRowItem(reply, comment.id, true)),
      ),
    )
    .join("");

  sortedComments
    .flatMap((comment) => [comment, ...(comment.replies || [])])
    .forEach((item) => {
      const textEl = commentsList.querySelector(`[data-comment-text-id="${CSS.escape(item.id)}"]`);
      if (!textEl) return;
      renderTextWithLinkPreviews(
        textEl,
        commentsList.querySelector(`[data-comment-preview-id="${CSS.escape(item.id)}"]`),
        item.text,
      );
      highlightCommentMention(textEl);
    });

  bindCommentThreadToggles(commentsList);

  commentsList.querySelectorAll("[data-comment-reply-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      replyingToCommentId = btn.dataset.commentReplyId;
      replyingToItemId = btn.dataset.replyToId || replyingToCommentId;
      const target = getEntryReplyTarget(post);
      syncEntryCommentComposer(post);
      prefillReplyMention(
        commentInput,
        getEntryCommentDisplayName(target),
        replyingToItemId !== replyingToCommentId,
        target?.userId === currentProfile?.id,
      );
    });
  });

  commentsList.querySelectorAll("[data-comment-like-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await toggleCommentLike(btn.dataset.commentLikeId);
    });
  });

  commentsList.querySelectorAll("[data-comment-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openDeleteCommentConfirmation(btn.dataset.commentDeleteId, btn.dataset.isReply === "true");
    });
  });

  commentsList.querySelectorAll("[data-comment-profile-id]").forEach((nameEl) => {
    const profileId = nameEl.getAttribute("data-comment-profile-id") || "";
    const fallbackProfile = {
      id: profileId,
      nickname: nameEl.dataset.profileName || "someone",
    };
    bindProfilePopupTrigger(nameEl, () => openProfilePopupForUser(profileId, fallbackProfile));
  });
}

function openDeleteCommentConfirmation(commentId, isReply = false) {
  if (!commentId) return;

  openConfirmationDialog({
    title: isReply ? "delete reply?" : "delete comment?",
    message: `this ${isReply ? "reply" : "comment"} will be deleted forever.`,
    confirmLabel: "delete",
    pendingLabel: "deleting...",
    onConfirm: () => deleteComment(commentId),
  });
}

async function saveComment() {
  const content = commentInput.value.trim();
  commentWritesInFlight += 1;

  try {
    if (!content || !currentCommentsPostId) {
      showMessage("write something first silly! ♡");
      return;
    }

    if (!areBreakupWordsAllowed(content)) {
      return;
    }

    const user = currentUser;

    if (!user) {
      showMessage("log in first silly! ♡");
      return;
    }

    const postId = currentCommentsPostId;
    const parentCommentId = replyingToCommentId;
    if (String(parentCommentId || "").startsWith("local-comment-")) {
      showMessage("one moment, that comment is still saving ♡");
      return;
    }
    const temporaryCommentId = `local-comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticComment = {
      id: temporaryCommentId,
      post_id: postId,
      userId: user.id,
      text: content,
      created_at: new Date().toISOString(),
      parent_comment_id: parentCommentId,
      nickname: currentProfile?.nickname || currentProfile?.username || "someone",
      likesCount: 0,
      likedByMe: false,
      replies: [],
    };

    addCommentToPost(postId, optimisticComment);

    commentInput.value = "";
    replyingToCommentId = null;
    replyingToItemId = null;
    if (parentCommentId) expandedCommentThreads.add(parentCommentId);
    renderCommentsList(postId);
    revealCommentRow(commentsList, `[data-comment-id="${CSS.escape(temporaryCommentId)}"]`, {
      highlight: false,
    });
    syncPostCommentButton(postId);
    showMessage(parentCommentId ? "reply posted! ♡" : "comment posted! ♡");

    const { data: savedComment, error } = await trackTimelineWrite(
      dataStore
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId,
        })
        .select("id, created_at")
        .single(),
    );

    if (error) {
      console.error(error);
      removeCommentFromPost(postId, temporaryCommentId);
      renderCommentsList(postId);
      syncPostCommentButton(postId);
      if (currentCommentsPostId === postId && !commentInput.value) commentInput.value = content;
      showMessage(error.message);
      return;
    }

    updateLocalCommentId(postId, temporaryCommentId, savedComment);
    markLocalRealtimeTable("comments");
    if (currentCommentsPostId === postId) {
      renderCommentsList(postId);
    }
  } finally {
    commentWritesInFlight -= 1;
  }
}

async function deleteComment(commentId) {
  const postId = currentCommentsPostId;
  if (!postId || !commentId) return false;

  const removal = removeCommentFromPost(postId, commentId);
  const row = commentsList?.querySelector(`[data-comment-id="${CSS.escape(String(commentId))}"]`);
  const el = row?.classList.contains("is-reply") ? row : row?.closest(".comment-thread") || row;

  if (el) {
    el.style.transition = `opacity 0.35s ${MOTION_EASING}, transform 0.35s ${MOTION_EASING}`;
    el.style.opacity = "0";
    el.style.transform = "translateY(6px) scale(0.98)";
  }

  window.setTimeout(() => {
    if (currentCommentsPostId === postId) {
      renderCommentsList(postId);
    }
  }, 350);
  syncPostCommentButton(postId);

  const { error } = await trackTimelineWrite(
    dataStore.from("comments").delete().eq("id", commentId),
  );

  if (error) {
    console.error(error);
    removal?.restore();
    renderCommentsList(postId);
    syncPostCommentButton(postId);
    showMessage(error.message);
    return false;
  }

  markLocalRealtimeTable("comments");
  showMessage("comment deleted ♡");
  return true;
}

async function logoutUser() {
  userInitiatedLogout = true;
  const { error } = await dataStore.auth.signOut();

  if (error) {
    userInitiatedLogout = false;
    showMessage(error.message);
    return;
  }
  sessionExpiredNoticeShown = false;
  userInitiatedLogout = false;
  clearBootSnapshot();

  currentProfile = null;
  knownProfiles = [];
  setCurrentUser(null);
  closeProfileDetailsPopup();
  authPopup.classList.add("open");

  emailInput.value = "";
  passwordInput.value = "";
  nicknameInput.value = "";
  if (bioInput) {
    bioInput.value = "";
  }
  pfpInput.value = "";

  placedStickers = [];
  renderPlacedStickers();
  notifications = [];
  closeNotificationsPanel();
  renderSignedOutShell();

  showMessage("logged out ♡");
}

async function checkSession() {
  await loadPendingSaves();

  const {
    data: { session },
  } = await dataStore.auth.getSession();

  if (session?.user) {
    currentUser = session.user;
    sessionExpiredNoticeShown = false;
    authPopup.classList.remove("open");

    const loadEverything = (showSkeleton) => {
      if (!currentProfile) currentProfile = { id: session.user.id };
      return Promise.all([
        loadProfile(session.user),
        refreshUserData({ includeWidgets: true, showSkeleton }),
      ]);
    };

    if (await hydrateFromBootSnapshot(session.user)) {
      bootPaintedFromSnapshot = true;
      setCurrentUser(session.user);
      void loadEverything(false).catch((error) => console.error(error));
      return;
    }

    setCurrentUser(session.user);
    renderAppSkeleton();
    try {
      await loadEverything(true);
    } catch (error) {
      console.error(error);
      showMessage("couldn't load everything, pull to refresh ♡");
    } finally {
      setCurrentUser(session.user);
    }
  } else {
    currentProfile = null;
    knownProfiles = [];
    setCurrentUser(null);
    closeProfileDetailsPopup();
    authPopup.classList.add("open");
    posts = [];
    placedStickers = [];
    notifications = [];
    closeNotificationsPanel();
    renderSignedOutShell();
  }
}

const authForm = document.getElementById("authForm");
const authNote = document.getElementById("authNote");
const authDemoHint = document.getElementById("authDemoHint");
if (authDemoHint) {
  authDemoHint.textContent = `sign in as ${PEOPLE.map((person) => person.email).join(" or ")}, with any password`;
}
if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void loginUser();
  });
} else if (loginBtn) {
  loginBtn.addEventListener("click", loginUser);
}
if (notificationsBtn) {
  notificationsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!currentUser || !notificationsPanel) return;

    if (notificationsPanel.hidden) {
      openNotificationsPanel();
    } else {
      closeNotificationsPanel();
    }
  });
}
if (clearNotificationsBtn) {
  clearNotificationsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openConfirmationDialog({
      title: "clear notifications?",
      message: "visible notifications will be cleared from your inbox.",
      confirmLabel: "clear",
      pendingLabel: "clearing...",
      onConfirm: () => {
        clearNotifications();
        showMessage("notifications cleared ♡");
      },
    });
  });
}
if (closeNotificationsBtn) {
  closeNotificationsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeNotificationsPanel();
  });
}
if (passwordToggleBtn) {
  passwordToggleBtn.addEventListener("click", () => {
    setPasswordVisibility(passwordInput?.type === "password");
  });
}
if (saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfile);
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
if (saveEntryBtn) saveEntryBtn.addEventListener("click", saveEntry);
if (saveCommentBtn) saveCommentBtn.addEventListener("click", saveComment);
if (zoomOutBtn) {
  zoomOutBtn.addEventListener("click", () => adjustAppZoom(-APP_ZOOM_STEP));
}
if (zoomInBtn) {
  zoomInBtn.addEventListener("click", () => adjustAppZoom(APP_ZOOM_STEP));
}
if (zoomResetBtn) {
  zoomResetBtn.addEventListener("click", () => setAppZoom(DEFAULT_APP_ZOOM, { persist: true }));
}
if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
mobileViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMobileView(button.dataset.mobileView || "timeline");
  });
});
window.addEventListener(
  "scroll",
  () => {
    if (
      !mobileLayoutFloorScroll ||
      window.scrollY >= mobileLayoutFloorScroll ||
      mobileViewSwipeGesture?.dragging ||
      mobileViewSlide ||
      document.body.classList.contains("popup-scroll-locked")
    ) {
      return;
    }
    mobileLayoutFloorScroll = Math.max(0, window.scrollY);
    syncMobileLayoutHeight();
  },
  { passive: true },
);
if (typeof ResizeObserver === "function") {
  const mobileViewResizeObserver = new ResizeObserver(() => {
    if (!mobileViewSwipeGesture?.dragging && !mobileViewSlide) syncMobileLayoutHeight();
  });
  MOBILE_VIEW_ORDER.forEach((view) => {
    const section = getMobileViewSection(view);
    if (section) mobileViewResizeObserver.observe(section);
  });
}
document.addEventListener("touchstart", handleMobileViewSwipeStart, {
  passive: true,
});
document.addEventListener("touchmove", handleMobileViewSwipeMove, {
  passive: false,
});
document.addEventListener("touchend", handleMobileViewSwipeEnd, {
  passive: true,
});
document.addEventListener("touchcancel", handleMobileViewSwipeCancel, {
  passive: true,
});
document.addEventListener(
  "click",
  (event) => {
    if (performance.now() >= mobileViewSwipeClickBlockUntil) return;
    event.preventDefault();
    event.stopPropagation();
  },
  true,
);

const PULL_REFRESH_LOCK_DISTANCE = 12;
const PULL_REFRESH_TRIGGER = 56;
const PULL_REFRESH_MAX = 84;
const PULL_REFRESH_RESISTANCE = 72;
const PULL_REFRESH_MIN_SHOW_MS = 450;
const PULL_REFRESH_MAX_SHOW_MS = 6000;
const PULL_REFRESH_QUEUE_MS = 5000;
const PULL_REFRESH_UPDATE_MS = 8000;
const PULL_REFRESH_DONE_SHOW_MS = 380;
const PULL_REFRESH_TIMEOUT_MS = 15000;
const pullRefreshIndicator = document.createElement("div");
pullRefreshIndicator.className = "pull-refresh";
pullRefreshIndicator.hidden = true;
pullRefreshIndicator.setAttribute("aria-hidden", "true");
pullRefreshIndicator.innerHTML = '<span class="pull-refresh-mark">♡</span>';
document.body.appendChild(pullRefreshIndicator);
const pullRefreshMark = pullRefreshIndicator.firstElementChild;
let pullRefreshGesture = null;
let pullRefreshRunning = false;
let pullRefreshHideTimer = 0;

function shouldIgnorePullRefresh(target) {
  if (!target?.closest) return false;
  if (
    target.closest(
      ".notifications-panel, .timeline-scrubber, .reaction-sticker, .ql-editor, input, textarea, select, [contenteditable='true']",
    )
  ) {
    return true;
  }

  let node = target instanceof Element ? target : target.parentElement;
  while (node && node !== document.body) {
    if (node.scrollTop > 0) return true;
    node = node.parentElement;
  }
  return false;
}

function setPullRefreshDistance(distance) {
  const progress = Math.min(1, distance / PULL_REFRESH_TRIGGER);
  pullRefreshIndicator.style.transform = `translate3d(-50%, ${distance}px, 0)`;
  pullRefreshIndicator.style.opacity = String(progress);
  pullRefreshIndicator.style.setProperty("--pull-progress", String(progress));
  const wasReady = pullRefreshIndicator.classList.contains("is-ready");
  pullRefreshIndicator.classList.toggle("is-ready", progress >= 1);
  if (progress >= 1 && !wasReady && pullRefreshGesture) navigator.vibrate?.(8);
}

function hidePullRefresh() {
  window.clearTimeout(pullRefreshHideTimer);
  pullRefreshIndicator.classList.remove("is-pulling", "is-refreshing");
  setPullRefreshDistance(0);
  pullRefreshHideTimer = window.setTimeout(() => {
    pullRefreshIndicator.hidden = true;
    pullRefreshIndicator.classList.remove("is-done");
    pullRefreshMark.textContent = "♡";
  }, 280);
}

function abandonPullRefresh() {
  const wasPulling = pullRefreshGesture?.pulling;
  pullRefreshGesture = null;
  if (wasPulling && !pullRefreshRunning) hidePullRefresh();
}

const waitMs = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function installNewSiteVersion() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (!registration) return false;
    await registration.update();
    const worker = registration.installing || registration.waiting;
    if (!worker) return false;
    return await new Promise((resolve) => {
      const check = () => {
        if (worker.state === "activated") resolve(true);
        if (worker.state === "redundant") resolve(false);
      };
      worker.addEventListener("statechange", check);
      check();
      window.setTimeout(() => resolve(false), PULL_REFRESH_UPDATE_MS);
    });
  } catch (error) {
    console.error(error);
    return false;
  }
}

function canReloadForNewVersion() {
  return (
    !document.querySelector(".popup.open") &&
    !uploadMeter &&
    !pendingSaves.some((save) => save.running)
  );
}

async function runPullRefresh() {
  pullRefreshRunning = true;
  pullRefreshIndicator.classList.remove("is-pulling");
  pullRefreshIndicator.classList.add("is-refreshing");
  setPullRefreshDistance(PULL_REFRESH_TRIGGER);

  const newVersion = installNewSiteVersion();
  let outcome = "";
  const work = (async () => {
    const queuedUntil = performance.now() + PULL_REFRESH_QUEUE_MS;
    while (liveRefreshInFlight && performance.now() < queuedUntil) await waitMs(50);
    liveRefreshInFlight = true;
    try {
      retryPendingSaves();
      await refreshUserData({ includeWidgets: true });
      outcome = "done";
    } catch (error) {
      console.error(error);
      outcome = "failed";
    }
  })();
  void Promise.race([work, waitMs(PULL_REFRESH_TIMEOUT_MS)]).then(() => {
    liveRefreshInFlight = false;
    if (liveRefreshQueued || liveRefreshIncludeWidgets) {
      const includeWidgets = liveRefreshIncludeWidgets;
      liveRefreshQueued = false;
      liveRefreshIncludeWidgets = false;
      scheduleLiveDataRefresh({ includeWidgets });
    }
  });

  await Promise.all([
    waitMs(PULL_REFRESH_MIN_SHOW_MS),
    Promise.race([work, waitMs(PULL_REFRESH_MAX_SHOW_MS)]),
  ]);

  pullRefreshIndicator.classList.remove("is-refreshing");
  if (outcome === "done") {
    pullRefreshIndicator.classList.add("is-done");
    pullRefreshMark.textContent = "♥";
    await waitMs(PULL_REFRESH_DONE_SHOW_MS);
  } else if (outcome === "failed") {
    showMessage("couldn't refresh, try again in a moment ♡");
  }
  pullRefreshRunning = false;
  hidePullRefresh();

  if ((await newVersion) && canReloadForNewVersion()) window.location.reload();
}

document.addEventListener(
  "touchstart",
  (event) => {
    abandonPullRefresh();
    if (
      !currentUser ||
      pullRefreshRunning ||
      event.touches.length !== 1 ||
      document.querySelector(".popup.open") ||
      dragWidget ||
      pendingWidgetDrag ||
      shouldIgnorePullRefresh(event.target)
    ) {
      return;
    }
    const touch = event.touches[0];
    pullRefreshGesture = {
      startX: touch.clientX,
      startY: touch.clientY,
      waitingForTop: window.scrollY > 0,
      pulling: false,
      distance: 0,
    };
  },
  { passive: true },
);

document.addEventListener(
  "touchmove",
  (event) => {
    const gesture = pullRefreshGesture;
    if (!gesture) return;
    if (gesture.waitingForTop) {
      if (window.scrollY > 0) return;
      gesture.waitingForTop = false;
      gesture.startX = event.touches[0].clientX;
      gesture.startY = event.touches[0].clientY;
    }
    if (
      event.touches.length !== 1 ||
      window.scrollY > 0 ||
      draggingPlacedSticker ||
      dragWidget ||
      pendingWidgetDrag
    ) {
      abandonPullRefresh();
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;

    if (!gesture.pulling) {
      if (
        mobileViewSwipeGesture?.lockedAxis === "x" ||
        deltaY < -PULL_REFRESH_LOCK_DISTANCE ||
        Math.abs(deltaX) > Math.max(PULL_REFRESH_LOCK_DISTANCE, deltaY)
      ) {
        pullRefreshGesture = null;
        return;
      }
      if (deltaY > 0 && deltaY >= Math.abs(deltaX) && event.cancelable) {
        event.preventDefault();
      }
      if (deltaY < PULL_REFRESH_LOCK_DISTANCE) return;
      gesture.pulling = true;
      gesture.startY = touch.clientY;
      mobileViewSwipeGesture = null;
      window.clearTimeout(pullRefreshHideTimer);
      pullRefreshIndicator.hidden = false;
      pullRefreshIndicator.classList.remove("is-done");
      pullRefreshMark.textContent = "♡";
      pullRefreshIndicator.classList.add("is-pulling");
    }

    if (event.cancelable) event.preventDefault();
    const pulled = Math.max(0, touch.clientY - gesture.startY);
    gesture.distance = PULL_REFRESH_MAX * (1 - Math.exp(-pulled / PULL_REFRESH_RESISTANCE));
    setPullRefreshDistance(gesture.distance);
  },
  { passive: false },
);

function endPullRefresh() {
  const gesture = pullRefreshGesture;
  pullRefreshGesture = null;
  if (!gesture?.pulling) return;
  if (gesture.distance >= PULL_REFRESH_TRIGGER) void runPullRefresh();
  else hidePullRefresh();
}
document.addEventListener("touchend", endPullRefresh, { passive: true });
document.addEventListener("touchcancel", abandonPullRefresh, { passive: true });
window.addEventListener("blur", abandonPullRefresh);
document.addEventListener("visibilitychange", abandonPullRefresh);
window.addEventListener(
  "scroll",
  () => {
    if (window.scrollY > 0 && !pullRefreshGesture?.waitingForTop) abandonPullRefresh();
  },
  { passive: true },
);

const UPLOAD_METER_CREEP_MS = 1500;
const UPLOAD_METER_FILL_MS = 150;
const UPLOAD_METER_MIN_SHOW_MS = 600;
const UPLOAD_METER_DONE_SHOW_MS = 460;
const UPLOAD_METER_HIDE_MS = 360;
const uploadMeterEl = document.createElement("div");
uploadMeterEl.className = "pull-refresh upload-meter";
uploadMeterEl.hidden = true;
uploadMeterEl.setAttribute("role", "status");
uploadMeterEl.setAttribute("aria-label", "saving");
uploadMeterEl.innerHTML = '<span class="pull-refresh-mark" aria-hidden="true">♡</span>';
document.body.appendChild(uploadMeterEl);
const uploadMeterMark = uploadMeterEl.firstElementChild;
let uploadMeter = null;
let uploadMeterHideTimer = 0;

function hideUploadMeter() {
  uploadMeter = null;
  window.clearTimeout(uploadMeterHideTimer);
  uploadMeterEl.classList.remove("is-visible");
  uploadMeterHideTimer = window.setTimeout(() => {
    uploadMeterEl.hidden = true;
    uploadMeterEl.classList.remove("is-done");
    uploadMeterMark.textContent = "♡";
  }, UPLOAD_METER_HIDE_MS);
}

function showUploadMeterDone() {
  uploadMeter = null;
  uploadMeterEl.style.setProperty("--pull-progress", "1");
  uploadMeterEl.classList.add("is-done");
  uploadMeterMark.textContent = "♥";
  uploadMeterEl.setAttribute("aria-label", "saved");
  uploadMeterHideTimer = window.setTimeout(hideUploadMeter, UPLOAD_METER_DONE_SHOW_MS);
}

function runUploadMeter(now) {
  const meter = uploadMeter;
  if (!meter) return;

  const elapsed = Math.max(1, now - meter.lastFrame);
  meter.lastFrame = now;
  const finished = meter.total - meter.waiting;
  const isComplete = meter.waiting === 0;
  const target = isComplete ? 1 : (finished + 0.92) / meter.total;
  const pace = isComplete ? UPLOAD_METER_FILL_MS : UPLOAD_METER_CREEP_MS;
  if (target > meter.shown) {
    meter.shown += (target - meter.shown) * (1 - Math.exp(-elapsed / pace));
  }
  uploadMeterEl.style.setProperty("--pull-progress", meter.shown.toFixed(4));

  if (isComplete && meter.shown > 0.99 && now - meter.startedAt >= UPLOAD_METER_MIN_SHOW_MS) {
    showUploadMeterDone();
  } else {
    requestAnimationFrame(runUploadMeter);
  }
}

function startUploadMeter(waiting) {
  const now = performance.now();
  uploadMeter = { total: waiting, waiting, shown: 0, startedAt: now, lastFrame: now };
  window.clearTimeout(uploadMeterHideTimer);
  uploadMeterEl.classList.remove("is-done");
  uploadMeterMark.textContent = "♡";
  uploadMeterEl.setAttribute("aria-label", "saving");
  uploadMeterEl.style.setProperty("--pull-progress", "0");
  uploadMeterEl.hidden = false;
  void uploadMeterEl.offsetWidth;
  uploadMeterEl.classList.add("is-visible");
  requestAnimationFrame(runUploadMeter);
}

function syncUploadMeter() {
  if (!pendingSavesReady) return;

  if (navigator.onLine === false) {
    if (uploadMeter) hideUploadMeter();
    return;
  }

  const metered = pendingSaves.filter((save) => save.showsMeter);
  const waiting = metered.filter((save) => !save.failed).length;

  if (!uploadMeter) {
    if (waiting) startUploadMeter(waiting);
    return;
  }

  if (!waiting && metered.length) {
    hideUploadMeter();
    return;
  }
  uploadMeter.total += Math.max(0, waiting - uploadMeter.waiting);
  uploadMeter.waiting = waiting;
}

document.addEventListener("beforeinput", handleBreakupGuardBeforeInput, true);
document.addEventListener("paste", handleBreakupGuardPaste, true);
window.addEventListener("scroll", requestFloatingEntryButtonVisibilityUpdate, {
  passive: true,
});
window.addEventListener("resize", requestMobileViewSwitcherVisibilitySync, {
  passive: true,
});
window.addEventListener("focus", () => {
  if (!currentUser) return;
  void touchCurrentUserPresence({ force: true });
  scheduleLiveDataRefresh({ includeWidgets: true, debounceMs: 120, minIntervalMs: 30000 });
});
window.addEventListener("pagehide", () => {
  if (!currentUser) return;
  void touchCurrentUserPresence({ force: true });
});
document.addEventListener("visibilitychange", () => {
  if (!currentUser) return;
  void touchCurrentUserPresence({ force: true });

  if (document.visibilityState !== "visible") return;
  scheduleLiveDataRefresh({ includeWidgets: true, debounceMs: 120, minIntervalMs: 30000 });
});
updateFloatingEntryButtonVisibility();
document.addEventListener("click", (event) => {
  if (!notificationsMenu?.contains(event.target)) {
    closeNotificationsPanel();
  }
});
const BOOT_SNAPSHOT_STORAGE_KEY = "bootSnapshotV1";
const BOOT_WIDGET_PHOTOS_STORAGE_KEY = "bootWidgetPhotos";
let bootSnapshotTimer = 0;
let bootDbPromise = null;

function openBootDb() {
  if (!bootDbPromise) {
    bootDbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open("tandem-boot", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("kv");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return bootDbPromise;
}

async function bootDbRequest(mode, run) {
  const db = await openBootDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const store = db.transaction("kv", mode).objectStore("kv");
      const request = run(store);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

const PENDING_SAVES_STORAGE_KEY = "pendingSavesV1";
const PENDING_SAVE_MAX_TRIES = 3;
const PENDING_SAVE_TIMEOUT_MS = 120000;
const WIDGET_SAVE_MERGE_TRIES = 3;
let pendingSavesLoaded = false;
let pendingSavesReady = false;
let pendingSavesRunning = false;
let pendingSaveRetryTimer = 0;

function isPendingPostId(postId) {
  return String(postId || "").startsWith(PENDING_POST_ID_PREFIX);
}

function getPendingEntrySave(postId) {
  return pendingSaves.find((save) => save.kind === "entry" && save.postId === postId) || null;
}

function getPendingWidgetSaves(widgetId) {
  return pendingSaves.filter((save) => save.kind === "widget" && save.widgetId === widgetId);
}

function getPendingWidgetSave(widgetId) {
  return getPendingWidgetSaves(widgetId).pop() || null;
}

function persistPendingSaves() {
  const stored = pendingSaves.map(
    ({ run, running, failed, tries, localAvatarUrl, ...save }) => save,
  );
  return bootDbRequest("readwrite", (store) => store.put(stored, PENDING_SAVES_STORAGE_KEY));
}

async function loadPendingSaves() {
  if (pendingSavesLoaded) return;
  pendingSavesLoaded = true;
  const stored = await bootDbRequest("readonly", (store) => store.get(PENDING_SAVES_STORAGE_KEY));
  if (!Array.isArray(stored)) return;
  pendingSaves = [
    ...stored.map((save) =>
      save.kind === "profile" && save.file
        ? { ...save, localAvatarUrl: URL.createObjectURL(save.file) }
        : save,
    ),
    ...pendingSaves,
  ];
}

function addPendingSave(save) {
  pendingSaves.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `save-${Date.now()}`,
    userId: currentUser?.id || currentProfile?.id || "",
    ...save,
  });
  void persistPendingSaves();
  void runPendingSaves();
}

function removePendingSave(save) {
  pendingSaves = pendingSaves.filter((item) => item !== save);
  void persistPendingSaves();
  syncUploadMeter();
}

function getChangedWidgetDataKeys(before, after) {
  const previous = before && typeof before === "object" ? before : {};
  const next = after && typeof after === "object" ? after : {};
  return [...new Set([...Object.keys(previous), ...Object.keys(next)])].filter(
    (key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]),
  );
}

function queueWidgetSave(widget, options = {}) {
  const {
    showsMeter = false,
    notifyUpdate = false,
    ownLikeOnly = false,
    ownThinkingOfYouTap = false,
    recordHistory = true,
  } = options;
  if (notifyUpdate) markWidgetContentUpdated(widget);

  const serverData = widgetServerData.get(widget.id);
  const changedKeys =
    options.changedKeys ||
    (serverData === undefined
      ? null
      : getChangedWidgetDataKeys(JSON.parse(serverData), widget.data));

  const snapshot = JSON.parse(
    JSON.stringify({
      title: widget.title,
      data: widget.data || null,
      content: widget.content || null,
    }),
  );
  const queued = pendingSaves.find(
    (save) => save.kind === "widget" && save.widgetId === widget.id && !save.running,
  );
  if (queued) {
    const editsLikes = (keys) => !keys || keys.includes("likes");
    queued.ownLikeOnly = queued.ownLikeOnly
      ? ownLikeOnly || !editsLikes(changedKeys)
      : ownLikeOnly && !editsLikes(queued.changedKeys);
    queued.snapshot = snapshot;
    queued.changedKeys =
      queued.changedKeys && changedKeys
        ? [...new Set([...queued.changedKeys, ...changedKeys])]
        : null;
    queued.showsMeter = queued.showsMeter || showsMeter;
    queued.ownThinkingOfYouTap = queued.ownThinkingOfYouTap || ownThinkingOfYouTap;
    queued.recordHistory = queued.recordHistory || recordHistory;
    void persistPendingSaves();
    void runPendingSaves();
    return;
  }
  addPendingSave({
    kind: "widget",
    widgetId: widget.id,
    snapshot,
    changedKeys,
    showsMeter,
    ownLikeOnly,
    ownThinkingOfYouTap,
    recordHistory,
  });
}

function mergeOwnWidgetLike(merged, latest, local, userId) {
  const liked = getWidgetLikeUserIds({ data: local }).includes(userId);
  const others = getWidgetLikeUserIds({ data: latest }).filter((id) => id !== userId);
  merged.likes = liked ? [...others, userId] : others;

  const timestamps = { ...getWidgetLikeTimestamps({ data: latest }) };
  const credits = { ...getWidgetProfileLikeCredits({ data: latest }) };
  delete timestamps[userId];
  delete credits[userId];
  const localTimestamp = getWidgetLikeTimestamps({ data: local })[userId];
  const localCredit = getWidgetProfileLikeCredits({ data: local })[userId];
  if (liked && localTimestamp) timestamps[userId] = localTimestamp;
  if (localCredit) credits[userId] = localCredit;
  merged.likeTimestamps = timestamps;
  merged.profileLikeCredits = credits;
}

function mergeOwnThinkingOfYouTap(merged, latest, local, userId) {
  const sameDay = latest.lastResetDate === local.lastResetDate;
  const withOwn = (key, base) => ({ ...base, [userId]: local[key]?.[userId] });
  merged.countsByUser = sameDay ? withOwn("countsByUser", latest.countsByUser) : local.countsByUser;
  merged.totalCountsByUser = withOwn("totalCountsByUser", latest.totalCountsByUser);
  merged.thinkingOfYouStreaks = withOwn("thinkingOfYouStreaks", latest.thinkingOfYouStreaks);
  const isOwn = (event) => String(event?.actorId || event?.userId || "") === userId;
  merged.thinkingOfYouEvents = [
    ...(latest.thinkingOfYouEvents || []).filter((event) => !isOwn(event)),
    ...(local.thinkingOfYouEvents || []).filter(isOwn),
  ]
    .sort((a, b) => String(a?.createdAt || "").localeCompare(String(b?.createdAt || "")))
    .slice(-60);
}

function mergeListById(base, latest, local, mergeChanged) {
  const baseById = new Map(base.map((item) => [item.id, item]));
  const latestById = new Map(latest.map((item) => [item.id, item]));
  const localIds = new Set(local.map((item) => item.id));
  return [
    ...latest.filter((item) => !baseById.has(item.id) && !localIds.has(item.id)),
    ...local.flatMap((item) => {
      const baseItem = baseById.get(item.id);
      const latestItem = latestById.get(item.id);
      if (!latestItem) return baseItem ? [] : [item];
      if (baseItem && JSON.stringify(baseItem) === JSON.stringify(item)) return [latestItem];
      return [mergeChanged(baseItem, latestItem, item)];
    }),
  ];
}

function mergeWidgetComments(base = [], latest = [], local = []) {
  return mergeListById(base, latest, local, (baseComment, latestComment, comment) => ({
    ...comment,
    replies: mergeListById(
      baseComment?.replies || [],
      latestComment.replies || [],
      comment.replies || [],
      (baseReply, latestReply, reply) => reply,
    ),
  }));
}

function applyPendingSavesToPosts() {
  const userId = currentUser?.id || currentProfile?.id || "";

  pendingSaves
    .filter((save) => save.userId === userId)
    .forEach((save) => {
      if (save.kind === "profile") {
        const avatar = save.localAvatarUrl ? { avatar_url: save.localAvatarUrl } : {};
        currentProfile = { ...currentProfile, ...save.updates, ...avatar };
        posts = posts.map((post) =>
          post.userId === userId
            ? {
                ...post,
                nickname: currentProfile.nickname,
                avatarUrl: currentProfile.avatar_url || "",
              }
            : post,
        );
      } else if (save.kind === "entry" && !save.isNew) {
        const post = getPostById(save.postId);
        if (post) {
          post.text = save.localContent;
          post.contentLoaded = true;
          post.contentStale = false;
          post.isEdited = true;
        }
      } else if (
        save.kind === "entry" &&
        !getPostById(save.postId) &&
        !(save.savedId && getPostById(save.savedId))
      ) {
        posts = [
          {
            id: save.postId,
            userId,
            text: save.localContent,
            contentLoaded: true,
            contentStale: false,
            created_at: save.createdAt,
            isEdited: false,
            author: "posted by you",
            nickname: currentProfile?.nickname || currentProfile?.username || "someone",
            avatarUrl: currentProfile?.avatar_url || "",
            likesCount: 0,
            likedByMe: false,
            comments: [],
          },
          ...posts,
        ];
      }
    });
}

async function preloadImage(url) {
  if (!url) return;
  try {
    const image = new Image();
    image.src = url;
    await Promise.race([
      image.decode(),
      new Promise((resolve) => window.setTimeout(resolve, 4000)),
    ]);
  } catch {}
}

function preloadEntryImage(content) {
  return preloadImage(extractEntryAttachment(content).image);
}

async function findInsertedPost(save) {
  const since = new Date(new Date(save.createdAt).getTime() - 10 * 60 * 1000);
  const { data, error } = await dataStore
    .from("posts")
    .select("id, content, created_at, user_id")
    .eq("user_id", save.userId)
    .gte("created_at", since.toISOString());
  if (error) throw error;
  return (data || []).find((row) => row.content === save.finalContent) || null;
}

async function runEntrySave(save) {
  if (save.finalContent === undefined) {
    const imageUrl = await uploadEntryImageData(save.userId, save.image);
    save.finalContent = composeEntryContentWithAttachment(save.text, imageUrl);
    delete save.image;
    await persistPendingSaves();
  }

  let savedPost = null;
  if (save.isNew) {
    if (save.inserting) savedPost = await findInsertedPost(save);
    if (!savedPost) {
      save.inserting = true;
      await persistPendingSaves();
      const { data, error } = await dataStore
        .from("posts")
        .insert({ user_id: save.userId, content: save.finalContent })
        .select("id, content, created_at, user_id")
        .single();
      if (error) throw error;
      savedPost = data;
    }
    save.savedId = savedPost.id;
  } else {
    const { data, error } = await dataStore
      .from("posts")
      .update({ content: save.finalContent, created_at: save.createdAt })
      .eq("id", save.postId)
      .eq("user_id", save.userId)
      .select("id, content, created_at, user_id")
      .maybeSingle();
    if (error) throw error;
    savedPost = data;
  }

  markLocalRealtimeTable("posts");
  await preloadEntryImage(save.finalContent);
  removePendingSave(save);

  const postId = savedPost?.id || save.postId;
  const content = savedPost?.content || save.finalContent;
  if (save.isNew && getPostById(postId)) {
    posts = posts.filter((post) => post.id !== save.postId);
  } else {
    const card = timelineEl.querySelector(
      `article.post[data-post-id="${CSS.escape(save.postId)}"]`,
    );
    if (card) card.dataset.postId = postId;
    posts = posts.map((post) =>
      post.id === save.postId
        ? {
            ...post,
            id: postId,
            text: content,
            created_at: savedPost?.created_at || post.created_at,
          }
        : post,
    );
  }
  renderTimeline();
  scheduleBootSnapshotSave();
}

async function runWidgetSave(save) {
  const getWidget = () => widgets.find((item) => item.id === save.widgetId);
  if (!getWidget()) return;

  const movePhoto = async (key) => {
    const image = save.snapshot.data?.[key];
    if (!isInlineImageDataUrl(image)) return;
    const url = await uploadEntryImageData(save.userId, image, "widget-photos");
    await preloadImage(url);
    [save.snapshot.data, getWidget()?.data].forEach((data) => {
      if (data?.[key] === image) data[key] = url;
    });
  };
  const isLastTry = (save.tries || 0) >= PENDING_SAVE_MAX_TRIES - 1;

  if (isKeepsakeWidget(getWidget())) {
    try {
      await movePhoto("image");
    } catch (error) {
      if (!isLastTry) throw error;
      console.error(error);
    }
    try {
      await movePhoto("originalImage");
    } catch (error) {
      if (!isLastTry) throw error;
      console.error(error);
      [save.snapshot.data, getWidget()?.data].forEach((data) => {
        delete data?.originalImage;
        delete data?.edits;
      });
    }
    await persistPendingSaves();
  }

  for (let attempt = 0; ; attempt += 1) {
    let onlyIfUpdatedAt = "";
    if (save.changedKeys) {
      const latestRow = await fetchLatestWidgetRow(save.widgetId);
      const widget = getWidget();
      if (latestRow?.data && widget?.data) {
        if (attempt < WIDGET_SAVE_MERGE_TRIES) onlyIfUpdatedAt = latestRow.updated_at || "";
        const saves = getPendingWidgetSaves(save.widgetId);
        const local = { ...widget.data };
        const merged = { ...latestRow.data };
        saves.forEach((item) => {
          const data = item.snapshot.data || {};
          (item.changedKeys || []).forEach((key) => {
            if (key in data) {
              local[key] = data[key];
              merged[key] = data[key];
            } else {
              delete local[key];
              delete merged[key];
            }
          });
        });
        if (saves.some((item) => item.ownLikeOnly)) {
          mergeOwnWidgetLike(merged, latestRow.data, local, save.userId);
        }
        if (saves.some((item) => item.ownThinkingOfYouTap)) {
          mergeOwnThinkingOfYouTap(merged, latestRow.data, local, save.userId);
        }
        if (
          saves.some((item) => item.changedKeys?.includes("comments")) &&
          Array.isArray(local.comments)
        ) {
          const serverData = JSON.parse(widgetServerData.get(save.widgetId) || "null");
          merged.comments = mergeWidgetComments(
            serverData?.comments,
            Array.isArray(latestRow.data.comments) ? latestRow.data.comments : [],
            local.comments,
          );
        }
        widget.data = merged;
      }
    }

    const saved = await saveWidget(getWidget(), {
      recordHistory: save.recordHistory !== false && attempt === 0,
      suppressErrorMessage: true,
      onlyIfUpdatedAt,
    });
    if (!saved) throw new Error("could not save widget");
    if (saved !== WIDGET_SAVE_CONFLICT) break;
  }
  removePendingSave(save);
  syncWidgetLikeButton(save.widgetId);
  syncWidgetCommentButton(save.widgetId);
  scheduleBootSnapshotSave();
}

async function runProfileSave(save) {
  const updates = { ...save.updates };
  if (save.file) {
    if (!save.avatarUrl) {
      save.avatarUrl = await uploadProfileAvatarFile(save.userId, save.file);
      await persistPendingSaves();
    }
    await preloadImage(save.avatarUrl);
    updates.avatar_url = save.avatarUrl;
  }

  const typedNickname = nicknameInput.value;
  const typedBio = bioInput?.value;
  const savedProfile = await updateCurrentUserProfile(updates, { throwOnError: true });
  nicknameInput.value = typedNickname;
  if (bioInput) bioInput.value = typedBio;
  if (!savedProfile) throw new Error("could not save profile");

  removePendingSave(save);
  applyProfileToTimeline(currentProfile);
  if (save.localAvatarUrl) URL.revokeObjectURL(save.localAvatarUrl);
  if (profilePopup?.classList.contains("open") && activeProfilePopupUserId === save.userId) {
    renderProfilePopupAvatar(currentProfile);
  }
  scheduleBootSnapshotSave();
}

async function runPendingSaves() {
  syncUploadMeter();
  if (pendingSavesRunning || !pendingSavesReady || navigator.onLine === false) return;
  pendingSavesRunning = true;
  window.clearTimeout(pendingSaveRetryTimer);

  try {
    for (;;) {
      const save = pendingSaves.find((item) => item.userId === currentUser?.id && !item.failed);
      if (!save) return;

      save.running = true;
      let timeout = 0;
      try {
        save.run ||= (
          save.kind === "entry"
            ? runEntrySave(save)
            : save.kind === "widget"
              ? runWidgetSave(save)
              : runProfileSave(save)
        ).finally(() => {
          save.run = null;
          save.running = false;
        });
        await Promise.race([
          save.run,
          new Promise((_, reject) => {
            timeout = window.setTimeout(
              () => reject(new Error("save timed out")),
              PENDING_SAVE_TIMEOUT_MS,
            );
          }),
        ]);
        removePendingSave(save);
      } catch (error) {
        console.error(error);
        save.tries = (save.tries || 0) + 1;
        if (save.tries < PENDING_SAVE_MAX_TRIES) {
          pendingSaveRetryTimer = window.setTimeout(
            () => void runPendingSaves(),
            1500 * 2 ** save.tries,
          );
          return;
        }
        save.failed = true;
        syncUploadMeter();
        renderTimeline();
        showMessage(
          isAuthExpiredError(String(error?.message || ""))
            ? error.message
            : "not saved yet, will keep trying ♡",
        );
      } finally {
        window.clearTimeout(timeout);
        save.running = Boolean(save.run);
      }
    }
  } finally {
    pendingSavesRunning = false;
  }
}

function retryPendingSaves() {
  resendUnsavedWidgetPositions();
  if (!pendingSaves.length) return;
  const hadFailed = pendingSaves.some((save) => save.failed);
  pendingSaves.forEach((save) => {
    save.failed = false;
    save.tries = 0;
  });
  if (hadFailed) renderTimeline();
  void runPendingSaves();
}

window.addEventListener("online", retryPendingSaves);
window.addEventListener("offline", syncUploadMeter);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") retryPendingSaves();
});

function scheduleBootSnapshotSave() {
  window.clearTimeout(bootSnapshotTimer);
  bootSnapshotTimer = window.setTimeout(saveBootSnapshot, 1500);
}

function saveBootSnapshot() {
  const userId = currentProfile?.id || currentUser?.id;
  if (!userId || !posts.length) return;

  const visibleIds = new Set(getVisibleTimelinePostIds().slice(0, TIMELINE_PAGE_SIZE));
  const snapshot = {
    v: 1,
    userId,
    savedAt: Date.now(),
    profile: currentProfile,
    knownProfiles,
    placedStickers,
    widgets,
    widgetServerData: Object.fromEntries(widgetServerData),
    posts: posts
      .filter((post) => !isPendingPostId(post.id))
      .map((post) => {
        const keepText = visibleIds.has(post.id) && post.contentLoaded && !post.contentMissing;
        return {
          ...post,
          text: keepText ? post.text : undefined,
          contentLoaded: keepText,
          contentStale: false,
        };
      }),
  };

  try {
    void bootDbRequest("readwrite", (store) =>
      store.put(JSON.parse(JSON.stringify(snapshot)), BOOT_SNAPSHOT_STORAGE_KEY),
    );
    localStorage.setItem(
      BOOT_WIDGET_PHOTOS_STORAGE_KEY,
      JSON.stringify(
        widgets
          .filter(isKeepsakeWidget)
          .map((widget) => String(widget.data?.image || ""))
          .filter((image) => image.startsWith("https://"))
          .slice(0, 8),
      ),
    );
  } catch (error) {
    console.error(error);
  }
}

function clearBootSnapshot() {
  void bootDbRequest("readwrite", (store) => store.delete(BOOT_SNAPSHOT_STORAGE_KEY));
  try {
    localStorage.removeItem(BOOT_SNAPSHOT_STORAGE_KEY);
    localStorage.removeItem(BOOT_WIDGET_PHOTOS_STORAGE_KEY);
  } catch {}
}

async function hydrateFromBootSnapshot(user) {
  try {
    localStorage.removeItem(BOOT_SNAPSHOT_STORAGE_KEY);
  } catch {}
  const snapshot = await withBootTimeout(
    bootDbRequest("readonly", (store) => store.get(BOOT_SNAPSHOT_STORAGE_KEY)),
    800,
  );
  if (
    !snapshot ||
    snapshot.v !== 1 ||
    snapshot.userId !== user.id ||
    !Array.isArray(snapshot.posts)
  ) {
    return false;
  }

  try {
    currentProfile = snapshot.profile || { id: user.id };
    knownProfiles = Array.isArray(snapshot.knownProfiles) ? snapshot.knownProfiles : [];
    placedStickers = Array.isArray(snapshot.placedStickers) ? snapshot.placedStickers : [];
    posts = snapshot.posts.map((post) => ({ ...post, contentStale: Boolean(post.contentLoaded) }));
    if (Array.isArray(snapshot.widgets) && snapshot.widgets.length) {
      const storedWidgets = new Map(snapshot.widgets.map((widget) => [widget.id, widget]));
      widgets = widgets.map((builtIn) => {
        const stored = storedWidgets.get(builtIn.id);
        if (!stored) return builtIn;
        const widget = { ...stored, title: builtIn.title };
        widgetServerData.set(
          widget.id,
          snapshot.widgetServerData?.[widget.id] ?? JSON.stringify(widget.data ?? null),
        );
        Object.assign(widget, getPendingWidgetSave(widget.id)?.snapshot);
        applyCachedWidgetLayout(widget, widget.updated_at);
        return widget;
      });
      syncCustomWidgets(snapshot.widgets, 0);
    }
    applyPendingSavesToPosts();

    renderTimeline();
    renderNotifications();
    if (Array.isArray(snapshot.widgets) && snapshot.widgets.length) {
      applyWeatherCache(getWeatherWidget());
      renderWidgets({ animateMobileReorder: false });
    } else {
      renderWidgetSkeletons();
    }
    return true;
  } catch (error) {
    console.error("could not restore the saved diary snapshot", error);
    clearBootSnapshot();
    posts = [];
    return false;
  }
}

function getPostById(postId) {
  return posts.find((item) => item.id === postId) || null;
}

function postNeedsContent(post) {
  return Boolean(post && (!post.contentLoaded || post.contentStale));
}

async function ensurePostContent(postIds = []) {
  const ids = [...new Set(postIds)].filter((id) => postNeedsContent(getPostById(id)));
  if (!ids.length) return true;

  const pending = ids.filter((id) => postContentRequests.has(id));
  const toFetch = ids.filter((id) => !postContentRequests.has(id));
  const requests = [];

  for (let index = 0; index < toFetch.length; index += POST_CONTENT_CHUNK_SIZE) {
    const chunk = toFetch.slice(index, index + POST_CONTENT_CHUNK_SIZE);
    const request = dataStore
      .from("posts")
      .select("id, content")
      .in("id", chunk)
      .then(({ data, error }) => {
        if (error) throw error;
        (data || []).forEach((row) => {
          const post = getPostById(row.id);
          if (!post || getPendingEntrySave(row.id)) return;
          post.text = row.content;
          post.contentLoaded = true;
          post.contentStale = false;
        });
        chunk.forEach((id) => {
          const post = getPostById(id);
          if (post && !post.contentLoaded) {
            post.contentLoaded = true;
            post.contentMissing = true;
          }
        });
        return true;
      })
      .finally(() => {
        chunk.forEach((id) => postContentRequests.delete(id));
      });
    chunk.forEach((id) => postContentRequests.set(id, request));
    requests.push(request);
  }

  pending.forEach((id) => requests.push(postContentRequests.get(id)));

  try {
    await Promise.all(requests);
    return true;
  } catch (error) {
    console.error(error);
    if (isAuthExpiredError(error)) void handleExpiredSession();
    return false;
  }
}

function getPostLocalDateKey(post) {
  const date = new Date(post?.created_at || "");
  return Number.isFinite(date.getTime()) ? getDateKeyFromDate(date) : "";
}

function hasActiveTimelineFilters() {
  return Boolean(
    timelineFilters.query ||
    timelineFilters.from ||
    timelineFilters.to ||
    timelineFilters.onThisDay,
  );
}

function postMatchesQueryLocally(post, query) {
  if (!post?.contentLoaded || !query) return false;
  const haystack = `${htmlToPlainText(post.text || "")} ${post.nickname || ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function getFilteredTimelinePosts() {
  const today = new Date();
  const todayMonthDay = getDateKeyFromDate(today).slice(5);
  const thisYear = today.getFullYear();
  const query = timelineFilters.query.trim();

  return posts.filter((post) => {
    const dateKey = getPostLocalDateKey(post);

    if (timelineFilters.onThisDay) {
      if (!dateKey || dateKey.slice(5) !== todayMonthDay) return false;
      if (Number(dateKey.slice(0, 4)) >= thisYear) return false;
    }

    if (timelineFilters.from && (!dateKey || dateKey < timelineFilters.from)) return false;
    if (timelineFilters.to && (!dateKey || dateKey > timelineFilters.to)) return false;

    if (query) {
      const serverMatch = timelineSearchMatchIds?.has(post.id);
      if (!serverMatch && !postMatchesQueryLocally(post, query)) return false;
    }

    return true;
  });
}

function getTimelineToolsMarkup() {
  return `
    <div class="timeline-tools-row">
      <label class="timeline-search">
        <span class="visually-hidden">search entries</span>
        <input class="popup-input timeline-search-input" id="timelineSearchInput" type="search" placeholder="search memories" autocomplete="off" enterkeyhint="search" />
        <span class="timeline-search-count" id="timelineToolsSummary" aria-live="polite"></span>
      </label>
      <div class="timeline-tools-buttons">
        <button class="soft-btn timeline-filter-toggle" id="timelineFiltersToggle" type="button" aria-expanded="false" aria-controls="timelineFilterPanel">
          filters
        </button>
        <button class="soft-btn timeline-on-this-day" id="timelineOnThisDayBtn" type="button" aria-pressed="false">
          on this day
        </button>
      </div>
    </div>
    <div class="timeline-filter-panel" id="timelineFilterPanel" hidden>
      <label class="timeline-date-field">
        <span>from</span>
        <input class="popup-input" id="timelineFromInput" type="date" />
      </label>
      <label class="timeline-date-field">
        <span>to</span>
        <input class="popup-input" id="timelineToInput" type="date" />
      </label>
    </div>
    <div class="timeline-tools-summary" id="timelineToolsClearRow" hidden>
      <button class="timeline-clear-filters" id="timelineClearFiltersBtn" type="button">clear filters</button>
    </div>
  `;
}

function ensureTimelineTools() {
  if (timelineToolsEl?.isConnected && timelineToolsEl.parentElement === timelineEl) {
    return timelineToolsEl;
  }

  timelineToolsEl = document.createElement("div");
  timelineToolsEl.className = "timeline-tools";
  timelineToolsEl.setAttribute("role", "search");
  timelineToolsEl.setAttribute("aria-label", "find entries");
  timelineToolsEl.innerHTML = getTimelineToolsMarkup();
  timelineToolsEl.hidden = !timelineSearchOpen;
  timelineEl.prepend(timelineToolsEl);

  const searchInput = timelineToolsEl.querySelector("#timelineSearchInput");
  const fromInput = timelineToolsEl.querySelector("#timelineFromInput");
  const toInput = timelineToolsEl.querySelector("#timelineToInput");
  const filtersToggle = timelineToolsEl.querySelector("#timelineFiltersToggle");
  const filterPanel = timelineToolsEl.querySelector("#timelineFilterPanel");
  const onThisDayBtn = timelineToolsEl.querySelector("#timelineOnThisDayBtn");
  const clearBtn = timelineToolsEl.querySelector("#timelineClearFiltersBtn");

  searchInput.value = timelineFilters.query;
  fromInput.value = timelineFilters.from;
  toInput.value = timelineFilters.to;
  filterPanel.hidden = !(timelineFilters.from || timelineFilters.to);
  filtersToggle.setAttribute("aria-expanded", String(!filterPanel.hidden));

  searchInput.addEventListener("input", () => {
    window.clearTimeout(timelineSearchTimer);
    timelineSearchTimer = window.setTimeout(() => {
      void setTimelineQuery(searchInput.value);
    }, 260);
  });
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && searchInput.value) {
      event.stopPropagation();
      searchInput.value = "";
      void setTimelineQuery("");
    }
  });

  filtersToggle.addEventListener("click", () => {
    filterPanel.hidden = !filterPanel.hidden;
    filtersToggle.setAttribute("aria-expanded", String(!filterPanel.hidden));
    if (!filterPanel.hidden) fromInput.focus();
  });

  const onDateChange = () => {
    let from = fromInput.value;
    let to = toInput.value;
    if (from && to && from > to) [from, to] = [to, from];
    timelineFilters.from = from;
    timelineFilters.to = to;
    applyTimelineFilters();
  };
  fromInput.addEventListener("change", onDateChange);
  toInput.addEventListener("change", onDateChange);

  onThisDayBtn.addEventListener("click", () => {
    timelineFilters.onThisDay = !timelineFilters.onThisDay;
    applyTimelineFilters();
  });

  clearBtn.addEventListener("click", () => {
    clearTimelineFilters();
    searchInput.focus();
  });

  return timelineToolsEl;
}

const searchToggleBtn = document.getElementById("searchToggleBtn");

function setTimelineSearchOpen(open) {
  timelineSearchOpen = open;
  searchToggleBtn?.setAttribute("aria-expanded", String(open));
  searchToggleBtn?.classList.toggle("active", open);
  const tools = ensureTimelineTools();
  if (!open && hasActiveTimelineFilters()) clearTimelineFilters();
  tools.hidden = !open;
  if (!open) return;
  applyTimelineFilters();
  if (isTabbedLayoutActive()) setMobileView("timeline", { animate: false });
  tools.scrollIntoView({ block: "nearest", behavior: "smooth" });
  tools.querySelector("#timelineSearchInput")?.focus({ preventScroll: true });
}

searchToggleBtn?.addEventListener("click", () => {
  setTimelineSearchOpen(!timelineSearchOpen);
});

function syncTimelineToolsSummary(matchingCount, totalCount) {
  if (!timelineToolsEl) return;

  const summaryEl = timelineToolsEl.querySelector("#timelineToolsSummary");
  const clearBtn = timelineToolsEl.querySelector("#timelineClearFiltersBtn");
  const onThisDayBtn = timelineToolsEl.querySelector("#timelineOnThisDayBtn");
  const filtersActive = hasActiveTimelineFilters();

  onThisDayBtn?.setAttribute("aria-pressed", String(timelineFilters.onThisDay));
  onThisDayBtn?.classList.toggle("active", timelineFilters.onThisDay);
  const clearRow = timelineToolsEl.querySelector("#timelineToolsClearRow");
  if (clearRow) clearRow.hidden = !filtersActive;
  if (clearBtn) clearBtn.hidden = false;

  if (!summaryEl) return;
  summaryEl.classList.toggle("is-filtered", filtersActive);
  if (timelineFilters.query && timelineSearchMatchIds === null) {
    summaryEl.textContent = "searching...";
  } else {
    const compact =
      (timelineToolsEl.querySelector("#timelineSearchInput")?.clientWidth || 999) < 380;
    if (filtersActive) {
      summaryEl.textContent = compact
        ? `${matchingCount}/${totalCount}`
        : `${matchingCount} of ${totalCount}`;
    } else if (totalCount) {
      summaryEl.textContent = compact
        ? `${totalCount}`
        : `${totalCount} ${totalCount === 1 ? "entry" : "entries"}`;
    } else {
      summaryEl.textContent = "";
    }
  }
  summaryEl.title = totalCount
    ? `${filtersActive ? matchingCount : totalCount} of ${totalCount} entries`
    : "";
  summaryEl.hidden = !summaryEl.textContent;
  const searchInput = timelineToolsEl.querySelector("#timelineSearchInput");
  if (searchInput) {
    requestAnimationFrame(() => {
      const pillWidth = summaryEl.hidden ? 0 : summaryEl.offsetWidth;
      searchInput.style.paddingRight = pillWidth ? `${pillWidth + 18}px` : "";
    });
  }
}

function escapeLikePattern(value) {
  return String(value || "").replace(/[\\%_]/g, (match) => `\\${match}`);
}

async function setTimelineQuery(rawQuery) {
  const query = String(rawQuery || "").trim();
  if (query === timelineFilters.query) return;

  timelineFilters.query = query;
  const token = ++timelineSearchToken;

  if (!query) {
    timelineSearchMatchIds = new Set();
    applyTimelineFilters();
    return;
  }

  timelineSearchMatchIds = null;
  applyTimelineFilters();

  const { data, error } = await dataStore
    .from("posts")
    .select("id")
    .ilike("content", `%${escapeLikePattern(query)}%`)
    .limit(500);

  if (token !== timelineSearchToken) return;

  if (error) {
    console.error(error);
    await ensurePostContent(posts.map((post) => post.id));
    if (token !== timelineSearchToken) return;
    timelineSearchMatchIds = new Set();
  } else {
    timelineSearchMatchIds = new Set((data || []).map((row) => row.id));
  }

  applyTimelineFilters();
}

function applyTimelineFilters() {
  timelineVisibleCount = TIMELINE_PAGE_SIZE;
  void refreshTimelineView();
}

function clearTimelineFilters() {
  timelineFilters.query = "";
  timelineFilters.from = "";
  timelineFilters.to = "";
  timelineFilters.onThisDay = false;
  timelineSearchMatchIds = new Set();
  timelineSearchToken += 1;
  if (timelineToolsEl) {
    timelineToolsEl.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
  }
  applyTimelineFilters();
}

function getVisibleTimelinePostIds() {
  return getFilteredTimelinePosts()
    .slice(0, timelineVisibleCount)
    .map((post) => post.id);
}

async function refreshTimelineView() {
  if (!currentUser && !posts.length) return;
  await ensurePostContent(getVisibleTimelinePostIds());
  renderTimeline();
}

async function loadMoreTimeline() {
  if (timelineLoadMoreInFlight) return;
  if (timelineScrubberDragging) {
    timelineLoadAfterScrub = true;
    return;
  }
  const filtered = getFilteredTimelinePosts();
  if (timelineVisibleCount >= filtered.length) return;

  timelineLoadMoreInFlight = true;
  const pagerButton = timelineEl.querySelector(".timeline-load-more");
  if (pagerButton) {
    pagerButton.disabled = true;
    pagerButton.textContent = "loading older entries...";
  }

  try {
    const nextIds = filtered
      .slice(timelineVisibleCount, timelineVisibleCount + TIMELINE_PAGE_SIZE)
      .map((post) => post.id);
    await ensurePostContent(nextIds);
    timelineVisibleCount += TIMELINE_PAGE_SIZE;
    const scrollSnapshot = getViewportScrollSnapshot();
    renderTimeline();
    restoreViewportScroll(scrollSnapshot);
  } finally {
    timelineLoadMoreInFlight = false;
  }
}

function disconnectTimelinePager() {
  timelinePagerObserver?.disconnect();
  timelinePagerObserver = null;
}

function observeTimelinePager(pager) {
  disconnectTimelinePager();
  if (!pager || !("IntersectionObserver" in window)) return;

  timelinePagerObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMoreTimeline();
      }
    },
    { rootMargin: "600px 0px" },
  );
  timelinePagerObserver.observe(pager);
}

async function revealPostInTimeline(postId) {
  let index = getFilteredTimelinePosts().findIndex((post) => post.id === postId);
  if (index === -1 && hasActiveTimelineFilters()) {
    clearTimelineFilters();
    index = getFilteredTimelinePosts().findIndex((post) => post.id === postId);
  }
  if (index === -1) return false;

  if (index >= timelineVisibleCount) {
    timelineVisibleCount = Math.ceil((index + 1) / TIMELINE_PAGE_SIZE) * TIMELINE_PAGE_SIZE;
  }
  await refreshTimelineView();
  return Boolean(timelineEl.querySelector(`article.post[data-post-id="${CSS.escape(postId)}"]`));
}

timelineEl.addEventListener("click", (event) => {
  const image = event.target.closest?.(".post-text img");
  if (image && timelineEl.contains(image) && !image.closest("a")) {
    event.preventDefault();
    openLightboxForImage(image);
    return;
  }

  const button = event.target.closest?.("button");
  if (!button || !timelineEl.contains(button)) return;

  if (button.classList.contains("timeline-load-more")) {
    void loadMoreTimeline();
    return;
  }

  const postId = button.dataset.postId;
  if (!postId) return;

  if (button.classList.contains("like-btn")) {
    void toggleLike(postId);
  } else if (button.classList.contains("comments-btn")) {
    openCommentsPopup(postId);
  } else if (button.classList.contains("stickers-btn")) {
    openStickerBoxForPost(postId);
  } else if (button.classList.contains("edit-entry-btn")) {
    void openEntryEditor(postId);
  } else if (button.classList.contains("delete-entry-btn")) {
    openDeleteEntryConfirmation(postId);
  }
});

timelineEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const image = event.target.closest?.(".post-text img[tabindex]");
  if (!image) return;
  event.preventDefault();
  openLightboxForImage(image);
});

const stickerPopupNote = stickerPopup?.querySelector(".popup-body > .small-note:last-child");
const STICKER_NOTE_DRAG = "you can drag your stickers from the sticker box onto any entry ♡";
const STICKER_NOTE_TAP = "tap a sticker to put it on this entry, then drag it wherever you like ♡";

function setStickerTargetPost(postId) {
  stickerTargetPostId = postId || null;
  document.querySelectorAll(".stickers-btn[aria-pressed='true']").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
  });
  if (stickerTargetPostId) {
    document
      .querySelector(`.stickers-btn[data-post-id="${CSS.escape(stickerTargetPostId)}"]`)
      ?.setAttribute("aria-pressed", "true");
  }
  if (stickerPopupNote) {
    stickerPopupNote.textContent = stickerTargetPostId ? STICKER_NOTE_TAP : STICKER_NOTE_DRAG;
  }
}

function openStickerBoxForPost(postId) {
  setStickerTargetPost(postId);
  renderEmojiPicker();
  const activeTab = document.querySelector(".sticker-tab.active")?.dataset.stickerTab || "type";
  switchStickerTab(activeTab);
  stickerPopup.classList.add("open");
}

async function placeStickerOnTargetPost(stickerValue, size = null) {
  const postId = stickerTargetPostId;
  if (!postId || !stickerValue) return false;

  const body = document.querySelector(
    `article.post[data-post-id="${CSS.escape(postId)}"] .post-body`,
  );
  if (!body) return false;

  const rect = body.getBoundingClientRect();
  const existing = placedStickers.filter((item) => item.postId === postId).length;
  const angle = existing * 2.4;
  const radius = Math.min(0.28, 0.08 + existing * 0.04);
  const syntheticEvent = {
    preventDefault() {},
    stopPropagation() {},
    currentTarget: body,
    target: body,
    dataTransfer: null,
    clientX: rect.left + rect.width * (0.5 + Math.cos(angle) * radius),
    clientY: rect.top + rect.height * (0.5 + Math.sin(angle) * radius),
  };

  activeSticker = stickerValue;
  activeStickerSize = size;
  stickerPopup.classList.remove("open");
  setStickerTargetPost(null);
  await handleStickerDrop(syntheticEvent, postId, {
    onPlaced: () =>
      body.closest(".post")?.scrollIntoView({ behavior: getScrollBehavior(), block: "nearest" }),
  });
  return true;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const dialogReturnFocus = new WeakMap();
const dialogOpenOrder = [];

function isElementVisible(element) {
  return Boolean(element && !element.hidden && element.getClientRects().length);
}

function getDialogFocusableElements(popupEl) {
  return Array.from(popupEl.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => isElementVisible(element) && !element.closest("[hidden], [inert]"),
  );
}

function getTopOpenDialog() {
  for (let index = dialogOpenOrder.length - 1; index >= 0; index -= 1) {
    const popupEl = dialogOpenOrder[index];
    if (popupEl.classList.contains("open")) return popupEl;
  }
  return document.querySelector(".popup.open");
}

function focusDialog(popupEl) {
  if (!popupEl.classList.contains("open") || popupEl.contains(document.activeElement)) return;
  const preferred =
    popupEl.querySelector("[autofocus]") ||
    popupEl.querySelector(
      ".popup-body input:not([type='hidden']):not([type='file']), .popup-body textarea, .popup-body [contenteditable='true']",
    );
  const keepKeyboardDown = isMobileLayoutActive() && !preferred?.hasAttribute("autofocus");
  const target = keepKeyboardDown
    ? null
    : isElementVisible(preferred)
      ? preferred
      : getDialogFocusableElements(popupEl)[0];
  const card = popupEl.querySelector(".popup-card");
  if (target) {
    target.focus({ preventScroll: true });
  } else if (card) {
    card.setAttribute("tabindex", "-1");
    card.focus({ preventScroll: true });
  }
}

function handleDialogStateChange(popupEl) {
  const isOpen = popupEl.classList.contains("open");
  const wasOpen = popupEl.dataset.dialogOpen === "true";
  if (isOpen === wasOpen) return;
  popupEl.dataset.dialogOpen = String(isOpen);

  if (isOpen) {
    const previous = document.activeElement;
    if (previous instanceof HTMLElement && !popupEl.contains(previous)) {
      dialogReturnFocus.set(popupEl, previous);
    }
    dialogOpenOrder.push(popupEl);
    window.setTimeout(() => focusDialog(popupEl), 60);
    return;
  }

  const orderIndex = dialogOpenOrder.lastIndexOf(popupEl);
  if (orderIndex !== -1) dialogOpenOrder.splice(orderIndex, 1);
  if (popupEl === stickerPopup) setStickerTargetPost(null);

  const returnTarget = dialogReturnFocus.get(popupEl);
  dialogReturnFocus.delete(popupEl);
  const nextDialog = getTopOpenDialog();
  if (nextDialog) {
    if (!nextDialog.contains(document.activeElement)) focusDialog(nextDialog);
  } else if (returnTarget?.isConnected && isElementVisible(returnTarget)) {
    returnTarget.focus({ preventScroll: true });
  }
}

function closeDialogFromEscape(popupEl) {
  if (popupEl.id === "authPopup") return false;
  if (popupEl.id === "deleteEntryPopup") {
    cancelDeleteEntryBtn?.click();
    return true;
  }
  if (popupEl.id === "imageLightbox") {
    closeImageLightbox();
    return true;
  }
  const closeButton =
    popupEl.querySelector(".popup-header button[id^='close']") ||
    popupEl.querySelector("button[id^='close']");
  if (closeButton) {
    closeButton.click();
  } else {
    popupEl.classList.remove("open");
  }
  return true;
}

document.querySelectorAll(".popup").forEach((popupEl) => {
  new MutationObserver(() => handleDialogStateChange(popupEl)).observe(popupEl, {
    attributes: true,
    attributeFilter: ["class"],
  });
  handleDialogStateChange(popupEl);
});

document.addEventListener("keydown", (event) => {
  const popupEl = getTopOpenDialog();
  if (!popupEl) {
    if (event.key === "Escape" && notificationsPanel && !notificationsPanel.hidden) {
      closeNotificationsPanel();
      notificationsBtn?.focus();
    }
    return;
  }

  if (event.key === "Escape") {
    if (event.defaultPrevented) return;
    if (closeDialogFromEscape(popupEl)) {
      event.preventDefault();
      event.stopPropagation();
    }
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = getDialogFocusableElements(popupEl);
  if (!focusable.length) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (!popupEl.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener("focusin", (event) => {
  const popupEl = getTopOpenDialog();
  if (!popupEl || popupEl.contains(event.target)) return;
  if (event.target.closest?.(".ql-tooltip, .message")) return;
  focusDialog(popupEl);
});

function isAuthExpiredError(error) {
  if (!error) return false;
  const status = Number(error.status || error.statusCode || 0);
  const message = typeof error === "string" ? error : String(error.message || "");
  return status === 401 || AUTH_EXPIRED_PATTERN.test(message);
}

function showSessionExpiredPrompt() {
  if (sessionExpiredNoticeShown) return;
  sessionExpiredNoticeShown = true;

  const lastEmail = currentUser?.email || "";
  saveEntryDraftNow();
  stopLiveUpdates();
  stopProfilePresenceHeartbeat();
  currentUser = null;
  setToolbarAuthState("logged-out");

  document.querySelectorAll(".popup.open").forEach((popupEl) => {
    if (popupEl.id !== "authPopup") popupEl.classList.remove("open");
  });

  if (authNote) {
    authNote.textContent =
      "your session expired ♡ log in again and you will pick up right where you left off.";
    authNote.hidden = false;
  }
  if (emailInput && lastEmail && !emailInput.value) emailInput.value = lastEmail;
  if (passwordInput) passwordInput.value = "";
  authPopup.classList.add("open");
  window.setTimeout(() => (lastEmail ? passwordInput : emailInput)?.focus(), 80);
}

function handleExpiredSession() {
  if (sessionExpiredNoticeShown || userInitiatedLogout) return Promise.resolve(false);
  if (sessionRecoveryPromise) return sessionRecoveryPromise;

  sessionRecoveryPromise = (async () => {
    try {
      const { data, error } = await dataStore.auth.refreshSession();
      if (!error && data?.session?.user) {
        currentUser = data.session.user;
        scheduleLiveDataRefresh({ includeWidgets: true, debounceMs: 120 });
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    showSessionExpiredPrompt();
    return false;
  })().finally(() => {
    sessionRecoveryPromise = null;
  });

  return sessionRecoveryPromise;
}

dataStore.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED" && session?.user) {
    currentUser = session.user;
    return;
  }
  if (event === "SIGNED_OUT" && currentUser && !userInitiatedLogout) {
    window.setTimeout(showSessionExpiredPrompt, 0);
  }
});

const entryDraftStatus = document.getElementById("entryDraftStatus");

function getEntryDraftKey(postId = editingPostId) {
  return `${currentProfile?.id || currentUser?.id || "anon"}:${postId || "new"}`;
}

function readEntryDrafts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ENTRY_DRAFT_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeEntryDrafts(drafts) {
  markCloudPrefChanged("entryDrafts");
  try {
    localStorage.setItem(ENTRY_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch (error) {
    Object.values(drafts).forEach((draft) => {
      if (draft && isInlineImageDataUrl(draft.image)) draft.image = "";
    });
    try {
      localStorage.setItem(ENTRY_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      return true;
    } catch {
      console.error(error);
      return false;
    }
  }
}

function getEntryComposerSnapshot() {
  const text = entryQuill
    ? entryQuill.getText().trim()
    : String(entryContentFallback?.value || "").trim();
  const html = entryQuill
    ? sanitizePostHtml(entryQuill.root?.innerHTML || "")
    : toSafeHtmlFromPlainText(text);
  return { text, html, image: String(entryImageData?.value || "").trim() };
}

function setEntryDraftStatus(message, options = {}) {
  if (!entryDraftStatus) return;
  const { canDiscard = false } = options;
  entryDraftStatus.hidden = !message;
  entryDraftStatus.innerHTML = message
    ? `<span>${escapeHtml(message)}</span>${canDiscard ? ' <button class="entry-draft-discard" type="button">discard draft</button>' : ""}`
    : "";
}

function withEntryDraftSuppressed(callback) {
  entryDraftSuppressed += 1;
  try {
    return callback();
  } finally {
    entryDraftSuppressed -= 1;
  }
}

function saveEntryDraftNow() {
  window.clearTimeout(entryDraftTimer);
  if (entryDraftSuppressed || !entryPopup?.classList.contains("open")) return;

  const snapshot = getEntryComposerSnapshot();
  const key = getEntryDraftKey();
  const drafts = readEntryDrafts();
  const post = editingPostId ? getPostById(editingPostId) : null;
  const originalSnapshot = post
    ? extractEntryAttachment(getPostDisplayHtml(post.text || ""))
    : null;
  const unchangedEdit =
    post &&
    snapshot.text === htmlToPlainText(originalSnapshot.content).trim() &&
    snapshot.image === (originalSnapshot.image || "");

  if ((!snapshot.text && !snapshot.image) || unchangedEdit) {
    if (drafts[key]) {
      delete drafts[key];
      noteEntryDraftRemoved(key);
      writeEntryDrafts(drafts);
    }
    setEntryDraftStatus("");
    return;
  }

  drafts[key] = { ...snapshot, savedAt: new Date().toISOString() };
  if (writeEntryDrafts(drafts)) {
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setEntryDraftStatus(`draft saved ${time} ♡`, { canDiscard: true });
  }
}

function scheduleEntryDraftSave() {
  if (entryDraftSuppressed) return;
  window.clearTimeout(entryDraftTimer);
  entryDraftTimer = window.setTimeout(saveEntryDraftNow, 700);
}

function clearEntryDraft(postId = editingPostId) {
  window.clearTimeout(entryDraftTimer);
  const drafts = readEntryDrafts();
  const key = getEntryDraftKey(postId);
  if (drafts[key]) {
    delete drafts[key];
    noteEntryDraftRemoved(key);
    writeEntryDrafts(drafts);
  }
  setEntryDraftStatus("");
}

function restoreEntryDraft() {
  const draft = readEntryDrafts()[getEntryDraftKey()];
  if (!draft || (!draft.text && !draft.image)) {
    setEntryDraftStatus("");
    return false;
  }

  withEntryDraftSuppressed(() => {
    if (entryQuill) {
      entryQuill.setContents([]);
      entryQuill.clipboard.dangerouslyPasteHTML(sanitizePostHtml(draft.html || ""));
    } else if (entryContentFallback) {
      entryContentFallback.value = draft.text || "";
    }
    renderEntryImagePreview(draft.image || "");
  });

  const savedAt = new Date(draft.savedAt || "");
  const when = Number.isFinite(savedAt.getTime())
    ? savedAt.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "earlier";
  setEntryDraftStatus(`restored your unsaved draft from ${when} ♡`, { canDiscard: true });
  return true;
}

function discardEntryDraft() {
  const post = editingPostId ? getPostById(editingPostId) : null;
  clearEntryDraft();
  withEntryDraftSuppressed(() => {
    if (post) {
      setEntryComposerFromStoredContent(post.text || "");
    } else {
      clearEntryComposer();
    }
  });
  focusEntryComposerToEnd();
  showMessage("draft discarded ♡");
}

entryDraftStatus?.addEventListener("click", (event) => {
  if (event.target.closest(".entry-draft-discard")) discardEntryDraft();
});
entryContentFallback?.addEventListener("input", scheduleEntryDraftSave);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveEntryDraftNow();
});
window.addEventListener("pagehide", saveEntryDraftNow);

const imageLightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxPrevBtn = document.getElementById("lightboxPrevBtn");
const lightboxNextBtn = document.getElementById("lightboxNextBtn");
const closeImageLightboxBtn = document.getElementById("closeImageLightbox");
let lightboxItems = [];
let lightboxIndex = 0;

function makeEntryImagesInteractive(root) {
  root?.querySelectorAll?.("img").forEach((image) => {
    if (image.closest("a")) return;
    image.classList.add("is-zoomable");
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    if (!image.getAttribute("aria-label")) {
      image.setAttribute("aria-label", "open photo");
    }
  });
}

function showLightboxItem(index) {
  if (!lightboxItems.length || !lightboxImage) return;
  lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[lightboxIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  if (lightboxCaption) {
    lightboxCaption.textContent =
      lightboxItems.length > 1
        ? `${item.caption} · ${lightboxIndex + 1} / ${lightboxItems.length}`
        : item.caption;
  }
  const multiple = lightboxItems.length > 1;
  if (lightboxPrevBtn) lightboxPrevBtn.hidden = !multiple;
  if (lightboxNextBtn) lightboxNextBtn.hidden = !multiple;
}

function openLightboxForImage(image) {
  const postEl = image.closest("article.post");
  const post = getPostById(postEl?.dataset.postId);
  const images = Array.from((postEl || image.parentElement).querySelectorAll(".post-text img"));
  const caption = post ? `${post.nickname || "someone"} — ${formatEntryDate(post.created_at)}` : "";
  lightboxItems = images.map((element) => ({
    src: element.currentSrc || element.src,
    alt: element.alt && element.alt !== "entry attachment" ? element.alt : "entry photo",
    caption,
  }));
  if (!lightboxItems.length || !imageLightbox) return;
  showLightboxItem(Math.max(0, images.indexOf(image)));
  imageLightbox.classList.add("open");
}

function closeImageLightbox() {
  imageLightbox?.classList.remove("open");
}

imageLightbox?.addEventListener("popupclosed", () => lightboxImage?.removeAttribute("src"));

closeImageLightboxBtn?.addEventListener("click", closeImageLightbox);
lightboxPrevBtn?.addEventListener("click", () => showLightboxItem(lightboxIndex - 1));
lightboxNextBtn?.addEventListener("click", () => showLightboxItem(lightboxIndex + 1));
imageLightbox?.addEventListener("click", (event) => {
  if (event.target === imageLightbox && !popupPointerStartedInsideCard) closeImageLightbox();
});
imageLightbox?.querySelector(".popup-card")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeImageLightbox();
});
imageLightbox?.addEventListener("keydown", (event) => {
  if (lightboxItems.length < 2) return;
  if (event.key === "ArrowLeft") showLightboxItem(lightboxIndex - 1);
  if (event.key === "ArrowRight") showLightboxItem(lightboxIndex + 1);
});

const exportEntriesBtn = document.getElementById("exportEntriesBtn");
let exportInFlight = false;

function waitForDocumentImages(doc, timeoutMs = 20000) {
  const pending = Array.from(doc.images).map((image) => {
    image.loading = "eager";
    return image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
  });
  return withBootTimeout(Promise.all(pending), timeoutMs);
}

function getExportPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const theme = document.documentElement.dataset.theme;
  return {
    theme,
    dark: ["dusk", "pine", "ember"].includes(theme),
    bg: read("--bg-1", "#fefdf9"),
    bg2: read("--bg-2", "#fdfbf1"),
    card: read("--card-solid", "#ffffff"),
    ink: read("--text", "#3f5150"),
    soft: read("--text-soft", "#687e7c"),
    tint: read("--header", "#d0ebe0"),
    accent: read("--button-border-strong", "#94bfae"),
    border: read("--button-border", "#bcd9cd"),
    heart: read("--heart", "#e2557f"),
  };
}

function getExportTogetherDays() {
  const togetherWidget = widgets.find((widget) => widget.id === "together");
  const start = new Date(togetherWidget?.data?.startDate || "");
  if (!Number.isFinite(start.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
}

function splitExportEntry(post) {
  const template = document.createElement("template");
  template.innerHTML = getPostDisplayHtml(post.text || "");
  const photos = Array.from(template.content.querySelectorAll("img"))
    .map((image) => image.getAttribute("src"))
    .filter(Boolean);
  template.content.querySelectorAll("img").forEach((image) => image.remove());
  template.content.querySelectorAll("figure, p").forEach((element) => {
    if (!element.textContent.trim() && !element.querySelector("br ~ *, a")) element.remove();
  });
  return { html: template.innerHTML.trim(), photos };
}

function buildEntriesExportHtml(entries, options = {}) {
  const { filterNote = "" } = options;
  const sorted = entries
    .slice()
    .sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
  const palette = getExportPalette();
  const isEmber = palette.theme === "ember";
  const headingFont = isEmber
    ? '"Grenze Gotisch", "Fredoka", serif'
    : '"Fredoka", "Quicksand", sans-serif';
  const bodyFont = isEmber
    ? '"Special Elite", "Courier New", monospace'
    : '"Quicksand", system-ui, sans-serif';
  const scriptFont = isEmber ? '"Grenze Gotisch", serif' : '"Dancing Script", cursive';
  const validDate = (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  };
  const monthYear = (date) =>
    date ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
  const longDate = (date) =>
    date
      ? date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
      : "";
  const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

  const prepared = sorted.map((post, index) => ({
    post,
    number: index + 1,
    date: validDate(post.created_at),
    ...splitExportEntry(post),
  }));
  const photoCount = prepared.reduce((total, item) => total + item.photos.length, 0);
  const commentCount = sorted.reduce((total, post) => total + getPostCommentCount(post), 0);
  const likeCount = sorted.reduce((total, post) => total + (post.likesCount || 0), 0);
  const togetherDays = getExportTogetherDays();
  const iconUrl = new URL("./icons/icon-512.png", window.location.href).href;
  const first = prepared[0]?.date;
  const last = prepared[prepared.length - 1]?.date;

  const years = [];
  prepared.forEach((item) => {
    const yearLabel = item.date ? String(item.date.getFullYear()) : "undated";
    let year = years[years.length - 1];
    if (!year || year.label !== yearLabel) {
      year = { label: yearLabel, months: [], count: 0, photos: 0 };
      years.push(year);
    }
    const monthLabel = monthYear(item.date) || "undated";
    let month = year.months[year.months.length - 1];
    if (!month || month.label !== monthLabel) {
      month = {
        label: monthLabel,
        short: item.date ? item.date.toLocaleDateString(undefined, { month: "short" }) : "",
        items: [],
      };
      year.months.push(month);
    }
    month.items.push(item);
    item.monthLabel = monthLabel;
    year.count += 1;
    year.photos += item.photos.length;
  });
  const allMonths = years.flatMap((year) => year.months);
  const busiest = allMonths.reduce(
    (best, month) => (!best || month.items.length > best.items.length ? month : best),
    null,
  );
  const maxMonth = Math.max(1, ...allMonths.map((month) => month.items.length));
  const byAuthor = new Map();
  sorted.forEach((post) => {
    const name = post.nickname || "someone";
    byAuthor.set(name, (byAuthor.get(name) || 0) + 1);
  });

  let pageNumber = 3;
  years.forEach((year) => {
    pageNumber += 1;
    year.page = pageNumber;
    year.months.forEach((month) => {
      month.page = pageNumber + 1;
      month.items.forEach((item) => {
        pageNumber += 1;
        item.page = pageNumber;
      });
    });
  });
  const totalPages = pageNumber + 1;

  const pageShell = (inner, { number = 0, label = "", className = "" } = {}) => `
    <section class="page ${className}">
      ${number ? `<div class="running"><span>${escapeHtml(APP_NAME)}</span><span>${escapeHtml(label)}</span></div>` : ""}
      <div class="page-inner">${inner}</div>
      ${number ? `<div class="folio">${number} / ${totalPages}</div>` : ""}
    </section>`;

  const cover = pageShell(
    `<div class="cover">
      <img class="cover-art" src="${escapeHtml(iconUrl)}" alt="" />
      <div class="sparkle">✦ ♡ ✦</div>
      <h1>${escapeHtml(APP_NAME)}</h1>
      <p class="subtitle">our story</p>
      <p class="facts">${escapeHtml(monthYear(first))}${monthYear(last) && monthYear(last) !== monthYear(first) ? ` – ${escapeHtml(monthYear(last))}` : ""}</p>
      <p class="facts">${plural(sorted.length, "entry", "entries")} · ${plural(photoCount, "photo")}${togetherDays ? ` · ${togetherDays} days together` : ""}</p>
      ${filterNote ? `<p class="note">${escapeHtml(filterNote)}</p>` : ""}
    </div>`,
    { className: "page-cover" },
  );

  const contents = pageShell(
    `<h2 class="page-title">contents</h2>
    <div class="toc fit-target">
      <div class="toc-row toc-special"><span>us, in numbers</span><i></i><b>3</b></div>
      ${years
        .map(
          (year) => `
        <div class="toc-row toc-year"><span>${escapeHtml(year.label)}</span><i></i><b>${year.page}</b></div>
        ${year.months
          .map(
            (month) =>
              `<div class="toc-row toc-month"><span>${escapeHtml(month.label)} <small>· ${plural(month.items.length, "entry", "entries")}</small></span><i></i><b>${month.page}</b></div>`,
          )
          .join("")}`,
        )
        .join("")}
    </div>`,
    { number: 2, label: "contents", className: "fit" },
  );

  const numbers = pageShell(
    `<h2 class="page-title">us, in numbers</h2>
    <div class="fit-target">
      <div class="tiles">
        <div class="tile"><b>${sorted.length}</b><span>entries</span></div>
        <div class="tile"><b>${photoCount}</b><span>photos</span></div>
        ${togetherDays ? `<div class="tile"><b>${togetherDays}</b><span>days together</span></div>` : ""}
        <div class="tile"><b>${commentCount}</b><span>comments</span></div>
        <div class="tile"><b>${likeCount}</b><span>likes</span></div>
      </div>
      <h3 class="sub">who wrote what</h3>
      <div class="authors">
        ${[...byAuthor.entries()]
          .map(
            ([name, count]) =>
              `<div class="author-row"><span>${escapeHtml(name)}</span><span class="bar"><i style="width:${Math.round((count / sorted.length) * 100)}%"></i></span><span class="val">${count} · ${Math.round((count / sorted.length) * 100)}%</span></div>`,
          )
          .join("")}
      </div>
      <h3 class="sub">entries each month</h3>
      <div class="chart">
        ${allMonths
          .map(
            (month) =>
              `<div class="chart-col"><span class="chart-val">${month.items.length}</span><span class="chart-bar" style="height:${Math.max(4, Math.round((month.items.length / maxMonth) * 100))}%"></span><span class="chart-label">${escapeHtml(month.short)}</span></div>`,
          )
          .join("")}
      </div>
      <div class="facts-grid">
        ${first ? `<div><span>first entry</span><b>${escapeHtml(longDate(first))}</b></div>` : ""}
        ${last ? `<div><span>latest entry</span><b>${escapeHtml(longDate(last))}</b></div>` : ""}
        ${busiest ? `<div><span>busiest month</span><b>${escapeHtml(busiest.label)}</b></div>` : ""}
        <div><span>photos per entry</span><b>${sorted.length ? (photoCount / sorted.length).toFixed(1) : 0}</b></div>
      </div>
    </div>`,
    { number: 3, label: "us, in numbers", className: "fit" },
  );

  const entryPage = (item) => {
    const { post, html, photos, number, date } = item;
    const dayLabel = date
      ? date.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const timeLabel = date
      ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";
    const comments = getPostCommentCount(post);
    const footer = [
      post.likesCount ? `<span class="heart">♥&#xFE0E;</span> ${post.likesCount}` : "",
      comments ? plural(comments, "comment") : "",
      post.isEdited ? "edited" : "",
    ]
      .filter(Boolean)
      .join("  ·  ");
    const grid = photos.length
      ? `<div class="photos photos-${Math.min(photos.length, 4)}">${photos
          .slice(0, 6)
          .map((src) => `<div class="photo"><img src="${escapeHtml(src)}" alt="" /></div>`)
          .join("")}</div>`
      : "";
    return pageShell(
      `<article class="entry${photos.length ? "" : " text-only"}">
        <header class="entry-head">
          <span class="num">#${number}</span>
          <span class="when"><b>${escapeHtml(dayLabel)}</b><small>${escapeHtml(timeLabel)}</small></span>
          <span class="author">${escapeHtml(post.nickname || "someone")}</span>
        </header>
        ${html ? `<div class="content fit-target">${html}</div>` : ""}
        ${grid}
        ${footer ? `<footer class="entry-foot">${footer}</footer>` : ""}
      </article>`,
      { number: item.page, label: item.monthLabel, className: "fit" },
    );
  };

  const body = years
    .map(
      (year) =>
        pageShell(
          `<div class="divider">
            <div class="sparkle">✦ ♡ ✦</div>
            <h2>${escapeHtml(year.label)}</h2>
            <p>${plural(year.count, "entry", "entries")}${year.photos ? ` · ${plural(year.photos, "photo")}` : ""}</p>
            <ul>${year.months.map((month) => `<li>${escapeHtml(month.label)} <span>${month.items.length}</span></li>`).join("")}</ul>
          </div>`,
          { number: year.page, label: year.label },
        ) + year.months.map((month) => month.items.map(entryPage).join("")).join(""),
    )
    .join("");

  const closing = pageShell(
    `<div class="divider">
      <div class="sparkle">✦ ♡ ✦</div>
      <p class="big">${escapeHtml(APP_TAGLINE)}</p>
      ${togetherDays ? `<p>${togetherDays} days together, and counting</p>` : ""}
      <p>exported ${escapeHtml(longDate(new Date()))}</p>
    </div>`,
    { number: totalPages, label: "♡" },
  );

  const fontsHref = isEmber
    ? "https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@500;700&family=Special+Elite&display=swap"
    : "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Fredoka:wght@400;500;600&family=Lora:ital,wght@0,400;0,700;1,400&family=Quicksand:wght@400;500;600;700&display=swap";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${escapeHtml(APP_NAME)} — ${escapeHtml(longDate(new Date()))}</title>
<link rel="stylesheet" href="${fontsHref}" />
<style>
  :root { --bg: ${palette.bg}; --bg2: ${palette.bg2}; --card: ${palette.card}; --ink: ${palette.ink}; --soft: ${palette.soft};
    --tint: ${palette.tint}; --accent: ${palette.accent}; --border: ${palette.border}; --heart: ${palette.heart}; --fit: 1; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: var(--bg); }
  body { font-family: ${bodyFont}; color: var(--ink); font-size: 11pt; line-height: 1.6; }
  .page { position: relative; width: 210mm; height: 296.6mm; overflow: hidden; padding: 17mm 15mm 16mm; display: flex; flex-direction: column;
    background: radial-gradient(circle at 12% 8%, var(--bg2), transparent 40%), radial-gradient(circle at 90% 95%, var(--bg2), transparent 40%), var(--bg);
    break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  .page-inner { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .running { position: absolute; top: 7mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; font-size: 7.5pt; letter-spacing: .08em; color: var(--soft); text-transform: lowercase; }
  .running span:first-child { font-family: ${headingFont}; text-transform: none; }
  .folio { position: absolute; bottom: 7mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: var(--soft); }
  .sparkle { color: var(--accent); letter-spacing: .6em; margin-left: .6em; font-size: 12pt; }

  .cover { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 2mm; border-radius: 8mm;
    border: .6pt solid var(--border); background: radial-gradient(circle at 25% 20%, var(--tint), transparent 45%), radial-gradient(circle at 80% 85%, var(--tint), transparent 40%), var(--card); }
  .cover-art { width: 60mm; height: 60mm; border-radius: 15mm; object-fit: cover; box-shadow: 0 5mm 12mm rgba(0,0,0,.25); margin-bottom: 7mm; }
  .cover h1 { font-family: ${headingFont}; font-weight: 600; font-size: 38pt; letter-spacing: .05em; margin: 1mm 0 0; }
  .subtitle { font-family: ${scriptFont}; font-size: 22pt; color: var(--accent); margin: 0 0 7mm; }
  .facts { margin: .8mm 0; color: var(--soft); font-size: 10.5pt; }
  .note { margin-top: 3mm; font-size: 9pt; font-style: italic; color: var(--soft); }

  .page-title { font-family: ${headingFont}; font-weight: 500; font-size: 22pt; color: var(--accent); text-align: center; margin: 2mm 0 7mm; }
  .fit-target { font-size: calc(1em * var(--fit)); }
  .toc { max-width: 140mm; margin: 0 auto; width: 100%; }
  .toc-row { display: flex; align-items: baseline; gap: 3mm; padding: 1.3mm 0; }
  .toc-row i { flex: 1; border-bottom: .6pt dotted var(--border); transform: translateY(-1mm); }
  .toc-row b { font-weight: 600; color: var(--soft); font-size: .9em; }
  .toc-row small { color: var(--soft); }
  .toc-special { font-style: italic; margin-bottom: 3mm; }
  .toc-year { margin-top: 3mm; font-family: ${headingFont}; font-size: 1.25em; color: var(--accent); }
  .toc-month { padding-left: 7mm; }

  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(28mm, 1fr)); gap: 4mm; margin-bottom: 8mm; }
  .tile { padding: 4mm 3mm; border-radius: 4mm; background: var(--card); border: .6pt solid var(--border); text-align: center; }
  .tile b { display: block; font-family: ${headingFont}; font-size: 20pt; font-weight: 600; color: var(--accent); line-height: 1.2; }
  .tile span { font-size: 8.5pt; color: var(--soft); }
  .sub { font-family: ${headingFont}; font-weight: 500; font-size: 12pt; margin: 0 0 3mm; }
  .authors { display: grid; gap: 2.5mm; margin-bottom: 8mm; }
  .author-row { display: grid; grid-template-columns: 24mm 1fr 22mm; gap: 4mm; align-items: center; }
  .bar { height: 4mm; border-radius: 4mm; background: var(--card); border: .5pt solid var(--border); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--accent); }
  .val { text-align: right; color: var(--soft); font-size: 9pt; }
  .chart { display: flex; align-items: flex-end; gap: 1.6mm; height: 55mm; padding: 4mm; border-radius: 4mm; background: var(--card); border: .6pt solid var(--border); margin-bottom: 8mm; }
  .chart-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 1mm; }
  .chart-bar { width: 100%; max-width: 9mm; border-radius: 2mm 2mm 0 0; background: var(--accent); }
  .chart-val, .chart-label { font-size: 7pt; color: var(--soft); }
  .facts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .facts-grid div { padding: 3mm 4mm; border-radius: 3mm; background: var(--card); border: .6pt solid var(--border); display: grid; }
  .facts-grid span { font-size: 8.5pt; color: var(--soft); }

  .divider { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .divider h2 { font-family: ${headingFont}; font-weight: 600; font-size: 64pt; color: var(--accent); margin: 2mm 0; }
  .divider p { color: var(--soft); margin: 1mm 0; }
  .divider ul { list-style: none; padding: 0; margin: 8mm 0 0; display: grid; gap: 1.5mm; min-width: 70mm; }
  .divider li { display: flex; justify-content: space-between; gap: 8mm; padding: 1.5mm 4mm; border-radius: 3mm; background: var(--card); border: .5pt solid var(--border); font-size: 10pt; }
  .divider li span { color: var(--soft); }
  .big { font-family: ${scriptFont}; font-size: 30pt !important; color: var(--accent) !important; }

  .entry { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 4mm; padding: 6mm; border-radius: 6mm; background: var(--card); border: .6pt solid var(--border); }
  .entry-head { flex: none; display: flex; align-items: center; gap: 3mm; padding-bottom: 3mm; border-bottom: .6pt solid var(--border); }
  .num { flex: none; padding: .6mm 2.5mm; border-radius: 2mm; background: var(--tint); font-family: ${headingFont}; font-size: 9pt; }
  .when { flex: 1; display: flex; flex-direction: column; line-height: 1.25; }
  .when b { font-family: ${headingFont}; font-weight: 500; font-size: 12pt; text-transform: lowercase; }
  .when small { color: var(--soft); font-size: 8.5pt; }
  .author { flex: none; padding: .8mm 3.5mm; border-radius: 10mm; border: .6pt solid var(--accent); color: var(--accent); font-size: 9pt; font-weight: 600; }
  .content { flex: none; overflow: hidden; }
  .entry.text-only .content { flex: 1; }
  .content p { margin: 0 0 .55em; }
  .content p:last-child { margin-bottom: 0; }
  .content a { color: var(--accent); word-break: break-all; }
  .content blockquote { margin: .5em 0; padding-left: 4mm; border-left: 1mm solid var(--tint); color: var(--soft); }
  .content .ql-align-center { text-align: center; } .content .ql-align-right { text-align: right; }
  .content .ql-font-fredoka { font-family: "Fredoka", sans-serif; }
  .content .ql-font-lora, .content .ql-font-merriweather, .content .ql-font-playfair, .content .ql-font-serif { font-family: "Lora", Georgia, serif; }
  .content .ql-font-caveat { font-family: "Caveat", cursive; font-size: 1.25em; }
  .content .ql-font-dancing { font-family: "Dancing Script", cursive; font-size: 1.15em; }
  .photos { flex: 1 1 auto; min-height: 40mm; display: grid; gap: 3mm; }
  .photos-1 { grid-template: 1fr / 1fr; }
  .photos-2 { grid-template: 1fr / 1fr 1fr; }
  .photos-3, .photos-4 { grid-template: 1fr 1fr / 1fr 1fr; }
  .photo { min-height: 0; border-radius: 4mm; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .photos-1 .photo { align-items: flex-start; }
  .photos-1 .photo img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4mm; }
  .photos-2 .photo img, .photos-3 .photo img, .photos-4 .photo img { width: 100%; height: 100%; object-fit: cover; }
  .entry-foot { flex: none; padding-top: 3mm; border-top: .6pt dashed var(--border); font-size: 9pt; color: var(--soft); }
  .heart { color: var(--heart); }
</style></head>
<body>
${cover}
${contents}
${numbers}
${body}
${closing}
</body></html>`;
}

function fitExportPages(doc) {
  doc.querySelectorAll(".page.fit").forEach((page) => {
    const inner = page.querySelector(".page-inner");
    const target = page.querySelector(".fit-target") || inner;
    const box = page.querySelector(".entry") || inner;
    const overflowing = () =>
      inner.scrollHeight > inner.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1;
    let fit = 1;
    while (overflowing() && fit > 0.45) {
      fit -= 0.05;
      target.style.setProperty("--fit", fit.toFixed(2));
    }
  });
}

let pendingExportPdf = null;

async function renderExportPdfFile(doc) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pages = [...doc.querySelectorAll(".page")];

  for (const [index, page] of pages.entries()) {
    showMessage(`making your PDF ♡ ${index + 1}/${pages.length}`);
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 210, 297);
    canvas.width = 0;
    canvas.height = 0;
  }

  const day = new Date().toISOString().slice(0, 10);
  return new File([pdf.output("blob")], `${APP_NAME.toLowerCase()}-${day}.pdf`, {
    type: "application/pdf",
  });
}

async function shareExportPdf(file) {
  try {
    await navigator.share({ files: [file], title: APP_NAME });
    pendingExportPdf = null;
  } catch (error) {
    if (error?.name === "AbortError") return;
    pendingExportPdf = file;
    if (exportEntriesBtn) exportEntriesBtn.textContent = "save PDF ♡";
    showMessage("your PDF is ready, tap save PDF ♡");
  }
}

async function exportEntriesAsPdf() {
  if (pendingExportPdf) {
    const file = pendingExportPdf;
    pendingExportPdf = null;
    if (exportEntriesBtn) exportEntriesBtn.textContent = "export PDF";
    await shareExportPdf(file);
    return;
  }
  if (exportInFlight) return;
  if (!currentUser) {
    showMessage("please log in first ♡");
    return;
  }

  exportInFlight = true;
  const originalLabel = exportEntriesBtn?.textContent;
  if (exportEntriesBtn) {
    exportEntriesBtn.disabled = true;
    exportEntriesBtn.textContent = "preparing...";
  }

  let frame = null;
  try {
    const loaded = await ensurePostContent(posts.map((post) => post.id));
    if (!loaded) throw new Error("could not load every entry, try again ♡");
    const filtersActive = hasActiveTimelineFilters();
    const source = filtersActive ? getFilteredTimelinePosts() : posts;
    const entries = source.filter((post) => post.contentLoaded && !post.contentMissing);
    const filterNote = filtersActive
      ? [
          timelineFilters.query ? `entries matching “${timelineFilters.query}”` : "",
          timelineFilters.onThisDay ? "entries from this day in past years" : "",
          timelineFilters.from || timelineFilters.to
            ? `from ${timelineFilters.from || "the start"} to ${timelineFilters.to || "today"}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
    if (!entries.length) {
      showMessage("no entries to export yet ♡");
      return;
    }

    frame = document.createElement("iframe");
    frame.className = "export-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    document.body.appendChild(frame);

    const doc = frame.contentDocument;
    doc.open();
    doc.write(buildEntriesExportHtml(entries, { filterNote }));
    doc.close();

    showMessage("gathering photos for your PDF ♡");
    await waitForDocumentImages(doc);
    if (doc.fonts?.ready)
      await withBootTimeout(
        doc.fonts.ready.catch(() => {}),
        4000,
      );
    fitExportPages(doc);

    if (isIosDevice() && isStandaloneApp()) {
      await shareExportPdf(await renderExportPdfFile(doc));
      return;
    }

    frame.contentWindow.focus();
    frame.contentWindow.print();
    showMessage('choose "save as PDF" to keep a copy ♡');
  } catch (error) {
    console.error(error);
    showMessage(error.message || "could not export entries ♡");
  } finally {
    exportInFlight = false;
    if (exportEntriesBtn) {
      exportEntriesBtn.disabled = false;
      if (!pendingExportPdf) exportEntriesBtn.textContent = originalLabel || "export PDF";
    }
    if (frame) {
      const removeFrame = () => frame.remove();
      frame.contentWindow?.addEventListener?.("afterprint", removeFrame, { once: true });
      window.setTimeout(removeFrame, 60000);
    }
  }
}

exportEntriesBtn?.addEventListener("click", () => void exportEntriesAsPdf());

function getScrollBehavior() {
  return reducedMotionMedia?.matches ? "auto" : "smooth";
}

reducedMotionMedia?.addEventListener?.("change", () => renderDecor());

setTheme(document.documentElement.dataset.theme);
setAppZoom(getStoredAppZoomPreference());
normalizeChromeSymbols();
activeMobileView = "timeline";
applyMobileView();
syncMobileViewSwitcherVisibility();
renderDecor();
renderNotifications();

async function initApp() {
  try {
    const sessionCheckCompleted = await withBootTimeout(
      checkSession().then(() => true),
      7000,
    );

    if (!sessionCheckCompleted && !currentUser) {
      renderBootFallbackShell();
    }

    await waitForInitialPageReady();
  } catch (error) {
    console.error(error);
    renderBootFallbackShell();
  } finally {
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - bootStartedAt;
    const remaining = Math.max(0, BOOT_SPLASH_MIN_MS - elapsed);

    window.setTimeout(() => {
      void hideLaunchSplash();
    }, remaining);
  }
}

window.setInterval(() => {
  if (currentUser && document.visibilityState === "visible") {
    void refreshWeatherWidget({ render: true });
  }
}, WEATHER_MAX_AGE_MS);

window.setTimeout(prefetchEntryEditor, 3000);

const timelineScrubber = document.createElement("div");
timelineScrubber.className = "timeline-scrubber";
timelineScrubber.innerHTML = `
  <div class="timeline-scrubber-thumb" role="slider" aria-label="scroll through entries" tabindex="-1">
    <span class="timeline-scrubber-grip" aria-hidden="true"></span>
    <span class="timeline-scrubber-label"></span>
  </div>
`;
document.body.appendChild(timelineScrubber);
const timelineScrubberThumb = timelineScrubber.querySelector(".timeline-scrubber-thumb");
const timelineScrubberLabel = timelineScrubber.querySelector(".timeline-scrubber-label");
let timelineScrubberHideTimer = 0;
let timelineScrubberFrame = 0;
let timelineScrubberDrag = null;
let timelineScrubberTarget = 0;
let timelineScrubberCurrent = 0;
let timelineScrubberLabelTime = 0;
let timelineScrubberLabelKey = "";
const scrubberMonthFormat = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });

function getTimelineScrollRange() {
  const rect = timelineEl.getBoundingClientRect();
  const start = window.scrollY + rect.top - 12;
  const end = window.scrollY + rect.bottom - window.innerHeight + 24;
  return { start, end: Math.max(start + 1, end), rect };
}

function isTimelineScrubberUseful() {
  if (!currentUser || !timelineEl || document.querySelector(".popup.open")) return false;
  if (isTabbedLayoutActive() && activeMobileView !== "timeline") return false;
  if (timelineEl.getClientRects().length === 0) return false;
  return timelineEl.offsetHeight > window.innerHeight * 2.5;
}

function getScrubberTrackBounds() {
  const top = timelineScrubber.offsetTop;
  const height = timelineScrubber.clientHeight - timelineScrubberThumb.offsetHeight;
  return { top, height: Math.max(1, height) };
}

function placeTimelineScrubber(rect) {
  const width = timelineScrubber.offsetWidth || 28;
  const left = Math.min(window.innerWidth - width, Math.round(rect.right - width / 2));
  timelineScrubber.style.left = `${Math.max(0, left)}px`;
}

function setTimelineScrubberProgress(progress, height = getScrubberTrackBounds().height) {
  timelineScrubberThumb.style.transform = `translate3d(0, ${progress * height}px, 0)`;
}

function updateTimelineScrubberLabel() {
  const middle = window.innerHeight / 2;
  const posts = timelineEl.querySelectorAll("article.post[data-post-id]");
  let low = 0;
  let high = posts.length - 1;
  let current = null;
  while (low <= high) {
    const index = (low + high) >> 1;
    if (posts[index].getBoundingClientRect().top <= middle) {
      current = posts[index];
      low = index + 1;
    } else {
      high = index - 1;
    }
  }
  const post = getPostById((current || posts[0])?.dataset.postId || "");
  const date = post?.created_at ? new Date(post.created_at) : null;
  const label = date && !Number.isNaN(date.getTime()) ? scrubberMonthFormat.format(date) : "";
  if (label !== timelineScrubberLabelKey) {
    timelineScrubberLabelKey = label;
    timelineScrubberLabel.textContent = label;
  }
}

function showTimelineScrubber() {
  if (!isTimelineScrubberUseful()) {
    timelineScrubber.classList.remove("is-visible");
    return;
  }
  timelineScrubber.classList.add("is-visible");
  if (!timelineScrubberDragging) {
    const { start, end, rect } = getTimelineScrollRange();
    placeTimelineScrubber(rect);
    setTimelineScrubberProgress(Math.min(1, Math.max(0, (window.scrollY - start) / (end - start))));
  }
  window.clearTimeout(timelineScrubberHideTimer);
  if (!timelineScrubberDragging) {
    timelineScrubberHideTimer = window.setTimeout(() => {
      timelineScrubber.classList.remove("is-visible");
    }, 1600);
  }
}

window.addEventListener(
  "scroll",
  () => {
    if (
      timelineScrubberDragging ||
      timelineScrubberFrame ||
      performance.now() < timelineScrubberQuietUntil
    ) {
      return;
    }
    timelineScrubberFrame = requestAnimationFrame(() => {
      timelineScrubberFrame = 0;
      showTimelineScrubber();
    });
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  if (timelineScrubber.classList.contains("is-visible") && !timelineScrubberDragging) {
    showTimelineScrubber();
  }
});

const TIMELINE_SCRUB_GLIDE_MS = 60;

function runTimelineScrub(now) {
  timelineScrubberFrame = 0;
  const drag = timelineScrubberDrag;
  if (!drag) return;

  const elapsed = Math.min(64, Math.max(1, now - drag.lastFrame));
  drag.lastFrame = now;
  const range = drag.end - drag.start;
  const gap = timelineScrubberTarget - timelineScrubberCurrent;
  timelineScrubberCurrent =
    Math.abs(gap * range) < 0.75
      ? timelineScrubberTarget
      : timelineScrubberCurrent + gap * (1 - Math.exp(-elapsed / TIMELINE_SCRUB_GLIDE_MS));
  window.scrollTo({ top: drag.start + timelineScrubberCurrent * range, behavior: "instant" });

  if (now - timelineScrubberLabelTime > 80) {
    timelineScrubberLabelTime = now;
    updateTimelineScrubberLabel();
  }

  if (timelineScrubberCurrent !== timelineScrubberTarget) {
    timelineScrubberFrame = requestAnimationFrame(runTimelineScrub);
  } else if (drag.released) {
    finishTimelineScrub();
  }
}

function queueTimelineScrub(clientY) {
  const drag = timelineScrubberDrag;
  timelineScrubberTarget = Math.min(
    1,
    Math.max(0, (clientY - drag.top - drag.grabOffset) / drag.height),
  );
  setTimelineScrubberProgress(timelineScrubberTarget, drag.height);
  if (!timelineScrubberFrame) {
    drag.lastFrame = performance.now();
    timelineScrubberFrame = requestAnimationFrame(runTimelineScrub);
  }
}

timelineScrubber.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (timelineScrubberFrame) {
    cancelAnimationFrame(timelineScrubberFrame);
    timelineScrubberFrame = 0;
  }
  const { top, height } = getScrubberTrackBounds();
  const { start, end } = getTimelineScrollRange();
  const grabOffset = event.clientY - timelineScrubberThumb.getBoundingClientRect().top;
  timelineScrubberDrag = { top, height, start, end, grabOffset, lastFrame: 0, released: false };
  timelineScrubberDragging = true;
  timelineScrubberCurrent = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
  timelineScrubberTarget = timelineScrubberCurrent;
  timelineScrubber.classList.add("is-dragging", "is-visible");
  document.body.classList.add("timeline-scrubbing");
  try {
    timelineScrubberThumb.setPointerCapture?.(event.pointerId);
  } catch {}
  window.clearTimeout(timelineScrubberHideTimer);
  updateTimelineScrubberLabel();
});

timelineScrubber.addEventListener("pointermove", (event) => {
  if (!timelineScrubberDragging || timelineScrubberDrag?.released) return;
  event.preventDefault();
  queueTimelineScrub(event.clientY);
});

function finishTimelineScrub() {
  timelineScrubberDragging = false;
  timelineScrubberDrag = null;
  document.body.classList.remove("timeline-scrubbing");
  updateTimelineScrubberLabel();
  showTimelineScrubber();
  if (timelineLoadAfterScrub) {
    timelineLoadAfterScrub = false;
    void loadMoreTimeline();
  }
}

function endTimelineScrub() {
  if (!timelineScrubberDragging || timelineScrubberDrag?.released) return;
  timelineScrubber.classList.remove("is-dragging");
  timelineScrubberDrag.released = true;
  if (!timelineScrubberFrame) finishTimelineScrub();
}
timelineScrubber.addEventListener("pointerup", endTimelineScrub);
timelineScrubber.addEventListener("pointercancel", endTimelineScrub);
timelineScrubber.addEventListener("lostpointercapture", endTimelineScrub);

function splitSelectorList(selectorText) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of selectorText) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function stripHoverRules(ruleList, owner) {
  for (let index = ruleList.length - 1; index >= 0; index -= 1) {
    const rule = ruleList[index];
    if (rule instanceof CSSStyleRule) {
      if (!rule.selectorText.includes(":hover")) continue;
      const kept = splitSelectorList(rule.selectorText.replace(/:not\(:hover\)/g, "")).filter(
        (selector) => !selector.includes(":hover"),
      );
      if (!kept.length) owner.deleteRule(index);
      else rule.selectorText = kept.join(", ");
    } else if (rule.cssRules) {
      stripHoverRules(rule.cssRules, rule);
    }
  }
}

function stripHoverStyles(sheet) {
  try {
    if (sheet?.cssRules) stripHoverRules(sheet.cssRules, sheet);
  } catch {}
}

if (window.matchMedia?.("(hover: none)").matches) {
  Array.from(document.styleSheets).forEach(stripHoverStyles);
  document.addEventListener(
    "load",
    (event) => {
      if (event.target instanceof HTMLLinkElement) stripHoverStyles(event.target.sheet);
    },
    true,
  );
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) =>
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLStyleElement) stripHoverStyles(node.sheet);
      }),
    );
  }).observe(document.head, { childList: true });
}

const newWidgetBtn = document.getElementById("newWidgetBtn");
const customWidgetPopup = document.getElementById("customWidgetPopup");
const customWidgetForm = document.getElementById("customWidgetForm");
const customWidgetTitle = document.getElementById("customWidgetTitle");
const customWidgetName = document.getElementById("customWidgetName");
const customWidgetText = document.getElementById("customWidgetText");
const customWidgetSide = document.getElementById("customWidgetSide");
const customWidgetSideField = document.getElementById("customWidgetSideField");
const customWidgetSaveBtn = document.getElementById("customWidgetSaveBtn");
const deleteCustomWidgetBtn = document.getElementById("deleteCustomWidgetBtn");
let editingCustomWidget = null;

function openCustomWidgetPopup(widgetId = "") {
  if (!currentUser || !customWidgetPopup) return;
  editingCustomWidget = widgets.find((widget) => widget.id === widgetId) || null;
  const isNew = !editingCustomWidget;

  customWidgetTitle.textContent = isNew ? "new widget ♡" : "edit widget ♡";
  customWidgetName.value = editingCustomWidget?.data?.heading || "";
  customWidgetText.value = editingCustomWidget?.data?.text || "";
  customWidgetSideField.hidden = !isNew;
  deleteCustomWidgetBtn.hidden = isNew;
  customWidgetSaveBtn.textContent = isNew ? "add widget" : "save";
  customWidgetPopup.classList.add("open");
  window.setTimeout(() => customWidgetName.focus(), 80);
}

function closeCustomWidgetPopup() {
  customWidgetPopup?.classList.remove("open");
  editingCustomWidget = null;
}

function getNewWidgetY(side) {
  const zone = side === "right" ? rightZone : leftZone;
  const bottoms = Array.from(zone.querySelectorAll(":scope > .widget")).map(
    (el) => el.offsetTop + el.offsetHeight,
  );
  return Math.max(0, ...bottoms) + 12;
}

async function saveCustomWidget(event) {
  event.preventDefault();
  const heading = customWidgetName.value.trim();
  const text = customWidgetText.value.trim();

  if (!heading) {
    showMessage("give your widget a name ♡");
    customWidgetName.focus();
    return;
  }
  if (!areBreakupWordsAllowed(heading, text)) return;

  const existing = editingCustomWidget;
  if (existing) {
    existing.data = { ...existing.data, heading, text };
    closeCustomWidgetPopup();
    renderWidgets();
    await saveWidget(existing, { recordHistory: false, notifyUpdate: true });
    return;
  }

  const side = customWidgetSide.value === "right" ? "right" : "left";
  const widget = {
    id: `${CUSTOM_WIDGET_ID_PREFIX}${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    title: "custom",
    side,
    x: 8,
    y: getNewWidgetY(side),
    zIndex: Math.max(1, ...widgets.map((item) => item.zIndex || 1)) + 1,
    data: { heading, text },
  };

  widgets.push(widget);
  closeCustomWidgetPopup();
  renderWidgets();
  if (await saveWidget(widget, { recordHistory: false })) {
    showMessage("widget added ♡");
  } else {
    widgets = widgets.filter((item) => item !== widget);
    renderWidgets();
  }
}

function confirmDeleteCustomWidget() {
  const widget = editingCustomWidget;
  if (!widget) return;
  closeCustomWidgetPopup();
  openConfirmationDialog({
    title: "delete this widget?",
    message: `${widget.data?.heading || "this widget"} will be deleted forever.`,
    onConfirm: async () => {
      const { error } = await dataStore.from("widgets").delete().eq("id", widget.id);
      if (error) {
        showMessage(error.message);
        return;
      }
      widgets = widgets.filter((item) => item.id !== widget.id);
      renderWidgets();
      showMessage("widget deleted ♡");
    },
  });
}

newWidgetBtn?.addEventListener("click", () => openCustomWidgetPopup());
customWidgetForm?.addEventListener("submit", (event) => void saveCustomWidget(event));
deleteCustomWidgetBtn?.addEventListener("click", confirmDeleteCustomWidget);
document.getElementById("closeCustomWidgetBtn")?.addEventListener("click", closeCustomWidgetPopup);
customWidgetPopup?.addEventListener("click", (event) => {
  if (event.target === customWidgetPopup && !popupPointerStartedInsideCard) {
    closeCustomWidgetPopup();
  }
});

initApp();
