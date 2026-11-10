# moonpeak dev

> MCP server and inspector with hot reload, on one port.

```bash
moonpeak dev [--port 3000] [--open]
```

Starts one HTTP server with:

| Path | |
|---|---|
| `/` | the inspector |
| `/mcp` | your MCP server (Streamable HTTP) |
| `/__moonpeak/view/<name>` | a View with Vite HMR |

Saving a View hot-swaps it and keeps its state; saving a tool takes effect on the next call. If the port is busy, the next free one is used. The server only answers on `localhost` (requests with another `Host` header get `403`), which blocks DNS-rebinding attacks from web pages.

`--open` opens the inspector in your browser. The port can also come from `moonpeak.config.js`.
