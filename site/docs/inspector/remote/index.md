# Remote servers

> Inspect an MCP server you didn't build with moonpeak.

```bash
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
```

- The inspector runs on localhost and proxies `/mcp` to the server, adding the headers server-side, so tokens never reach the page.
- Views are loaded with `resources/read`, like a host does, and rendered in the same sandbox.
- Simulations come from `tests/simulations/` in the folder you ran the command in.
- Servers that don't offer the optional `GET` stream (they answer `405`) are handled quietly.

Try it on the live demo: `npx moonpeak inspect --server https://moonpeak-ai.com/mcp`.
