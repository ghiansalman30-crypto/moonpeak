# useRequestModal

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useRequestModal } from "moonpeak/chatgpt";

useRequestModal(): (opts: object) => Promise<unknown>
```

Ask ChatGPT to open a modal. A no-op elsewhere.

## Example

```tsx
const requestModal = useRequestModal();
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).