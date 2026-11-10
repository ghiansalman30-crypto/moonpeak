# useIsClaude

> Claude hook from moonpeak/claude.

```ts
import { useIsClaude } from "moonpeak/claude";

useIsClaude(): boolean
```

True when the host reports itself as Claude.

## Example

```tsx
import { useIsClaude } from "moonpeak/claude";
const claude = useIsClaude();
```

## Works in

Claude. Safe to call anywhere: elsewhere it returns an empty value.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).