@@page slug="app-framework/tools" title="Tools" description="One file in src/tools is one MCP tool: metadata, a zod schema and a handler."

```ts
// src/tools/show-moon.ts
import { z } from "zod";
import { moonOn, parseDate } from "../lib/moon";

export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date. Use when the user asks about the moon on a date.",
  resource: "moon",                     // render src/resources/moon as the UI
  annotations: { readOnlyHint: true },
  invoking: "Looking up",               // ChatGPT status while running
  invoked: "Here's the moon",           // ...and after
};

export const schema = {
  date: z.string().optional().describe("Date as YYYY-MM-DD. Defaults to today."),
};

export default async function showMoon({ date }: { date?: string }) {
  return moonOn(parseDate(date));       // a plain object becomes structuredContent
}
```

## Exports

| Export | Required | What it is |
|---|---|---|
| `default` | yes | The handler: `(input, ctx) => result`. May be async. |
| `tool` | yes | Metadata (below). |
| `schema` | no | Input schema: a zod raw shape (`{ date: z.string() }`) or a zod object (any Standard Schema). |
| `outputSchema` | no | Output schema, same forms. Hosts can validate `structuredContent` against it. |

## `tool` fields

| Field | Meaning |
|---|---|
| `description` | Written for the model: say what the tool does and when to use it. This is what evals test. |
| `title` | Human name shown by hosts. |
| `resource` | Name of a folder in `src/resources`. Makes this an MCP App tool with a View. Leave it out for a text-only tool. |
| `visibility` | `["model", "app"]` (default), `["model"]`, or `["app"]` for a helper only your View may call. See [Tool visibility](/docs/mcp-apps/visibility). |
| `annotations` | MCP hints: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`. |
| `invoking`, `invoked` | Short status texts ChatGPT shows while the tool runs and after. |
| `_meta` | Extra `_meta` keys merged into the tool definition. |

## What a handler can return

| Return | Becomes |
|---|---|
| A plain object | `structuredContent`, plus a JSON text copy in `content` for the model |
| A string | One text content block |
| A full `CallToolResult` (`{ content, structuredContent, isError, _meta }`) | Passed through as is |
| `throw new Error("...")` | `isError: true` with your message as text |

See [Tool results](/docs/mcp-apps/tool-results) for how hosts use each part.

## A text-only tool

```ts
// src/tools/moon-facts.ts
export const tool = { title: "Moon facts", description: "Answer a quick moon question in text." };
export default async function () {
  return "The Moon is 384,400 km away on average.";
}
```

## Validation errors

Input is validated against `schema` before your handler runs. A bad call returns a tool error naming the field, which `moonpeak test` and the inspector both show.

@@page slug="app-framework/views" title="Views" description="One folder in src/resources is one View: a React component the host renders next to the chat."

```tsx
// src/resources/moon/moon.tsx
import { useToolData, useTheme, useCallTool } from "moonpeak";

export const resource = {
  title: "Moon phase",
  description: "Moon phase for a date with a 7-day strip",
  prefersBorder: true,
};

export default function Moon() {
  const { output, isPending, isError } = useToolData<{ date?: string }, { phase: string }>();
  const theme = useTheme();
  if (isError) return <p className="error">Something went wrong.</p>;
  if (isPending) return <p>Reading the sky…</p>;
  return <h1 className={theme}>{output?.phase}</h1>;
}
```

The default export is the View. moonpeak connects it to the host, mounts it and wraps it in an error boundary; you never touch `postMessage`.

## Styles

A CSS file in the folder named `<name>.css`, `style.css` or `styles.css` is imported automatically. Each View is built into one HTML file with its CSS and JS inlined, so it works under strict host CSPs. Style both themes: hosts can switch between light and dark at any time.

## Resource config

`export const resource = {...}` sets per-View options:

| Field | Meaning |
|---|---|
| `title`, `description` | Shown by hosts and used as ChatGPT's widget description. |
| `prefersBorder` | Ask the host to draw a border around the View. |
| `csp.connectDomains` | Origins the View may `fetch` from. |
| `csp.resourceDomains` | Origins for images, fonts and scripts. |
| `csp.frameDomains`, `csp.baseUriDomains` | Origins for nested frames and `<base>`. |
| `permissions` | Ask for `camera`, `microphone`, `geolocation` or `clipboardWrite`. |
| `domain` | A dedicated origin for the View, when the host supports it. |

See [Security & CSP](/docs/mcp-apps/security).

## Rules of thumb

- Call every hook before the first early `return`.
- Use one [`useAppState`](/docs/hooks/use-app-state) per View for state that should survive reloads.
- Talk to your server with [`useCallTool`](/docs/hooks/use-call-tool), not `fetch`, unless you set `csp.connectDomains`.
- Keep the View useful in a 320 px wide frame; check it with the inspector's mobile device.

## Hot reload

In `moonpeak dev`, saving a View hot-swaps the component and keeps its state. Saving the `resource` config or a tool takes effect on the next call without a page reload.

@@page slug="app-framework/runtime-apis" title="Runtime APIs" description="Every hook a View can use, from moonpeak, moonpeak/chatgpt and moonpeak/claude."

Hooks from `moonpeak` work in every MCP Apps host. Hooks from `moonpeak/chatgpt` and `moonpeak/claude` are safe to call anywhere and return empty values outside their host.

## Tool data

| Hook | Returns |
|---|---|
| [useToolData](/docs/hooks/use-tool-data) | `{ input, output, content, isPending, isError, isStreaming, isCancelled, tool, result }` |
| [useToolInput](/docs/hooks/use-tool-input) | the tool input |
| [useToolOutput](/docs/hooks/use-tool-output) | the structured output |
| [useToolResult](/docs/hooks/use-tool-result) | the raw `CallToolResult` |

## Host context

| Hook | Returns |
|---|---|
| [useTheme](/docs/hooks/use-theme) | `"light" \| "dark"` |
| [useDisplayMode](/docs/hooks/use-display-mode) | `"inline" \| "pip" \| "fullscreen"` |
| [useRequestDisplayMode](/docs/hooks/use-request-display-mode) | a function to request a mode, plus `available` |
| [useHostContext](/docs/hooks/use-host-context) | the whole host context |
| [useLocale](/docs/hooks/use-locale) · [useTimeZone](/docs/hooks/use-time-zone) | locale and IANA time zone |
| [usePlatform](/docs/hooks/use-platform) · [useDeviceCapabilities](/docs/hooks/use-device-capabilities) | `web/desktop/mobile`, touch and hover |
| [useSafeArea](/docs/hooks/use-safe-area) · [useContainerSize](/docs/hooks/use-container-size) · [useMaxHeight](/docs/hooks/use-max-height) | layout limits |

## Host

| Hook | Returns |
|---|---|
| [useHost](/docs/hooks/use-host) | `{ name, version }` of the host |
| [useHostCapabilities](/docs/hooks/use-host-capabilities) | what the host supports |
| [useConnection](/docs/hooks/use-connection) | `{ status, ready, error }` |
| [useApp](/docs/hooks/use-app) | the raw MCP Apps SDK `App` |

## Actions

| Hook | Does |
|---|---|
| [useCallTool](/docs/hooks/use-call-tool) | call a tool on your server through the host |
| [useSendMessage](/docs/hooks/use-send-message) | post a message as the user |
| [useUpdateModelContext](/docs/hooks/use-update-model-context) | tell the model something silently |
| [useOpenLink](/docs/hooks/use-open-link) · [useDownloadFile](/docs/hooks/use-download-file) · [useLog](/docs/hooks/use-log) | host actions |

## State

| Hook | Does |
|---|---|
| [useAppState](/docs/hooks/use-app-state) | one state object per View, persisted in ChatGPT, optionally shared with the model |
| [useResultState](/docs/hooks/use-result-state) | local state that resets on every new result |

## Host extras

| Hook | From |
|---|---|
| [useIsChatGPT](/docs/hooks/use-is-chat-gpt), [useWidgetState](/docs/hooks/use-widget-state), [useOpenAiGlobal](/docs/hooks/use-open-ai-global), [useUploadFile](/docs/hooks/use-upload-file), [useRequestModal](/docs/hooks/use-request-modal), [useUserAgent](/docs/hooks/use-user-agent) | `moonpeak/chatgpt` |
| [useIsClaude](/docs/hooks/use-is-claude), [useClaudeStyles](/docs/hooks/use-claude-styles) | `moonpeak/claude` |

## Helpers

```ts
import { isHost, connect } from "moonpeak";
isHost(useHost(), "claude");   // forgiving host-name check
```

`connect()` is called for you when a View mounts. Call it yourself only if you render without moonpeak's entry (for example in a test harness).

@@page slug="app-framework/chatgpt" title="ChatGPT Apps" description="A moonpeak project is a ChatGPT App. What moonpeak adds for ChatGPT, and how to try it."

ChatGPT Apps are MCP Apps. Every moonpeak resource carries both the MCP Apps metadata and the older ChatGPT Apps SDK keys, so ChatGPT renders your Views without extra work:

| moonpeak | ChatGPT key |
|---|---|
| tool `resource` | `openai/outputTemplate` |
| tool `invoking`, `invoked` | `openai/toolInvocation/invoking`, `.../invoked` |
| tool `visibility: ["app"]` | `openai/visibility: "private"` and `openai/widgetAccessible: true` |
| resource `description` | `openai/widgetDescription` |
| resource `prefersBorder` | `openai/widgetPrefersBorder` |
| resource `csp` | `openai/widgetCSP` |

## ChatGPT-only hooks

```tsx
import { useIsChatGPT, useWidgetState, useOpenAiGlobal, useUploadFile, useRequestModal, useUserAgent } from "moonpeak/chatgpt";
```

They read `window.openai` and do nothing outside ChatGPT. Prefer the portable hooks when one exists: [`useAppState`](/docs/hooks/use-app-state) already saves to ChatGPT's widget state.

## Try it in ChatGPT

1. Deploy over HTTPS (see [Deployment](/docs/guides/deployment)).
2. In ChatGPT: Settings → Apps → enable **Developer mode** → **Create app**.
3. Enter `https://your-domain/mcp` and save.
4. In a new chat, ask for something your tool handles.

The inspector's ChatGPT host replicates `window.openai` (globals, widget state, display modes), so most issues show up locally first.

@@page slug="app-framework/claude" title="Claude connectors" description="A moonpeak project is a Claude connector with interactive UI."

Claude renders MCP Apps natively. Deploy your server and add it as a connector:

1. Deploy over HTTPS (see [Deployment](/docs/guides/deployment)).
2. In Claude: Settings → Connectors → **Add custom connector**.
3. Enter `https://your-domain/mcp`.
4. Enable the connector in a chat and ask for something your tool handles.

## Claude-only hooks

```tsx
import { useIsClaude, useClaudeStyles } from "moonpeak/claude";

const vars = useClaudeStyles();   // fonts and colors Claude sends in host context
```

moonpeak already applies host style variables to the document, so `var(--font-sans)` and friends work in your CSS in every host that sends them.

## Auth

If your server needs a user's credentials, see [Authorization](/docs/guides/authorization).

@@page slug="app-framework/mcp-server" title="MCP server" description="The server moonpeak builds from your tools and Views, and how to use it directly."

`moonpeak dev` and `moonpeak start` both build an MCP server from your project. You can also use the pieces yourself from `moonpeak/server`:

```ts
import { createMcpServer, createHandler, createNodeHandler, resourceUri, RESOURCE_MIME_TYPE } from "moonpeak/server";
```

| Export | What it does |
|---|---|
| `createMcpServer(opts)` | An `McpServer` (MCP TypeScript SDK v2) with every tool and `ui://` resource registered. |
| `createHandler(opts)` | A Fetch handler `(Request) => Promise<Response>` for Workers, Hono, Deno, Bun, Next.js. Stateless: one server per request. |
| `createNodeHandler(opts)` | A Node `(req, res)` handler for `http.createServer` and Express. |
| `resourceUri(app, name)` | `ui://<app>/<name>.html` |
| `RESOURCE_MIME_TYPE` | `text/html;profile=mcp-app` |

`opts` is `{ name, version?, instructions?, tools, resources }`. The easiest way to get it is from a build:

```ts
import { loadBuilt } from "moonpeak/server";   // reads dist/server.mjs + dist/resources (Node)
const opts = await loadBuilt(process.cwd());
```

or by importing `dist/server.mjs` and reading the HTML files yourself (see [Production server](/docs/app-framework/production-server)).

## Transport

Streamable HTTP at `/mcp`, stateless. `POST` carries JSON-RPC; the optional `GET` stream answers `405` because the server never pushes. That is spec-compliant and every host handles it.

@@page slug="app-framework/production-server" title="Production server" description="moonpeak build and moonpeak start, and how to mount the build on another runtime."

```bash
moonpeak build     # dist/resources/<view>.html, dist/server.mjs, dist/manifest.json
moonpeak start     # serves /mcp and /health on $PORT or 8000
```

`dist/server.mjs` bundles your tools (dependencies stay external, so install them in production). Each `dist/resources/*.html` is one self-contained View.

## Endpoints

| Path | |
|---|---|
| `/mcp` | the MCP server (Streamable HTTP) |
| `/health` | `{ ok, name, version, tools }` for load balancers |

## Mount it yourself

```ts
// Express
import express from "express";
import { createNodeHandler, loadBuilt } from "moonpeak/server";

const app = express();
app.all("/mcp", await createNodeHandler(await loadBuilt(process.cwd())));
app.listen(8000);
```

```ts
// Cloudflare Workers, Hono, Deno, Bun
import { createHandler } from "moonpeak/server";
import * as built from "./dist/server.mjs";
// however your runtime imports text files (Wrangler text rules, Bun, Deno...)
import moon from "./dist/resources/moon.html";
import calendar from "./dist/resources/calendar.html";
const html = { moon, calendar };

const handle = createHandler({
  ...built.app,
  tools: built.tools,
  resources: built.resources.map((r) => ({ ...r, html: () => html[r.name] })),
});
export default { fetch: (req) => (new URL(req.url).pathname === "/mcp" ? handle(req) : new Response("ok")) };
```

Then put it behind HTTPS. See [Deployment](/docs/guides/deployment).
