# Review and confirm: safe actions in MCP Apps with app-only tools

> How to let the model propose an action that only the user can approve, and a visibility bug we fixed on the way.

Some actions should never run just because a model decided to: booking, paying, deleting, sending. MCP Apps have a clean answer for this, and moonpeak's `review` starter is built around it.

## The pattern

1. The model calls a normal tool, `plan-night`, that returns a **proposal**: a date, the sky darkness and what to look for. Nothing has happened yet.
2. The View renders the proposal with **Confirm plan** and **Pick another night**.
3. **Confirm** calls a second tool, `confirm-plan`, from the View with `useCallTool`.
4. The View tells the model what happened with `useUpdateModelContext`.

The trick is step 3. `confirm-plan` is declared app-only:

```ts
export const tool = {
  title: "Confirm stargazing plan",
  description: "Confirm a proposed plan. Called from the review View only.",
  visibility: ["app"],
};
```

Hosts leave app-only tools out of the tool list they give the model. The model can propose, but only the user's click confirms.

## The bug we found

While writing the review starter, a moonpeak e2e test failed: `confirm-plan` showed up in the tool list without any visibility metadata. moonpeak only wrote `_meta.ui.visibility` for tools that had a View of their own, and an app-only helper usually doesn't. So hosts would have offered the "app-only" tool to the model.

The fix writes visibility for every tool that declares it, with or without a View, and adds ChatGPT's equivalent keys (`openai/visibility: "private"` and `openai/widgetAccessible: true`). The evals runner had the same blind spot and now leaves app-only tools out too, so evals see exactly what the model would see.

## Test it

The starter ships the test that caught it:

```ts
test("confirm-plan is app-only", async ({ mcp }) => {
  const tools = await mcp.listTools();
  const confirm = tools.find((t) => t.name === "confirm-plan");
  expect(confirm._meta.ui.visibility).toEqual(["app"]);
});
```

One more thing: app-only is about what the model sees, not who can reach your server. Anyone who can call `/mcp` directly can call any tool, so still check permissions inside handlers. More in [Tool visibility](/docs/mcp-apps/visibility).
