# review

> Review and confirm: the model proposes a stargazing night, the user confirms it in the UI through an app-only tool.

```bash
npx moonpeak new my-app review
```

| Part | File |
|---|---|
| View | `src/resources/review/review.tsx`, `review.css` |
| Tools | `src/tools/plan-night.ts` (model-visible, with View), `src/tools/confirm-plan.ts` (app-only) |
| Tests | `tests/simulations/plan-night.json`, `confirm-plan.json`, `tests/e2e/review.spec.ts`, `tests/evals/review.eval.json` |

## The pattern

1. The model calls `plan-night` with a date and place. It returns a **proposal** (`status: "proposed"`) with sky darkness and targets, and suggests a darker night when the moon is bright.
2. The View shows the proposal with **Confirm plan** and **Pick another night**.
3. **Confirm** calls `confirm-plan` with [`useCallTool`](/docs/hooks/use-call-tool). That tool has `visibility: ["app"]`, so hosts never offer it to the model: only the user's click can confirm. The View then tells the model with [`useUpdateModelContext`](/docs/hooks/use-update-model-context).
4. **Decline** posts a follow-up with [`useSendMessage`](/docs/hooks/use-send-message), asking for the darker night.

The decision is kept in `useAppState`, so a confirmed plan stays confirmed after a reload. Use the same shape for anything the model should propose but the user must approve: bookings, payments, sending email.
