# useSendMessage

> Actions hook from moonpeak.

```ts
import { useSendMessage } from "moonpeak";

useSendMessage(): (text: string) => Promise<unknown>
```

Post a message into the conversation as the user, which starts a new model turn.

## Example

```tsx
const sendMessage = useSendMessage();
<button onClick={() => sendMessage("What should I photograph tonight?")}>Ask</button>
```

## Works in

Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector.

See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).