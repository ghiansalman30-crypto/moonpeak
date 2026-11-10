# Display modes & layout

> Inline, picture-in-picture and fullscreen, and how to size a View.

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
