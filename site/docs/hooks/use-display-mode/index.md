# useDisplayMode

> Host context hook from moonpeak.

```ts
import { useDisplayMode } from "moonpeak";

useDisplayMode(): "inline" | "pip" | "fullscreen"
```

How the host is showing the View right now.

## Example

```tsx
const mode = useDisplayMode();
return <div className={`app mode-${mode}`}>…</div>;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).