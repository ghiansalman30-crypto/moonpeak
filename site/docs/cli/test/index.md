# moonpeak test

> Every testing mode in one command.

```bash
moonpeak test [--filter text]          # schemas, Views, simulations (in-process)
moonpeak test --e2e                    # Playwright against the inspector
moonpeak test --visual [--update]      # @visual screenshot tests
moonpeak test --eval                   # model evals
moonpeak test --server <url> [--header k:v]   # all of the above against another server
moonpeak test init [--server <url>]    # write a simulation per tool
```

| Option | |
|---|---|
| `--filter <text>` | only tools or simulations whose name contains the text |
| `--e2e` | runs your Playwright config; excludes `@visual` tests |
| `--visual` | runs only `@visual` tests; records missing baselines |
| `--update` | with `--visual`: re-record every baseline |
| `--eval` | runs `tests/evals/*.eval.json`; needs provider keys |
| `--server <url>` | test a remote server instead of this project |
| `--header k:v` | extra request header, repeatable |

In a folder without `src/tools` that has a `moonpeak.test.json` (`{ "server": "https://..." }`, written by `test init --server`), `moonpeak test` tests that server automatically.

Exit code is `0` when everything passed, `1` otherwise, so it drops into CI. See [Testing Framework](/docs/testing).
