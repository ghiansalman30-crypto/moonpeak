import { test, expect } from "moonpeak/test";

test("plan renders with the sky rating", async ({ inspector }) => {
  for (const host of ["chatgpt", "claude"] as const) {
    const view = await inspector.open({ tool: "plan-night", sim: "plan-night#dark-new-moon-night", host });
    await expect(view.getByText("Stargazing plan · Bromo")).toBeVisible();
    await expect(view.getByText("Excellent")).toBeVisible();
  }
});

test("confirm calls the app-only tool and tells the model", async ({ inspector }) => {
  const view = await inspector.open({ tool: "plan-night", sim: "plan-night#dark-new-moon-night" });
  await view.getByRole("button", { name: "Confirm plan" }).click();
  await expect(view.getByRole("status")).toContainText(/Confirmed · ref MP-[0-9A-Z]{6}/);
  await expect(inspector.modelContext()).toContainText("confirmed the stargazing plan for 2026-12-09");
});

test("declining a bright night asks for the darker one", async ({ inspector }) => {
  const view = await inspector.open({ tool: "plan-night", sim: "plan-night#bright-full-moon-suggests-another-night" });
  await expect(view.getByText("Poor")).toBeVisible();
  await view.getByRole("button", { name: "Pick another night" }).click();
  await expect(inspector.sentMessages()).toContainText("What about 2026-12-");
  await expect(view.getByRole("status")).toContainText("Declined");
});

test("confirm-plan is app-only and returns a stable ref", async ({ mcp }) => {
  const tools = await mcp.listTools();
  const confirm = tools.find((t) => t.name === "confirm-plan");
  expect((confirm?._meta as { ui?: { visibility?: string[] } })?.ui?.visibility).toEqual(["app"]);
  const a = await mcp.call("confirm-plan", { date: "2026-12-09", place: "Bromo" });
  const b = await mcp.call("confirm-plan", { date: "2026-12-09", place: "Bromo" });
  expect(a).toHaveStructuredContent({ status: "confirmed", date: "2026-12-09" });
  expect(a.structuredContent).toEqual(b.structuredContent);
});
