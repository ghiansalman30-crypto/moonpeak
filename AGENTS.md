# AGENTS.md

Notes for coding agents working in this repository.

## Layout

- `packages/moonpeak`: the npm package. `bin/moonpeak.mjs` (CLI), `lib/` (dev server, build, start, test runner, scaffolder), `lib/runtime/` (React hooks used inside Views), `lib/server/` (MCP server helpers), `inspector/` (the local host UI), `types/` (hand-written `.d.ts`).
- `examples/starter`: the template copied by `moonpeak new`. Its `moonpeak.template.json` maps each resource to its files so `new` can drop the ones the user did not pick. Add new files there when you add a resource.
- `examples/kitchen-sink`: exercises every hook and host action; the inspector checks run against it.
- `site/`: moonpeak-ai.com. `site/build-docs.mjs` turns `packages/moonpeak/README.md` into `site/docs/index.html`.

## Rules

- Plain ESM JavaScript in `packages/moonpeak/lib`; keep `types/*.d.ts` in sync with any API change.
- Views must use exactly one `useAppState` per View (it holds one object).
- Never let moonpeak itself be pre-bundled by Vite (`OPTIMIZE_DEPS` in `lib/vite.js`): two runtime copies means the View never receives host data.
- An app-only tool (`visibility: ["app"]`) must stay hidden from the model with or without its own resource.
- Visual baselines (`__screenshots__`) are platform specific and are not committed.

## Before you push

```bash
npm install
npx playwright install chromium
npm run validate
```

`validate` runs typecheck, `moonpeak test` for every example, both builds and the starter's Playwright suite. CI runs the same thing on Linux and also scaffolds a project from the packed tarball.
