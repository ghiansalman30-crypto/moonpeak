@@page slug="mcp-apps" title="MCP Apps" description="What MCP Apps are and how a host renders one."

An **MCP App** is an MCP tool that comes with a UI. The protocol is the [MCP Apps extension](https://github.com/modelcontextprotocol/ext-apps) to the Model Context Protocol, supported by ChatGPT (where they are called ChatGPT Apps), Claude, VS Code, Goose and others.

## The pieces

| Piece | What it is |
|---|---|
| **Tool** | A normal MCP tool whose definition carries `_meta.ui.resourceUri`. |
| **UI resource** | An HTML document at a `ui://` URI with MIME type `text/html;profile=mcp-app`. |
| **View** | That HTML running in a sandboxed iframe in the host. |
| **Bridge** | A small JSON-RPC protocol over `postMessage` between the View and the host. |

## What happens on a tool call

1. The model calls your tool. The host sees `_meta.ui.resourceUri` and reads the resource with `resources/read`.
2. The host renders the HTML in a sandboxed iframe and connects the bridge.
3. The host sends the View its **host context** (theme, display mode, locale, size...) and the **tool input**, then the **tool result** when your handler returns.
4. The View can call tools, post messages, update model context, open links or ask for another display mode. The host decides whether to allow each request.

In moonpeak, steps 1 to 3 are the framework's job. Your View reads the result with [`useToolData`](/docs/hooks/use-tool-data) and acts with the [action hooks](/docs/app-framework/runtime-apis#actions).

## Why it matters

The same server works in every host that supports MCP Apps. You don't build a ChatGPT version and a Claude version: you build one MCP App and test it in both host styles with the [inspector](/docs/inspector).

@@page slug="mcp-apps/lifecycle" title="Lifecycle" description="The order in which a View receives data, and what each state means."

| Stage | `useConnection().status` | `useToolData()` |
|---|---|---|
| Mounted, bridge connecting | `connecting` | `isPending: true` |
| Connected, model still writing arguments | `ready` | `isStreaming: true`, partial `input` |
| Arguments final, tool running | `ready` | `input` set, `isPending: true` |
| Result arrived | `ready` | `output`, `content`, `isPending: false` |
| Tool threw | `ready` | `isError: true`, message in `content` |
| User cancelled | `ready` | `isCancelled: true` |

A View may also be shown again later for an old message (for example after a page reload in ChatGPT). Keep anything the user changed in [`useAppState`](/docs/hooks/use-app-state) so it comes back.

When a View calls a tool itself with [`useCallTool`](/docs/hooks/use-call-tool), that result comes back as the promise's value. It does not replace the result the View was opened with; store it in state if you render from it.

@@page slug="mcp-apps/display-modes" title="Display modes & layout" description="Inline, picture-in-picture and fullscreen, and how to size a View."

| Mode | Where | Typical use |
|---|---|---|
| `inline` | in the message list, as wide as the chat | cards, small tables, carousels |
| `pip` | a floating window that stays while the user scrolls | timers, players, live status |
| `fullscreen` | covers the chat | maps, editors, long lists |

Read the current mode with [`useDisplayMode`](/docs/hooks/use-display-mode) and request a change with [`useRequestDisplayMode`](/docs/hooks/use-request-display-mode). The host may refuse; `available` lists the modes it allows.

## Sizing

- **Height**: inline Views grow to their content; moonpeak reports size changes to the host automatically. Respect [`useMaxHeight`](/docs/hooks/use-max-height) and scroll inside the View beyond it.
- **Width**: assume anything from 320 px (phones) to about 760 px. Test with the inspector's `mobile` device.
- **Safe areas**: in fullscreen on phones, pad by [`useSafeArea`](/docs/hooks/use-safe-area).

@@page slug="mcp-apps/state" title="State persistence" description="Keeping what the user did in a View across reloads, and sharing it with the model."

[`useAppState`](/docs/hooks/use-app-state) holds one object per View instance:

```tsx
const [state, setState] = useAppState({ selected: 0, more: [] }, { share: true });
```

| Where | What happens |
|---|---|
| ChatGPT | saved as the message's widget state, restored when the View is shown again |
| Other hosts | kept for as long as the View lives |
| `{ share: true }` | also sent to the model as context (debounced 400 ms), so "the one I picked" makes sense to it |

Use [`useResultState`](/docs/hooks/use-result-state) for throwaway UI state that should reset when a new result arrives.

Anything that must outlive the conversation (orders, saved plans) belongs on your server: call a tool to save it.

@@page slug="mcp-apps/visibility" title="Tool visibility" description="Tools only the model can call, only the View can call, or both."

```ts
export const tool = {
  title: "Confirm stargazing plan",
  description: "Confirm a proposed plan. Called from the review View only.",
  visibility: ["app"],
};
```

| `visibility` | Model can call | View can call |
|---|---|---|
| `["model", "app"]` (default) | yes | yes |
| `["model"]` | yes | no |
| `["app"]` | no | yes |

moonpeak writes `_meta.ui.visibility` on the tool, plus `openai/visibility: "private"` and `openai/widgetAccessible: true` for ChatGPT, whether or not the tool has a View of its own. Hosts leave app-only tools out of the model's tool list, and `moonpeak test --eval` does too.

Use app-only tools for anything that needs the user's explicit action: confirming, paying, deleting. The [review](/docs/resources/review) resource is a full example.

App-only tools are still reachable by anyone who can call your server directly, so check permissions in the handler as you would for any endpoint.

@@page slug="mcp-apps/security" title="Security & CSP" description="What a View can and cannot do, and how to allow more."

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

@@page slug="mcp-apps/tool-results" title="Tool results" description="content, structuredContent and _meta: who reads what."

A `CallToolResult` has three parts, read by different consumers:

| Part | Read by | Put here |
|---|---|---|
| `content` | the **model** | a short text summary the model can talk about |
| `structuredContent` | the **View** (and the model, in hosts that pass it) | the data the View renders |
| `_meta` | the **View** only | data the model should not see (ids, large payloads, signed URLs) |

When your handler returns a plain object, moonpeak puts it in `structuredContent` and a JSON copy in `content`. For large data, return the shape yourself so the model gets a summary:

```ts
export default async function ({ from }) {
  const events = upcomingPhases(parseDate(from), 8);
  return {
    content: [{ type: "text", text: `Next: ${events[0].phase} on ${events[0].date}.` }],
    structuredContent: { from, events },
  };
}
```

Throwing returns `isError: true` with your message as text. The View sees `isError` in [`useToolData`](/docs/hooks/use-tool-data); [`useCallTool`](/docs/hooks/use-call-tool) throws it as an `Error`.

@@page slug="guides/deployment" title="Deployment" description="Put a moonpeak server on the internet over HTTPS."

Hosts need a public HTTPS URL. The simplest setup is a VPS with Node and a reverse proxy.

## Node on a server

```bash
npm ci
npm run build
PORT=8000 npm start          # /mcp and /health
```

Keep it running with systemd, pm2 or a container. A minimal systemd unit:

```ini
[Service]
WorkingDirectory=/opt/my-app
ExecStart=/usr/bin/node node_modules/moonpeak/bin/moonpeak.mjs start --port 8000
Environment=NODE_ENV=production
Restart=always
```

## HTTPS with nginx

```nginx
location = /mcp {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_buffering off;          # responses are streamed (SSE)
    proxy_read_timeout 120s;
}
```

Get a certificate with `certbot --nginx -d your-domain`. Add `limit_req` on `/mcp` if the server is public.

## Serverless and edge

Mount `createHandler` from `moonpeak/server` (Fetch API) on Workers, Deno Deploy, Bun or a Next.js route; see [Production server](/docs/app-framework/production-server). The handler is stateless, so it scales horizontally without sticky sessions.

## After deploying

```bash
npx moonpeak test --server https://your-domain/mcp    # same checks, against production
```

Then add `https://your-domain/mcp` in Claude (Connectors) or ChatGPT (Developer mode → Create app). The moonpeak demo at `https://moonpeak-ai.com/mcp` is deployed exactly this way.

@@page slug="guides/authorization" title="Authorization" description="Protecting a moonpeak server and testing protected servers."

moonpeak's server has no built-in auth: put it behind the auth your platform already uses.

## Protecting your server

Mount the handler behind a middleware that checks the request before it reaches `/mcp`:

```ts
import express from "express";
import { createNodeHandler, loadBuilt } from "moonpeak/server";

const mcp = await createNodeHandler(await loadBuilt(process.cwd()));
const app = express();
app.all("/mcp", (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${process.env.MCP_TOKEN}`) return res.status(401).end();
  next();
}, mcp);
app.listen(8000);
```

For per-user access in Claude and ChatGPT, implement OAuth 2.1 as described in the MCP authorization spec (protected resource metadata plus an authorization server); hosts run the user through the login flow when they add your connector. Handlers can then read the verified user from the request in your middleware.

## Testing protected servers

```bash
moonpeak test --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
```

The inspector adds headers server-side in its proxy, so the token is never exposed to the page.

@@page slug="guides/patterns" title="Patterns" description="Shapes that work well for MCP Apps."

## Detail card

One result, rendered richly, with buttons that call the same tool again with new arguments. Example: [moon](/docs/resources/moon).

## Carousel

A horizontal list of cards for browsing. Load more pages with `useCallTool` and keep them in `useAppState` with `share: true`, so the model knows which card the user picked. Example: [calendar](/docs/resources/calendar).

## Review and confirm

The model proposes an action, the user approves it in the View, and an app-only tool performs it. The model cannot skip the click. Example: [review](/docs/resources/review).

## Text tool next to a UI tool

Offer a text-only tool for quick answers and a UI tool for exploring. Describe both clearly and add eval cases that check the model picks the right one.

## Summary for the model, data for the View

Return a short `content` summary and the full data in `structuredContent` (see [Tool results](/docs/mcp-apps/tool-results)), so long lists don't fill the model's context.

## Keep the chat moving

After an important action, either post a message ([`useSendMessage`](/docs/hooks/use-send-message)) when the model should respond, or update model context ([`useUpdateModelContext`](/docs/hooks/use-update-model-context)) when it only needs to know.

@@page slug="guides/troubleshooting" title="Troubleshooting" description="Common problems and their fixes."

## The View stays on its loading state

- The handler threw before returning: check the inspector's Log tab and the dev server output.
- `useAppState` is used in more than one component: it holds one object per View, so the calls overwrite each other. Use it once and pass values down (moonpeak warns in the console).
- You read `output` before checking `isPending`.

## "the View is not connected to a host yet"

An action hook was called during the first render. Call actions from event handlers or effects, not while rendering.

## A tool doesn't appear in ChatGPT or Claude

- The server isn't reachable over HTTPS from the internet: run `npx moonpeak test --server https://your-domain/mcp` from another machine.
- The tool is `visibility: ["app"]`: by design, the model never sees it.
- The host cached the old tool list: remove and re-add the connector or app.

## The model picks the wrong tool

Rewrite the `description` to say when to use the tool (and when not to), then measure with [evals](/docs/testing/evals).

## `moonpeak test --e2e` can't find a browser

Run `npx playwright install chromium` once (in CI, `npx playwright install --with-deps chromium` on `ubuntu-24.04`).

## Visual tests fail on another machine

Baselines are platform specific. Record them where they are checked: `moonpeak test --visual --update` on that platform.

## 403 from the dev server

`moonpeak dev` only answers to `localhost`. Open it as `http://localhost:3000`, not by IP or another host name.

## Something else

Open an issue on [GitHub](https://github.com/ghiansalman30-crypto/moonpeak/issues) with the inspector URL (it contains every setting).
