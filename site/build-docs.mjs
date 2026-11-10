// Builds site/docs/index.html from packages/moonpeak/README.md so the docs never drift.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const here = path.dirname(fileURLToPath(import.meta.url));
const md = fs.readFileSync(path.join(here, "..", "packages", "moonpeak", "README.md"), "utf8")
  .replace(/^# moonpeak\n+/, "")
  .replace(/^## What you get/m, "## Quickstart\n\n```bash\nnpx moonpeak new my-app\ncd my-app && npm install\nnpm run dev\n```\n\nOpen http://localhost:3000. Edit `src/resources/moon/moon.tsx` and the View reloads. Edit `src/tools/show-moon.ts` and the next call uses the new code.\n\nTo try it in Claude or ChatGPT, run `moonpeak build && moonpeak start`, expose port 8000 over HTTPS, and add `https://your-host/mcp` as a custom connector (Claude) or app (ChatGPT developer mode).\n\n## What you get");

const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toc = [];
const renderer = new marked.Renderer();
renderer.heading = ({ tokens, depth }) => {
  const text = marked.Parser.parseInline(tokens);
  const id = slug(text);
  if (depth === 2) toc.push({ id, text });
  return `<h${depth} id="${id}"><a href="#${id}">${text}</a></h${depth}>`;
};
const body = marked.parse(md, { renderer });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>moonpeak docs</title>
<meta name="description" content="moonpeak documentation: MCP App framework, hooks, simulations, testing, inspector and deployment." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='g' cx='38%25' cy='34%25'%3E%3Cstop offset='0' stop-color='%23fffdf5'/%3E%3Cstop offset='1' stop-color='%23aaa79a'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='16' cy='16' r='14' fill='url(%23g)'/%3E%3Ccircle cx='12' cy='12' r='3.5' fill='%238c897f' fill-opacity='.45'/%3E%3Ccircle cx='20' cy='13' r='2.5' fill='%238c897f' fill-opacity='.4'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../style.css" />
<style>
  .docs-wrap { display: grid; grid-template-columns: 220px 1fr; gap: 48px; max-width: 1180px; margin: 0 auto; padding: 48px clamp(16px, 5vw, 64px) 96px; }
  .toc { position: sticky; top: 84px; align-self: start; display: flex; flex-direction: column; gap: 4px; font-size: 14.5px; }
  .toc b { font: 500 12px var(--mono); text-transform: uppercase; letter-spacing: .08em; color: var(--accent); margin-bottom: 8px; }
  .toc a { color: var(--mute); text-decoration: none; padding: 4px 0; }
  .toc a:hover { color: var(--text); }
  article { min-width: 0; }
  article h2 { font-size: 32px; margin: 56px 0 14px; scroll-margin-top: 84px; }
  article h2:first-child { margin-top: 0; }
  article h3 { font-size: 20px; margin: 30px 0 10px; scroll-margin-top: 84px; }
  article h2 a, article h3 a { text-decoration: none; }
  article p, article li { color: #c3c8dc; }
  article pre { font: 13.5px/1.6 var(--mono); background: #0a0d1a; border: 1px solid var(--line); border-radius: 14px; padding: 18px; overflow-x: auto; }
  article pre code { background: none; border: 0; padding: 0; font-size: inherit; }
  article table { width: 100%; border-collapse: collapse; font-size: 14.5px; margin: 14px 0; display: block; overflow-x: auto; }
  article th, article td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  article th { color: var(--mute); font-weight: 500; }
  article ul { padding-left: 20px; }
  article a { color: var(--accent); }
  article hr { border: 0; border-top: 1px solid var(--line); margin: 36px 0; }
  .lead { font-size: 19px; }
  @media (max-width: 820px) { .docs-wrap { grid-template-columns: 1fr; } .toc { position: static; flex-direction: row; flex-wrap: wrap; gap: 4px 14px; } .toc b { width: 100%; } }
</style>
</head>
<body>
<div class="sky" aria-hidden="true"></div>
<header class="nav">
  <a class="logo" href="../"><span class="mark"></span>moonpeak</a>
  <nav>
    <a href="../#framework">App framework</a>
    <a href="../#testing">Testing</a>
    <a href="../#inspector">Inspector</a>
    <a href="./">Docs</a>
  </nav>
</header>
<div class="docs-wrap">
  <aside class="toc"><b>Docs</b>${toc.map((t) => `<a href="#${t.id}">${t.text}</a>`).join("")}</aside>
  <article>${body.replace("<p><strong>", '<p class="lead"><strong>')}</article>
</div>
<footer>
  <span class="logo small"><span class="mark"></span>moonpeak</span>
  <span>© 2026 moonpeak contributors · MIT</span>
  <a href="https://github.com/ghiansalman30-crypto/moonpeak">GitHub</a>
</footer>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "docs", "index.html"), html);
console.log(`docs: ${toc.length} sections`);
