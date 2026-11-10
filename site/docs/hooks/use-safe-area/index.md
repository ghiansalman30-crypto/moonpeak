# useSafeArea

> Host context hook from moonpeak.

```ts
import { useSafeArea } from "moonpeak";

useSafeArea(): { top; right; bottom; left }
```

Insets (px) the View must keep clear, for notches and host chrome, mostly in fullscreen on mobile.

## Example

```tsx
const s = useSafeArea();
return <div style={{ paddingTop: s.top, paddingBottom: s.bottom }}>…</div>;
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).