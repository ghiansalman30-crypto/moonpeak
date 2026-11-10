// Builds site/blog/ (index + one page per post) from site/blog-src/posts.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { NAV, FOOTER } from "./build-pages.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "blog");
const SITE = "https://moonpeak-ai.com";
const index = fs.readFileSync(path.join(here, "index.html"), "utf8");
const ICON = index.match(/<link rel="icon"[^>]*>/)[0];
const AUTHOR = "The moonpeak team";

const text = fs.readFileSync(path.join(here, "blog-src", "posts.md"), "utf8").replace(/\r\n/g, "\n");
const posts = text.split(/^@@post /m).slice(1).map((chunk) => {
  const nl = chunk.indexOf("\n");
  const a = Object.fromEntries([...chunk.slice(0, nl).matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  return { ...a, md: chunk.slice(nl + 1).trim() + "\n" };
});
const fmt = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
const minutes = (md) => Math.max(1, Math.round(md.split(/\s+/).length / 220));

const shell = ({ title, description, canonical, root, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, "&quot;")}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />
<link rel="canonical" href="${canonical}" />
<link rel="alternate" type="application/rss+xml" title="moonpeak blog" href="${root}blog/rss.xml" />
${ICON}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${root}style.css" />
<link rel="stylesheet" href="${root}pages.css" />
<link rel="stylesheet" href="${root}docs.css" />
<link rel="stylesheet" href="${root}blog.css" />
</head>
<body class="docs-page blog-page">
<div class="sky" aria-hidden="true"></div>
${NAV(root)}
${body}
${FOOTER(root)}
</body>
</html>
`;

// links written as (/docs/...) become relative to the post
const rel = (html, root) => html.replace(/href="\/(?!\/)([^"]*)"/g, (_, r) => `href="${root}${r}"`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of posts) {
  const root = "../../";
  const body = rel(marked.parse(p.md), root);
  const html = shell({
    title: `${p.title} | moonpeak blog`,
    description: p.description,
    canonical: `${SITE}/blog/${p.slug}/`,
    root,
    body: `<main class="post">
  <a class="back" href="../">← All posts</a>
  <p class="crumb">${fmt(p.date)} · ${minutes(p.md)} min read</p>
  <h1>${p.title}</h1>
  <p class="doc-lede">${p.description}</p>
  <p class="byline">${AUTHOR}</p>
  <article>${body}</article>
  <nav class="post-foot"><a class="btn ghost" href="../">More posts</a><a class="btn" href="${root}docs/">Read the docs →</a></nav>
</main>`,
  });
  fs.mkdirSync(path.join(OUT, p.slug), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.slug, "index.html"), html);
  fs.writeFileSync(path.join(OUT, p.slug, "index.md"), `# ${p.title}\n\n> ${p.description}\n\n${p.md}`);
}

fs.writeFileSync(path.join(OUT, "index.html"), shell({
  title: "moonpeak blog · MCP Apps, ChatGPT Apps and Claude connectors",
  description: "Tutorials, releases and notes about building and testing MCP Apps with moonpeak.",
  canonical: `${SITE}/blog/`,
  root: "../",
  body: `<main class="blog-index">
  <p class="kicker">Blog</p>
  <h1>moonpeak blog</h1>
  <p class="doc-lede">Tutorials, releases and notes about building and testing MCP Apps, ChatGPT Apps and Claude connectors.</p>
  <div class="post-list">
    ${posts.map((p) => `<a class="post-card glow-card" href="${p.slug}/"><span class="crumb">${fmt(p.date)} · ${minutes(p.md)} min read</span><h2>${p.title}</h2><p>${p.description}</p><span class="more">Read →</span></a>`).join("\n    ")}
  </div>
  <p class="rss"><a href="rss.xml">RSS feed</a></p>
</main>`,
}));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
fs.writeFileSync(path.join(OUT, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>moonpeak blog</title><link>${SITE}/blog/</link><description>Tutorials, releases and notes about MCP Apps.</description>
${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join("\n")}
</channel></rss>
`);
console.log(`blog: ${posts.length} posts + index + rss.xml`);
