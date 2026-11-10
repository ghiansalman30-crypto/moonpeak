# Tool visibility

> Tools only the model can call, only the View can call, or both.

```ts
export const tool = {
  title: "Confirm stargazing plan",
  description: "Confirm a proposed plan. Called from the review View only.",
  visibility: ["app"],
};
```

| `visibility` | Model can call | View can call |
|---|---|---|
| `["model", "app"]` (default) | yes | yes |
| `["model"]` | yes | no |
| `["app"]` | no | yes |

moonpeak writes `_meta.ui.visibility` on the tool, plus `openai/visibility: "private"` and `openai/widgetAccessible: true` for ChatGPT, whether or not the tool has a View of its own. Hosts leave app-only tools out of the model's tool list, and `moonpeak test --eval` does too.

Use app-only tools for anything that needs the user's explicit action: confirming, paying, deleting. The [review](/docs/resources/review) resource is a full example.

App-only tools are still reachable by anyone who can call your server directly, so check permissions in the handler as you would for any endpoint.
