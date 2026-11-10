# Evals

> Check that real models pick the right tool with the right arguments.

```json
// tests/evals/moon.eval.json
{
  "models": ["claude-opus-5-5", "gpt-5"],
  "runs": 3,
  "passRate": 1,
  "system": "You are a helpful astronomy assistant.",
  "cases": [
    { "prompt": "what does the moon look like on 2026-11-24?", "expect": { "tool": "show-moon", "args": { "date": "2026-11-24" } } },
    { "prompt": "quick: moon phase on 2026-12-09, just text", "expect": { "tool": "moon-facts" } },
    { "prompt": "write me a haiku about autumn", "expect": { "tool": null } }
  ]
}
```

```bash
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... moonpeak test --eval
```

For every case and model, moonpeak sends your tool list (names, descriptions, input schemas) and the prompt, `runs` times, and checks which tool the model called:

| `expect` | Passes when |
|---|---|
| `"tool": "name"` | the model called that tool |
| `"tool": null` | the model called no tool |
| `"args": {...}` | the arguments partially match |

A case passes when at least `passRate` of its runs pass (default: all of them). Tools with `visibility: ["app"]` are never sent, because hosts never show them to the model.

## Providers

| Model names | Needs |
|---|---|
| `claude-*` | `ANTHROPIC_API_KEY` and `@anthropic-ai/sdk` in your project |
| `gpt-*`, `o1`/`o3`/`o4-*`, `chatgpt-*` | `OPENAI_API_KEY` and `openai` in your project |

`ANTHROPIC_BASE_URL` and `OPENAI_BASE_URL` are respected, so evals can run against a proxy or a gateway. Evals are the one mode that costs money; keep `runs` small and run them on demand rather than on every push.
