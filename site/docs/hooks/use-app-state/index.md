# useAppState

> State hook from moonpeak.

```ts
import { useAppState } from "moonpeak";

useAppState<S>(initial: S, options?: { share?: boolean }): [S, (next: S | (prev: S) => S) => S]
```

State that belongs to this View instance. In ChatGPT it is saved with the message (widget state), so it survives reloads. With `{ share: true }` the model also sees it on its next turn (debounced 400 ms).

## Example

```tsx
const [state, setState] = useAppState({ selected: 0, more: [] }, { share: true });
setState((s) => ({ ...s, selected: 2 }));
```

## Notes

- It holds ONE object per View. Use it once, put every field in that object and pass pieces down. moonpeak warns in the console if it is used twice.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).