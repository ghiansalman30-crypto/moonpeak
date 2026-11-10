# useToolOutput

> Tool data hook from moonpeak.

```ts
import { useToolOutput } from "moonpeak";

useToolOutput<Out>(): Out | undefined
```

Just the structured content your handler returned.

## Example

```tsx
const output = useToolOutput<{ phase: string }>();
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).