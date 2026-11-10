# useResultState

> State hook from moonpeak.

```ts
import { useResultState } from "moonpeak";

useResultState<S>(initial: S | (result) => S): [S, (next: S) => void]
```

Like `useState`, but resets whenever a new tool result arrives. Good for UI state tied to one result, like an open row.

## Example

```tsx
const [open, setOpen] = useResultState<number | null>(null);
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).