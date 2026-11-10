# useDeviceCapabilities

> Host context hook from moonpeak.

```ts
import { useDeviceCapabilities } from "moonpeak";

useDeviceCapabilities(): { touch?: boolean; hover?: boolean }
```

Whether the device has touch input and hover. Use it instead of guessing from screen size.

## Example

```tsx
const { hover } = useDeviceCapabilities();
// show tooltips only when hover exists
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).