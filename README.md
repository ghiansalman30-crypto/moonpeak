# moonpeak monorepo

| Path | What |
|---|---|
| `packages/moonpeak` | the npm package: framework, CLI, inspector, testing ([README](packages/moonpeak/README.md)) |
| `examples/starter` | the starter app `moonpeak new` copies (moon phase View + text tool) |
| `examples/kitchen-sink` | every hook and host action in one View, used to check the inspector end to end |
| `site` | landing page and docs (`node site/build-docs.mjs` regenerates docs from the package README) |

```bash
npm install
cd examples/starter
npx moonpeak dev        # inspector
npx moonpeak test       # schema, View and simulation checks
npx moonpeak test --e2e # Playwright
```
