# Security & CSP

> What a View can and cannot do, and how to allow more.

Hosts render Views in a sandboxed iframe with a strict Content Security Policy. By default a View can run its own inlined JS and CSS (which is how `moonpeak build` ships it) and talk to the host over the bridge. It cannot fetch other origins, load remote scripts or open popups on its own.

## Allowing more

```tsx
export const resource = {
  title: "Map",
  csp: {
    connectDomains: ["https://api.example.com"],     // fetch / WebSocket
    resourceDomains: ["https://tiles.example.com"],  // images, fonts, scripts
  },
  permissions: { geolocation: {} },
};
```

moonpeak sends these as MCP Apps `_meta.ui.csp` / `permissions` and as ChatGPT's `openai/widgetCSP`. Ask only for what you use; hosts may review apps that ask for more.

## Good practice

- Prefer [`useCallTool`](/docs/hooks/use-call-tool) over `fetch`: the call goes through the host to your server, with no CSP entry and no secrets in the View.
- Never put API keys in a View. Everything in it is visible to the user.
- Treat tool input as untrusted: validate with `schema`, and check permissions in handlers, including app-only ones.
- Use [`useOpenLink`](/docs/hooks/use-open-link) for links so the host can show its own confirmation.
