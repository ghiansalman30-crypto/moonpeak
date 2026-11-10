# useMaxHeight

> Host context hook from moonpeak.

```ts
import { useMaxHeight } from "moonpeak";

useMaxHeight(): number | undefined
```

The tallest the View may grow (`maxHeight`, or `height` when the host sets a fixed size).

## Example

```tsx
const max = useMaxHeight();
return <div style={{ maxHeight: max, overflowY: "auto" }}>…</div>;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).