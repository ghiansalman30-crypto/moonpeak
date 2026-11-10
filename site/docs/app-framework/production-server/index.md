# Production server

> moonpeak build and moonpeak start, and how to mount the build on another runtime.

```bash
moonpeak build     # dist/resources/<view>.html, dist/server.mjs, dist/manifest.json
moonpeak start     # serves /mcp and /health on $PORT or 8000
```

`dist/server.mjs` bundles your tools (dependencies stay external, so install them in production). Each `dist/resources/*.html` is one self-contained View.

## Endpoints

| Path | |
|---|---|
| `/mcp` | the MCP server (Streamable HTTP) |
| `/health` | `{ ok, name, version, tools }` for load balancers |

## Mount it yourself

```ts
// Express
import express from "express";
import { createNodeHandler, loadBuilt } from "moonpeak/server";

const app = express();
app.all("/mcp", await createNodeHandler(await loadBuilt(process.cwd())));
app.listen(8000);
```

```ts
// Cloudflare Workers, Hono, Deno, Bun
import { createHandler } from "moonpeak/server";
import * as built from "./dist/server.mjs";
// however your runtime imports text files (Wrangler text rules, Bun, Deno...)
import moon from "./dist/resources/moon.html";
import calendar from "./dist/resources/calendar.html";
const html = { moon, calendar };

const handle = createHandler({
  ...built.app,
  tools: built.tools,
  resources: built.resources.map((r) => ({ ...r, html: () => html[r.name] })),
});
export default { fetch: (req) => (new URL(req.url).pathname === "/mcp" ? handle(req) : new Response("ok")) };
```

Then put it behind HTTPS. See [Deployment](/docs/guides/deployment).
