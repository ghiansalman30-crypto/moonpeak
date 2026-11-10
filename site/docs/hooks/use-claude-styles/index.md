# useClaudeStyles

> Claude hook from moonpeak/claude.

```ts
import { useClaudeStyles } from "moonpeak/claude";

useClaudeStyles(): Record<string, string | undefined>
```

The style variables Claude sends in host context (fonts, colors), so a View can match the chat around it.

## Example

```tsx
const vars = useClaudeStyles();
<div style={{ fontFamily: vars["--font-sans"] }}>…</div>
```

## Works in

Claude. Safe to call anywhere: elsewhere it returns an empty value.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).