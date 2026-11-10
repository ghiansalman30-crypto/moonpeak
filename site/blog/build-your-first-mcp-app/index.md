# Build your first MCP App in ten minutes

> A step-by-step tutorial: scaffold a project, write a tool and its View, test it, and run it in Claude.

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
