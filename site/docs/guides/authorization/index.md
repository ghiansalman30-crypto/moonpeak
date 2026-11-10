# Authorization

> Protecting a moonpeak server and testing protected servers.

moonpeak's server has no built-in auth: put it behind the auth your platform already uses.

## Protecting your server

Mount the handler behind a middleware that checks the request before it reaches `/mcp`:

```ts
import express from "express";
import { createNodeHandler, loadBuilt } from "moonpeak/server";

const mcp = await createNodeHandler(await loadBuilt(process.cwd()));
const app = express();
app.all("/mcp", (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${process.env.MCP_TOKEN}`) return res.status(401).end();
  next();
}, mcp);
app.listen(8000);
```

For per-user access in Claude and ChatGPT, implement OAuth 2.1 as described in the MCP authorization spec (protected resource metadata plus an authorization server); hosts run the user through the login flow when they add your connector. Handlers can then read the verified user from the request in your middleware.

## Testing protected servers

```bash
moonpeak test --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
```

The inspector adds headers server-side in its proxy, so the token is never exposed to the page.
