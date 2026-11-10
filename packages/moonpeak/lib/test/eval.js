// `moonpeak test --eval`: does the model pick the right tool, with the right
// arguments, for real prompts? Runs each case N times per model.
//
// tests/evals/<name>.eval.json
//   {
//     "models": ["claude-opus-5-5", "gpt-5"],
//     "runs": 3,
//     "cases": [
//       { "prompt": "what's the weather in Lisbon", "expect": { "tool": "show-weather", "args": { "city": "re:(?i)lisbon" } } },
//       { "prompt": "tell me a joke", "expect": { "tool": null } }
//     ]
//   }
//
// Needs provider keys (ANTHROPIC_API_KEY / OPENAI_API_KEY) and the matching SDK
// installed in your project (@anthropic-ai/sdk / openai). Nothing else in
// moonpeak needs either.
import fs from "node:fs";
import path from "node:path";
import { connect, partialMatch } from "./runner.js";
import { c } from "../log.js";

const DEFAULT_MODELS = ["claude-opus-5-5"];

function loadEvals(root) {
  const dir = path.join(root, "tests", "evals");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".eval.json"))
    .sort()
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

async function importFromProject(root, name) {
  const { createRequire } = await import("node:module");
  const { pathToFileURL } = await import("node:url");
  try {
    const req = createRequire(path.join(root, "package.json"));
    return await import(pathToFileURL(req.resolve(name)).href);
  } catch {
    throw new Error(`model evals need "${name}" in your project: npm i -D ${name}`);
  }
}

const isOpenAI = (m) => /^(gpt|o\d|chatgpt)/i.test(m);

/** Ask one model one prompt with your tools. Returns { tool, args } for the first call, or { tool: null }. */
async function ask(root, model, prompt, tools, system) {
  if (isOpenAI(model)) {
    const { default: OpenAI } = await importFromProject(root, "openai");
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model,
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      tools: tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description || "", parameters: t.inputSchema } })),
    });
    const call = res.choices?.[0]?.message?.tool_calls?.[0];
    return call ? { tool: call.function.name, args: JSON.parse(call.function.arguments || "{}") } : { tool: null };
  }

  const { default: Anthropic } = await importFromProject(root, "@anthropic-ai/sdk");
  const client = new Anthropic();
  const res = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    ...(system ? { system } : {}),
    tools: tools.map((t) => ({ name: t.name, description: t.description || "", input_schema: t.inputSchema })),
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") return { tool: null, refused: true };
  const call = res.content.find((b) => b.type === "tool_use");
  return call ? { tool: call.name, args: call.input ?? {} } : { tool: null };
}

export async function runEvals({ root, server, headers, filter, quiet = false }) {
  const say = (s = "") => !quiet && console.log(s);
  const evals = loadEvals(root);
  say(`\n  ${c.bold("moonpeak test --eval")}\n`);
  if (!evals.length) {
    say(`  ${c.yellow("!")} no evals in tests/evals/*.eval.json\n`);
    return { failed: 0, results: [] };
  }

  const { client, close } = await connect({ root, server, headers });
  const { tools } = await client.listTools();
  await close();

  const results = [];
  for (const ev of evals) {
    const models = ev.models?.length ? ev.models : DEFAULT_MODELS;
    const runs = Math.max(1, Number(ev.runs || 3));
    const threshold = ev.passRate ?? 1; // share of runs that must pass
    for (const kase of ev.cases || []) {
      if (filter && !kase.prompt.includes(filter) && !(kase.expect?.tool || "").includes(filter)) continue;
      for (const model of models) {
        let pass = 0;
        const notes = [];
        for (let i = 0; i < runs; i++) {
          try {
            const got = await ask(root, model, kase.prompt, tools, ev.system);
            const errs = [];
            const want = kase.expect || {};
            if (want.tool !== undefined && got.tool !== want.tool) errs.push(`picked ${got.tool ?? "no tool"}${got.refused ? " (refused)" : ""}, wanted ${want.tool ?? "no tool"}`);
            if (want.args && got.tool) errs.push(...partialMatch(got.args, want.args, "args"));
            if (errs.length) notes.push(errs.join("; "));
            else pass++;
          } catch (e) {
            notes.push(e.message);
            if (/need "/.test(e.message)) break;
          }
        }
        const ok = pass / runs >= threshold;
        results.push({ model, prompt: kase.prompt, pass, runs, ok });
        say(`  ${ok ? c.green("✓") : c.red("✗")} ${c.dim(model.padEnd(20))} ${pass}/${runs}  ${kase.prompt}`);
        if (!ok) for (const n of [...new Set(notes)].slice(0, 3)) say(`      ${c.red(n)}`);
      }
    }
  }
  const failed = results.filter((r) => !r.ok).length;
  say(`\n  ${failed ? c.red(`${failed} failed`) : c.green("all passed")} ${c.dim(`· ${results.length} cases`)}\n`);
  return { failed, results };
}
