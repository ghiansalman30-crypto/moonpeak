# moonpeak

**MCP App framework. MCP testing framework. A local inspector with ChatGPT and Claude style hosts.**

Build interactive apps that render inside ChatGPT, Claude and every other MCP Apps host, then test them in CI without host accounts, tunnels or AI credits.

```bash
npx moonpeak new my-app       # asks which resources to include and whether to install
cd my-app
npm run dev            # inspector at http://localhost:3000, MCP server at /mcp
```

Open source, MIT licensed. Built on the official [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps) and the MCP TypeScript SDK v2, so what works in the inspector works in real hosts.

---

## What you get

| | |
|---|---|
| **App framework** | One file per tool, one folder per View. React hooks for tool data, theme, display mode, state, calling tools and posting messages. |
| **Inspector** | ChatGPT-style and Claude-style hosts on localhost. Switch host, theme, device width and display mode (inline, PiP, fullscreen). Edit tool input and output live. Every setting lives in the URL. |
| **Testing** | `moonpeak test` checks schemas, Views and simulations in-process. `--e2e` runs Playwright against the inspector. `--eval` checks real models pick the right tool. `--server` tests any MCP server in any language. |
| **Production** | `moonpeak build` inlines each View into one HTML file and bundles your tools. Serve with `moonpeak start`, or mount `createHandler` on Workers, Hono, Express, Deno or Bun. |

## Starter resources

`npx moonpeak new` asks which of these to include. Pass them directly with `npx moonpeak new my-app calendar,review`.

| Resource | Pattern | What it shows |
|---|---|---|
| `moon` | detail card | moon phase for a date, a 7-day strip, calling tools from the View |
| `calendar` | carousel | swipeable cards of the upcoming phases, loading more through the host |
| `review` | review / confirm | the model proposes a plan, the user confirms in the UI through an app-only tool |

Flags: `--install` / `--no-install` skip the install question, `-y` accepts every default.

## Project layout

Everything is discovered from the folders. No config file needed.

```
src/
  tools/show-moon.ts            one MCP tool per file
  resources/moon/moon.tsx       one View per folder (+ optional moon.css)
tests/
  simulations/show-moon.json    fixtures for the inspector and `moonpeak test`
  e2e/moon.spec.ts              Playwright tests (optional)
  evals/moon.eval.json          model evals (optional)
```

### A tool

```ts
// src/tools/show-moon.ts
import { z } from "zod";

export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date.",
  resource: "moon",              // render src/resources/moon as the UI
};

export const schema = { date: z.string().optional() };

export default async function ({ date }: { date?: string }) {
  return { date, phase: "Full Moon", illumination: 1 };   // becomes structuredContent
}
```

Return a plain object (structured content), a string (text), or a full `CallToolResult`. Throwing returns `isError: true` with your message. Leave out `resource` for a plain text tool.

### A View

```tsx
// src/resources/moon/moon.tsx
import { useToolData, useTheme, useCallTool, useRequestDisplayMode } from "moonpeak";

export const resource = { title: "Moon phase", prefersBorder: true };

export default function Moon() {
  const { output, isPending } = useToolData<{ date?: string }, { phase: string }>();
  const theme = useTheme();
  if (isPending) return <p>Loading…</p>;
  return <h1 className={theme}>{output?.phase}</h1>;
}
```

## Hooks

Portable, from `moonpeak` (work in every host):

| Hook | Returns |
|---|---|
| `useToolData()` | `{ input, output, content, isPending, isError, isStreaming, isCancelled, tool, result }` |
| `useToolInput()` · `useToolOutput()` · `useToolResult()` | the parts on their own |
| `useTheme()` | `"light" \| "dark"` |
| `useDisplayMode()` · `useRequestDisplayMode()` | current mode, and a function to ask for `inline`, `pip` or `fullscreen` |
| `useAppState(initial, { share })` | one state object per View, persisted in ChatGPT, optionally shared with the model |
| `useResultState(initial)` | local state that resets on every new tool result |
| `useCallTool()` | call another tool on your server through the host |
| `useSendMessage()` | post a message into the chat as the user |
| `useUpdateModelContext()` | tell the model what happened without posting |
| `useOpenLink()` · `useDownloadFile()` · `useLog()` | host actions |
| `useHost()` · `useHostContext()` · `useHostCapabilities()` · `useConnection()` · `useApp()` | host info and the raw `App` |
| `useLocale()` · `useTimeZone()` · `usePlatform()` · `useDeviceCapabilities()` · `useSafeArea()` · `useContainerSize()` · `useMaxHeight()` | environment |

Host extras, safe to call anywhere: `moonpeak/chatgpt` (`useWidgetState`, `useUploadFile`, `useRequestModal`, `useOpenAiGlobal`, `useIsChatGPT`) and `moonpeak/claude` (`useIsClaude`, `useClaudeStyles`).

## Simulations

```json
[
  { "name": "full moon", "prompt": "Moon on Nov 24?", "input": { "date": "2026-11-24" },
    "expect": { "output": { "phase": "Full Moon", "week": { "$length": 7 } } } },
  { "name": "mocked", "input": {}, "output": { "phase": "Waxing Crescent" }, "host": { "theme": "dark" } },
  { "name": "bad date", "input": { "date": "soon" }, "expect": { "isError": true, "text": "not a date" } }
]
```

- `output` / `result` mock the tool result in the inspector, so you can design a View without a backend.
- `expect` is checked by `moonpeak test`: partial match on `output`, `"re:..."` for regexes, `"*"` for "any value", `$length` / `$minLength` for arrays.
- `host` sets inspector settings for that scenario: `name` (`chatgpt` or `claude`), `theme`, `displayMode`, `device`, `locale`.

## Testing

```bash
moonpeak test                     # schema + View + simulation checks, in-process, ~1s
moonpeak test --e2e               # Playwright against the inspector (starts it for you)
moonpeak test --visual            # screenshot tests tagged @visual (first run records baselines)
moonpeak test --visual --update   # re-record baselines after an intended change
moonpeak test --eval              # model evals, needs ANTHROPIC_API_KEY / OPENAI_API_KEY
moonpeak test init --server URL   # write simulations for an existing server
moonpeak test --server URL        # test any MCP server, any language
```

Run `npx playwright install chromium` once before the first e2e run. E2E tests get two fixtures:

```ts
import { test, expect } from "moonpeak/test";

test("renders in Claude dark mode", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon", host: "claude", theme: "dark" });
  await expect(view.getByRole("heading", { name: "Full Moon" })).toBeVisible();
});

test("tool output", async ({ mcp }) => {
  expect(await mcp.call("show-moon", { date: "2026-11-24" })).toHaveStructuredContent({ phase: "Full Moon" });
});
```

## Inspect any server

```bash
moonpeak inspect --server http://localhost:8000/mcp
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
```

Works with MCP servers written in Python, Go, Rust, Java or TypeScript. Views are loaded with `resources/read` and rendered in a sandboxed frame, the same way real hosts do it.

## Deploy

```bash
moonpeak build && moonpeak start     # http://localhost:8000/mcp
```

Or mount it yourself:

```ts
// Cloudflare Workers, Hono, Deno, Bun, Next.js route handlers
import { createHandler } from "moonpeak/server";
import * as built from "./dist/server.mjs";
```

```ts
// Express / node:http
import { createNodeHandler } from "moonpeak/server";
app.all("/mcp", await createNodeHandler(opts));
```

Then add the URL as a connector in Claude, or as an app in ChatGPT developer mode.

## CLI

| Command | |
|---|---|
| `moonpeak new [name] [resources]` | scaffold a project; resources: `moon`, `calendar`, `review` (default: ask, or all) |
| `moonpeak dev` | MCP server + inspector with hot reload |
| `moonpeak build` | `dist/resources/*.html` + `dist/server.mjs` |
| `moonpeak start` | serve the build at `/mcp` |
| `moonpeak inspect --server <url>` | inspector for any MCP server |
| `moonpeak test [init] [--e2e] [--visual] [--eval] [--server <url>]` | tests |
| `moonpeak upgrade` | update moonpeak |

## License

MIT
