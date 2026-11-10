# Inspector

> ChatGPT-style and Claude-style hosts on localhost.

```bash
moonpeak dev                                         # your project
moonpeak inspect --server https://moonpeak-ai.com/mcp  # any server
```

The inspector is a real MCP Apps host: it connects to your server with the MCP client, reads `ui://` resources and renders them in a sandboxed iframe through the official `AppBridge`, exactly like ChatGPT and Claude do.

## Sidebar

| Control | |
|---|---|
| Tool | every tool on the server; tools with a View first |
| Simulation | fixtures for that tool; picking one runs it |
| Host | ChatGPT-style or Claude-style chrome, host info and capabilities |
| Theme | light or dark, sent live to the View |
| Device | desktop, tablet or mobile width (mobile also reports a touch platform) |
| Display mode | inline, picture-in-picture or fullscreen |
| Input | edit the arguments and **Run** the real handler |
| Output | edit the structured content and **Apply** to re-render without a backend |
| Log | every bridge message and `useLog` call |

## What the View can do

Calls to `callTool`, `sendMessage`, `updateModelContext`, `openLink`, `downloadFile` and display mode requests are handled like a host would: tools run against your server, messages appear in the chat, model context appears in a panel, links open in a new tab and downloads save. In the ChatGPT host, `window.openai` is there too (globals, widget state).

Everything you set lives in the URL. See [URL parameters](/docs/inspector/url-parameters).
