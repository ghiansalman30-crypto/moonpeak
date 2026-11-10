# useIsChatGPT

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useIsChatGPT } from "moonpeak/chatgpt";

useIsChatGPT(): boolean  ·  isChatGPT(): boolean
```

True when the View runs inside ChatGPT (the `window.openai` global is present).

## Example

```tsx
import { useIsChatGPT } from "moonpeak/chatgpt";
const chatgpt = useIsChatGPT();
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).