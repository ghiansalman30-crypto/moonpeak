# Runtime APIs

> Every hook a View can use, from moonpeak, moonpeak/chatgpt and moonpeak/claude.

Hooks from `moonpeak` work in every MCP Apps host. Hooks from `moonpeak/chatgpt` and `moonpeak/claude` are safe to call anywhere and return empty values outside their host.

## Tool data

| Hook | Returns |
|---|---|
| [useToolData](/docs/hooks/use-tool-data) | `{ input, output, content, isPending, isError, isStreaming, isCancelled, tool, result }` |
| [useToolInput](/docs/hooks/use-tool-input) | the tool input |
| [useToolOutput](/docs/hooks/use-tool-output) | the structured output |
| [useToolResult](/docs/hooks/use-tool-result) | the raw `CallToolResult` |

## Host context

| Hook | Returns |
|---|---|
| [useTheme](/docs/hooks/use-theme) | `"light" \| "dark"` |
| [useDisplayMode](/docs/hooks/use-display-mode) | `"inline" \| "pip" \| "fullscreen"` |
| [useRequestDisplayMode](/docs/hooks/use-request-display-mode) | a function to request a mode, plus `available` |
| [useHostContext](/docs/hooks/use-host-context) | the whole host context |
| [useLocale](/docs/hooks/use-locale) · [useTimeZone](/docs/hooks/use-time-zone) | locale and IANA time zone |
| [usePlatform](/docs/hooks/use-platform) · [useDeviceCapabilities](/docs/hooks/use-device-capabilities) | `web/desktop/mobile`, touch and hover |
| [useSafeArea](/docs/hooks/use-safe-area) · [useContainerSize](/docs/hooks/use-container-size) · [useMaxHeight](/docs/hooks/use-max-height) | layout limits |

## Host

| Hook | Returns |
|---|---|
| [useHost](/docs/hooks/use-host) | `{ name, version }` of the host |
| [useHostCapabilities](/docs/hooks/use-host-capabilities) | what the host supports |
| [useConnection](/docs/hooks/use-connection) | `{ status, ready, error }` |
| [useApp](/docs/hooks/use-app) | the raw MCP Apps SDK `App` |

## Actions

| Hook | Does |
|---|---|
| [useCallTool](/docs/hooks/use-call-tool) | call a tool on your server through the host |
| [useSendMessage](/docs/hooks/use-send-message) | post a message as the user |
| [useUpdateModelContext](/docs/hooks/use-update-model-context) | tell the model something silently |
| [useOpenLink](/docs/hooks/use-open-link) · [useDownloadFile](/docs/hooks/use-download-file) · [useLog](/docs/hooks/use-log) | host actions |

## State

| Hook | Does |
|---|---|
| [useAppState](/docs/hooks/use-app-state) | one state object per View, persisted in ChatGPT, optionally shared with the model |
| [useResultState](/docs/hooks/use-result-state) | local state that resets on every new result |

## Host extras

| Hook | From |
|---|---|
| [useIsChatGPT](/docs/hooks/use-is-chat-gpt), [useWidgetState](/docs/hooks/use-widget-state), [useOpenAiGlobal](/docs/hooks/use-open-ai-global), [useUploadFile](/docs/hooks/use-upload-file), [useRequestModal](/docs/hooks/use-request-modal), [useUserAgent](/docs/hooks/use-user-agent) | `moonpeak/chatgpt` |
| [useIsClaude](/docs/hooks/use-is-claude), [useClaudeStyles](/docs/hooks/use-claude-styles) | `moonpeak/claude` |

## Helpers

```ts
import { isHost, connect } from "moonpeak";
isHost(useHost(), "claude");   // forgiving host-name check
```

`connect()` is called for you when a View mounts. Call it yourself only if you render without moonpeak's entry (for example in a test harness).
