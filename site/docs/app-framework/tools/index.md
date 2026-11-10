# Tools

> One file in src/tools is one MCP tool: metadata, a zod schema and a handler.

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
