@@page slug="resources/moon" title="moon" description="Detail card: a date's moon phase, a 7-day strip, and buttons that call the tool again through the host."

```bash
npx moonpeak new my-app moon
```

| Part | File |
|---|---|
| View | `src/resources/moon/moon.tsx`, `moon.css` |
| Tools | `src/tools/show-moon.ts` (with View), `src/tools/moon-facts.ts` (text only) |
| Tests | `tests/simulations/show-moon.json`, `moon-facts.json`, `tests/e2e/moon.spec.ts`, `tests/evals/moon.eval.json` |

## What it shows

- Reading tool data with [`useToolData`](/docs/hooks/use-tool-data) and handling pending and error states.
- Calling the same tool again from the View ("Week →") with [`useCallTool`](/docs/hooks/use-call-tool), keeping the new result in [`useAppState`](/docs/hooks/use-app-state).
- Posting a follow-up question with [`useSendMessage`](/docs/hooks/use-send-message).
- Asking for fullscreen with [`useRequestDisplayMode`](/docs/hooks/use-request-display-mode) and styling per display mode.
- A text-only sibling tool (`moon-facts`), so evals can check the model picks the right one.

The moon math in `src/lib/moon.ts` is real (synodic month from a known new moon), so no API is needed.

@@page slug="resources/calendar" title="calendar" description="Carousel: swipeable cards of the upcoming moon phases, loading more through the host."

```bash
npx moonpeak new my-app calendar
```

| Part | File |
|---|---|
| View | `src/resources/calendar/calendar.tsx`, `calendar.css` |
| Tool | `src/tools/moon-calendar.ts` (`from?`, `count` 1-12) |
| Tests | `tests/simulations/moon-calendar.json`, `tests/e2e/calendar.spec.ts`, `tests/evals/calendar.eval.json` |

## What it shows

- A horizontal scroll-snap carousel with previous and next buttons that works with touch, mouse and keyboard.
- **Pagination through the host**: "Load 4 more" calls `moon-calendar` again from the View and appends the result.
- **Shared state**: the selected card and loaded pages live in `useAppState(..., { share: true })`, so the model knows which phase the user picked.
- A schema limit (`count` max 12) with a simulation proving out-of-range input is a tool error.

@@page slug="resources/review" title="review" description="Review and confirm: the model proposes a stargazing night, the user confirms it in the UI through an app-only tool."

```bash
npx moonpeak new my-app review
```

| Part | File |
|---|---|
| View | `src/resources/review/review.tsx`, `review.css` |
| Tools | `src/tools/plan-night.ts` (model-visible, with View), `src/tools/confirm-plan.ts` (app-only) |
| Tests | `tests/simulations/plan-night.json`, `confirm-plan.json`, `tests/e2e/review.spec.ts`, `tests/evals/review.eval.json` |

## The pattern

1. The model calls `plan-night` with a date and place. It returns a **proposal** (`status: "proposed"`) with sky darkness and targets, and suggests a darker night when the moon is bright.
2. The View shows the proposal with **Confirm plan** and **Pick another night**.
3. **Confirm** calls `confirm-plan` with [`useCallTool`](/docs/hooks/use-call-tool). That tool has `visibility: ["app"]`, so hosts never offer it to the model: only the user's click can confirm. The View then tells the model with [`useUpdateModelContext`](/docs/hooks/use-update-model-context).
4. **Decline** posts a follow-up with [`useSendMessage`](/docs/hooks/use-send-message), asking for the darker night.

The decision is kept in `useAppState`, so a confirmed plan stays confirmed after a reload. Use the same shape for anything the model should propose but the user must approve: bookings, payments, sending email.

@@page slug="cli/new" title="moonpeak new" description="Scaffold a project, picking which starter resources to include."

```bash
npx moonpeak new [name] [resources] [--install | --no-install] [-y]
```

| Argument | |
|---|---|
| `name` | Folder and package name. Asked for when missing (default `moonpeak-app`). |
| `resources` | Comma-separated: `moon`, `calendar`, `review`, or `all`. Asked for when missing. |
| `--install` / `--no-install` | Install dependencies, or don't, without asking. |
| `-y`, `--yes` | Accept every default. |

Outside a terminal (CI, scripts) `new` never prompts: it uses the defaults and does not install.

```bash
npx moonpeak new moon-app calendar,review --install
pnpm dlx moonpeak new moon-app          # uses pnpm for the install and next steps
```

The target folder must be empty or missing.

@@page slug="cli/dev" title="moonpeak dev" description="MCP server and inspector with hot reload, on one port."

```bash
moonpeak dev [--port 3000] [--open]
```

Starts one HTTP server with:

| Path | |
|---|---|
| `/` | the inspector |
| `/mcp` | your MCP server (Streamable HTTP) |
| `/__moonpeak/view/<name>` | a View with Vite HMR |

Saving a View hot-swaps it and keeps its state; saving a tool takes effect on the next call. If the port is busy, the next free one is used. The server only answers on `localhost` (requests with another `Host` header get `403`), which blocks DNS-rebinding attacks from web pages.

`--open` opens the inspector in your browser. The port can also come from `moonpeak.config.js`.

@@page slug="cli/build" title="moonpeak build" description="Bundle every View into one HTML file and your tools into dist/server.mjs."

```bash
moonpeak build [--out dist]
```

Writes (into `--out`, default `dist`):

| File | |
|---|---|
| `dist/resources/<name>.html` | each View with its JS and CSS inlined |
| `dist/server.mjs` | your tools and resource configs, bundled (dependencies external) |
| `dist/manifest.json` | app name, version, tools and resources |

Serve it with [`moonpeak start`](/docs/cli/start) or mount it yourself ([Production server](/docs/app-framework/production-server)).

@@page slug="cli/start" title="moonpeak start" description="Serve a build at /mcp."

```bash
moonpeak start [--port 8000] [--out dist]
```

Serves the build in `--out` (default `dist/`) on `0.0.0.0`: `/mcp` and `/health`. The port is `--port`, else `$PORT`, else `8000`. Run `moonpeak build` first.

@@page slug="cli/inspect" title="moonpeak inspect" description="Open the inspector against any MCP server."

```bash
moonpeak inspect --server <url> [--header k:v]... [--port 3000]
```

```bash
moonpeak inspect --server http://localhost:8000/mcp
moonpeak inspect --server https://api.example.com/mcp --header "authorization:Bearer $TOKEN"
moonpeak inspect --server https://moonpeak-ai.com/mcp
```

The inspector proxies `/mcp` to the server (adding your headers), lists its tools, reads `ui://` resources with `resources/read` and renders them exactly like a host. Simulations come from `tests/simulations/` in the current folder, so you can keep fixtures for a server that moonpeak didn't build (`moonpeak test init --server` writes them). See [Remote servers](/docs/inspector/remote).

@@page slug="cli/test" title="moonpeak test" description="Every testing mode in one command."

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

@@page slug="cli/upgrade" title="moonpeak upgrade" description="Update moonpeak in the current project."

```bash
moonpeak upgrade
```

Installs `moonpeak@latest` with the package manager that ran the command. `moonpeak --version` prints the installed version.
