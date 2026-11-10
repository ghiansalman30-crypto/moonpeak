# State persistence

> Keeping what the user did in a View across reloads, and sharing it with the model.

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
