// `moonpeak test`: run every simulation against your server, with no host, no
// tunnel and no API keys. Works on a moonpeak project or any MCP server (--server).
import fs from "node:fs";
import path from "node:path";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";
import { createMcpServer } from "../server/index.js";
import { discoverSimulations, loadConfig } from "../project.js";
import { c } from "../log.js";

/** Connect an MCP client to the project in-process, or to a remote server. */
export async function connect({ root, server, headers } = {}) {
  const client = new Client({ name: "moonpeak-test", version: "1.0.0" });
  if (server) {
    await client.connect(new StreamableHTTPClientTransport(new URL(server), { requestInit: { headers } }));
    return { client, close: () => client.close() };
  }
  const { createServer } = await import("vite");
  const { baseConfig } = await import("../vite.js");
  const { loadProject } = await import("../dev.js");
  const cfg = await loadConfig(root);
  const vite = await createServer({ ...baseConfig({ root, appName: cfg.name, userVite: cfg.vite }), appType: "custom", server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  const project = await loadProject(vite, root, cfg, new Map());
  const mcp = createMcpServer({ name: cfg.name, version: cfg.version, instructions: cfg.instructions, ...project });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await mcp.connect(a);
  await client.connect(b);
  return {
    client,
    close: async () => {
      await client.close();
      await mcp.close();
      await vite.close();
    },
  };
}

// ---------- matching ----------

/** Every key in `want` must match `got`. Arrays match element by element; strings starting with "re:" are regexes. */
export function partialMatch(got, want, at = "$") {
  if (want === null || typeof want !== "object") {
    if (typeof want === "string" && want.startsWith("re:")) {
      return new RegExp(want.slice(3)).test(String(got)) ? [] : [`${at}: ${JSON.stringify(got)} does not match /${want.slice(3)}/`];
    }
    if (want === "*") return got === undefined ? [`${at}: missing`] : [];
    return Object.is(got, want) ? [] : [`${at}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`];
  }
  if (got === null || typeof got !== "object") return [`${at}: expected an ${Array.isArray(want) ? "array" : "object"}, got ${JSON.stringify(got)}`];
  if (Array.isArray(want)) {
    if (!Array.isArray(got)) return [`${at}: expected an array`];
    const errs = [];
    want.forEach((w, i) => errs.push(...partialMatch(got[i], w, `${at}[${i}]`)));
    return errs;
  }
  const errs = [];
  for (const [k, w] of Object.entries(want)) {
    if (k === "$length") {
      if (got.length !== w) errs.push(`${at}.length: expected ${w}, got ${got.length}`);
      continue;
    }
    if (k === "$minLength") {
      if (!(got.length >= w)) errs.push(`${at}.length: expected at least ${w}, got ${got.length}`);
      continue;
    }
    errs.push(...partialMatch(got[k], w, `${at}.${k}`));
  }
  return errs;
}

const textOf = (res) => (res?.content || []).filter((x) => x.type === "text").map((x) => x.text).join("\n");

export function checkResult(res, expect = {}) {
  const errs = [];
  const isErr = Boolean(res?.isError);
  if (expect.isError !== undefined) {
    if (expect.isError !== isErr) errs.push(`expected isError ${expect.isError}, got ${isErr}${isErr ? ` (${textOf(res)})` : ""}`);
  } else if (isErr) {
    errs.push(`tool returned an error: ${textOf(res)}`);
  }
  if (expect.output !== undefined) errs.push(...partialMatch(res?.structuredContent, expect.output, "output"));
  for (const t of [].concat(expect.text ?? [])) {
    if (!textOf(res).includes(t)) errs.push(`text does not contain ${JSON.stringify(t)}`);
  }
  return errs;
}

// ---------- runner ----------

export async function runTests({ root, server, headers, filter, quiet = false } = {}) {
  const t0 = Date.now();
  const say = (s = "") => !quiet && console.log(s);
  say(`\n  ${c.bold("moonpeak test")} ${c.dim(server || path.basename(root))}\n`);

  const { client, close } = await connect({ root, server, headers });
  const results = [];
  const record = (group, name, errs, ms) => {
    results.push({ group, name, ok: !errs.length, errs });
    say(`  ${errs.length ? c.red("✗") : c.green("✓")} ${c.dim(group.padEnd(10))} ${name} ${c.gray(ms + "ms")}`);
    for (const e of errs) say(`      ${c.red(e)}`);
  };

  try {
    const { tools } = await client.listTools();

    // 1. Static checks on every tool
    for (const t of tools) {
      if (filter && !t.name.includes(filter)) continue;
      const errs = [];
      if (!t.description) errs.push("missing description (models pick tools by their description)");
      if (t.inputSchema?.type !== "object") errs.push("inputSchema must be an object schema");
      record("schema", t.name, errs, 0);
    }

    // 2. Every View resolves to real HTML
    const seen = new Set();
    for (const t of tools) {
      const uri = getToolUiResourceUri(t);
      if (!uri || seen.has(uri) || (filter && !t.name.includes(filter))) continue;
      seen.add(uri);
      const s = Date.now();
      const errs = [];
      try {
        const res = await client.readResource({ uri });
        const item = res.contents?.[0];
        if (!item?.text?.includes("<script")) errs.push("resource has no script, the View would render empty");
        if (item?.mimeType !== "text/html;profile=mcp-app") errs.push(`mimeType is ${item?.mimeType}, hosts expect text/html;profile=mcp-app`);
      } catch (e) {
        errs.push(`resources/read failed: ${e.message}`);
      }
      record("view", uri, errs, Date.now() - s);
    }

    // 3. Simulations
    const sims = root ? discoverSimulations(root) : [];
    const names = new Set(tools.map((t) => t.name));
    for (const sim of sims) {
      if (filter && !sim.id.includes(filter) && !sim.tool.includes(filter)) continue;
      if (sim.error) {
        record("sim", sim.id, [sim.error], 0);
        continue;
      }
      if (!names.has(sim.tool)) {
        record("sim", sim.id, [`tool "${sim.tool}" does not exist`], 0);
        continue;
      }
      const s = Date.now();
      let errs;
      try {
        const res = await client.callTool({ name: sim.tool, arguments: sim.input });
        errs = checkResult(res, sim.expect || {});
      } catch (e) {
        errs = sim.expect?.isError ? [] : [`call failed: ${e.message}`];
      }
      record("sim", sim.id, errs, Date.now() - s);
    }
    if (root && !sims.length) say(`  ${c.yellow("!")} no simulations in tests/simulations yet. Try: moonpeak test init`);
  } finally {
    await close();
  }

  const failed = results.filter((r) => !r.ok).length;
  say(`\n  ${failed ? c.red(`${failed} failed`) : c.green("all passed")} ${c.dim(`· ${results.length} checks · ${((Date.now() - t0) / 1000).toFixed(1)}s`)}\n`);
  return { results, failed };
}

/** `moonpeak test init`: write a simulation per tool from the live schema. */
export async function initTests({ root, server, headers }) {
  const { client, close } = await connect({ root: server ? undefined : root, server, headers });
  const dir = path.join(root, "tests", "simulations");
  fs.mkdirSync(dir, { recursive: true });
  const written = [];
  try {
    const { tools } = await client.listTools();
    for (const t of tools) {
      const file = path.join(dir, `${t.name}.json`);
      if (fs.existsSync(file)) continue;
      const input = {};
      for (const [k, p] of Object.entries(t.inputSchema?.properties || {})) {
        input[k] = p.default ?? p.examples?.[0] ?? p.enum?.[0] ?? (p.type === "number" || p.type === "integer" ? 1 : p.type === "boolean" ? true : p.type === "array" ? [] : p.type === "object" ? {} : "example");
      }
      fs.writeFileSync(file, JSON.stringify({ name: `${t.name} happy path`, tool: t.name, prompt: `Use ${t.title || t.name}`, input, expect: { isError: false } }, null, 2) + "\n");
      written.push(path.relative(root, file));
    }
  } finally {
    await close();
  }
  if (server) {
    const cfgFile = path.join(root, "moonpeak.test.json");
    if (!fs.existsSync(cfgFile)) fs.writeFileSync(cfgFile, JSON.stringify({ server }, null, 2) + "\n");
  }
  return written;
}
