# useToolData

> Tool data hook from moonpeak.

```ts
import { useToolData } from "moonpeak";

useToolData<In, Out>(): ToolData<In, Out>
```

Everything about the tool call this View was opened for: the input, your handler's structured output, the raw result and its state.

## Returns

| Field | Type | Meaning |
|---|---|---|
| `input` | `In | undefined` | Tool arguments. While the model is still writing them, the partial input. |
| `output` | `Out | undefined` | The `structuredContent` your handler returned. |
| `content` | `ContentBlock[] | undefined` | The result's content blocks (text the model sees). |
| `isPending` | `boolean` | No result yet and not cancelled. Show a skeleton. |
| `isStreaming` | `boolean` | The host is still streaming the input. |
| `isError` | `boolean` | The tool returned `isError: true` (your handler threw). |
| `isCancelled` | `boolean` | The user or host cancelled the call. |
| `tool` | `{ name, title?, description? }` | Which tool this View belongs to. |
| `result` | `CallToolResult | undefined` | The whole result, including `_meta`. |

## Example

```tsx
import { useToolData } from "moonpeak";

export default function Moon() {
  const { output, isPending, isError, content } = useToolData<{ date?: string }, { phase: string }>();
  if (isError) return <p>{content?.[0]?.text}</p>;
  if (isPending) return <p>Reading the sky…</p>;
  return <h1>{output?.phase}</h1>;
}
```

## Notes

- Handle `isError` and `isPending` before reading `output`.
- Call every hook before the first early `return`.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).