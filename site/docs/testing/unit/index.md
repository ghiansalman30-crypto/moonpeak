# In-process checks

> What moonpeak test checks, in seconds, with no browser.

```bash
moonpeak test [--filter plan-night]
```

Runs your real handlers in-process over an in-memory MCP transport:

1. **Setup**: the project has tools. An empty project fails loudly instead of passing.
2. **Schema**: every tool lists with a valid input schema (and output schema if you set one).
3. **View**: every `ui://` resource builds and returns HTML with the MCP Apps MIME type.
4. **Simulations**: every simulation with `expect` runs against the handler (or its mocked output) and is checked.

Nothing leaves your machine. Use `--filter` to run one tool or simulation.
