// `moonpeak build`: one self-contained HTML file per View + one server bundle.
//
//   dist/resources/<name>.html   JS and CSS inlined, ready for any MCP Apps host
//   dist/server.mjs              your tools and resource configs, bundled
//   dist/manifest.json           what was built
import fs from "node:fs";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { discoverResources, discoverTools, loadConfig } from "./project.js";
import { buildViewHtml } from "./vite.js";
import { c } from "./log.js";

export async function buildProject({ root, outDir = "dist", quiet = false } = {}) {
  const t0 = Date.now();
  const cfg = await loadConfig(root);
  const out = path.resolve(root, outDir);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "resources"), { recursive: true });

  const tools = discoverTools(root);
  const resources = discoverResources(root);
  if (!tools.length) throw new Error("no tools found in src/tools");

  const say = (s) => !quiet && console.log(s);
  say(`\n  ${c.bold("moonpeak build")} ${c.dim(cfg.name)}\n`);

  for (const r of resources) {
    const html = await buildViewHtml({ root, appName: cfg.name, name: r.name, userVite: cfg.vite });
    fs.writeFileSync(path.join(out, "resources", `${r.name}.html`), html);
    say(`  ${c.green("✓")} view    ${r.name.padEnd(24)} ${c.dim((Buffer.byteLength(html) / 1024).toFixed(1) + " kB")}`);
  }

  const posix = (p) => p.replace(/\\/g, "/");
  const entry = [
    ...tools.map((t, i) => `import * as t${i} from ${JSON.stringify(posix(t.file))};`),
    ...resources.map((r, i) => `import * as r${i} from ${JSON.stringify(posix(r.file))};`),
    `export const app = ${JSON.stringify({ name: cfg.name, version: cfg.version, instructions: cfg.instructions })};`,
    `export const tools = [${tools.map((t, i) => `{ name: ${JSON.stringify(t.name)}, module: t${i} }`).join(", ")}];`,
    `export const resources = [${resources.map((r, i) => `{ name: ${JSON.stringify(r.name)}, config: r${i}.resource || {} }`).join(", ")}];`,
  ].join("\n");

  await esbuild({
    stdin: { contents: entry, resolveDir: root, sourcefile: "moonpeak-server-entry.js", loader: "js" },
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    packages: "external",
    jsx: "automatic",
    outfile: path.join(out, "server.mjs"),
    loader: { ".css": "empty", ".svg": "empty", ".png": "empty", ".jpg": "empty", ".webp": "empty", ".gif": "empty", ".woff2": "empty" },
    logLevel: "error",
  });
  say(`  ${c.green("✓")} server  ${"server.mjs".padEnd(24)} ${c.dim(tools.length + " tools")}`);

  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify({ name: cfg.name, version: cfg.version, builtAt: new Date().toISOString(), tools: tools.map((t) => t.name), resources: resources.map((r) => r.name) }, null, 2),
  );
  say(`\n  ${c.dim(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), out) || "."}`)}`);
  say(`  ${c.dim("run it with")} moonpeak start\n`);
  return out;
}

/** Load a built project as plain data for createMcpServer / createHandler. */
export async function loadBuilt(root, outDir = "dist") {
  const out = path.resolve(root, outDir);
  const file = path.join(out, "server.mjs");
  if (!fs.existsSync(file)) throw new Error(`nothing built yet: run "moonpeak build" first (looked for ${file})`);
  const { pathToFileURL } = await import("node:url");
  const mod = await import(pathToFileURL(file).href);
  const resources = mod.resources.map((r) => {
    const html = fs.readFileSync(path.join(out, "resources", `${r.name}.html`), "utf8");
    return { ...r, html: () => html };
  });
  return { ...mod.app, tools: mod.tools, resources };
}
