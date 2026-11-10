// Builds the multi-page docs at site/docs/** from site/docs-src/*.md.
// Each source file holds several pages, separated by lines like:
//   @@page slug="testing/evals" title="Evals" description="..."
// _nav.json sets the sidebar order. Hook pages come from site/docs-src/hooks.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { NAV, FOOTER, SOCIAL } from "./build-pages.mjs";
import { hookPages } from "./docs-src/hooks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, "docs-src");
const OUT = path.join(here, "docs");
const SITE = "https://moonpeak-ai.com";
const REPO = "https://github.com/ghiansalman30-crypto/moonpeak";
const index = fs.readFileSync(path.join(here, "index.html"), "utf8");
const ICON = index.match(/<link rel="icon"[^>]*>/)[0];

// ------------------------------------------------------------------ collect pages
const pages = new Map();
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".md"))) {
  const text = fs.readFileSync(path.join(SRC, file), "utf8").replace(/\r\n/g, "\n");
  for (const chunk of text.split(/^@@page /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    const attrs = Object.fromEntries([...chunk.slice(0, nl).matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    if (attrs.slug === undefined || !attrs.title) throw new Error(`${file}: page without slug/title`);
    if (pages.has(attrs.slug)) throw new Error(`duplicate page ${attrs.slug}`);
    pages.set(attrs.slug, { ...attrs, md: chunk.slice(nl + 1).trim() + "\n", source: `site/docs-src/${file}` });
  }
}
for (const p of hookPages()) pages.set(p.slug, { ...p, source: "site/docs-src/hooks.mjs" });

const nav = JSON.parse(fs.readFileSync(path.join(SRC, "_nav.json"), "utf8"));
const order = [];
for (const g of nav) {
  g.items = g.items.flatMap((s) => (s === "@hooks" ? hookPages().map((h) => h.slug) : [s]));
  for (const s of g.items) {
    if (!pages.has(s)) throw new Error(`_nav.json lists missing page "${s}"`);
    order.push(s);
  }
}
for (const s of pages.keys()) if (!order.includes(s)) throw new Error(`page "${s}" is not in _nav.json`);

// ------------------------------------------------------------------ render
const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** relative URL from docs page `from` to docs page `to` ("" is the docs home) */
const href = (from, to) => {
  const up = from === "" ? "" : "../".repeat(from.split("/").length);
  const r = `${up}${to === "" ? "" : /.[a-z0-9]+$/i.test(to) ? to : to + "/"}`;
  return r || "./";
};
// links written as (/docs/x) or (/x) in sources become relative, so the site works anywhere
const relLinks = (html, from) => {
  const depth = from === "" ? 0 : from.split("/").length;
  return html
    .replace(/href="\/docs\/?([^"#]*?)\/?(#[^"]*)?"/g, (_, to, hash = "") => `href="${href(from, to)}${hash}"`)
    .replace(/href="\/(?!\/)([^"]*)"/g, (_, rest) => `href="${"../".repeat(depth + 1)}${rest}"`);
};

const searchIndex = [];
const rendered = new Map();
for (const slug of order) {
  const p = pages.get(slug);
  const toc = [];
  const r = new marked.Renderer();
  r.heading = ({ tokens, depth }) => {
    const text = marked.Parser.parseInline(tokens);
    const id = slugify(text);
    if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/<[^>]+>/g, ""), depth });
    return `<h${depth} id="${id}"><a href="#${id}">${text}</a></h${depth}>`;
  };
  r.code = ({ text, lang }) =>
    `<div class="codeblock"><button class="copy-code" type="button" aria-label="Copy code">copy</button><pre><code${lang ? ` class="lang-${lang}"` : ""}>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`;
  const body = relLinks(marked.parse(p.md, { renderer: r }), slug);
  rendered.set(slug, { body, toc });
  searchIndex.push({
    s: slug, t: p.title, d: p.description || "", h: toc.map((t) => t.text),
    x: p.md.replace(/```[\s\S]*?```/g, " ").replace(/\]\([^)]*\)/g, "]").replace(/[#*`>|\-\[\]()]/g, " ").replace(/\s+/g, " ").slice(0, 1600),
  });
}

const group = (slug) => nav.find((g) => g.items.includes(slug))?.title;
const sidebar = (current) =>
  nav.map((g) => `<div class="sb-group"><b>${g.title}</b>${g.items.map((s) => `<a href="${href(current, s)}"${s === current ? ' class="on" aria-current="page"' : ""}>${pages.get(s).nav || pages.get(s).title}</a>`).join("")}</div>`).join("");

for (const [i, slug] of order.entries()) {
  const p = pages.get(slug);
  const { body, toc } = rendered.get(slug);
  const prev = order[i - 1], next = order[i + 1];
  const depth = slug === "" ? 0 : slug.split("/").length;
  const root = "../".repeat(depth + 1); // site root
  const docsRoot = depth ? "../".repeat(depth) : "./";
  const title = `${p.title} - moonpeak docs`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${(p.description || p.title).replace(/"/g, "&quot;")}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${(p.description || p.title).replace(/"/g, "&quot;")}" />
${SOCIAL(`${SITE}/docs/${slug ? slug + "/" : ""}`, title, p.description || p.title)}
<link rel="canonical" href="${SITE}/docs/${slug ? slug + "/" : ""}" />
<link rel="alternate" type="text/markdown" href="index.md" />
${ICON}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${root}style.css" />
<link rel="stylesheet" href="${root}pages.css" />
<link rel="stylesheet" href="${root}docs.css" />
</head>
<body class="docs-page" data-docs-root="${docsRoot}">
<div class="sky" aria-hidden="true"></div>
${NAV(root)}
<div class="docs-shell">
  <aside class="sidebar" aria-label="Docs navigation">
    <button class="search-open" type="button"><span>Search docs</span><kbd>/</kbd></button>
    <button class="sb-toggle" type="button" aria-expanded="false">Browse docs <span>${group(slug) || "Docs"} · ${p.title}</span></button>
    <nav>${sidebar(slug)}</nav>
  </aside>
  <main class="doc">
    <p class="crumb">${group(slug) || "Docs"}</p>
    <h1>${p.title}</h1>
    ${p.description ? `<p class="doc-lede">${p.description}</p>` : ""}
    <div class="doc-tools"><button type="button" class="copy-md">Copy page as Markdown</button><a href="index.md">View .md</a><a href="${REPO}/edit/main/${p.source}">Edit on GitHub</a></div>
    <article>${body}</article>
    <nav class="pager">${prev !== undefined ? `<a class="prev" href="${href(slug, prev)}"><span>Previous</span>${pages.get(prev).title}</a>` : "<span></span>"}${next !== undefined ? `<a class="next" href="${href(slug, next)}"><span>Next</span>${pages.get(next).title}</a>` : ""}</nav>
  </main>
  <aside class="onpage" aria-label="On this page">${toc.length ? `<b>On this page</b>${toc.map((t) => `<a class="d${t.depth}" href="#${t.id}">${t.text}</a>`).join("")}` : ""}</aside>
</div>
<div class="search-modal" hidden>
  <div class="search-box" role="dialog" aria-modal="true" aria-label="Search docs">
    <input type="search" placeholder="Search the docs" aria-label="Search the docs" />
    <ol class="search-results"></ol>
    <p class="search-hint">Enter to open · Esc to close · ${order.length} pages</p>
  </div>
</div>
${FOOTER(root)}
<script src="${docsRoot}docs.js" defer></script>
</body>
</html>
`;
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "index.md"), `# ${p.title}\n\n${p.description ? `> ${p.description}\n\n` : ""}${p.md}`);
}

// remove folders of pages that no longer exist
(function sweep(dir, rel = "") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    sweep(path.join(dir, e.name), r);
    if (!pages.has(r) && ![...pages.keys()].some((k) => k.startsWith(r + "/"))) fs.rmSync(path.join(dir, e.name), { recursive: true, force: true });
  }
})(OUT);

fs.writeFileSync(path.join(OUT, "search.json"), JSON.stringify(searchIndex));
fs.copyFileSync(path.join(SRC, "docs.js"), path.join(OUT, "docs.js"));

// llms.txt (index) and llms-full.txt (every page), like sunpeak's docs
const url = (s) => `${SITE}/docs/${s ? s + "/" : ""}`;
const line = (s) => `- [${pages.get(s).title}](${url(s)}index.md)${pages.get(s).description ? `: ${pages.get(s).description}` : ""}`;
const llms = `# moonpeak

> Server-agnostic MCP testing framework and full-stack MCP App framework. Build, inspect and test MCP Apps (interactive UIs) for ChatGPT, Claude and every MCP Apps host. Open source, MIT, npm package \`moonpeak\`.

Start a project with \`npx moonpeak new\`. A live demo MCP server runs at ${SITE}/mcp. Every page below is also available as Markdown, and ${SITE}/docs/llms-full.txt has all of them in one file.

${nav.map((g) => `## ${g.title}\n\n${g.items.map(line).join("\n")}`).join("\n\n")}

## Site

- [MCP App framework](${SITE}/mcp-app-framework/)
- [MCP testing framework](${SITE}/testing-framework/)
- [MCP App inspector](${SITE}/mcp-app-inspector/)
- [FAQs](${SITE}/faqs/)
- [Source on GitHub](${REPO})
`;
fs.writeFileSync(path.join(OUT, "llms.txt"), llms);
fs.writeFileSync(path.join(here, "llms.txt"), llms);
fs.writeFileSync(path.join(OUT, "llms-full.txt"), order.map((s) => `# ${pages.get(s).title}\n\nSource: ${url(s)}\n\n${pages.get(s).md}`).join("\n\n---\n\n"));
console.log(`docs: ${order.length} pages in ${nav.length} groups + search.json + llms.txt + llms-full.txt`);
