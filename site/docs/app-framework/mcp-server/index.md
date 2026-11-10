# MCP server

> The server moonpeak builds from your tools and Views, and how to use it directly.

`moonpeak dev` and `moonpeak start` both build an MCP server from your project. You can also use the pieces yourself from `moonpeak/server`:

```ts
import { createMcpServer, createHandler, createNodeHandler, resourceUri, RESOURCE_MIME_TYPE } from "moonpeak/server";
```

| Export | What it does |
|---|---|
| `createMcpServer(opts)` | An `McpServer` (MCP TypeScript SDK v2) with every tool and `ui://` resource registered. |
| `createHandler(opts)` | A Fetch handler `(Request) => Promise<Response>` for Workers, Hono, Deno, Bun, Next.js. Stateless: one server per request. |
| `createNodeHandler(opts)` | A Node `(req, res)` handler for `http.createServer` and Express. |
| `resourceUri(app, name)` | `ui://<app>/<name>.html` |
| `RESOURCE_MIME_TYPE` | `text/html;profile=mcp-app` |

`opts` is `{ name, version?, instructions?, tools, resources }`. The easiest way to get it is from a build:

```ts
import { loadBuilt } from "moonpeak/server";   // reads dist/server.mjs + dist/resources (Node)
const opts = await loadBuilt(process.cwd());
```

or by importing `dist/server.mjs` and reading the HTML files yourself (see [Production server](/docs/app-framework/production-server)).

## Transport

Streamable HTTP at `/mcp`, stateless. `POST` carries JSON-RPC; the optional `GET` stream answers `405` because the server never pushes. That is spec-compliant and every host handles it.
