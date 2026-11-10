// moonpeak docs: search, copy buttons, active "on this page" link. No dependencies.
const root = document.body.dataset.docsRoot || "./";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- copy code / copy page ---------- */
for (const b of $$(".copy-code")) {
  b.addEventListener("click", async () => {
    const code = b.parentElement.querySelector("code").innerText;
    try { await navigator.clipboard.writeText(code); b.textContent = "copied"; } catch { b.textContent = "failed"; }
    setTimeout(() => (b.textContent = "copy"), 1400);
  });
}
$(".copy-md")?.addEventListener("click", async (e) => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(await (await fetch("index.md")).text()); b.textContent = "Copied"; }
  catch { b.textContent = "Copy failed"; }
  setTimeout(() => (b.textContent = "Copy page as Markdown"), 1500);
});

/* ---------- search ---------- */
const modal = $(".search-modal");
const input = $(".search-box input");
const list = $(".search-results");
let index = null, hits = [], sel = 0;
async function load() {
  if (!index) index = await (await fetch(root + "search.json")).json();
  return index;
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function score(p, terms) {
  let s = 0;
  for (const t of terms) {
    const title = p.t.toLowerCase(), head = p.h.join(" ").toLowerCase(), body = (p.d + " " + p.x).toLowerCase();
    if (title.includes(t)) s += title.startsWith(t) ? 12 : 8;
    else if (head.includes(t)) s += 4;
    else if (body.includes(t)) s += 1;
    else return 0; // every term must match somewhere
  }
  return s;
}
function snippet(p, term) {
  const text = p.d + " " + p.x, i = text.toLowerCase().indexOf(term);
  if (i < 0) return esc(p.d || text.slice(0, 110));
  const a = Math.max(0, i - 50), part = text.slice(a, i + 80);
  return (a ? "…" : "") + esc(part).replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), (m) => `<mark>${m}</mark>`) + "…";
}
async function run() {
  const q = input.value.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const all = await load();
  hits = terms.length ? all.map((p) => [score(p, terms), p]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 12).map(([, p]) => p) : all.slice(0, 8);
  sel = 0;
  list.innerHTML = hits.length
    ? hits.map((p, i) => `<li><a href="${root}${p.s ? p.s + "/" : ""}" class="${i === 0 ? "sel" : ""}"><b>${esc(p.t)}</b><span>${terms.length ? snippet(p, terms[0]) : esc(p.d)}</span></a></li>`).join("")
    : `<li class="empty">No results for “${esc(q)}”</li>`;
}
function open() { modal.hidden = false; input.value = ""; run(); setTimeout(() => input.focus(), 0); }
function close() { modal.hidden = true; }
$(".search-open")?.addEventListener("click", open);
input?.addEventListener("input", run);
modal?.addEventListener("click", (e) => { if (e.target === modal) close(); });
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "");
  if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); open(); return; }
  if (modal.hidden) return;
  const links = $$("a", list);
  if (e.key === "Escape") close();
  else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    sel = (sel + (e.key === "ArrowDown" ? 1 : links.length - 1)) % Math.max(1, links.length);
    links.forEach((a, i) => a.classList.toggle("sel", i === sel));
    links[sel]?.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter" && links[sel]) { e.preventDefault(); location.href = links[sel].href; }
});

/* ---------- active "on this page" link ---------- */
const tocLinks = $$(".onpage a");
if (tocLinks.length && "IntersectionObserver" in window) {
  const byId = new Map(tocLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) {
      tocLinks.forEach((a) => a.classList.remove("on"));
      byId.get(en.target.id)?.classList.add("on");
    }
  }, { rootMargin: "-10% 0px -75% 0px" });
  for (const id of byId.keys()) { const h = document.getElementById(id); if (h) io.observe(h); }
}

/* ---------- mobile: open / close the sidebar ---------- */
$(".sb-toggle")?.addEventListener("click", (e) => {
  const sb = $(".sidebar");
  sb.classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", String(sb.classList.contains("open")));
});

/* ---------- keep the current page visible in the sidebar ---------- */
$(".sidebar a.on")?.scrollIntoView({ block: "center" });
window.scrollTo(0, 0);
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
