# CI

> Run moonpeak tests in GitHub Actions.

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx moonpeak test
      - run: npx playwright install --with-deps chromium
      - run: npx moonpeak test --e2e
```

For a server in another language, start it in the background first, then point `--server` at it.

Pin `ubuntu-24.04`: Playwright's `--with-deps` installs system packages and only supports the Ubuntu versions it knows. Run `--eval` in a separate, manually triggered workflow with your provider keys as secrets.
