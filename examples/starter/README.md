# moonpeak app

An MCP App built with [moonpeak](https://moonpeak-ai.com). It renders inside ChatGPT, Claude and every other MCP Apps host.

```bash
npm install
npm run dev        # inspector at http://localhost:3000, MCP server at /mcp
```

## Layout

```
src/
  tools/        one MCP tool per file (export `tool`, `schema` and a default handler)
  resources/    one View per folder (React component + optional CSS)
  lib/          shared code (moon math, the moon drawing)
tests/
  simulations/  fixtures for the inspector and `moonpeak test`
  e2e/          Playwright tests against the inspector
  evals/        checks that real models pick the right tool
```

## Commands

| | |
|---|---|
| `npm run dev` | inspector + MCP server with hot reload |
| `npm test` | schema, View and simulation checks |
| `npx moonpeak test --e2e` | Playwright tests (run `npx playwright install chromium` once) |
| `npx moonpeak test --eval` | model evals, needs `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` |
| `npm run build` | one self-contained HTML file per View + `dist/server.mjs` |
| `npm start` | serve the build at `http://localhost:8000/mcp` |

## Try it in a real host

Deploy `npm run build && npm start` behind HTTPS, then add `https://your-domain/mcp`:

- **Claude**: Settings → Connectors → Add custom connector
- **ChatGPT**: Settings → Apps → Developer mode → Create app

Docs: https://moonpeak-ai.com/docs/
