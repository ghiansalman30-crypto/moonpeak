# Tool results

> content, structuredContent and _meta: who reads what.

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
