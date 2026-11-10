// moonpeak/test: Playwright fixtures for end-to-end tests against the inspector.
//
//   import { test, expect } from "moonpeak/test";
//   test("renders", async ({ inspector }) => {
//     const view = await inspector.open({ tool: "show-weather", host: "claude", theme: "dark" });
//     await expect(view.getByText("Lisbon")).toBeVisible();
//   });
import { test as base, expect as baseExpect } from "@playwright/test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { checkResult, partialMatch } from "./runner.js";

export { partialMatch, checkResult };

const BASE = () => process.env.MOONPEAK_URL || "http://localhost:3000";

export const test = base.extend({
  /** Drives the inspector UI. `open()` resolves once the View has received its data. */
  inspector: async ({ page }, use) => {
    const api = {
      page,
      async open({ tool, sim, host = "chatgpt", theme = "light", device, mode } = {}) {
        const p = new URLSearchParams();
        if (tool) p.set("tool", tool);
        if (sim) p.set("sim", sim);
        p.set("host", host);
        p.set("theme", theme);
        if (device) p.set("device", device);
        if (mode) p.set("mode", mode);
        await page.goto(`${BASE()}/?${p}`);
        await page.locator('iframe#moonpeak-view[data-ready="true"]').waitFor({ timeout: 20_000 });
        return page.frameLocator("iframe#moonpeak-view");
      },
      view: () => page.frameLocator("iframe#moonpeak-view"),
      /** Messages the View posted into the conversation. */
      sentMessages: () => page.getByTestId("sent-message"),
      modelContext: () => page.getByTestId("model-context"),
      setTheme: (v) => page.getByTestId("seg-theme").locator(`button[data-value="${v}"]`).click(),
      setDisplayMode: (v) => page.getByTestId("seg-mode").locator(`button[data-value="${v}"]`).click(),
    };
    await use(api);
  },
  /** A real MCP client connected to the dev server. */
  mcp: async ({}, use) => {
    const client = new Client({ name: "moonpeak-e2e", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL("/mcp", BASE())));
    await use({
      client,
      call: (name, args = {}) => client.callTool({ name, arguments: args }),
      listTools: async () => (await client.listTools()).tools,
    });
    await client.close();
  },
});

export const expect = baseExpect.extend({
  toHaveStructuredContent(result, want) {
    const errs = partialMatch(result?.structuredContent, want, "structuredContent");
    return { pass: errs.length === 0, message: () => (errs.length ? errs.join("\n") : "structured content matched") };
  },
  toBeError(result) {
    const pass = Boolean(result?.isError);
    return { pass, message: () => (pass ? "expected the tool call not to be an error" : "expected the tool call to be an error") };
  },
  toHaveTextContent(result, text) {
    const all = (result?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    const pass = all.includes(text);
    return { pass, message: () => `expected text content ${pass ? "not " : ""}to include ${JSON.stringify(text)}` };
  },
});
