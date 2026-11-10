# useLocale

> Host context hook from moonpeak.

```ts
import { useLocale } from "moonpeak";

useLocale(): string
```

The host's locale (BCP 47), falling back to the browser's. Use it for `Intl` formatting.

## Example

```tsx
const locale = useLocale();
const day = new Date(date).toLocaleDateString(locale, { weekday: "long" });
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).