# moonpeak inspect

> Open the inspector against any MCP server.

```bash
moonpeak inspect --server <url> [--header k:v]... [--port 3000]
```

```bash
moonpeak inspect --server http://localhost:8000/mcp
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
moonpeak inspect --server https://moonpeak-ai.com/mcp
```

The inspector proxies `/mcp` to the server (adding your headers), lists its tools, reads `ui://` resources with `resources/read` and renders them exactly like a host. Simulations come from `tests/simulations/` in the current folder, so you can keep fixtures for a server that moonpeak didn't build (`moonpeak test init --server` writes them). See [Remote servers](/docs/inspector/remote).
