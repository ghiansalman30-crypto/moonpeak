# useHostCapabilities

> Host hook from moonpeak.

```ts
import { useHostCapabilities } from "moonpeak";

useHostCapabilities(): Record<string, unknown> | null
```

What the host supports (for example `updateModelContext`, `openLinks`, `downloadFile`). Feature-detect before showing a control.

## Example

```tsx
const caps = useHostCapabilities();
const canDownload = Boolean(caps?.downloadFile);
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).