# Visual regression

> Screenshot tests tagged @visual.

```ts
test("@visual crescent in both hosts", async ({ inspector }) => {
  for (const host of ["chatgpt", "claude"] as const) {
    const view = await inspector.open({ tool: "show-moon", sim: "show-moon#mocked-crescent", host });
    await expect(view.locator(".moon-app")).toHaveScreenshot(`crescent-${host}.png`, { maxDiffPixelRatio: 0.01 });
  }
});
```

```bash
moonpeak test --visual            # runs @visual tests; records missing baselines
moonpeak test --visual --update   # re-record after an intended change
```

`--e2e` skips `@visual` tests, so functional runs stay fast. Use a **mocked** simulation for screenshots so data never changes between runs.

Baselines are platform specific (fonts render differently on Windows, macOS and Linux). Record them on the platform that checks them, usually CI, and keep `__screenshots__` out of git otherwise.
