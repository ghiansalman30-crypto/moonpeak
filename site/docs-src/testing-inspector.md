@@page slug="testing" title="Testing Framework" description="Test MCP Apps and any MCP server in CI, without host accounts, tunnels or AI credits."

moonpeak tests at five levels. Start with the first and add the others when you need them.

| Level | Command | Needs | Speed |
|---|---|---|---|
| [In-process checks](/docs/testing/unit) | `moonpeak test` | nothing | ~1 s |
| [E2E](/docs/testing/e2e) | `moonpeak test --e2e` | Chromium (Playwright) | seconds |
| [Visual regression](/docs/testing/visual) | `moonpeak test --visual` | Chromium | seconds |
| [Evals](/docs/testing/evals) | `moonpeak test --eval` | provider API keys | depends on the model |
| [Any MCP server](/docs/testing/any-server) | `--server <url>` | a running server | same as above |

All of them read the same [simulations](/docs/testing/simulations): JSON fixtures that also drive the inspector, so the scenario you look at is the scenario you test.

```text
  moonpeak test my-app

  ✓ schema     plan-night
  ✓ view       ui://my-app/review.html
  ✓ sim        plan-night#dark-new-moon-night
  ✗ sim        plan-night#bad-date
      expected isError true, got false

  1 failed · 21 checks · 1.1s
```

Ready-made CI setup: [CI](/docs/testing/ci).

@@page slug="testing/simulations" title="Simulations" description="JSON fixtures for a tool: input, optional mocked output, expectations and host settings."

One file per tool in `tests/simulations/<tool>.json`, holding one simulation or an array:

```json
[
  {
    "name": "full moon",
    "prompt": "What does the moon look like on Nov 24, 2026?",
    "input": { "date": "2026-11-24" },
    "expect": { "output": { "phase": "Full Moon", "week": { "$length": 7 } } }
  },
  {
    "name": "mocked crescent",
    "input": {},
    "output": { "phase": "Waxing Crescent", "illumination": 0.11 },
    "host": { "name": "claude", "theme": "dark", "device": "mobile" }
  },
  {
    "name": "bad date",
    "input": { "date": "soon" },
    "expect": { "isError": true, "text": "not a date" }
  }
]
```

## Fields

| Field | |
|---|---|
| `name` | Shown in the inspector and test output. In a file with several simulations the id is `<tool>#<slug of name>` (e.g. `show-moon#full-moon`); a file with one simulation uses the tool name as its id. |
| `tool` | Which tool; defaults to the file name. |
| `prompt` | What a user might ask. Shown in the inspector's chat. |
| `input` | Tool arguments. |
| `output` / `result` | **Mock** the tool result (`output` = structuredContent, `result` = a whole CallToolResult). The handler is not called, so you can design a View before the backend exists. |
| `expect` | What `moonpeak test` checks (below). |
| `host` | Inspector settings for this scenario: `name` (`chatgpt` or `claude`), `theme`, `displayMode` (`inline`, `pip`, `fullscreen`), `device` (`desktop`, `tablet`, `mobile`), `locale`. |

## Expectations

| Key | Passes when |
|---|---|
| `isError` | the result's `isError` matches |
| `text` | the result's text contains the string (or every string in an array) |
| `output` | **partial match** against `structuredContent` |

Inside `output`:

| Matcher | Example | Matches |
|---|---|---|
| literal | `"phase": "Full Moon"` | equal value |
| object | `{ "week": {...} }` | listed keys only, extra keys ignored |
| array | `[{ "phase": "Full Moon" }]` | element by element, partial |
| `"re:..."` | `"re:^MP-[0-9A-Z]{6}$"` | regular expression |
| `"*"` | `"ref": "*"` | any value, as long as the key exists |
| `$length` | `{ "$length": 7 }` | array length |
| `$minLength` | `{ "$minLength": 1 }` | at least that many |

## Writing them for an existing server

```bash
moonpeak test init --server http://localhost:8000/mcp
```

writes a starter simulation per tool (with example input built from its schema) plus `moonpeak.test.json`. Running it again only adds files for new tools.

@@page slug="testing/unit" title="In-process checks" description="What moonpeak test checks, in about a second, with no browser."

```bash
moonpeak test [--filter plan-night]
```

Runs your real handlers in-process over an in-memory MCP transport:

1. **Setup**: the project has tools. An empty project fails loudly instead of passing.
2. **Schema**: every tool lists with a valid input schema (and output schema if you set one).
3. **View**: every `ui://` resource builds and returns HTML with the MCP Apps MIME type.
4. **Simulations**: every simulation with `expect` runs against the handler (or its mocked output) and is checked.

Nothing leaves your machine. Use `--filter` to run one tool or simulation.

@@page slug="testing/e2e" title="E2E testing" description="Playwright tests against the inspector, in ChatGPT and Claude style hosts."

```bash
npx playwright install chromium   # once
moonpeak test --e2e
```

moonpeak starts the inspector for your project and runs your Playwright config. Tests import from `moonpeak/test`:

```ts
import { test, expect } from "moonpeak/test";

test("renders in Claude dark mode", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon", host: "claude", theme: "dark" });
  await expect(view.getByRole("heading", { name: "Full Moon" })).toBeVisible();
});

test("asking posts a message", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon" });
  await view.getByRole("button", { name: "Ask about this night" }).click();
  await expect(inspector.sentMessages()).toContainText("full moon");
});

test("tool output", async ({ mcp }) => {
  expect(await mcp.call("show-moon", { date: "2026-11-24" })).toHaveStructuredContent({ phase: "Full Moon" });
});
```

## `inspector` fixture

| Member | |
|---|---|
| `open({ tool, sim, host, theme, device, mode })` | opens the inspector with those settings and returns a frame locator for the View once it has rendered |
| `view()` | the current View's frame locator |
| `sentMessages()` | locator for messages the View posted |
| `modelContext()` | locator for what the View told the model |
| `setTheme(t)`, `setDisplayMode(m)` | change host settings without reloading the View |
| `page` | the Playwright page |

## `mcp` fixture

| Member | |
|---|---|
| `call(name, args)` | call a tool, returns the `CallToolResult` |
| `listTools()` | the server's tools, with `_meta` |
| `client` | the raw MCP client |

## Matchers

`toHaveStructuredContent(partial)`, `toBeError()` and `toHaveTextContent(text)`, using the same partial matching as simulations.

@@page slug="testing/visual" title="Visual regression" description="Screenshot tests tagged @visual."

```ts
test("@visual crescent in both hosts", async ({ inspector }) => {
  for (const host of ["chatgpt", "claude"] as const) {
    const view = await inspector.open({ tool: "show-moon", sim: "show-moon#mocked-crescent", host });
    await expect(view.locator(".moon-app")).toHaveScreenshot(`crescent-${host}.png`, { maxDiffPixelRatio: 0.01 });
  }
});
```

```bash
moonpeak test --visual            # runs @visual tests; records missing baselines
moonpeak test --visual --update   # re-record after an intended change
```

`--e2e` skips `@visual` tests, so functional runs stay fast. Use a **mocked** simulation for screenshots so data never changes between runs.

Baselines are platform specific (fonts render differently on Windows, macOS and Linux). Record them on the platform that checks them, usually CI, and keep `__screenshots__` out of git otherwise.

@@page slug="testing/evals" title="Evals" description="Check that real models pick the right tool with the right arguments."

```json
// tests/evals/moon.eval.json
{
  "models": ["claude-opus-5-5", "gpt-5"],
  "runs": 3,
  "passRate": 1,
  "system": "You are a helpful astronomy assistant.",
  "cases": [
    { "prompt": "what does the moon look like on 2026-11-24?", "expect": { "tool": "show-moon", "args": { "date": "2026-11-24" } } },
    { "prompt": "quick: moon phase on 2026-12-09, just text", "expect": { "tool": "moon-facts" } },
    { "prompt": "write me a haiku about autumn", "expect": { "tool": null } }
  ]
}
```

```bash
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... moonpeak test --eval
```

For every case and model, moonpeak sends your tool list (names, descriptions, input schemas) and the prompt, `runs` times, and checks which tool the model called:

| `expect` | Passes when |
|---|---|
| `"tool": "name"` | the model called that tool |
| `"tool": null` | the model called no tool |
| `"args": {...}` | the arguments partially match |

A case passes when at least `passRate` of its runs pass (default: all of them). Tools with `visibility: ["app"]` are never sent, because hosts never show them to the model.

## Providers

| Model names | Needs |
|---|---|
| `claude-*` | `ANTHROPIC_API_KEY` and `@anthropic-ai/sdk` in your project |
| `gpt-*`, `o1`/`o3`/`o4-*`, `chatgpt-*` | `OPENAI_API_KEY` and `openai` in your project |

`ANTHROPIC_BASE_URL` and `OPENAI_BASE_URL` are respected, so evals can run against a proxy or a gateway. Evals are the one mode that costs money; keep `runs` small and run them on demand rather than on every push.

@@page slug="testing/any-server" title="Any MCP server" description="Test and inspect MCP servers written in Python, Go, Rust, Java or anything else."

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

@@page slug="testing/ci" title="CI" description="Run moonpeak tests in GitHub Actions."

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx moonpeak test
      - run: npx playwright install --with-deps chromium
      - run: npx moonpeak test --e2e
```

For a server in another language, start it in the background first, then point `--server` at it.

Pin `ubuntu-24.04`: Playwright's `--with-deps` installs system packages and only supports the Ubuntu versions it knows. Run `--eval` in a separate, manually triggered workflow with your provider keys as secrets.

@@page slug="inspector" title="Inspector" description="ChatGPT-style and Claude-style hosts on localhost."

```bash
moonpeak dev                                         # your project
moonpeak inspect --server https://moonpeak-ai.com/mcp  # any server
```

The inspector is a real MCP Apps host: it connects to your server with the MCP client, reads `ui://` resources and renders them in a sandboxed iframe through the official `AppBridge`, exactly like ChatGPT and Claude do.

## Sidebar

| Control | |
|---|---|
| Tool | every tool on the server; tools with a View first |
| Simulation | fixtures for that tool; picking one runs it |
| Host | ChatGPT-style or Claude-style chrome, host info and capabilities |
| Theme | light or dark, sent live to the View |
| Device | desktop, tablet or mobile width (mobile also reports a touch platform) |
| Display mode | inline, picture-in-picture or fullscreen |
| Input | edit the arguments and **Run** the real handler |
| Output | edit the structured content and **Apply** to re-render without a backend |
| Log | every bridge message and `useLog` call |

## What the View can do

Calls to `callTool`, `sendMessage`, `updateModelContext`, `openLink`, `downloadFile` and display mode requests are handled like a host would: tools run against your server, messages appear in the chat, model context appears in a panel, links open in a new tab and downloads save. In the ChatGPT host, `window.openai` is there too (globals, widget state).

Everything you set lives in the URL. See [URL parameters](/docs/inspector/url-parameters).

@@page slug="inspector/url-parameters" title="URL parameters" description="Every inspector setting is in the URL, so a bug report is a link."

```text
http://localhost:3000/?tool=show-moon&sim=show-moon%23full-moon&host=claude&theme=dark&device=mobile&mode=fullscreen
```

| Parameter | Values | Default |
|---|---|---|
| `tool` | a tool name | first tool with a View |
| `sim` | a simulation id (`tool#name`, URL-encode the `#` as `%23`) | first simulation of the tool |
| `host` | `chatgpt`, `claude` | `chatgpt` |
| `theme` | `light`, `dark` | `light` |
| `device` | `desktop`, `tablet`, `mobile` | `desktop` |
| `mode` | `inline`, `pip`, `fullscreen` | `inline` |
| `locale` | BCP 47 tag | the browser's |
| `panel` | `input`, `output`, `log` | `input` |

E2E tests open the inspector through the same parameters (`inspector.open({...})`).

@@page slug="inspector/remote" title="Remote servers" description="Inspect an MCP server you didn't build with moonpeak."

```bash
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
```

- The inspector runs on localhost and proxies `/mcp` to the server, adding the headers server-side, so tokens never reach the page.
- Views are loaded with `resources/read`, like a host does, and rendered in the same sandbox.
- Simulations come from `tests/simulations/` in the folder you ran the command in.
- Servers that don't offer the optional `GET` stream (they answer `405`) are handled quietly.

Try it on the live demo: `npx moonpeak inspect --server https://moonpeak-ai.com/mcp`.
