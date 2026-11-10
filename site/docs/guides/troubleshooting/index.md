# Troubleshooting

> Common problems and their fixes.

## The View stays on its loading state

- The handler threw before returning: check the inspector's Log tab and the dev server output.
- `useAppState` is used in more than one component: it holds one object per View, so the calls overwrite each other. Use it once and pass values down (moonpeak warns in the console).
- You read `output` before checking `isPending`.

## "the View is not connected to a host yet"

An action hook was called during the first render. Call actions from event handlers or effects, not while rendering.

## A tool doesn't appear in ChatGPT or Claude

- The server isn't reachable over HTTPS from the internet: run `npx moonpeak test --server https://your-domain/mcp` from another machine.
- The tool is `visibility: ["app"]`: by design, the model never sees it.
- The host cached the old tool list: remove and re-add the connector or app.

## The model picks the wrong tool

Rewrite the `description` to say when to use the tool (and when not to), then measure with [evals](/docs/testing/evals).

## `moonpeak test --e2e` can't find a browser

Run `npx playwright install chromium` once (in CI, `npx playwright install --with-deps chromium` on `ubuntu-24.04`).

## Visual tests fail on another machine

Baselines are platform specific. Record them where they are checked: `moonpeak test --visual --update` on that platform.

## 403 from the dev server

`moonpeak dev` only answers to `localhost`. Open it as `http://localhost:3000`, not by IP or another host name.

## Something else

Open an issue on [GitHub](https://github.com/ghiansalman30-crypto/moonpeak/issues) with the inspector URL (it contains every setting).
