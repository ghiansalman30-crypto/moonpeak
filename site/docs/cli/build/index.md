# moonpeak build

> Bundle every View into one HTML file and your tools into dist/server.mjs.

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
