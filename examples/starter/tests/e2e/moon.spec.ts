import { test, expect } from "moonpeak/test";

test("renders the full moon in ChatGPT and Claude", async ({ inspector }) => {
  for (const host of ["chatgpt", "claude"] as const) {
    const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon", host });
    await expect(view.getByRole("heading", { name: "Full Moon" })).toBeVisible();
    await expect(view.getByRole("list", { name: "Next 7 days" }).getByRole("listitem")).toHaveCount(7);
  }
});

test("dark theme reaches the View", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon", theme: "dark" });
  await expect(view.locator(".moon-app.dark")).toBeVisible();
});

test("next week calls the tool through the host", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon" });
  await view.getByRole("button", { name: "Week →" }).click();
  await expect(view.getByText(/2026/).first()).toBeVisible();
  await expect(view.getByRole("heading")).not.toHaveText("Full Moon");
});

test("asking about the night posts a message", async ({ inspector }) => {
  const view = await inspector.open({ tool: "show-moon", sim: "show-moon#full-moon" });
  await view.getByRole("button", { name: "Ask about this night" }).click();
  await expect(inspector.sentMessages()).toContainText("full moon");
});

test("tool returns structured content", async ({ mcp }) => {
  const res = await mcp.call("show-moon", { date: "2026-11-24" });
  expect(res).toHaveStructuredContent({ phase: "Full Moon" });
});
