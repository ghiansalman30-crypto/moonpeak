import { test, expect } from "moonpeak/test";

test("calendar shows the next eight phases in both hosts", async ({ inspector }) => {
  for (const host of ["chatgpt", "claude"] as const) {
    const view = await inspector.open({ tool: "moon-calendar", sim: "moon-calendar#next-eight-phases", host });
    await expect(view.getByRole("heading", { name: "Upcoming moon phases" })).toBeVisible();
    // 8 phases + the "Load 4 more" card
    await expect(view.getByRole("list", { name: "Moon phases" }).getByRole("listitem")).toHaveCount(9);
  }
});

test("selecting a card and asking posts a message", async ({ inspector }) => {
  const view = await inspector.open({ tool: "moon-calendar", sim: "moon-calendar#next-eight-phases" });
  const full = view.getByRole("button", { name: /Full Moon/ }).first();
  await full.click();
  await expect(full).toHaveAttribute("aria-pressed", "true");
  await view.getByRole("button", { name: "Ask about this phase" }).click();
  await expect(inspector.sentMessages()).toContainText("full moon");
});

test("load more calls the tool through the host", async ({ inspector }) => {
  const view = await inspector.open({ tool: "moon-calendar", sim: "moon-calendar#next-eight-phases" });
  await view.getByRole("button", { name: "Load 4 more" }).click();
  await expect(view.getByRole("list", { name: "Moon phases" }).getByRole("listitem")).toHaveCount(13);
});

test("calendar tool returns structured content", async ({ mcp }) => {
  const res = await mcp.call("moon-calendar", { from: "2026-11-18", count: 1 });
  expect(res).toHaveStructuredContent({ events: [{ phase: "Full Moon", date: "2026-11-24" }] });
});
