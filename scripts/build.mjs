import * as esbuild from "esbuild";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outdir = path.join(root, "dist");
const args = new Set(process.argv.slice(2));
const serve = args.has("--serve");
const watch = serve && !args.has("--no-watch");

const ENTRY_MARKER = /<script type="module" src="\.\/src\/main\.js"><\/script>/;
const CSS_MARKER = /<meta name="build" content="css" \/>/;
const THEMES_MARKER = /<meta name="build" content="themes" \/>/;
const THEMES_DIR = path.join(root, "src", "themes");

async function buildThemes() {
  const urls = {};
  let names = [];
  try {
    names = (await readdir(THEMES_DIR)).filter((file) => file.endsWith(".css"));
  } catch {
    return urls;
  }
  for (const file of names) {
    const source = await readFile(path.join(THEMES_DIR, file), "utf8");
    const { code } = await esbuild.transform(source, {
      loader: "css",
      minify: true,
      target: ["chrome90", "firefox90", "safari15"],
    });
    const hash = createHash("sha256").update(code).digest("hex").slice(0, 8).toUpperCase();
    const name = file.replace(/\.css$/, "");
    const outName = `theme-${name}-${hash}.css`;
    await writeFile(path.join(outdir, "assets", outName), code);
    urls[name] = `./assets/${outName}`;
  }
  return urls;
}

async function listFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full)];
    }),
  );
  return files.flat().map((file) => file.split(path.sep).join("/"));
}

async function writeHtmlAndServiceWorker(metafile) {
  const outputs = Object.entries(metafile.outputs);
  const entry = outputs.find(([, info]) => info.entryPoint === "src/main.js");
  if (!entry) throw new Error("main entry missing from build output");

  const toUrl = (file) =>
    `./${path.relative(outdir, path.join(root, file)).split(path.sep).join("/")}`;
  const jsUrl = toUrl(entry[0]);
  const cssUrl = entry[1].cssBundle ? toUrl(entry[1].cssBundle) : "";

  const themeUrls = await buildThemes();
  let html = await readFile(path.join(root, "index.html"), "utf8");
  if (!ENTRY_MARKER.test(html) || !CSS_MARKER.test(html) || !THEMES_MARKER.test(html)) {
    throw new Error("index.html is missing the build markers");
  }
  html = html
    .replace(
      CSS_MARKER,
      `${cssUrl ? `<link rel="stylesheet" href="${cssUrl}" />\n    ` : ""}<link rel="modulepreload" href="${jsUrl}" />`,
    )
    .replace(
      THEMES_MARKER,
      `<script>
      window.__THEME_CSS__ = ${JSON.stringify(themeUrls)};
      (function () {
        var href = window.__THEME_CSS__[document.documentElement.dataset.theme];
        if (href) document.write('<link rel="stylesheet" id="themeStylesheet" href="' + href + '" />');
      })();
    </script>`,
    )
    .replace(ENTRY_MARKER, `<script type="module" src="${jsUrl}"></script>`);
  await writeFile(path.join(outdir, "index.html"), html);

  const files = (await listFiles(outdir)).filter(
    (file) =>
      !file.endsWith(".map") &&
      file !== "sw.js" &&
      !file.startsWith("icons/icon-maskable") &&
      !file.startsWith("themes/") &&
      !/launching(-pc)?\.jpeg$/.test(file),
  );
  const versionHash = createHash("sha256");
  for (const file of files.sort()) {
    versionHash.update(file);
    versionHash.update(await readFile(path.join(outdir, file)));
  }
  const version = versionHash.digest("hex").slice(0, 12);
  const template = await readFile(path.join(root, "src", "sw.template.js"), "utf8");
  const sw = template
    .replace("__CACHE_VERSION__", version)
    .replace(
      "__PRECACHE_URLS__",
      JSON.stringify(["./", ...files.map((file) => `./${file}`)], null, 2),
    );
  await writeFile(path.join(outdir, "sw.js"), sw);
  return { jsUrl, cssUrl, version, fileCount: files.length };
}

const htmlPlugin = {
  name: "html-and-sw",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length || !result.metafile) return;
      try {
        await cp(path.join(root, "public"), outdir, { recursive: true });
        const info = await writeHtmlAndServiceWorker(result.metafile);
        const sizes = await Promise.all(
          [info.jsUrl, info.cssUrl].filter(Boolean).map(async (url) => {
            const { size } = await stat(path.join(outdir, url));
            return `${url} ${(size / 1024).toFixed(1)} KB`;
          }),
        );
        console.log(
          `built ${new Date().toLocaleTimeString()} · sw ${info.version} · ${sizes.join(" · ")}`,
        );
      } catch (error) {
        console.error(error);
        if (!watch) process.exitCode = 1;
      }
    });
  },
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const options = {
  absWorkingDir: root,
  entryPoints: ["src/main.js"],
  outdir: path.join(outdir, "assets"),
  bundle: true,
  splitting: true,
  format: "esm",
  target: ["es2020", "chrome90", "firefox90", "safari15"],
  minify: true,
  sourcemap: "linked",
  legalComments: "none",
  entryNames: "[name]-[hash]",
  chunkNames: "[name]-[hash]",
  assetNames: "[name]-[hash]",
  loader: {
    ".cur": "file",
    ".png": "file",
    ".jpg": "file",
    ".jpeg": "file",
    ".webp": "file",
    ".svg": "file",
  },
  metafile: true,
  logLevel: "warning",
  plugins: [htmlPlugin],
};

if (serve) {
  const ctx = await esbuild.context(options);
  if (watch) await ctx.watch();
  else await ctx.rebuild();
  const { port } = await ctx.serve({ servedir: outdir, port: 5173 });
  console.log(`serving dist/ on http://localhost:${port}`);
} else {
  const result = await esbuild.build(options);
  if (result.errors.length) process.exit(1);
}
