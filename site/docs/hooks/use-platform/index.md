# usePlatform

> Host context hook from moonpeak.

```ts
import { usePlatform } from "moonpeak";

usePlatform(): "web" | "desktop" | "mobile"
```

Where the host is running. Defaults to `"web"`.

## Example

```tsx
const compact = usePlatform() === "mobile";
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).