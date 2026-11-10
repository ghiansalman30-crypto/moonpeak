# useContainerSize

> Host context hook from moonpeak.

```ts
import { useContainerSize } from "moonpeak";

useContainerSize(): { width?; height?; maxWidth?; maxHeight? }
```

The space the host gives the View, as reported in host context.

## Example

```tsx
const { width } = useContainerSize();
const columns = (width ?? 600) > 520 ? 7 : 4;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).