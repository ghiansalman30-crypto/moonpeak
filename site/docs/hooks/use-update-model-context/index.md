# useUpdateModelContext

> Actions hook from moonpeak.

```ts
import { useUpdateModelContext } from "moonpeak";

useUpdateModelContext(): (value: string | object) => Promise<unknown>
```

Tell the model what happened in the View without posting a message. A string becomes text content; an object becomes structured content. The model sees it on its next turn.

## Example

```tsx
const updateModelContext = useUpdateModelContext();
await updateModelContext("The user confirmed the plan for 2026-12-09 (ref MP-1A2B3C).");
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).