# moonpeak new

> Scaffold a project, picking which starter resources to include.

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
