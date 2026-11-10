@@page slug="" title="Overview" nav="Overview" description="Server-agnostic MCP testing framework and full-stack MCP App framework."

moonpeak is one npm package with three jobs:

- **An MCP App framework.** One file per tool, one folder per View. React hooks for tool data, theme, display modes, state and host actions. The same project runs as a ChatGPT App, a Claude connector and in every other MCP Apps host.
- **An MCP testing framework.** Simulations, schema and View checks, Playwright e2e against ChatGPT and Claude style hosts, visual regression and real-model evals. It also tests MCP servers written in any language.
- **An MCP App inspector.** ChatGPT-style and Claude-style hosts on localhost, with every host setting in the URL.

```bash
npx moonpeak new
```

It is built on the official [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps) and the MCP TypeScript SDK v2, so what works in the inspector works in real hosts.

## Where to start

| If you want to | Read |
|---|---|
| Build your first app | [Quickstart](/docs/quickstart) |
| Understand the folders | [Project scaffold](/docs/project-scaffold) |
| Write a tool or a View | [Tools](/docs/app-framework/tools) · [Views](/docs/app-framework/views) |
| Look up a hook | [Runtime APIs](/docs/app-framework/runtime-apis) |
| Test an existing MCP server | [Any MCP server](/docs/testing/any-server) |
| Ship it | [Deployment](/docs/guides/deployment) |
| Learn the protocol | [MCP Apps introduction](/docs/mcp-apps) |

## Try the live demo

The starter app runs at `https://moonpeak-ai.com/mcp`. Add it as a custom connector in Claude, as an app in ChatGPT developer mode, or open it in the inspector:

```bash
npx moonpeak inspect --server https://moonpeak-ai.com/mcp
```

## For agents

Every docs page has a Markdown version (add `index.md` to its URL). [llms.txt](/docs/llms.txt) lists them all and [llms-full.txt](/docs/llms-full.txt) has every page in one file. The repository also ships an [agent skill](https://github.com/ghiansalman30-crypto/moonpeak/blob/main/skills/moonpeak/SKILL.md) for Claude Code and other coding agents.

@@page slug="quickstart" title="Quickstart" description="From npx moonpeak new to a View rendering in Claude."

## 1. Create a project

```bash
npx moonpeak new
```

`new` asks three things:

1. **Project name**, for example `moon-app`.
2. **Resources**: which starter Views to include. Pick any of `moon`, `calendar` and `review`, or press Enter for all of them.
3. **Install dependencies?** Press Enter to install with the package manager you ran it with (npm, pnpm, yarn or bun).

You can skip the questions:

```bash
npx moonpeak new moon-app calendar,review --install
```

## 2. Start the inspector

```bash
cd moon-app
npm run dev
```

Open http://localhost:3000. The inspector lists your tools, runs the selected one and renders its View in a ChatGPT-style host. Switch to the Claude host, dark theme, a phone width or fullscreen from the sidebar. Your MCP server is live at http://localhost:3000/mcp.

## 3. Change something

Edit `src/resources/moon/moon.tsx` and save: the View updates in place and keeps its state. Edit `src/tools/show-moon.ts` and the next call uses the new code. No restart.

## 4. Test it

```bash
npm test                      # schemas, Views and simulations, in seconds
npx playwright install chromium
npx moonpeak test --e2e       # Playwright against the inspector
```

## 5. Run it in Claude or ChatGPT

```bash
npm run build && npm start    # http://localhost:8000/mcp
```

Put that behind HTTPS (see [Deployment](/docs/guides/deployment)), then:

- **Claude**: Settings → Connectors → Add custom connector → `https://your-domain/mcp`
- **ChatGPT**: Settings → Apps → enable Developer mode → Create app → `https://your-domain/mcp`

Ask *"what does the moon look like on Nov 24?"* and the moon View renders in the chat.

## Next

- [Project scaffold](/docs/project-scaffold): what every folder does
- [Tools](/docs/app-framework/tools) and [Views](/docs/app-framework/views)
- [Simulations](/docs/testing/simulations)

@@page slug="project-scaffold" title="Project scaffold" description="What npx moonpeak new creates, and how moonpeak discovers tools, Views and tests."

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

@@page slug="configuration" title="Configuration" description="moonpeak works without a config file. moonpeak.config.js is there when you need it."

Create `moonpeak.config.js` (or `.mjs`) in the project root and export an object:

```js
// moonpeak.config.js
export default {
  name: "moon-app",              // app name in ui:// URIs; defaults to package.json name
  version: "1.2.0",              // server version; defaults to package.json version
  instructions: "Use show-moon for anything about the moon on a date.",
  port: 3000,                    // dev server port
  vite: {
    plugins: [],                 // extra Vite plugins for your Views (e.g. Tailwind)
    resolve: { alias: {} },
    define: {},
    css: {},
  },
};
```

| Key | Used by | Default |
|---|---|---|
| `name` | resource URIs, server info | `package.json` name, then the folder name |
| `version` | server info | `package.json` version, then `0.0.0` |
| `instructions` | MCP `initialize` instructions sent to the host | none |
| `port` | `moonpeak dev` | 3000, or the next free port |
| `vite` | building Views in dev and `moonpeak build` | moonpeak's own React setup |

## Tailwind or other Vite plugins

```js
import tailwindcss from "@tailwindcss/vite";
export default { vite: { plugins: [tailwindcss()] } };
```

Then `@import "tailwindcss";` in your View's CSS file.

## Per-View settings

Settings for one View live next to it, as `export const resource = {...}` in the View file. See [Views](/docs/app-framework/views#resource-config).
