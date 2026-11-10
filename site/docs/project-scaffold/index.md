# Project scaffold

> What npx moonpeak new creates, and how moonpeak discovers tools, Views and tests.

```
moon-app/
  package.json
  tsconfig.json
  playwright.config.ts
  moonpeak.config.js        optional
  src/
    tools/                  one MCP tool per file
      show-moon.ts
      moon-facts.ts
    resources/              one View per folder
      moon/
        moon.tsx
        moon.css
    lib/                    shared code
  tests/
    simulations/            fixtures for the inspector and moonpeak test
      show-moon.json
    e2e/                    Playwright tests
      moon.spec.ts
    evals/                  model evals
      moon.eval.json
```

## Discovery rules

| Folder | Rule |
|---|---|
| `src/tools/*.ts` (also `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`) | Every file is one tool. The file name is the tool name. `*.test.*`, `*.spec.*` and `*.d.ts` are ignored. |
| `src/resources/<name>/<name>.tsx` | Every folder is one View, served as `ui://<app>/<name>.html`. A `<name>.css`, `style.css` or `styles.css` next to it is included. |
| `tests/simulations/*.json` | One file per tool, holding one simulation or an array of them. |
| `tests/e2e/*.spec.ts` | Run by `moonpeak test --e2e`. |
| `tests/evals/*.eval.json` | Run by `moonpeak test --eval`. |

The app name (used in resource URIs) is `name` from `moonpeak.config.js`, else `name` from `package.json`.

## Scripts

| Script | Runs |
|---|---|
| `npm run dev` | `moonpeak dev`: inspector + MCP server with hot reload |
| `npm test` | `moonpeak test` |
| `npm run test:e2e` | `moonpeak test --e2e` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `moonpeak build` |
| `npm start` | `moonpeak start` |

## Starter resources

`new` can include any of three example Views. Each comes with its tools, simulations, e2e tests and evals, so you can delete the ones you don't need without breaking the others.

- [moon](/docs/resources/moon): a detail card
- [calendar](/docs/resources/calendar): a carousel
- [review](/docs/resources/review): a review and confirm flow
