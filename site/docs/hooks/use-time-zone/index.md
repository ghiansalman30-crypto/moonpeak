# useTimeZone

> Host context hook from moonpeak.

```ts
import { useTimeZone } from "moonpeak";

useTimeZone(): string
```

The user's IANA time zone as reported by the host, falling back to the browser's.

## Example

```tsx
const tz = useTimeZone(); // "Asia/Jakarta"
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).