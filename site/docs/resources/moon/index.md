# moon

> Detail card: a date's moon phase, a 7-day strip, and buttons that call the tool again through the host.

```bash
npx moonpeak new my-app moon
```

| Part | File |
|---|---|
| View | `src/resources/moon/moon.tsx`, `moon.css` |
| Tools | `src/tools/show-moon.ts` (with View), `src/tools/moon-facts.ts` (text only) |
| Tests | `tests/simulations/show-moon.json`, `moon-facts.json`, `tests/e2e/moon.spec.ts`, `tests/evals/moon.eval.json` |

## What it shows

- Reading tool data with [`useToolData`](/docs/hooks/use-tool-data) and handling pending and error states.
- Calling the same tool again from the View ("Week →") with [`useCallTool`](/docs/hooks/use-call-tool), keeping the new result in [`useAppState`](/docs/hooks/use-app-state).
- Posting a follow-up question with [`useSendMessage`](/docs/hooks/use-send-message).
- Asking for fullscreen with [`useRequestDisplayMode`](/docs/hooks/use-request-display-mode) and styling per display mode.
- A text-only sibling tool (`moon-facts`), so evals can check the model picks the right one.

The moon math in `src/lib/moon.ts` is real (synodic month from a known new moon), so no API is needed.
