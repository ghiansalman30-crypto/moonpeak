# useToolInput

> Tool data hook from moonpeak.

```ts
import { useToolInput } from "moonpeak";

useToolInput<In>(): In | undefined
```

Just the tool input (or the partial input while it streams).

## Example

```tsx
const input = useToolInput<{ date?: string }>();
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).