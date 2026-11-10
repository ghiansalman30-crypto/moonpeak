# useCallTool

> Actions hook from moonpeak.

```ts
import { useCallTool } from "moonpeak";

useCallTool(): (name: string, args?: object) => Promise<CallToolResult>
```

Call a tool on your MCP server through the host. Throws an `Error` with the tool's text when the result has `isError: true` (the result is on `err.result`).

## Example

```tsx
const callTool = useCallTool();

async function nextWeek() {
  const res = await callTool("show-moon", { date: "2026-12-01" });
  setState({ view: res.structuredContent, selected: 0 });
}
```

## Notes

- Tools marked `visibility: ["app"]` can be called here even though the model never sees them.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).