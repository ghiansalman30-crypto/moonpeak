# Configuration

> moonpeak works without a config file. moonpeak.config.js is there when you need it.

Create `moonpeak.config.js` (or `.mjs`) in the project root and export an object:

```js
// moonpeak.config.js
export default {
  name: "moon-app",              // app name in ui:// URIs; defaults to package.json name
  version: "1.2.0",              // server version; defaults to package.json version
  instructions: "Use show-moon for anything about the moon on a date.",
  port: 3000,                    // dev server port
  vite: {
    plugins: [],                 // extra Vite plugins for your Views (e.g. Tailwind)
    resolve: { alias: {} },
    define: {},
    css: {},
  },
};
```

| Key | Used by | Default |
|---|---|---|
| `name` | resource URIs, server info | `package.json` name, then the folder name |
| `version` | server info | `package.json` version, then `0.0.0` |
| `instructions` | MCP `initialize` instructions sent to the host | none |
| `port` | `moonpeak dev` | 3000, or the next free port |
| `vite` | building Views in dev and `moonpeak build` | moonpeak's own React setup |

## Tailwind or other Vite plugins

```js
import tailwindcss from "@tailwindcss/vite";
export default { vite: { plugins: [tailwindcss()] } };
```

Then `@import "tailwindcss";` in your View's CSS file.

## Per-View settings

Settings for one View live next to it, as `export const resource = {...}` in the View file. See [Views](/docs/app-framework/views#resource-config).
