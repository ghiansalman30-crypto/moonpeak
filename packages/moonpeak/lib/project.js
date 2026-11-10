// Convention over configuration: everything is discovered from the folder layout.
//
//   src/tools/<tool-name>.ts            -> one MCP tool per file
//   src/resources/<name>/<name>.tsx     -> one UI resource (View) per folder
//   src/resources/<name>.tsx            -> also accepted
//   tests/simulations/*.json            -> deterministic fixtures for the inspector and `moonpeak test`
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CODE = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];

export function findRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, "src", "tools")) || fs.existsSync(path.join(dir, "moonpeak.config.js"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(start);
    dir = up;
  }
}

export function readPackage(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  } catch {
    return {};
  }
}

export async function loadConfig(root) {
  const pkg = readPackage(root);
  let cfg = {};
  for (const f of ["moonpeak.config.js", "moonpeak.config.mjs"]) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      const mod = await import(pathToFileURL(p).href + `?t=${Date.now()}`);
      cfg = mod.default || mod;
      break;
    }
  }
  return {
    name: cfg.name || pkg.name || path.basename(root),
    version: cfg.version || pkg.version || "0.0.0",
    instructions: cfg.instructions,
    port: cfg.port,
    vite: cfg.vite,
    ...cfg,
  };
}

const isCode = (f) => CODE.includes(path.extname(f)) && !/\.(test|spec|d)\.[cm]?[jt]sx?$/.test(f);

export function discoverTools(root) {
  const dir = path.join(root, "src", "tools");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(isCode)
    .sort()
    .map((f) => ({ name: f.replace(/\.[^.]+$/, ""), file: path.join(dir, f) }));
}

export function discoverResources(root) {
  const dir = path.join(root, "src", "resources");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const file = CODE.map((e) => path.join(sub, entry.name + e)).find((p) => fs.existsSync(p)) || CODE.map((e) => path.join(sub, "index" + e)).find((p) => fs.existsSync(p));
      if (file) out.push({ name: entry.name, file, dir: sub });
    } else if (isCode(entry.name)) {
      out.push({ name: entry.name.replace(/\.[^.]+$/, ""), file: path.join(dir, entry.name), dir });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Simulations: one JSON file can hold one scenario or an array of them. */
export function discoverSimulations(root) {
  const dir = path.join(root, "tests", "simulations");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const base = f.replace(/\.json$/, "");
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      out.push({ id: base, file: f, error: `invalid JSON: ${e.message}` });
      continue;
    }
    const list = Array.isArray(data) ? data : [data];
    list.forEach((s, i) => {
      out.push({
        id: list.length > 1 ? `${base}#${s.name ? slug(s.name) : i + 1}` : base,
        file: f,
        name: s.name || base,
        tool: s.tool || base,
        input: s.input ?? {},
        output: s.output, // optional: mocked structured content (skips the real handler in the inspector)
        result: s.result, // optional: full mocked CallToolResult
        expect: s.expect, // optional: assertions for `moonpeak test`
        host: s.host, // optional: { name, theme, displayMode, locale, width }
        prompt: s.prompt, // optional: user message shown in the inspector chat
      });
    });
  }
  return out;
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Read `export const resource = {...}` without executing the React file (good enough for literals). */
export function staticResourceConfig(file) {
  const src = fs.readFileSync(file, "utf8");
  const m = src.match(/export\s+const\s+resource\s*(?::[^=]+)?=\s*(\{[\s\S]*?\n\})/);
  if (!m) return {};
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${m[1].replace(/\bsatisfies\s+\w+/g, "")});`)();
  } catch {
    return {};
  }
}
