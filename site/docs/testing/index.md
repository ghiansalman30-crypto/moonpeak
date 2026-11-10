# Testing Framework

> Test MCP Apps and any MCP server in CI, without host accounts, tunnels or AI credits.

moonpeak tests at five levels. Start with the first and add the others when you need them.

| Level | Command | Needs | Speed |
|---|---|---|---|
| [In-process checks](/docs/testing/unit) | `moonpeak test` | nothing | ~1 s |
| [E2E](/docs/testing/e2e) | `moonpeak test --e2e` | Chromium (Playwright) | seconds |
| [Visual regression](/docs/testing/visual) | `moonpeak test --visual` | Chromium | seconds |
| [Evals](/docs/testing/evals) | `moonpeak test --eval` | provider API keys | depends on the model |
| [Any MCP server](/docs/testing/any-server) | `--server <url>` | a running server | same as above |

All of them read the same [simulations](/docs/testing/simulations): JSON fixtures that also drive the inspector, so the scenario you look at is the scenario you test.

```text
  moonpeak test my-app

  ✓ schema     plan-night
  ✓ view       ui://my-app/review.html
  ✓ sim        plan-night#dark-new-moon-night
  ✗ sim        plan-night#bad-date
      expected isError true, got false

  1 failed · 21 checks · 1.1s
```

Ready-made CI setup: [CI](/docs/testing/ci).
