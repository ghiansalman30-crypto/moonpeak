// Builds the topic pages (framework, testing, inspector, FAQs) with the landing page's
// head, nav, logo and footer, so every page looks like one site.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const index = fs.readFileSync(path.join(here, "index.html"), "utf8");
const LOGO = index.match(/<svg class="mark"[\s\S]*?<\/svg>/)[0];
const ICON = index.match(/<link rel="icon"[^>]*>/)[0];
const GH = "https://github.com/ghiansalman30-crypto/moonpeak";
const GH_ICON = `<svg viewBox="0 0 16 16" width="18" height="18"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const NAV = (base) => `<header class="nav">
  <a class="logo" href="${base}">${LOGO}moonpeak</a>
  <nav>
    <div class="dd">
      <button class="dd-btn" type="button" aria-haspopup="true" aria-expanded="false" onclick="var d=this.parentNode;d.classList.toggle('open');this.setAttribute('aria-expanded',d.classList.contains('open'))">App Framework <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="dd-menu">
        <a href="${base}mcp-app-framework/"><b>MCP App framework</b><span>One codebase for every MCP Apps host</span></a>
        <a href="${base}chatgpt-app-framework/"><b>ChatGPT App framework</b><span>Build and test ChatGPT Apps</span></a>
        <a href="${base}claude-connector-framework/"><b>Claude Connector framework</b><span>Connectors with interactive UI</span></a>
      </div>
    </div>
    <a href="${base}testing-framework/">Testing Framework</a>
    <a href="${base}mcp-app-inspector/">Inspector</a>
    <a href="${base}blog/">Blog</a>
    <a href="${base}docs/">Docs</a>
    <a class="gh" href="${GH}" aria-label="Source on GitHub">${GH_ICON}</a>
  </nav>
  <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" onclick="var n=this.closest('.nav');n.classList.toggle('open');this.setAttribute('aria-expanded',n.classList.contains('open'))"><span></span><span></span></button>
  <span class="progress" aria-hidden="true"></span>
</header>
<script>(function(){function shut(e){document.querySelectorAll(".dd.open").forEach(function(d){if(e.type==="keydown"?e.key==="Escape":!d.contains(e.target)){d.classList.remove("open");var b=d.querySelector(".dd-btn");if(b)b.setAttribute("aria-expanded","false")}})}document.addEventListener("click",shut);document.addEventListener("keydown",shut)})();</script>`;

export const FOOTER = (base) => `<footer class="site-foot">
  <div class="foot-brand"><span class="logo small">${LOGO}moonpeak</span><p>Server-agnostic MCP testing framework and full-stack MCP App framework.</p></div>
  <div class="foot-cols">
    <div><b>Product</b><a href="${base}mcp-app-framework/">MCP App framework</a><a href="${base}chatgpt-app-framework/">ChatGPT App framework</a><a href="${base}claude-connector-framework/">Claude Connector framework</a><a href="${base}testing-framework/">Testing Framework</a><a href="${base}mcp-app-inspector/">Inspector</a></div>
    <div><b>Learn</b><a href="${base}docs/">Docs</a><a href="${base}blog/">Blog</a><a href="${base}faqs/">FAQs</a><a href="${base}llms.txt">llms.txt</a></div>
    <div><b>Open source</b><a href="${GH}">GitHub</a><a href="https://www.npmjs.com/package/moonpeak">npm</a><a href="${GH}/blob/main/LICENSE">MIT License</a></div>
  </div>
  <p class="foot-copy">© 2026 moonpeak contributors · MIT · No token, no telemetry</p>
</footer>`;

const page = ({ slug, title, description, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<link rel="canonical" href="https://moonpeak-ai.com/${slug}/" />
${ICON}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../style.css" />
<link rel="stylesheet" href="../effects.css" />
<link rel="stylesheet" href="../pages.css" />
</head>
<body class="landing sub-page">
<div class="sky" aria-hidden="true"></div>
<canvas class="stars" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>
${NAV("../")}
<main>
${body}
  <section class="final" data-reveal>
    <h2>Open source, MIT licensed.</h2>
    <div class="cta center">
      <button class="cmd magnetic" data-copy="npx moonpeak new"><span class="prompt">$</span> npx moonpeak new <span class="copy">copy</span></button>
      <a class="btn shine magnetic" href="../docs/">Documentation →</a>
      <a class="btn ghost gh-btn" href="${GH}">${GH_ICON} GitHub</a>
    </div>
  </section>
</main>
${FOOTER("../")}
<div class="toast" role="status" aria-live="polite">Copied</div>
<script src="../main.js" defer></script>
</body>
</html>
`;

const hero = ({ kicker, h1, sub, cmd }) => `  <section class="page-hero">
    <p class="kicker">${kicker}</p>
    <h1>${h1}</h1>
    <p class="lede">${sub}</p>
    <div class="cta">
      <button class="cmd magnetic" data-copy="${esc(cmd)}"><span class="prompt">$</span> ${esc(cmd)} <span class="copy">copy</span></button>
      <a class="btn shine magnetic" href="../docs/">Documentation</a>
      <a class="btn ghost gh-btn" href="${GH}">${GH_ICON} Source</a>
    </div>
  </section>`;

const code = (lang, src, name) => `<div class="term win"><div class="bar"><i></i><i></i><i></i><span class="fname">${name || lang}</span></div><pre class="code">${esc(src.trim())}</pre></div>`;
const ticks = (items) => `<ul class="ticks">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

// ---------------------------------------------------------------- framework
const framework = page({
  slug: "mcp-app-framework",
  title: "MCP App Framework · ChatGPT App & Claude Connector framework | moonpeak",
  description: "moonpeak is a full-stack MCP App framework: one file per tool, one folder per View, 27 React hooks, a local inspector and a production server. The same app runs as a ChatGPT App and a Claude connector.",
  body: `${hero({
    kicker: "MCP App framework · ChatGPT Apps · Claude connectors",
    h1: "The MCP App framework.",
    sub: "Write an MCP tool and the UI it shows once. moonpeak renders it in ChatGPT, Claude, VS Code, Goose and every MCP Apps host, from the same code.",
    cmd: "npx moonpeak new",
  })}

  <section class="split" data-reveal>
    <div>
      <h2>Why use an MCP App framework?</h2>
      <p>An MCP App is an MCP tool plus a <code>ui://</code> resource the host renders next to the conversation. Doing that by hand means a server, a bundler that inlines everything into one HTML file, host metadata for every client and a fake host to look at it. moonpeak does all of it from two folders.</p>
      ${ticks([
        "Folders are the config: tools, Views and fixtures are discovered.",
        "Return a plain object and it becomes <code>structuredContent</code>; throw and it becomes a tool error.",
        "Each View builds to one self-contained HTML file, ready for strict CSPs.",
        "Resources carry MCP Apps metadata and the older <code>openai/*</code> keys, so ChatGPT renders them too.",
        "Hot reload for Views and tools while the inspector stays open.",
      ])}
    </div>
    ${code("tree", `my-app/
├─ src/
│  ├─ tools/show-moon.ts        # one MCP tool
│  ├─ resources/moon/moon.tsx   # its View
│  └─ lib/
└─ tests/
   ├─ simulations/show-moon.json
   ├─ e2e/moon.spec.ts
   └─ evals/moon.eval.json`, "my-app")}
  </section>

  <section class="split rev" data-reveal>
    ${code("ts", `import { z } from "zod";

export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date.",
  resource: "moon",             // render src/resources/moon
};

export const schema = { date: z.string().optional() };

export default async function ({ date }) {
  return { date, phase: "Full Moon", illumination: 1 };
}`, "src/tools/show-moon.ts")}
    <div>
      <h2>A tool is one file.</h2>
      <p>Export the tool's metadata, a zod schema and a handler. Point <code>resource</code> at a View folder to give it a UI, or leave it out for a text tool. Mark helper tools <code>visibility: ["app"]</code> and only your View can call them; the model never sees them.</p>
    </div>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>A View is one React component.</h2>
      <p>Twenty-seven typed hooks cover everything a View needs: the tool's input and output, theme, locale, safe areas, container size, display mode requests, per-View state that survives reloads, calling other tools, posting into the chat and updating model context.</p>
      <a class="more" href="../docs/app-framework/runtime-apis/">Every hook →</a>
    </div>
    ${code("tsx", `import { useToolData, useTheme, useCallTool } from "moonpeak";

export default function Moon() {
  const { output, isPending } = useToolData();
  const theme = useTheme();
  const callTool = useCallTool();
  if (isPending) return <p>Reading the sky…</p>;
  return (
    <div className={theme}>
      <h1>{output.phase}</h1>
      <button onClick={() => callTool("show-moon", next)}>Next week</button>
    </div>
  );
}`, "src/resources/moon/moon.tsx")}
  </section>

  <section data-reveal>
    <h2>Start from a pattern</h2>
    <p class="sub"><code>npx moonpeak new</code> asks which resources to start with. Each one is a working View with simulations, e2e tests and evals.</p>
    <div class="grid3" data-stagger>
      <article class="glow-card"><span class="ic">◐</span><h3>moon</h3><p>Detail card. A date's moon phase with a 7-day strip; buttons call the tool again through the host.</p></article>
      <article class="glow-card"><span class="ic">◑</span><h3>calendar</h3><p>Carousel. Swipeable cards of the upcoming phases; "load more" pages through the host, selection is shared with the model.</p></article>
      <article class="glow-card"><span class="ic">◒</span><h3>review</h3><p>Review and confirm. The model proposes a stargazing night, the user confirms it through an app-only tool.</p></article>
    </div>
    <div class="cmdrow"><code>npx moonpeak new my-app calendar,review</code><span>pick resources up front</span></div>
  </section>

  <section class="split rev" data-reveal>
    ${code("bash", `moonpeak build      # dist/resources/*.html + dist/server.mjs
moonpeak start      # http://localhost:8000/mcp

# or mount it yourself (Workers, Hono, Deno, Bun, Next.js)
import { createHandler } from "moonpeak/server";`, "deploy")}
    <div>
      <h2>Ship it anywhere.</h2>
      <p><code>moonpeak build</code> inlines every View and bundles your tools. Serve the result with <code>moonpeak start</code>, or mount <code>createHandler</code> on any runtime that speaks Fetch, or <code>createNodeHandler</code> on Express and node:http. Then add the HTTPS URL as a Claude connector or a ChatGPT app.</p>
      <a class="more" href="../docs/guides/deployment/">Deploy docs →</a>
    </div>
  </section>`,
});

// ---------------------------------------------------------------- testing
const testing = page({
  slug: "testing-framework",
  title: "MCP Testing Framework · test MCP servers and MCP Apps in CI | moonpeak",
  description: "moonpeak is a server-agnostic MCP testing framework: simulations, schema and View checks, Playwright e2e against ChatGPT and Claude style hosts, visual regression and real-model evals. Works with MCP servers in any language.",
  body: `${hero({
    kicker: "MCP testing framework",
    h1: "Test MCP Apps in CI.<br />No accounts, no keys.",
    sub: "Point moonpeak at any MCP server, written in TypeScript, Python, Go, Rust or Java, and get schema checks, simulations, browser tests in ChatGPT and Claude style hosts, and evals that ask real models which tool they'd pick.",
    cmd: "npx moonpeak test init --server http://localhost:8000/mcp",
  })}

  <section class="split" data-reveal>
    <div>
      <h2>Why use an MCP testing framework?</h2>
      <p>MCP Apps fail in ways unit tests don't catch: a schema the host rejects, a View that never receives its data, a tool the model never picks. Testing in the real hosts means accounts, tunnels and AI credits on every run. moonpeak replicates the hosts locally so the same checks run on every push.</p>
      ${ticks([
        "<b>Simulations</b>: JSON fixtures with input, mocked output, expectations and host settings.",
        "<b>Schema and View checks</b>: every tool schema validated, every View built and rendered.",
        "<b>E2E</b>: Playwright drives the inspector in ChatGPT and Claude style hosts.",
        "<b>Visual regression</b>: screenshot tests tagged <code>@visual</code>.",
        "<b>Evals</b>: do Claude and GPT models pick the right tool with the right arguments?",
      ])}
    </div>
    <div class="term"><div class="bar"><i></i><i></i><i></i><span class="fname">zsh</span></div><pre><span class="d">$</span> moonpeak test

  <b>moonpeak test</b> <span class="d">my-app</span>

  <span class="ok">✓</span> <span class="d">schema</span>     moon-calendar
  <span class="ok">✓</span> <span class="d">schema</span>     plan-night
  <span class="ok">✓</span> <span class="d">view</span>       ui://my-app/calendar.html
  <span class="ok">✓</span> <span class="d">view</span>       ui://my-app/review.html
  <span class="ok">✓</span> <span class="d">sim</span>        plan-night#dark-new-moon-night
  <span class="ok">✓</span> <span class="d">sim</span>        plan-night#bad-date

  <span class="ok">all passed</span> <span class="d">· 21 checks</span></pre></div>
  </section>

  <section class="split rev" data-reveal>
    ${code("json", `[
  {
    "name": "dark new moon night",
    "prompt": "Stargazing at Bromo on Dec 9 2026?",
    "input": { "date": "2026-12-09", "place": "Bromo" },
    "expect": { "output": { "phase": "New Moon", "darkness": "excellent" } }
  },
  {
    "name": "bad date",
    "input": { "date": "next friday" },
    "expect": { "isError": true, "text": "not a date" }
  }
]`, "tests/simulations/plan-night.json")}
    <div>
      <h2>Simulations are just JSON.</h2>
      <p>Partial matching on <code>output</code>, <code>"re:..."</code> for regexes, <code>"*"</code> for any value, <code>$length</code> and <code>$minLength</code> for arrays. Mocked output lets you design a View before the backend exists. <code>moonpeak test init --server</code> writes a first fixture for every tool of an existing server.</p>
    </div>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>E2E with real host behaviour.</h2>
      <p>Tests get an <code>inspector</code> fixture that opens your View in a ChatGPT or Claude style host, with theme, device and display mode, and an <code>mcp</code> fixture that calls tools directly. Sent messages and model context are captured so you can assert on them.</p>
      <a class="more" href="../docs/testing/">Testing docs →</a>
    </div>
    ${code("ts", `import { test, expect } from "moonpeak/test";

test("confirm tells the model", async ({ inspector }) => {
  const view = await inspector.open({
    tool: "plan-night",
    sim: "plan-night#dark-new-moon-night",
    host: "claude",
  });
  await view.getByRole("button", { name: "Confirm plan" }).click();
  await expect(inspector.modelContext())
    .toContainText("confirmed the stargazing plan");
});`, "tests/e2e/review.spec.ts")}
  </section>

  <section class="split rev" data-reveal>
    ${code("json", `{
  "models": ["claude-opus-5-5", "gpt-5"],
  "runs": 3,
  "cases": [
    {
      "prompt": "plan stargazing at Bromo on 2026-12-09",
      "expect": { "tool": "plan-night",
                  "args": { "date": "2026-12-09" } }
    },
    { "prompt": "write me a haiku", "expect": { "tool": null } }
  ]
}`, "tests/evals/review.eval.json")}
    <div>
      <h2>Evals against real models.</h2>
      <p><code>moonpeak test --eval</code> sends your tool list to Claude and OpenAI models and checks which tool they call, with which arguments, over several runs. App-only tools are left out, exactly as hosts do. Bring your own <code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code>.</p>
    </div>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>Any server, any language.</h2>
      <p>Everything above works against a server moonpeak didn't build: <code>--server</code> speaks Streamable HTTP to it, <code>--header</code> adds auth. Run it in GitHub Actions next to the server's own tests.</p>
    </div>
    ${code("yaml", `- run: npx playwright install --with-deps chromium
- run: npx moonpeak test --server http://localhost:8000/mcp
- run: npx moonpeak test --e2e`, ".github/workflows/ci.yml")}
  </section>`,
});

// ---------------------------------------------------------------- inspector
const SHOTS = [
  ["chatgpt-light.png", "ChatGPT · light", "The starter's moon View in a ChatGPT-style host, light theme"],
  ["claude-dark.png", "Claude · dark", "The same View in a Claude-style host, dark theme"],
  ["fullscreen.png", "Fullscreen", "The View expanded to fullscreen display mode"],
  ["inspect-remote.png", "Any server", "The inspector pointed at a remote MCP server"],
];
const inspector = page({
  slug: "mcp-app-inspector",
  title: "MCP App Inspector · ChatGPT & Claude hosts on localhost | moonpeak",
  description: "The moonpeak inspector replicates ChatGPT and Claude style hosts on localhost. Inspect any MCP server across hosts, themes, display modes and devices without deploying or paying for host accounts.",
  body: `${hero({
    kicker: "MCP App Inspector",
    h1: "ChatGPT and Claude,<br />on localhost.",
    sub: "The moonpeak inspector replicates ChatGPT and Claude style hosts on your machine. Inspect any MCP server across hosts, themes, display modes and device sizes without deploying or paying for host accounts.",
    cmd: "npx moonpeak inspect --server https://moonpeak-ai.com/mcp",
  })}

  <section class="inspector shots-tabs" data-reveal>
    <div class="tabs" role="tablist" aria-label="Inspector screenshots">
      ${SHOTS.map(([, label], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${i}">${label}</button>`).join("")}
    </div>
    <div class="tab-stage">
      ${SHOTS.map(([f, label, alt], i) => `<figure class="${i === 0 ? "on" : ""}" data-panel="${i}"><img src="../assets/${f}" alt="${alt}" loading="${i === 0 ? "eager" : "lazy"}" /><figcaption>${label}</figcaption></figure>`).join("")}
    </div>
    <p class="sub center-sub">Try it now: the command above opens the inspector against moonpeak's live demo server.</p>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>Why the moonpeak inspector?</h2>
      ${ticks([
        "<b>Two hosts</b>: ChatGPT-style and Claude-style chrome, host info, capabilities and the <code>window.openai</code> globals ChatGPT Views expect.",
        "<b>Every host setting</b>: theme, locale, device width, safe areas and display mode (inline, picture-in-picture, fullscreen).",
        "<b>Live editing</b>: change tool input and run the real handler, or edit the output and re-render without a backend.",
        "<b>Host actions</b>: messages, model context, links, downloads, logs and widget state show up in side panels.",
        "<b>Shareable</b>: every setting lives in the URL, so a bug report is a link.",
      ])}
    </div>
    ${code("bash", `# your moonpeak project, with hot reload
moonpeak dev

# any MCP server, in any language
moonpeak inspect --server http://localhost:8000/mcp
moonpeak inspect --server https://api.example.com/mcp \\
  --header "authorization:Bearer $TOKEN"`, "inspect")}
  </section>`,
});

// ---------------------------------------------------------------- FAQs
const FAQ = [
  ["What is an MCP App?", "An MCP tool that comes with a UI. The tool declares a <code>ui://</code> resource, the host fetches that HTML and renders it in a sandboxed frame next to the conversation, and the two talk over a small postMessage protocol defined by the MCP Apps extension."],
  ["What is an MCP App framework?", "A toolkit that turns tools and React components into a working MCP server with UI resources: discovery, bundling each View into one HTML file, host metadata, a local host to look at it and a production server. moonpeak is one."],
  ["Is moonpeak a ChatGPT App framework?", "Yes. ChatGPT Apps are MCP Apps. moonpeak resources carry both the MCP Apps metadata and the older <code>openai/*</code> keys, and <code>moonpeak/chatgpt</code> exposes widget state, file upload and modals when a View runs inside ChatGPT."],
  ["Is moonpeak a Claude connector framework?", "Yes. Deploy the server over HTTPS and add <code>https://your-domain/mcp</code> as a custom connector in Claude. <code>moonpeak/claude</code> has Claude-specific helpers."],
  ["Do I need a ChatGPT or Claude account to develop?", "No. The inspector replicates both hosts locally, including theme, display modes and the bridge calls a View can make. You only need a host account to try the deployed app there."],
  ["Can I test a server that isn't built with moonpeak?", "Yes. <code>moonpeak inspect --server</code> and <code>moonpeak test --server</code> work with any MCP server over Streamable HTTP, written in any language. <code>--header</code> adds auth."],
  ["Does it run in CI?", "Yes. <code>moonpeak test</code> runs in-process in about a second. <code>--e2e</code> and <code>--visual</code> need Chromium from Playwright. <code>--eval</code> needs provider keys. The repository's own CI runs all of it on Linux."],
  ["What do evals need?", "Provider keys (<code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code>) and the matching SDK in your project. Everything else runs offline."],
  ["How do I deploy?", "<code>moonpeak build</code> then <code>moonpeak start</code>, or import <code>createHandler</code> from <code>moonpeak/server</code> and mount it on any runtime that speaks Fetch."],
  ["Is there a live demo?", "Yes. The starter app runs at <code>https://moonpeak-ai.com/mcp</code>. Add it as a connector in Claude or an app in ChatGPT developer mode, or inspect it with <code>npx moonpeak inspect --server https://moonpeak-ai.com/mcp</code>."],
  ["Is it free? Is there a token?", "Free and MIT licensed. No account, no telemetry and no token."],
];
const faqs = page({
  slug: "faqs",
  title: "FAQs | moonpeak MCP App framework and MCP testing framework",
  description: "Answers about MCP Apps, ChatGPT Apps, Claude connectors and the moonpeak framework, testing framework and inspector.",
  body: `  <section class="page-hero short">
    <p class="kicker">FAQs</p>
    <h1>Frequently asked questions</h1>
  </section>
  <section class="faq" data-reveal>
    <table class="facts">
      <tr><th>Product</th><td>moonpeak</td></tr>
      <tr><th>Category</th><td>MCP App framework, MCP testing framework, MCP App inspector</td></tr>
      <tr><th>License</th><td>MIT</td></tr>
      <tr><th>Package</th><td><code>moonpeak</code> on npm</td></tr>
      <tr><th>Includes</th><td>App framework, CLI, inspector, test runner, Playwright fixtures, evals</td></tr>
      <tr><th>Built on</th><td>MCP Apps SDK, MCP TypeScript SDK v2, React, Vite</td></tr>
    </table>
    ${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n    ")}
  </section>`,
});

// ---------------------------------------------------------------- ChatGPT Apps
const chatgpt = page({
  slug: "chatgpt-app-framework",
  title: "ChatGPT App framework · build and test ChatGPT Apps | moonpeak",
  description: "Build ChatGPT Apps with moonpeak: React Views, the ChatGPT Apps SDK metadata written for you, window.openai in the local inspector, and tests that run without a ChatGPT account.",
  body: `${hero({
    kicker: "ChatGPT App framework",
    h1: "Build ChatGPT Apps<br />without the guesswork.",
    sub: "ChatGPT Apps are MCP Apps. moonpeak writes the ChatGPT Apps SDK metadata for you, replicates <code>window.openai</code> on localhost and tests your app in a ChatGPT-style host before you ever open ChatGPT.",
    cmd: "npx moonpeak new",
  })}

  <section class="split" data-reveal>
    <div>
      <h2>One app, ChatGPT included.</h2>
      <p>Every moonpeak resource carries the MCP Apps metadata and the older ChatGPT keys side by side, so the same build renders in ChatGPT, Claude and every other host.</p>
      ${ticks([
        "<code>resource</code> becomes <code>openai/outputTemplate</code>.",
        "<code>invoking</code> / <code>invoked</code> become ChatGPT's status texts.",
        "App-only tools get <code>openai/visibility: private</code> and <code>openai/widgetAccessible</code>.",
        "Resource <code>csp</code> becomes <code>openai/widgetCSP</code>.",
        "<code>useAppState</code> saves to ChatGPT widget state automatically.",
      ])}
      <a class="more" href="../docs/app-framework/chatgpt/">ChatGPT Apps docs →</a>
    </div>
    ${code("ts", `export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date.",
  resource: "moon",
  invoking: "Looking up",        // ChatGPT status while running
  invoked: "Here's the moon",    // ...and after
};`, "src/tools/show-moon.ts")}
  </section>

  <section class="split rev" data-reveal>
    ${code("tsx", `import { useIsChatGPT, useWidgetState, useUploadFile } from "moonpeak/chatgpt";

export default function Gallery() {
  const chatgpt = useIsChatGPT();
  const upload = useUploadFile();      // null outside ChatGPT
  // ...
}`, "ChatGPT extras")}
    <div>
      <h2>ChatGPT extras when you need them.</h2>
      <p><code>moonpeak/chatgpt</code> exposes widget state, file upload, modals, user agent and any <code>window.openai</code> global. Each hook is safe to call in other hosts, where it returns an empty value.</p>
    </div>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>Try it in ChatGPT.</h2>
      <p>Deploy over HTTPS, then in ChatGPT open Settings → Apps, turn on Developer mode and create an app with your <code>/mcp</code> URL. Or add the live demo, <code>https://moonpeak-ai.com/mcp</code>, to see it first.</p>
      <a class="more" href="../docs/guides/deployment/">Deployment guide →</a>
    </div>
    ${code("bash", `npm run build && npm start      # http://localhost:8000/mcp
npx moonpeak test --server https://your-domain/mcp`, "ship")}
  </section>`,
});

// ---------------------------------------------------------------- Claude connectors
const claude = page({
  slug: "claude-connector-framework",
  title: "Claude Connector framework · connectors with interactive UI | moonpeak",
  description: "Build Claude connectors that render interactive UI with moonpeak: MCP Apps Views, a Claude-style host on localhost and tests that run without a Claude account.",
  body: `${hero({
    kicker: "Claude Connector framework",
    h1: "Claude connectors<br />with real UI.",
    sub: "Claude renders MCP Apps natively. moonpeak turns your tools and React Views into a connector, lets you see it in a Claude-style host on localhost and tests it in CI.",
    cmd: "npx moonpeak new",
  })}

  <section class="split" data-reveal>
    <div>
      <h2>From tool to connector.</h2>
      ${ticks([
        "Write a tool in <code>src/tools</code> and its View in <code>src/resources</code>.",
        "See it in the inspector's Claude host, light or dark, inline or fullscreen.",
        "Deploy with <code>moonpeak start</code> or <code>createHandler</code>, behind HTTPS.",
        "In Claude: Settings → Connectors → Add custom connector → your <code>/mcp</code> URL.",
      ])}
      <a class="more" href="../docs/app-framework/claude/">Claude connector docs →</a>
    </div>
    ${code("bash", `npx moonpeak new my-connector review
cd my-connector && npm run dev     # Claude host at localhost:3000?host=claude`, "start")}
  </section>

  <section class="split rev" data-reveal>
    ${code("tsx", `import { useIsClaude, useClaudeStyles } from "moonpeak/claude";

const vars = useClaudeStyles();   // fonts and colors from Claude
<div style={{ fontFamily: vars["--font-sans"] }}>…</div>`, "Claude extras")}
    <div>
      <h2>Looks at home in Claude.</h2>
      <p>moonpeak applies the host's style variables to the document, so your CSS can use Claude's fonts and colors. <code>moonpeak/claude</code> adds host detection and the raw style map.</p>
    </div>
  </section>

  <section class="split" data-reveal>
    <div>
      <h2>Safe actions by design.</h2>
      <p>Mark a tool <code>visibility: ["app"]</code> and Claude never offers it to the model: only a click in your View can run it. The <code>review</code> starter shows the full propose-then-confirm flow.</p>
      <a class="more" href="../docs/mcp-apps/visibility/">Tool visibility →</a>
    </div>
    ${code("ts", `export const tool = {
  title: "Confirm stargazing plan",
  description: "Called from the review View only.",
  visibility: ["app"],
};`, "src/tools/confirm-plan.ts")}
  </section>`,
});

for (const [slug, html] of [["mcp-app-framework", framework], ["chatgpt-app-framework", chatgpt], ["claude-connector-framework", claude], ["testing-framework", testing], ["mcp-app-inspector", inspector], ["faqs", faqs]]) {
  fs.mkdirSync(path.join(here, slug), { recursive: true });
  fs.writeFileSync(path.join(here, slug, "index.html"), html);
}
console.log("pages: mcp-app-framework, chatgpt-app-framework, claude-connector-framework, testing-framework, mcp-app-inspector, faqs");
