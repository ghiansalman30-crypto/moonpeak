// `moonpeak start`: serve the built project over Streamable HTTP.
import http from "node:http";
import { createNodeHandler } from "./server/index.js";
import { loadBuilt } from "./build.js";
import { c } from "./log.js";

export async function startProd({ root, port, host = "0.0.0.0", outDir = "dist" } = {}) {
  const opts = await loadBuilt(root, outDir);
  const mcp = await createNodeHandler(opts);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/mcp") return mcp(req, res);
    if (url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, name: opts.name, version: opts.version, tools: opts.tools.length }));
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`${opts.name} MCP server. Connect your host to /mcp`);
  });
  const p = Number(port || process.env.PORT || 8000);
  await new Promise((r) => server.listen(p, host, r));
  console.log(`\n  ${c.bold("moonpeak start")} ${c.dim(opts.name + "@" + opts.version)}`);
  console.log(`  ${c.dim("mcp")}  ${c.cyan(`http://localhost:${p}/mcp`)}\n`);
  return { port: p, close: () => new Promise((r) => server.close(r)) };
}
