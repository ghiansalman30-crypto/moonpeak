# ChatGPT Apps

> A moonpeak project is a ChatGPT App. What moonpeak adds for ChatGPT, and how to try it.

ChatGPT Apps are MCP Apps. Every moonpeak resource carries both the MCP Apps metadata and the older ChatGPT Apps SDK keys, so ChatGPT renders your Views without extra work:

| moonpeak | ChatGPT key |
|---|---|
| tool `resource` | `openai/outputTemplate` |
| tool `invoking`, `invoked` | `openai/toolInvocation/invoking`, `.../invoked` |
| tool `visibility: ["app"]` | `openai/visibility: "private"` and `openai/widgetAccessible: true` |
| resource `description` | `openai/widgetDescription` |
| resource `prefersBorder` | `openai/widgetPrefersBorder` |
| resource `csp` | `openai/widgetCSP` |

## ChatGPT-only hooks

```tsx
import { useIsChatGPT, useWidgetState, useOpenAiGlobal, useUploadFile, useRequestModal, useUserAgent } from "moonpeak/chatgpt";
```

They read `window.openai` and do nothing outside ChatGPT. Prefer the portable hooks when one exists: [`useAppState`](/docs/hooks/use-app-state) already saves to ChatGPT's widget state.

## Try it in ChatGPT

1. Deploy over HTTPS (see [Deployment](/docs/guides/deployment)).
2. In ChatGPT: Settings → Apps → enable **Developer mode** → **Create app**.
3. Enter `https://your-domain/mcp` and save.
4. In a new chat, ask for something your tool handles.

The inspector's ChatGPT host replicates `window.openai` (globals, widget state, display modes), so most issues show up locally first.
