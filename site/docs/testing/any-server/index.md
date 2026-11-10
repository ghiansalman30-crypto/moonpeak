# Any MCP server

> Test and inspect MCP servers written in Python, Go, Rust, Java or anything else.

Everything in the testing framework works against a server moonpeak didn't build, over Streamable HTTP:

```bash
# write fixtures for each tool, plus moonpeak.test.json
moonpeak test init --server http://localhost:8000/mcp

# edit tests/simulations/*.json, then
moonpeak test                       # picks the server up from moonpeak.test.json
moonpeak test --server http://localhost:8000/mcp --header "authorization:Bearer $TOKEN"

# look at its Views
moonpeak inspect --server http://localhost:8000/mcp
```

The folder only needs `tests/simulations/` (and optionally `tests/e2e/`, `tests/evals/`). No `src/`, no build.

If the server can't be reached, moonpeak says so with the URL instead of a stack trace, and exits `1`.
