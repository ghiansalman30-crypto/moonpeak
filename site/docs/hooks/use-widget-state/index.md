# useWidgetState

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useWidgetState } from "moonpeak/chatgpt";

useWidgetState<S>(): [S | undefined, (v: S) => void]
```

ChatGPT's raw widget state. Prefer `useAppState`, which uses it in ChatGPT and works in every other host too.

## Example

```tsx
const [saved, save] = useWidgetState<{ tab: number }>();
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).