# useTheme

> Host context hook from moonpeak.

```ts
import { useTheme } from "moonpeak";

useTheme(): "light" | "dark"
```

The host's theme. Defaults to `"light"` before the host reports one. moonpeak also applies the host's CSS variables to the document.

## Example

```tsx
const theme = useTheme();
return <div className={`card ${theme}`}>…</div>;
```

## Notes

- Style both themes: hosts switch at any time without reloading the View.

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).