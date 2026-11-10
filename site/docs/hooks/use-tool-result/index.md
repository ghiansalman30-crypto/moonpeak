# useToolResult

> Tool data hook from moonpeak.

```ts
import { useToolResult } from "moonpeak";

useToolResult<Out>(): CallToolResult<Out> | undefined
```

The raw `CallToolResult`: `content`, `structuredContent`, `isError` and `_meta`.

## Example

```tsx
const result = useToolResult();
const meta = result?._meta;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).