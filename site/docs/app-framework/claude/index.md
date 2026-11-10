# Claude connectors

> A moonpeak project is a Claude connector with interactive UI.

Claude renders MCP Apps natively. Deploy your server and add it as a connector:

1. Deploy over HTTPS (see [Deployment](/docs/guides/deployment)).
2. In Claude: Settings → Connectors → **Add custom connector**.
3. Enter `https://your-domain/mcp`.
4. Enable the connector in a chat and ask for something your tool handles.

## Claude-only hooks

```tsx
import { useIsClaude, useClaudeStyles } from "moonpeak/claude";

const vars = useClaudeStyles();   // fonts and colors Claude sends in host context
```

moonpeak already applies host style variables to the document, so `var(--font-sans)` and friends work in your CSS in every host that sends them.

## Auth

If your server needs a user's credentials, see [Authorization](/docs/guides/authorization).
