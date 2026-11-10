# moonpeak start

> Serve a build at /mcp.

```bash
moonpeak start [--port 8000] [--out dist]
```

Serves the build in `--out` (default `dist/`) on `0.0.0.0`: `/mcp` and `/health`. The port is `--port`, else `$PORT`, else `8000`. Run `moonpeak build` first.
