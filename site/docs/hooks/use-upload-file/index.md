# useUploadFile

> ChatGPT hook from moonpeak/chatgpt.

```ts
import { useUploadFile } from "moonpeak/chatgpt";

useUploadFile(): (file: File) => Promise<{ fileId: string } | null>
```

Upload a file through ChatGPT. Resolves to `null` in hosts without uploads.

## Example

```tsx
const upload = useUploadFile();
const res = await upload(input.files[0]);
```

## Works in

ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).