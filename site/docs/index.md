# Overview

> Server-agnostic MCP testing framework and full-stack MCP App framework.

moonpeak is one npm package with three jobs:

- **An MCP App framework.** One file per tool, one folder per View. React hooks for tool data, theme, display modes, state and host actions. The same project runs as a ChatGPT App, a Claude connector and in every other MCP Apps host.
- **An MCP testing framework.** Simulations, schema and View checks, Playwright e2e against ChatGPT and Claude style hosts, visual regression and real-model evals. It also tests MCP servers written in any language.
- **An MCP App inspector.** ChatGPT-style and Claude-style hosts on localhost, with every host setting in the URL.

```bash
npx moonpeak new
```

It is built on the official [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps) and the MCP TypeScript SDK v2, so what works in the inspector works in real hosts.

## Where to start

| If you want to | Read |
|---|---|
| Build your first app | [Quickstart](/docs/quickstart) |
| Understand the folders | [Project scaffold](/docs/project-scaffold) |
| Write a tool or a View | [Tools](/docs/app-framework/tools) · [Views](/docs/app-framework/views) |
| Look up a hook | [Runtime APIs](/docs/app-framework/runtime-apis) |
| Test an existing MCP server | [Any MCP server](/docs/testing/any-server) |
| Ship it | [Deployment](/docs/guides/deployment) |
| Learn the protocol | [MCP Apps introduction](/docs/mcp-apps) |

## Try the live demo

The starter app runs at `https://moonpeak-ai.com/mcp`. Add it as a custom connector in Claude, as an app in ChatGPT developer mode, or open it in the inspector:

```bash
npx moonpeak inspect --server https://moonpeak-ai.com/mcp
```

## For agents

Every docs page has a Markdown version (add `index.md` to its URL). [llms.txt](/docs/llms.txt) lists them all and [llms-full.txt](/docs/llms-full.txt) has every page in one file. The repository also ships an [agent skill](https://github.com/ghiansalman30-crypto/moonpeak/blob/main/skills/moonpeak/SKILL.md) for Claude Code and other coding agents.
