// moonpeak landing effects. Vanilla, no dependencies. Everything degrades to a
// static page when prefers-reduced-motion is set or JS is off.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
document.documentElement.classList.add("js");

/* ---------- starfield: twinkle, depth parallax, shooting stars ---------- */
(() => {
  const cv = $("canvas.stars");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const pointer = { x: 0, y: 0, on: false, fade: 0 };
  let w, h, dpr, stars = [], meteors = [], mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0, last = 0, nextMeteor = 2500;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr;
    h = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
    const n = Math.round(Math.min(260, (innerWidth * innerHeight) / 5200));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      z: Math.random() ** 2 * 0.9 + 0.1,               // depth: 0.1 far, 1 near
      r: (Math.random() * 1.1 + 0.35) * dpr,
      p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.8,
      hue: Math.random() < 0.15 ? 220 : Math.random() < 0.1 ? 40 : 0,
    }));
  }
  function meteor() {
    const fromLeft = Math.random() < 0.5;
    meteors.push({ x: (fromLeft ? 0.1 : 0.55) * w + Math.random() * w * 0.35, y: Math.random() * h * 0.35,
      vx: (fromLeft ? 1 : -1) * (0.9 + Math.random() * 0.6) * dpr, vy: (0.35 + Math.random() * 0.25) * dpr, life: 0, max: 900 + Math.random() * 500 });
  }
  function frame(t) {
    const dt = Math.min(48, t - last || 16); last = t;
    tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const near = [];
    for (const s of stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.s + s.p));
      const px = (((s.x + tx * 18 * s.z * dpr) % w) + w) % w;
      const py = ((s.y - scrollY * 0.12 * s.z * dpr + ty * 12 * s.z * dpr) % h + h) % h;
      if (pointer.on && s.z > 0.3) {
        const dx = px - pointer.x * dpr, dy = py - pointer.y * dpr, dd = dx * dx + dy * dy, R = 170 * dpr;
        if (dd < R * R) near.push({ x: px, y: py, k: 1 - Math.sqrt(dd) / R });
      }
      ctx.globalAlpha = a * (0.4 + s.z * 0.6);
      ctx.fillStyle = s.hue === 220 ? "#c7d2ff" : s.hue === 40 ? "#ffe7c2" : "#ffffff";
      ctx.beginPath(); ctx.arc(px < 0 ? px + w : px, py, s.r * (0.6 + s.z * 0.6), 0, 7); ctx.fill();
      if (s.z > 0.85 && a > 0.92) { // occasional sparkle cross on the nearest stars
        ctx.globalAlpha = (a - 0.92) * 6;
        ctx.fillRect(px - 4 * dpr, py - 0.25 * dpr, 8 * dpr, 0.5 * dpr);
        ctx.fillRect(px - 0.25 * dpr, py - 4 * dpr, 0.5 * dpr, 8 * dpr);
      }
    }
    // constellation: stars near the cursor link up with faint moonlit lines
    if (near.length > 1) {
      ctx.lineWidth = 0.7 * dpr;
      ctx.strokeStyle = "#c9d2ff";
      const L = 115 * dpr;
      for (let i = 0; i < near.length; i++) {
        let links = 0;
        for (let j = i + 1; j < near.length && links < 3; j++) {
          const A = near[i], B = near[j], dx = A.x - B.x, dy = A.y - B.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d > L) continue;
          links++;
          ctx.globalAlpha = Math.min(A.k, B.k) * (1 - d / L) * 0.9 * pointer.fade;
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
        if (links) { // linked stars light up a little
          ctx.globalAlpha = near[i].k * 0.8 * pointer.fade;
          ctx.fillStyle = "#e9edff";
          ctx.beginPath(); ctx.arc(near[i].x, near[i].y, 1.6 * dpr, 0, 7); ctx.fill();
        }
      }
    }
    pointer.fade += ((pointer.on ? 1 : 0) - pointer.fade) * 0.08;
    nextMeteor -= dt;
    if (nextMeteor < 0) { meteor(); nextMeteor = 4000 + Math.random() * 7000; }
    meteors = meteors.filter((m) => (m.life += dt) < m.max);
    for (const m of meteors) {
      m.x += m.vx * dt * 0.6; m.y += m.vy * dt * 0.6;
      const k = Math.sin((m.life / m.max) * Math.PI);
      const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 110, m.y - m.vy * 110);
      g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(1, "rgba(169,184,255,0)");
      ctx.globalAlpha = k; ctx.strokeStyle = g; ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 110, m.y - m.vy * 110); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  let raf;
  resize();
  addEventListener("resize", resize);
  addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });
  if (fine) {
    addEventListener("pointermove", (e) => {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      pointer.x = e.clientX; pointer.y = e.clientY;
      // only over open sky, not while reading cards or code
      pointer.on = !e.target.closest?.("a, button, pre, .term, .glow-card, figure, details, table, .statrow, p, h1, h2, h3, li");
    }, { passive: true });
    document.addEventListener("pointerleave", () => (pointer.on = false));
  }
  document.addEventListener("visibilitychange", () => {
    if (reduce) return;
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
})();

/* ---------- tonight's real moon phase, waxing further as you scroll ---------- */
const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 864e5; // reference new moon, days since epoch
function phaseOf(date) { return ((((date / 864e5 - NEW_MOON) / SYNODIC) % 1) + 1) % 1; }
function phaseName(p) {
  const n = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
  return n[Math.round(p * 8) % 8];
}
/** SVG path for the dark part of a unit moon (radius 50, centred on 50,50). */
function shadowPath(p) {
  const r = 50, k = Math.cos(2 * Math.PI * p), rx = Math.abs(k) * r;
  // waxing: dark limb on the left; waning: mirrored
  const d = `M50 0 A${r} ${r} 0 0 0 50 100 A${rx} ${r} 0 0 ${k > 0 ? 0 : 1} 50 0Z`;
  return { d, flip: p > 0.5 };
}
(() => {
  const svg = $(".moon .phase");
  if (!svg) return;
  const path = svg.querySelector("path");
  const label = $(".moon-label");
  const today = phaseOf(Date.now());
  const illum = (p) => Math.round(((1 - Math.cos(2 * Math.PI * p)) / 2) * 100);
  function draw(p) {
    const { d, flip } = shadowPath(p);
    path.setAttribute("d", d);
    path.setAttribute("transform", flip ? "translate(100 0) scale(-1 1)" : "");
  }
  if (label) label.innerHTML = `<b>Tonight</b> ${phaseName(today)} · ${illum(today)}% lit`;
  if (reduce) { draw(0.5); return; }
  // On load the moon waxes from tonight's real phase to full; scrolling out of the
  // hero then wanes it toward last quarter.
  const start = today > 0.5 ? today - 1 : today;      // always wax forward to 0.5
  const startAt = Math.min(start, 0.47);
  const hero = $(".hero");
  let intro = 0, scrollF = 0;
  const ease = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  const render = () => {
    const p = startAt + (0.5 - startAt) * ease(intro) + 0.22 * scrollF;
    draw(((p % 1) + 1) % 1);
  };
  render();
  const begin = () => {
    const t0 = performance.now() + 350, dur = 3400;
    (function grow(t) {
      intro = Math.min(1, Math.max(0, (t - t0) / dur));
      render();
      if (intro < 1) requestAnimationFrame(grow);
    })(t0);
  };
  if (document.readyState === "complete") begin(); else addEventListener("load", begin, { once: true });
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const f = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.9)));
      scrollF = f * f * (3 - 2 * f);
      render();
      if (label) label.classList.toggle("dim", f > 0.05);
    });
  }, { passive: true });
})();

/* ---------- hero: word reveal, parallax ridges, moon drift, cursor glow ---------- */
(() => {
  const h1 = $(".hero h1");
  if (h1 && !reduce) {
    let i = 0;
    const wrap = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of n.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(part); continue; }
            const s = document.createElement("span");
            s.className = "w"; s.textContent = part; s.style.setProperty("--i", i++);
            frag.append(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") wrap(n);
      }
    };
    wrap(h1);
    h1.classList.add("split-words");
  }
  const hero = $(".hero");
  const moon = $(".moon");
  const ridges = $$(".ridges path");
  const glow = $(".cursor-glow");
  if (reduce || !hero) return;
  let mx = 0, my = 0, cx = 0, cy = 0, sy = 0;
  if (fine) hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (glow) glow.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
  });
  // Runs only while something is still easing, then sleeps until the next input.
  let running = false;
  const wake = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  addEventListener("scroll", () => { sy = scrollY; wake(); }, { passive: true });
  if (fine) hero.addEventListener("pointermove", wake);
  function loop() {
    cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
    if (sy < innerHeight * 1.4) {
      if (moon) moon.style.transform = `translate3d(${cx * -22}px, ${cy * -16 + sy * 0.35}px, 0)`;
      ridges.forEach((p, i) => {
        const d = (i + 1) / ridges.length;
        p.style.transform = `translate3d(${cx * -30 * d}px, ${sy * (0.18 - d * 0.14)}px, 0)`;
      });
    }
    if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.0005) requestAnimationFrame(loop);
    else running = false;
  }
  wake();
})();

/* ---------- nav: progress line, compact on scroll, active section ---------- */
(() => {
  const nav = $(".nav"), bar = $(".progress");
  const links = $$('.nav nav a[href^="#"]');
  const secs = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  let tick = false;
  function update() {
    tick = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const f = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (bar) bar.style.transform = `scaleX(${f})`;
    nav?.classList.toggle("scrolled", scrollY > 20);
    let cur = null;
    for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id;
    for (const a of links) a.classList.toggle("on", a.getAttribute("href") === "#" + cur);
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- reveal on scroll (+ staggered children) ---------- */
(() => {
  const els = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  els.forEach((e) => {
    [...e.querySelectorAll("[data-stagger] > *")].forEach((c, i) => c.style.setProperty("--d", i * 90 + "ms"));
    io.observe(e);
  });
  // Safety net: a fast jump (anchor link, End key) can skip past a section without
  // it ever intersecting. Anything at or above the fold is revealed regardless.
  let pending = false;
  const sweep = () => {
    pending = false;
    for (const e of els) if (!e.classList.contains("in") && e.getBoundingClientRect().top < innerHeight * 0.92) { e.classList.add("in"); io.unobserve(e); }
  };
  addEventListener("scroll", () => { if (!pending) { pending = true; setTimeout(sweep, 120); } }, { passive: true });
  addEventListener("load", sweep);
})();

/* ---------- cards: spotlight border + gentle tilt ---------- */
(() => {
  for (const card of $$(".glow-card")) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (!reduce && fine) card.style.transform = `perspective(900px) rotateX(${(0.5 - y / r.height) * 6}deg) rotateY(${(x / r.width - 0.5) * 6}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  }
})();

/* ---------- magnetic buttons ---------- */
(() => {
  if (reduce || !fine) return;
  for (const b of $$(".magnetic")) {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    b.addEventListener("pointerleave", () => (b.style.transform = ""));
  }
})();

/* ---------- copy command + toast ---------- */
(() => {
  const toast = $(".toast");
  let t;
  for (const b of $$("[data-copy]")) {
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); } catch {}
      const s = b.querySelector(".copy");
      if (s) { s.textContent = "copied"; setTimeout(() => (s.textContent = "copy"), 1400); }
      b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
      if (toast) { toast.classList.add("show"); clearTimeout(t); t = setTimeout(() => toast.classList.remove("show"), 1800); }
    });
  }
})();

/* ---------- count-up stats ---------- */
(() => {
  const nums = $$("[data-count]");
  const run = (el) => {
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1400;
    (function step(t) {
      const f = Math.min(1, (t - t0) / dur), e = 1 - (1 - f) ** 4;
      el.textContent = (to * e).toFixed(dec);
      if (f < 1) requestAnimationFrame(step);
    })(t0);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();

/* ---------- terminal types itself when it scrolls into view ---------- */
(() => {
  const term = $(".term[data-typing]");
  if (!term) return;
  const pre = term.querySelector("pre");
  const lines = pre.innerHTML.split("\n");
  const replay = term.querySelector(".replay");
  let busy = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function play() {
    if (busy) return; busy = true;
    pre.innerHTML = ""; pre.classList.add("typing");
    for (const line of lines) {
      const cmd = line.match(/^(<span class="d">\$<\/span> )(.*)$/);
      if (cmd) {
        pre.insertAdjacentHTML("beforeend", cmd[1]);
        for (const ch of cmd[2]) { pre.insertAdjacentText("beforeend", ch); await sleep(38 + Math.random() * 40); }
        await sleep(420);
        pre.insertAdjacentHTML("beforeend", "\n");
      } else {
        pre.insertAdjacentHTML("beforeend", line + "\n");
        await sleep(line.includes("✓") ? 150 : line.trim() ? 90 : 40);
      }
    }
    pre.classList.remove("typing"); busy = false;
  }
  if (reduce) return;
  pre.style.minHeight = pre.offsetHeight + "px";
  pre.innerHTML = '<span class="d">$</span> ';
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.5 });
  io.observe(term);
  replay?.addEventListener("click", play);
})();

/* ---------- inspector shots flatten as they reach the centre ---------- */
(() => {
  const figs = $$(".shots figure");
  if (reduce || !figs.length) return;
  let tick = false;
  function update() {
    tick = false;
    if (innerWidth <= 900) { figs.forEach((f) => (f.style.transform = "")); return; }
    for (const f of figs) {
      const r = f.getBoundingClientRect();
      const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
      const k = Math.max(-1, Math.min(1, c * 1.6));
      const dir = f.classList.contains("tilt-l") ? 1 : -1;
      f.style.transform = `perspective(1400px) rotateY(${dir * 14 * Math.abs(k)}deg) rotateX(${k * 8}deg) translateY(${k * 30}px) scale(${1 - Math.abs(k) * 0.05})`;
    }
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* ---------- FAQ: animated open/close ---------- */
(() => {
  for (const d of $$(".faq details")) {
    const sum = d.querySelector("summary"), body = d.querySelector("p");
    sum.addEventListener("click", (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 220, easing: "ease-in" }).onfinish = () => (d.open = false);
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 280, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    });
  }
})();

/* ---------- phase glyphs cycle on the feature cards ---------- */
(() => {
  if (reduce) return;
  const glyphs = ["◐", "◓", "◑", "◒"];
  for (const ic of $$(".grid4 .ic")) {
    let i = glyphs.indexOf(ic.textContent), timer;
    const card = ic.closest(".glow-card");
    card?.addEventListener("pointerenter", () => { timer = setInterval(() => (ic.textContent = glyphs[(i = (i + 1) % 4)]), 160); });
    card?.addEventListener("pointerleave", () => clearInterval(timer));
  }
})();

/* ---------- screenshot tabs (inspector page) ---------- */
(() => {
  const tabs = $$(".tabs [role=tab]");
  if (!tabs.length) return;
  const panels = $$(".tab-stage figure");
  const show = (i) => {
    tabs.forEach((t, j) => t.setAttribute("aria-selected", String(i === j)));
    panels.forEach((p, j) => p.classList.toggle("on", i === j));
  };
  tabs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  // arrow keys move between tabs
  tabs.forEach((t, i) => t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    show(n); tabs[n].focus();
  }));
})();

/* ---------- rotating "what it is" line in the hero ---------- */
(() => {
  const el = $(".rotator b");
  if (!el) return;
  const words = el.dataset.words.split("|");
  let i = 0;
  if (reduce) return;
  setInterval(() => {
    el.classList.add("out");
    setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove("out"); }, 320);
  }, 2400);
})();
