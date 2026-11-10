# MCP Apps

> What MCP Apps are and how a host renders one.

An **MCP App** is an MCP tool that comes with a UI. The protocol is the [MCP Apps extension](https://github.com/modelcontextprotocol/ext-apps) to the Model Context Protocol, supported by ChatGPT (where they are called ChatGPT Apps), Claude, VS Code, Goose and others.

## The pieces

| Piece | What it is |
|---|---|
| **Tool** | A normal MCP tool whose definition carries `_meta.ui.resourceUri`. |
| **UI resource** | An HTML document at a `ui://` URI with MIME type `text/html;profile=mcp-app`. |
| **View** | That HTML running in a sandboxed iframe in the host. |
| **Bridge** | A small JSON-RPC protocol over `postMessage` between the View and the host. |

## What happens on a tool call

1. The model calls your tool. The host sees `_meta.ui.resourceUri` and reads the resource with `resources/read`.
2. The host renders the HTML in a sandboxed iframe and connects the bridge.
3. The host sends the View its **host context** (theme, display mode, locale, size...) and the **tool input**, then the **tool result** when your handler returns.
4. The View can call tools, post messages, update model context, open links or ask for another display mode. The host decides whether to allow each request.

In moonpeak, steps 1 to 3 are the framework's job. Your View reads the result with [`useToolData`](/docs/hooks/use-tool-data) and acts with the [action hooks](/docs/app-framework/runtime-apis#actions).

## Why it matters

The same server works in every host that supports MCP Apps. You don't build a ChatGPT version and a Claude version: you build one MCP App and test it in both host styles with the [inspector](/docs/inspector).
