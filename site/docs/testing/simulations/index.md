# Simulations

> JSON fixtures for a tool: input, optional mocked output, expectations and host settings.

One file per tool in `tests/simulations/<tool>.json`, holding one simulation or an array:

```json
[
  {
    "name": "full moon",
    "prompt": "What does the moon look like on Nov 24, 2026?",
    "input": { "date": "2026-11-24" },
    "expect": { "output": { "phase": "Full Moon", "week": { "$length": 7 } } }
  },
  {
    "name": "mocked crescent",
    "input": {},
    "output": { "phase": "Waxing Crescent", "illumination": 0.11 },
    "host": { "name": "claude", "theme": "dark", "device": "mobile" }
  },
  {
    "name": "bad date",
    "input": { "date": "soon" },
    "expect": { "isError": true, "text": "not a date" }
  }
]
```

## Fields

| Field | |
|---|---|
| `name` | Shown in the inspector and test output. In a file with several simulations the id is `<tool>#<slug of name>` (e.g. `show-moon#full-moon`); a file with one simulation uses the tool name as its id. |
| `tool` | Which tool; defaults to the file name. |
| `prompt` | What a user might ask. Shown in the inspector's chat. |
| `input` | Tool arguments. |
| `output` / `result` | **Mock** the tool result (`output` = structuredContent, `result` = a whole CallToolResult). The handler is not called, so you can design a View before the backend exists. |
| `expect` | What `moonpeak test` checks (below). |
| `host` | Inspector settings for this scenario: `name` (`chatgpt` or `claude`), `theme`, `displayMode` (`inline`, `pip`, `fullscreen`), `device` (`desktop`, `tablet`, `mobile`), `locale`. |

## Expectations

| Key | Passes when |
|---|---|
| `isError` | the result's `isError` matches |
| `text` | the result's text contains the string (or every string in an array) |
| `output` | **partial match** against `structuredContent` |

Inside `output`:

| Matcher | Example | Matches |
|---|---|---|
| literal | `"phase": "Full Moon"` | equal value |
| object | `{ "week": {...} }` | listed keys only, extra keys ignored |
| array | `[{ "phase": "Full Moon" }]` | element by element, partial |
| `"re:..."` | `"re:^MP-[0-9A-Z]{6}$"` | regular expression |
| `"*"` | `"ref": "*"` | any value, as long as the key exists |
| `$length` | `{ "$length": 7 }` | array length |
| `$minLength` | `{ "$minLength": 1 }` | at least that many |

## Writing them for an existing server

```bash
moonpeak test init --server http://localhost:8000/mcp
```

writes a starter simulation per tool (with example input built from its schema) plus `moonpeak.test.json`. Running it again only adds files for new tools.
