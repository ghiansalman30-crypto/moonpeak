// `moonpeak dev` and `moonpeak inspect`: one local server with
//   /mcp                 your MCP server (Streamable HTTP), reloaded on every change
//   /                    the inspector (ChatGPT + Claude style hosts on localhost)
//   /__moonpeak/view/x   a View with hot module reload, used by the inspector
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { Readable } from "node:stream";
import { createServer as createVite } from "vite";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpServer } from "./server/index.js";
import { discoverResources, discoverSimulations, discoverTools, loadConfig } from "./project.js";
import { baseConfig, buildViewHtml, devViewHtml, OPTIMIZE_DEPS, PKG_DIR } from "./vite.js";
import { c } from "./log.js";

export async function freePort(start) {
  for (let p = start; p < start + 50; p++) {
    // Free only if nothing holds it on IPv4 loopback, IPv6 loopback or the wildcard.
    let ok = true;
    for (const opts of [{ host: "127.0.0.1" }, { host: "::1", ipv6Only: true }, { host: "::", ipv6Only: false }]) {
      ok = await new Promise((resolve) => {
        const s = net.createServer();
        s.once("error", (e) => resolve(e.code === "EADDRNOTAVAIL" || e.code === "EAFNOSUPPORT"));
        s.listen({ port: p, ...opts }, () => s.close(() => resolve(true)));
      });
      if (!ok) break;
    }
    if (ok) return p;
  }
  throw new Error(`no free port near ${start}`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (d) => chunks.push(d));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

const inspectorHtml = () => fs.readFileSync(path.join(PKG_DIR, "inspector", "index.html"), "utf8");

/** Load tools + resources through Vite so TypeScript and edits just work. */
export async function loadProject(vite, root, cfg, viewCache) {
  const tools = [];
  for (const t of discoverTools(root)) tools.push({ name: t.name, module: await vite.ssrLoadModule(t.file) });
  const resources = [];
  for (const r of discoverResources(root)) {
    let config = {};
    try {
      config = (await vite.ssrLoadModule(r.file)).resource || {};
    } catch (e) {
      console.warn(c.yellow(`  ! could not read resource config for ${r.name}: ${e.message}`));
    }
    resources.push({
      name: r.name,
      config,
      html: () => {
        if (!viewCache.has(r.name)) {
          viewCache.set(
            r.name,
            buildViewHtml({ root, appName: cfg.name, name: r.name, userVite: cfg.vite, minify: false }).catch((e) => {
              viewCache.delete(r.name);
              throw e;
            }),
          );
        }
        return viewCache.get(r.name);
      },
    });
  }
  return { tools, resources };
}

export async function startDev({ root, port, remote, open = false, quiet = false } = {}) {
  const cfg = remote ? { name: "inspect" } : await loadConfig(root);
  // One HTTP server for everything, including Vite's HMR websocket (no second port).
  const server = http.createServer();
  const vite = await createVite({
    ...baseConfig({ root: remote ? PKG_DIR : root, appName: cfg.name, userVite: cfg.vite }),
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: { server },
      fs: { allow: [root || PKG_DIR, PKG_DIR, path.resolve(PKG_DIR, "..", "..")] },
    },
    optimizeDeps: remote ? { include: ["@modelcontextprotocol/ext-apps/app-bridge", "@modelcontextprotocol/client"] } : OPTIMIZE_DEPS,
  });

  const viewCache = new Map();
  if (!remote) {
    vite.watcher.on("all", (_ev, file) => {
      if (file.startsWith(path.join(root, "src"))) viewCache.clear();
    });
  }

  const mcp = remote
    ? null
    : toNodeHandler(
        createMcpHandler(
          async () => {
            const { tools, resources } = await loadProject(vite, root, cfg, viewCache);
            return createMcpServer({ name: cfg.name, version: cfg.version, instructions: cfg.instructions, tools, resources });
          },
          { legacy: "stateless", onerror: (e) => console.error(c.red("  mcp error: ") + (e?.stack || e)) },
        ),
      );

  async function proxy(req, res) {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
    const headers = {};
    for (const h of ["content-type", "accept", "mcp-session-id", "mcp-protocol-version", "authorization", "last-event-id"]) {
      if (req.headers[h]) headers[h] = req.headers[h];
    }
    if (remote.headers) Object.assign(headers, remote.headers);
    try {
      const r = await fetch(remote.url, { method: req.method, headers, body });
      // Servers without a push stream answer the optional GET with 405, which the
      // browser logs as a failed request. Hand the inspector an idle stream instead;
      // nothing is lost, since such a server never sends anything on it.
      if (req.method === "GET" && r.status === 405) {
        await r.body?.cancel().catch(() => {});
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
        res.write(": moonpeak idle stream\n\n");
        const ping = setInterval(() => res.write(": ping\n\n"), 25000);
        req.on("close", () => clearInterval(ping));
        return;
      }
      const out = {};
      r.headers.forEach((v, k) => {
        if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) out[k] = v;
      });
      res.writeHead(r.status, out);
      if (r.body) Readable.fromWeb(r.body).pipe(res);
      else res.end();
    } catch (e) {
      json(res, 502, { error: `could not reach ${remote.url}: ${e.message}` });
    }
  }

  server.on("request", async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    // Dev server answers on every interface (IPv4 + IPv6) but only to local host names.
    const hostname = String(req.headers.host || "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname) && !hostname.endsWith(".localhost")) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("moonpeak dev only answers on localhost");
    }
    try {
      if (url.pathname === "/mcp") return remote ? proxy(req, res) : mcp(req, res);

      if (url.pathname === "/__moonpeak/api/project") {
        if (remote) return json(res, 200, { name: remote.url, remote: true, server: remote.url, simulations: remote.simulations || [] });
        return json(res, 200, {
          name: cfg.name,
          version: cfg.version,
          remote: false,
          tools: discoverTools(root).map((t) => t.name),
          resources: discoverResources(root).map((r) => r.name),
          simulations: discoverSimulations(root),
        });
      }

      const view = url.pathname.match(/^\/__moonpeak\/view\/([\w.-]+)$/);
      if (view && !remote) {
        const html = await vite.transformIndexHtml(url.pathname, devViewHtml(view[1]));
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        return res.end(html);
      }

      if (url.pathname === "/" || url.pathname === "/index.html") {
        const html = await vite.transformIndexHtml("/", inspectorHtml());
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        return res.end(html);
      }

      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end("not found");
      });
    } catch (e) {
      vite.ssrFixStacktrace?.(e);
      console.error(c.red("  error: ") + (e?.stack || e));
      if (!res.headersSent) json(res, 500, { error: e.message });
    }
  });

  const p = await freePort(port || Number(cfg.port) || 3000);
  await new Promise((r) => server.listen({ port: p, host: "::", ipv6Only: false }, r));
  const base = `http://localhost:${p}`;
  if (!quiet) {
    console.log("");
    console.log(`  ${c.bold("moonpeak")} ${c.dim(remote ? "inspect" : "dev")}`);
    console.log(`  ${c.dim("inspector")}  ${c.cyan(base + "/")}`);
    console.log(`  ${c.dim("mcp")}        ${c.cyan(base + "/mcp")}${remote ? c.dim("  -> " + remote.url) : ""}`);
    console.log("");
  }
  if (open) openBrowser(base);
  return {
    url: base,
    port: p,
    close: async () => {
      await new Promise((r) => server.close(r));
      await vite.close();
    },
  };
}

export function openBrowser(url) {
  import("node:child_process").then(({ spawn }) => {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
    try {
      spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref();
    } catch {}
  });
}
