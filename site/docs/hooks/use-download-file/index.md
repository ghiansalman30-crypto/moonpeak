# useDownloadFile

> Actions hook from moonpeak.

```ts
import { useDownloadFile } from "moonpeak";

useDownloadFile(): (file: { contents: unknown[] }) => Promise<unknown>
```

Ask the host to save a file for the user, using MCP resource contents.

## Example

```tsx
const download = useDownloadFile();
await download({ contents: [{ uri: "file:///moon.csv", mimeType: "text/csv", text: csv }] });
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).