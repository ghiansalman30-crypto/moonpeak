# useConnection

> Host hook from moonpeak.

```ts
import { useConnection } from "moonpeak";

useConnection(): { status: "connecting" | "ready" | "error"; error; ready: boolean }
```

State of the postMessage connection to the host.

## Example

```tsx
const { ready, error } = useConnection();
if (error) return <p>Could not reach the host.</p>;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).