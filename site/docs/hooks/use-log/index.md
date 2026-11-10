# useLog

> Actions hook from moonpeak.

```ts
import { useLog } from "moonpeak";

useLog(): (level, data) => void
```

Send a log message to the host (levels: debug, info, notice, warning, error). The inspector shows them in its Log tab. Never throws.

## Example

```tsx
const log = useLog();
log("info", { loaded: events.length });
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).