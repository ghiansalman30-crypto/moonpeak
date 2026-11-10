# useRequestDisplayMode

> Host context hook from moonpeak.

```ts
import { useRequestDisplayMode } from "moonpeak";

useRequestDisplayMode(): ((mode) => Promise<DisplayMode>) & { available: DisplayMode[] }
```

Ask the host to switch display mode. Resolves to the mode the host actually granted; `available` lists what this host allows.

## Example

```tsx
const requestMode = useRequestDisplayMode();

{requestMode.available.includes("fullscreen") && (
  <button onClick={() => requestMode("fullscreen")}>Expand</button>
)}
```

## Notes

- Hosts may refuse a mode. Render from `useDisplayMode()`, not from what you asked for.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).