# Introducing moonpeak: build, inspect and test MCP Apps

> An open-source MCP App framework, MCP testing framework and local inspector with ChatGPT and Claude style hosts, in one npm package.

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
