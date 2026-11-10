# useHostContext

> Host context hook from moonpeak.

```ts
import { useHostContext } from "moonpeak";

useHostContext(): HostContext
```

The whole host context object: theme, display modes, locale, time zone, platform, device capabilities, safe areas, container dimensions, tool info and style variables.

## Example

```tsx
const ctx = useHostContext();
console.log(ctx.platform, ctx.containerDimensions);
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).