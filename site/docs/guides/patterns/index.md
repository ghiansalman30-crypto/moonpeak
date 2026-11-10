# Patterns

> Shapes that work well for MCP Apps.

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
