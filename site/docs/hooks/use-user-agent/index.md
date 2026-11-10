# useUserAgent

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useUserAgent } from "moonpeak/chatgpt";

useUserAgent(): unknown
```

ChatGPT's user agent info (device type, capabilities). `undefined` outside ChatGPT.

## Example

```tsx
const ua = useUserAgent();
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).