# E2E testing

> Playwright tests against the inspector, in ChatGPT and Claude style hosts.

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
