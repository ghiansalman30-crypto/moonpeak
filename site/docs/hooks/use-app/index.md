# useApp

> Host hook from moonpeak.

```ts
import { useApp } from "moonpeak";

useApp(): App | null
```

The underlying `App` instance from the official MCP Apps SDK (`@modelcontextprotocol/ext-apps`), for anything the hooks don't cover.

## Example

```tsx
const app = useApp();
await app?.readServerResource({ uri: "ui://my-app/data" });
```

## Notes

- `null` until the View has connected.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).