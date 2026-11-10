---
name: moonpeak
description: Build, inspect and test MCP Apps (interactive UIs for ChatGPT, Claude and other MCP Apps hosts) with the moonpeak framework. Use when creating a moonpeak project, adding an MCP tool or View, writing simulations, e2e tests or evals, or deploying a moonpeak server.
---

# Building MCP Apps with moonpeak

## Start

```bash
npx moonpeak new my-app moon,calendar,review   # pick resources, or omit to be asked
cd my-app && npm install && npm run dev         # inspector http://localhost:3000, MCP at /mcp
```

## Add a tool

One file in `src/tools/`. The file name is the tool name.

```ts
import { z } from "zod";
export const tool = {
  title: "Show moon phase",
  description: "When to use it, written for the model.",
  resource: "moon",                 // the View in src/resources/moon; omit for a text-only tool
  annotations: { readOnlyHint: true },
  // visibility: ["app"],           // app-only: callable from a View, hidden from the model
};
export const schema = { date: z.string().optional().describe("YYYY-MM-DD") };
export default async function ({ date }: { date?: string }) {
  return { phase: "Full Moon" };    // object -> structuredContent, string -> text, throw -> isError
}
```

## Add a View

One folder in `src/resources/<name>/` with `<name>.tsx` (default export component) and optional `<name>.css`.

- Read data with `useToolData()` -> `{ input, output, isPending, isError, content }`. Handle `isPending` and `isError` first.
- Call tools with `useCallTool()`, post into the chat with `useSendMessage()`, tell the model silently with `useUpdateModelContext(text)`.
- Keep View state in ONE `useAppState({...})` per View. Use `{ share: true }` to expose it to the model.
- Theme: `useTheme()` returns `"light" | "dark"`; style both.
- Call every hook before any early `return`.

## Test

- Fixtures in `tests/simulations/<tool>.json`: `input`, optional mocked `output`, `expect` (partial match, `"re:..."`, `"*"`, `$length`), `host` settings.
- `npm test` runs schemas, View builds and simulations. `npx moonpeak test --e2e` runs Playwright with `inspector` and `mcp` fixtures from `moonpeak/test`. `--eval` checks real models pick the right tool.

## Ship

`npm run build && npm start` serves `/mcp`. Put it behind HTTPS and add the URL as a connector in Claude or an app in ChatGPT developer mode. Docs: https://moonpeak-ai.com/docs/
