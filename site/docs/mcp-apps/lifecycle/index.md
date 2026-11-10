# Lifecycle

> The order in which a View receives data, and what each state means.

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
