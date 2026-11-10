# useOpenLink

> Actions hook from moonpeak.

```ts
import { useOpenLink } from "moonpeak";

useOpenLink(): (url: string) => Promise<unknown>
```

Ask the host to open a URL. Views run sandboxed, so plain `<a target="_blank">` may be blocked.

## Example

```tsx
const openLink = useOpenLink();
<button onClick={() => openLink("https://moonpeak-ai.com")}>Docs</button>
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).