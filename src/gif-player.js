const MAX_FRAMES = 240;
const gifCache = new Map();
const players = new Set();
let decoderPromise = null;
let rafId = 0;

function loadDecoder() {
  decoderPromise =
    decoderPromise ||
    import("gifuct-js").then((module) => (module.parseGIF ? module : module.default));
  return decoderPromise;
}

function loadGif(url) {
  if (gifCache.has(url)) return gifCache.get(url);
  const promise = (async () => {
    const [{ parseGIF, decompressFrames }, response] = await Promise.all([
      loadDecoder(),
      fetch(url, { mode: "cors", credentials: "omit" }),
    ]);
    if (!response.ok) throw new Error(`gif ${response.status}`);
    const gif = parseGIF(await response.arrayBuffer());
    const frames = decompressFrames(gif, true).slice(0, MAX_FRAMES);
    if (frames.length < 2) throw new Error("not animated");

    const width = gif.lsd.width;
    const height = gif.lsd.height;
    const composed = document.createElement("canvas");
    composed.width = width;
    composed.height = height;
    const context = composed.getContext("2d", { willReadFrequently: true });
    const patch = document.createElement("canvas");
    const patchContext = patch.getContext("2d");
    const output = [];
    let previous = null;

    for (const frame of frames) {
      if (previous?.disposalType === 2) {
        const { left, top, width: w, height: h } = previous.dims;
        context.clearRect(left, top, w, h);
      }
      const restore = frame.disposalType === 3 ? context.getImageData(0, 0, width, height) : null;
      const { left, top, width: w, height: h } = frame.dims;
      patch.width = w;
      patch.height = h;
      const image = patchContext.createImageData(w, h);
      image.data.set(frame.patch);
      patchContext.putImageData(image, 0, 0);
      context.drawImage(patch, left, top);

      const still = document.createElement("canvas");
      still.width = width;
      still.height = height;
      still.getContext("2d").drawImage(composed, 0, 0);
      output.push({ image: still, delay: Math.max(20, Number(frame.delay) || 100) });

      if (restore) context.putImageData(restore, 0, 0);
      previous = frame;
    }
    return { width, height, frames: output };
  })();
  promise.catch(() => gifCache.delete(url));
  gifCache.set(url, promise);
  return promise;
}

function drawPlayer(player) {
  const { canvas, gif } = player;
  const frame = gif.frames[player.index];
  const ratio = window.devicePixelRatio || 1;
  const boxWidth = Math.max(1, Math.round(canvas.clientWidth * ratio));
  const boxHeight = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width !== boxWidth || canvas.height !== boxHeight) {
    canvas.width = boxWidth;
    canvas.height = boxHeight;
  }
  const scale = Math.max(boxWidth / gif.width, boxHeight / gif.height);
  const drawWidth = gif.width * scale;
  const drawHeight = gif.height * scale;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, boxWidth, boxHeight);
  context.drawImage(
    frame.image,
    (boxWidth - drawWidth) / 2,
    (boxHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function tick(now) {
  rafId = 0;
  players.forEach((player) => {
    if (!player.canvas.isConnected) {
      players.delete(player);
      return;
    }
    if (!player.canvas.clientWidth || player.canvas.closest("section[aria-hidden]")) return;
    if (now < player.nextAt) return;
    player.index = (player.index + 1) % player.gif.frames.length;
    player.nextAt = now + player.gif.frames[player.index].delay;
    drawPlayer(player);
  });
  if (players.size) rafId = requestAnimationFrame(tick);
}

function swapToCanvas(img, gif) {
  if (!img.isConnected) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  img.replaceWith(canvas);
  const player = { canvas, gif, index: 0, nextAt: performance.now() + gif.frames[0].delay };
  drawPlayer(player);
  players.add(player);
  if (!rafId) rafId = requestAnimationFrame(tick);
}

export function forgetGifs(urls) {
  urls.forEach((url) => gifCache.delete(url));
}

export function animateGifImage(img) {
  const url = img.src;
  if (!url) return;
  loadGif(url)
    .then((gif) => {
      if (img.isConnected) {
        swapToCanvas(img, gif);
        return;
      }
      requestAnimationFrame(() => swapToCanvas(img, gif));
    })
    .catch(() => {});
}
