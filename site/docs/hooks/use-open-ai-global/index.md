# useOpenAiGlobal

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useOpenAiGlobal } from "moonpeak/chatgpt";

useOpenAiGlobal<T>(key: string): T | undefined
```

Read a `window.openai` global (for example `maxHeight`, `locale`, `userAgent`) and re-render when ChatGPT changes it. `undefined` outside ChatGPT.

## Example

```tsx
const maxHeight = useOpenAiGlobal<number>("maxHeight");
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).