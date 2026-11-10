# useHost

> Host hook from moonpeak.

```ts
import { useHost } from "moonpeak";

useHost(): { name: string; version?: string } | null
```

Name and version of the host rendering the View. `isHost(host, "claude")` is a forgiving check.

## Example

```tsx
import { useHost, isHost } from "moonpeak";
const host = useHost();
const inClaude = isHost(host, "claude");
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).