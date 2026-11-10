// moonpeak/server: turn discovered tools + resources into an MCP server.
// Portable: the handler is a fetch-style function, so it mounts on Node,
// Express, Hono, Cloudflare Workers, Deno or Bun.
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

export { RESOURCE_MIME_TYPE };

export const resourceUri = (app, name) => `ui://${slug(app)}/${name}.html`;

function slug(s) {
  return String(s || "app").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "app";
}

/** Accept a zod raw shape, a zod object, or nothing. */
function toSchema(schema) {
  if (!schema) return undefined;
  if (typeof schema?.["~standard"] === "object") return schema; // already a schema
  return z.object(schema);
}

/** Tool handlers may return a plain object; wrap it as a CallToolResult. */
export function normalizeResult(ret) {
  if (ret === undefined || ret === null) return { content: [] };
  if (typeof ret === "string") return { content: [{ type: "text", text: ret }] };
  if (typeof ret === "object" && ("content" in ret || "structuredContent" in ret || "isError" in ret)) {
    const out = { ...ret };
    if (!out.content) out.content = out.structuredContent ? [{ type: "text", text: JSON.stringify(out.structuredContent) }] : [];
    return out;
  }
  return { structuredContent: ret, content: [{ type: "text", text: JSON.stringify(ret) }] };
}

/**
 * @param {object} opts
 * @param {string} opts.name               server name (also the ui:// namespace)
 * @param {string} [opts.version]
 * @param {Array<{name:string, module:any}>} opts.tools
 * @param {Array<{name:string, config?:object, html:()=>string|Promise<string>}>} opts.resources
 */
export function createMcpServer({ name, version = "0.0.0", tools = [], resources = [], instructions }) {
  const server = new McpServer({ name, version }, instructions ? { instructions } : undefined);
  const known = new Set(resources.map((r) => r.name));

  for (const r of resources) {
    const cfg = r.config || {};
    const uri = resourceUri(name, r.name);
    const ui = {};
    if (cfg.csp) ui.csp = cfg.csp;
    if (cfg.permissions) ui.permissions = cfg.permissions;
    if (cfg.domain) ui.domain = cfg.domain;
    if (cfg.prefersBorder !== undefined) ui.prefersBorder = cfg.prefersBorder;
    const meta = { ui };
    // Older ChatGPT Apps SDK keys, so the same resource renders there too.
    if (cfg.description) meta["openai/widgetDescription"] = cfg.description;
    if (cfg.prefersBorder !== undefined) meta["openai/widgetPrefersBorder"] = cfg.prefersBorder;
    if (cfg.csp) meta["openai/widgetCSP"] = { connect_domains: cfg.csp.connectDomains ?? [], resource_domains: cfg.csp.resourceDomains ?? [] };

    registerAppResource(
      server,
      cfg.title || r.name,
      uri,
      { description: cfg.description, mimeType: RESOURCE_MIME_TYPE, _meta: meta },
      async () => ({ contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: await r.html(), _meta: meta }] }),
    );
  }

  for (const t of tools) {
    const mod = t.module || {};
    const def = mod.tool || {};
    const handler = mod.default || mod.handler;
    if (typeof handler !== "function") throw new Error(`moonpeak: tool "${t.name}" has no default export handler`);
    const config = {
      title: def.title,
      description: def.description,
      inputSchema: toSchema(mod.schema ?? def.schema),
      annotations: def.annotations,
      _meta: { ...(def._meta || {}) },
    };
    const out = toSchema(mod.outputSchema ?? def.outputSchema);
    if (out) config.outputSchema = out;

    const cb = async (...args) => {
      const ctx = args.length > 1 ? args[1] : args[0];
      const input = args.length > 1 ? args[0] : {};
      try {
        return normalizeResult(await handler(input ?? {}, ctx));
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: e?.message || String(e) }] };
      }
    };

    // Visibility applies with or without a View: an app-only helper tool (no resource
    // of its own) must still be hidden from the model, or the model could call it.
    if (def.visibility) {
      config._meta.ui = { ...(config._meta.ui || {}), visibility: def.visibility };
      if (!def.visibility.includes("model")) config._meta["openai/visibility"] = "private";
      if (def.visibility.includes("app")) config._meta["openai/widgetAccessible"] = true;
    }

    if (def.resource) {
      if (!known.has(def.resource)) throw new Error(`moonpeak: tool "${t.name}" points at resource "${def.resource}", which does not exist in src/resources`);
      const uri = resourceUri(name, def.resource);
      config._meta.ui = { ...(config._meta.ui || {}), resourceUri: uri };
      config._meta["openai/outputTemplate"] = uri;
      if (def.invoking) config._meta["openai/toolInvocation/invoking"] = def.invoking;
      if (def.invoked) config._meta["openai/toolInvocation/invoked"] = def.invoked;
      registerAppTool(server, t.name, config, cb);
    } else {
      server.registerTool(t.name, config, cb);
    }
  }
  return server;
}

/** Fetch-style handler: `(request: Request) => Promise<Response>`. Stateless, one server per request. */
export function createHandler(opts) {
  const h = createMcpHandler(() => createMcpServer(opts), { legacy: "stateless" });
  return (request) => h.fetch(request);
}

/** Node `(req, res)` handler, for http.createServer or Express. */
export async function createNodeHandler(opts) {
  const { toNodeHandler } = await import("@modelcontextprotocol/node");
  const h = createMcpHandler(() => createMcpServer(opts), { legacy: "stateless" });
  return toNodeHandler(h);
}

/** Alias kept for people coming from other MCP App frameworks. */
export const createMcpHandlerFor = createHandler;

/**
 * Load a `moonpeak build` output (dist/server.mjs + dist/resources/*.html) as
 * server options for createHandler / createNodeHandler. Node only; node built-ins
 * are imported lazily so this module still loads on Workers.
 */
export async function loadBuilt(root = ".", outDir = "dist") {
  const [{ default: fs }, { default: path }, { pathToFileURL }] = await Promise.all([import("node:fs"), import("node:path"), import("node:url")]);
  const out = path.resolve(root, outDir);
  const file = path.join(out, "server.mjs");
  if (!fs.existsSync(file)) throw new Error(`nothing built yet: run "moonpeak build" first (looked for ${file})`);
  const mod = await import(pathToFileURL(file).href);
  const resources = mod.resources.map((r) => {
    const html = fs.readFileSync(path.join(out, "resources", `${r.name}.html`), "utf8");
    return { ...r, html: () => html };
  });
  return { ...mod.app, tools: mod.tools, resources };
}
