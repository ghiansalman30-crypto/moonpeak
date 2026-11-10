// Vite wiring shared by `dev`, `build` and `inspect`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { discoverResources } from "./project.js";

export const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOUNT = path.join(PKG_DIR, "lib", "runtime", "mount.js").replace(/\\/g, "/");
const INSPECTOR = path.join(PKG_DIR, "inspector").replace(/\\/g, "/");

const VIEW = "virtual:moonpeak/view/";

/** Virtual entry per resource: connect to the host and mount the component. */
export function moonpeakPlugin({ root, appName }) {
  return {
    name: "moonpeak",
    enforce: "pre",
    resolveId(id) {
      if (id.startsWith(VIEW)) return "\0" + id;
      if (id.startsWith("/@moonpeak/inspector/")) return path.join(INSPECTOR, id.slice("/@moonpeak/inspector/".length)).replace(/\\/g, "/");
      return null;
    },
    load(id) {
      if (!id.startsWith("\0" + VIEW)) return null;
      const name = id.slice(("\0" + VIEW).length);
      const res = discoverResources(root).find((r) => r.name === name);
      if (!res) return `throw new Error("moonpeak: unknown resource ${name}")`;
      const file = res.file.replace(/\\/g, "/");
      const css = ["styles.css", "style.css", `${name}.css`].map((f) => path.join(res.dir, f)).find((p) => fs.existsSync(p));
      return [
        css ? `import ${JSON.stringify(css.replace(/\\/g, "/"))};` : "",
        `import Component from ${JSON.stringify(file)};`,
        `import { mount } from ${JSON.stringify(MOUNT)};`,
        `mount(Component, { name: ${JSON.stringify(appName + "/" + name)} });`,
      ].join("\n");
    },
  };
}

export function baseConfig({ root, appName, userVite = {} }) {
  return {
    root,
    configFile: false,
    logLevel: "warn",
    clearScreen: false,
    plugins: [moonpeakPlugin({ root, appName }), react(), ...(userVite.plugins || [])],
    resolve: { dedupe: ["react", "react-dom"], ...(userVite.resolve || {}) },
    define: userVite.define,
    css: userVite.css,
    server: { fs: { allow: [root, PKG_DIR, path.resolve(PKG_DIR, "..", "..")] } },
  };
}

export const VIEW_ID = (name) => VIEW + name;

/** A View page as served by the dev server (with HMR). */
export function devViewHtml(name) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title>
<style>html,body{margin:0;background:transparent}</style></head>
<body><div id="root"></div><script>try{if(parent!==window&&parent.__moonpeakOpenAI){var o=parent.__moonpeakOpenAI(window);if(o)window.openai=o}}catch(e){}</script><script type="module" src="/@id/__x00__${VIEW}${name}"></script></body></html>`;
}

/** Build one resource into a single self-contained HTML string (JS + CSS inlined). */
export async function buildViewHtml({ root, appName, name, userVite, minify = true }) {
  const { build } = await import("vite");
  const cfg = baseConfig({ root, appName, userVite });
  const out = await build({
    ...cfg,
    mode: "production",
    define: { "process.env.NODE_ENV": '"production"', ...(cfg.define || {}) },
    build: {
      write: false,
      emptyOutDir: false,
      minify,
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
      modulePreload: false,
      reportCompressedSize: false,
      rollupOptions: {
        input: VIEW + name,
        onwarn(w, warn) {
          if (w.code === "INVALID_ANNOTATION" || w.code === "MODULE_LEVEL_DIRECTIVE") return;
          warn(w);
        },
        output: { format: "es", inlineDynamicImports: true, entryFileNames: "view.js", assetFileNames: "[name][extname]" },
      },
    },
  });
  const outputs = (Array.isArray(out) ? out : [out]).flatMap((o) => o.output);
  const js = outputs.filter((o) => o.type === "chunk").map((o) => o.code).join("\n");
  const css = outputs
    .filter((o) => o.type === "asset" && String(o.fileName).endsWith(".css"))
    .map((o) => (typeof o.source === "string" ? o.source : Buffer.from(o.source).toString("utf8")))
    .join("\n");
  const safe = (s) => s.replace(/<\/(script|style)/gi, "<\\/$1");
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title>
<style>html,body{margin:0;background:transparent}</style>${css ? `<style>${safe(css)}</style>` : ""}</head>
<body><div id="root"></div><script type="module">${safe(js)}</script></body></html>`;
}
