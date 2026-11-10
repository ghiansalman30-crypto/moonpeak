# Views

> One folder in src/resources is one View: a React component the host renders next to the chat.

```tsx
// src/resources/moon/moon.tsx
import { useToolData, useTheme, useCallTool } from "moonpeak";

export const resource = {
  title: "Moon phase",
  description: "Moon phase for a date with a 7-day strip",
  prefersBorder: true,
};

export default function Moon() {
  const { output, isPending, isError } = useToolData<{ date?: string }, { phase: string }>();
  const theme = useTheme();
  if (isError) return <p className="error">Something went wrong.</p>;
  if (isPending) return <p>Reading the sky…</p>;
  return <h1 className={theme}>{output?.phase}</h1>;
}
```

The default export is the View. moonpeak connects it to the host, mounts it and wraps it in an error boundary; you never touch `postMessage`.

## Styles

A CSS file in the folder named `<name>.css`, `style.css` or `styles.css` is imported automatically. Each View is built into one HTML file with its CSS and JS inlined, so it works under strict host CSPs. Style both themes: hosts can switch between light and dark at any time.

## Resource config

`export const resource = {...}` sets per-View options:

| Field | Meaning |
|---|---|
| `title`, `description` | Shown by hosts and used as ChatGPT's widget description. |
| `prefersBorder` | Ask the host to draw a border around the View. |
| `csp.connectDomains` | Origins the View may `fetch` from. |
| `csp.resourceDomains` | Origins for images, fonts and scripts. |
| `csp.frameDomains`, `csp.baseUriDomains` | Origins for nested frames and `<base>`. |
| `permissions` | Ask for `camera`, `microphone`, `geolocation` or `clipboardWrite`. |
| `domain` | A dedicated origin for the View, when the host supports it. |

See [Security & CSP](/docs/mcp-apps/security).

## Rules of thumb

- Call every hook before the first early `return`.
- Use one [`useAppState`](/docs/hooks/use-app-state) per View for state that should survive reloads.
- Talk to your server with [`useCallTool`](/docs/hooks/use-call-tool), not `fetch`, unless you set `csp.connectDomains`.
- Keep the View useful in a 320 px wide frame; check it with the inspector's mobile device.

## Hot reload

In `moonpeak dev`, saving a View hot-swaps the component and keeps its state. Saving the `resource` config or a tool takes effect on the next call without a page reload.
