# Quickstart

> From npx moonpeak new to a View rendering in Claude.

## 1. Create a project

```bash
npx moonpeak new
```

`new` asks three things:

1. **Project name**, for example `moon-app`.
2. **Resources**: which starter Views to include. Pick any of `moon`, `calendar` and `review`, or press Enter for all of them.
3. **Install dependencies?** Press Enter to install with the package manager you ran it with (npm, pnpm, yarn or bun).

You can skip the questions:

```bash
npx moonpeak new moon-app calendar,review --install
```

## 2. Start the inspector

```bash
cd moon-app
npm run dev
```

Open http://localhost:3000. The inspector lists your tools, runs the selected one and renders its View in a ChatGPT-style host. Switch to the Claude host, dark theme, a phone width or fullscreen from the sidebar. Your MCP server is live at http://localhost:3000/mcp.

## 3. Change something

Edit `src/resources/moon/moon.tsx` and save: the View updates in place and keeps its state. Edit `src/tools/show-moon.ts` and the next call uses the new code. No restart.

## 4. Test it

```bash
npm test                      # schemas, Views and simulations, in seconds
npx playwright install chromium
npx moonpeak test --e2e       # Playwright against the inspector
```

## 5. Run it in Claude or ChatGPT

```bash
npm run build && npm start    # http://localhost:8000/mcp
```

Put that behind HTTPS (see [Deployment](/docs/guides/deployment)), then:

- **Claude**: Settings → Connectors → Add custom connector → `https://your-domain/mcp`
- **ChatGPT**: Settings → Apps → enable Developer mode → Create app → `https://your-domain/mcp`

Ask *"what does the moon look like on Nov 24?"* and the moon View renders in the chat.

## Next

- [Project scaffold](/docs/project-scaffold): what every folder does
- [Tools](/docs/app-framework/tools) and [Views](/docs/app-framework/views)
- [Simulations](/docs/testing/simulations)
