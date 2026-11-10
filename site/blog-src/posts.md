@@post slug="introducing-moonpeak" title="Introducing moonpeak: build, inspect and test MCP Apps" date="2026-11-10" description="An open-source MCP App framework, MCP testing framework and local inspector with ChatGPT and Claude style hosts, in one npm package."

MCP Apps let a tool return an interactive UI that the host renders right in the conversation. ChatGPT calls them ChatGPT Apps, Claude renders them as part of connectors, and VS Code and Goose support them too. The protocol is shared, but the tooling around it has been thin: you end up wiring a server, a bundler and a fake host together, then testing by hand in real accounts.

moonpeak is our answer: one package, MIT licensed, with no token and no telemetry.

## What's in the box

- **An app framework.** One file per tool in `src/tools`, one folder per View in `src/resources`. Twenty-seven React hooks cover tool data, theme, display modes, state and host actions. The same project runs in every MCP Apps host.
- **An inspector.** ChatGPT-style and Claude-style hosts on localhost, with theme, device width and display mode switches, live input and output editing, and every setting in the URL.
- **A testing framework.** JSON simulations, schema and View checks that run in about a second, Playwright e2e against both host styles, visual regression and real-model evals. It works on MCP servers written in any language.

## Try it

```bash
npx moonpeak new
```

`new` asks which starter resources you want (a detail card, a carousel and a review-and-confirm flow) and whether to install. Then `npm run dev` opens the inspector.

Or skip the install and look at the live demo: add `https://moonpeak-ai.com/mcp` as a custom connector in Claude, or inspect it locally with `npx moonpeak inspect --server https://moonpeak-ai.com/mcp`.

## Built on the official SDKs

moonpeak uses `@modelcontextprotocol/ext-apps` for the View bridge and the MCP TypeScript SDK v2 for the server, so behaviour in the inspector matches behaviour in real hosts. Resources also carry the older ChatGPT Apps SDK keys, so nothing extra is needed for ChatGPT.

The [docs](/docs/) cover every hook, CLI command and testing mode, and the source is on [GitHub](https://github.com/ghiansalman30-crypto/moonpeak).

@@post slug="build-your-first-mcp-app" title="Build your first MCP App in ten minutes" date="2026-11-10" description="A step-by-step tutorial: scaffold a project, write a tool and its View, test it, and run it in Claude."

This walkthrough builds a small MCP App with moonpeak and gets it running in Claude. You need Node 20.19 or newer.

## 1. Scaffold

```bash
npx moonpeak new moon-app moon --install
cd moon-app
npm run dev
```

Open http://localhost:3000. The inspector shows the `show-moon` tool, runs it, and renders its View in a ChatGPT-style host. Click **Claude** and **Dark** in the sidebar: the View updates without reloading.

## 2. Change the tool

Open `src/tools/show-moon.ts`. A tool is three exports: metadata, a zod schema and a handler.

```ts
export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date. Use when the user asks about the moon on a date.",
  resource: "moon",
};
export const schema = { date: z.string().optional().describe("YYYY-MM-DD") };
export default async function ({ date }) {
  return moonOn(parseDate(date));
}
```

The `description` is written for the model: it decides when the tool gets called. Returning a plain object makes it the result's `structuredContent`, which is what the View reads.

## 3. Change the View

Open `src/resources/moon/moon.tsx` and change the heading. Save: the View hot-swaps and keeps its state. Views read the tool result with one hook:

```tsx
const { output, isPending, isError } = useToolData();
```

and act through the host with others: `useCallTool` to call your server again, `useSendMessage` to post into the chat, `useRequestDisplayMode` to go fullscreen.

## 4. Test it

```bash
npm test
```

runs schema checks, builds every View and checks the fixtures in `tests/simulations/show-moon.json` against your real handler, in about a second. Add a case:

```json
{ "name": "new moon", "input": { "date": "2026-12-09" }, "expect": { "output": { "phase": "New Moon" } } }
```

For browser tests, run `npx playwright install chromium` once and then `npx moonpeak test --e2e`.

## 5. Run it in Claude

```bash
npm run build && npm start
```

serves `http://localhost:8000/mcp`. Put it behind HTTPS (a VPS with nginx and certbot works well), then in Claude go to Settings → Connectors → Add custom connector and paste `https://your-domain/mcp`. Ask *"what does the moon look like on Nov 24?"* and the View renders in the chat.

Next: the [review starter](/docs/resources/review) shows how to let the model propose an action that only the user can confirm.

@@post slug="review-and-confirm-app-only-tools" title="Review and confirm: safe actions in MCP Apps with app-only tools" date="2026-11-10" description="How to let the model propose an action that only the user can approve, and a visibility bug we fixed on the way."

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
