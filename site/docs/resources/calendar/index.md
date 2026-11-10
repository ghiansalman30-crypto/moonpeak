# calendar

> Carousel: swipeable cards of the upcoming moon phases, loading more through the host.

```bash
npx moonpeak new my-app calendar
```

| Part | File |
|---|---|
| View | `src/resources/calendar/calendar.tsx`, `calendar.css` |
| Tool | `src/tools/moon-calendar.ts` (`from?`, `count` 1-12) |
| Tests | `tests/simulations/moon-calendar.json`, `tests/e2e/calendar.spec.ts`, `tests/evals/calendar.eval.json` |

## What it shows

- A horizontal scroll-snap carousel with previous and next buttons that works with touch, mouse and keyboard.
- **Pagination through the host**: "Load 4 more" calls `moon-calendar` again from the View and appends the result.
- **Shared state**: the selected card and loaded pages live in `useAppState(..., { share: true })`, so the model knows which phase the user picked.
- A schema limit (`count` max 12) with a simulation proving out-of-range input is a tool error.
