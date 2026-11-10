# URL parameters

> Every inspector setting is in the URL, so a bug report is a link.

```text
http://localhost:3000/?tool=show-moon&sim=show-moon%23full-moon&host=claude&theme=dark&device=mobile&mode=fullscreen
```

| Parameter | Values | Default |
|---|---|---|
| `tool` | a tool name | first tool with a View |
| `sim` | a simulation id (`tool#name`, URL-encode the `#` as `%23`) | first simulation of the tool |
| `host` | `chatgpt`, `claude` | `chatgpt` |
| `theme` | `light`, `dark` | `light` |
| `device` | `desktop`, `tablet`, `mobile` | `desktop` |
| `mode` | `inline`, `pip`, `fullscreen` | `inline` |
| `locale` | BCP 47 tag | the browser's |
| `panel` | `input`, `output`, `log` | `input` |

E2E tests open the inspector through the same parameters (`inspector.open({...})`).
