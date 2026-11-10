// moonpeak inspector: a local stand-in for ChatGPT and Claude.
// It talks to your MCP server over /mcp like a real host and embeds Views with
// the official MCP Apps bridge, so what works here works in production hosts.
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { AppBridge, PostMessageTransport, getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";

// ---------------------------------------------------------------- state

const params = new URLSearchParams(location.search);
const S = {
  project: null,
  tools: [],
  tool: params.get("tool") || "",
  sim: params.get("sim") || "",
  host: params.get("host") === "claude" ? "claude" : "chatgpt",
  theme: params.get("theme") === "dark" ? "dark" : "light",
  device: ["mobile", "tablet", "desktop"].includes(params.get("device")) ? params.get("device") : "desktop",
  mode: ["inline", "pip", "fullscreen"].includes(params.get("mode")) ? params.get("mode") : "inline",
  locale: params.get("locale") || navigator.language || "en-US",
  input: {},
  result: undefined,
  modelContext: null,
  messages: [],
  log: [],
  panel: params.get("panel") || "input",
  running: false,
};

const HOSTS = {
  chatgpt: { label: "ChatGPT", info: { name: "chatgpt (moonpeak inspector)", version: "1.0.0" } },
  claude: { label: "Claude", info: { name: "claude (moonpeak inspector)", version: "1.0.0" } },
};
const DEVICES = { mobile: 390, tablet: 768, desktop: null };

// ---------------------------------------------------------------- tiny dom helper

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}

function seg(name, value, options, onPick) {
  return h(
    "div",
    { class: "seg", role: "radiogroup", "data-testid": `seg-${name}` },
    options.map(([v, label]) =>
      h("button", { class: v === value ? "on" : "", role: "radio", "aria-checked": String(v === value), "data-value": v, onclick: () => onPick(v) }, label),
    ),
  );
}

function syncUrl() {
  const p = new URLSearchParams();
  if (S.tool) p.set("tool", S.tool);
  if (S.sim) p.set("sim", S.sim);
  p.set("host", S.host);
  p.set("theme", S.theme);
  if (S.device !== "desktop") p.set("device", S.device);
  if (S.mode !== "inline") p.set("mode", S.mode);
  history.replaceState(null, "", "?" + p.toString());
}

function log(dir, method, data) {
  S.log.unshift({ t: new Date().toLocaleTimeString(), dir, method, data });
  S.log.length = Math.min(S.log.length, 200);
  renderLog();
}

// ---------------------------------------------------------------- mcp client

let client;
async function connectClient() {
  client = new Client({ name: "moonpeak-inspector", version: "1.0.0" });
  // A moonpeak project server is stateless and never pushes, so its answer to the
  // optional GET stream is always 405. Answer that locally instead of sending it,
  // which keeps the browser console free of a red "Failed to load resource".
  // Remote servers keep the real GET: they may push notifications over it.
  const local = S.project && !S.project.remote;
  const fetchImpl = local
    ? (input, init) => ((init?.method || "GET").toUpperCase() === "GET" ? Promise.resolve(new Response(null, { status: 405, statusText: "Method Not Allowed" })) : fetch(input, init))
    : undefined;
  await client.connect(new StreamableHTTPClientTransport(new URL("/mcp", location.origin), fetchImpl ? { fetch: fetchImpl } : undefined));
}

async function loadTools() {
  const { tools } = await client.listTools();
  // UI tools first, then the rest
  S.tools = tools.sort((a, b) => Number(!!getToolUiResourceUri(b)) - Number(!!getToolUiResourceUri(a)) || a.name.localeCompare(b.name));
}

const currentTool = () => S.tools.find((t) => t.name === S.tool);
const simsFor = (tool) => (S.project?.simulations || []).filter((s) => s.tool === tool);
const currentSim = () => (S.project?.simulations || []).find((s) => s.id === S.sim);

function pickTool(name, { keepSim = false } = {}) {
  S.tool = name;
  const sims = simsFor(name);
  if (!keepSim || !sims.find((s) => s.id === S.sim)) S.sim = sims[0]?.id || "";
  applySim();
}

function applySim() {
  const sim = currentSim();
  S.input = sim ? structuredClone(sim.input || {}) : exampleInput(currentTool());
  S.result = sim?.result ? structuredClone(sim.result) : sim?.output !== undefined ? { structuredContent: structuredClone(sim.output), content: [{ type: "text", text: JSON.stringify(sim.output) }] } : undefined;
  if (sim?.host) {
    if (sim.host.name === "claude" || sim.host.name === "chatgpt") S.host = sim.host.name;
    if (sim.host.theme) S.theme = sim.host.theme;
    if (sim.host.displayMode) S.mode = sim.host.displayMode;
    if (sim.host.locale) S.locale = sim.host.locale;
    if (sim.host.device) S.device = sim.host.device;
  }
  S.messages = [];
  S.modelContext = null;
}

/** Required fields (and fields with defaults) only, with values that match their format. */
function exampleInput(tool) {
  return exampleArgs(tool?.inputSchema);
}

function exampleArgs(schema = {}) {
  const required = new Set(schema.required || []);
  const out = {};
  for (const [k, p] of Object.entries(schema.properties || {})) {
    if (!required.has(k) && p.default === undefined) continue;
    out[k] = exampleValue(p, k);
  }
  return out;
}

function exampleValue(p = {}, key = "") {
  if (p.default !== undefined) return p.default;
  if (p.examples?.length) return p.examples[0];
  if (p.const !== undefined) return p.const;
  if (p.enum?.length) return p.enum[0];
  const type = Array.isArray(p.type) ? p.type.find((t) => t !== "null") : p.type;
  const hint = `${key} ${p.format || ""} ${p.description || ""} ${p.pattern || ""}`.toLowerCase();
  if (type === "integer" || type === "number") return p.minimum ?? (p.exclusiveMinimum !== undefined ? p.exclusiveMinimum + 1 : 1);
  if (type === "boolean") return true;
  if (type === "array") return p.minItems ? Array.from({ length: p.minItems }, () => exampleValue(p.items)) : [];
  if (type === "object") return exampleArgs(p);
  if (/date-time|timestamp/.test(hint)) return new Date().toISOString();
  if (/yyyy-mm-dd|\bdate\b/.test(hint)) return new Date().toISOString().slice(0, 10);
  if (/email/.test(hint)) return "pilot@example.com";
  if (/\buri\b|\burl\b|link/.test(hint)) return "https://example.com";
  return "example";
}

async function runLive() {
  if (!S.tool) return;
  S.running = true;
  render();
  log("→", "tools/call", { name: S.tool, arguments: S.input });
  try {
    S.result = await client.callTool({ name: S.tool, arguments: S.input });
    log("←", "tools/call result", S.result);
  } catch (e) {
    S.result = { isError: true, content: [{ type: "text", text: e.message }] };
    log("!", "tools/call failed", e.message);
  }
  S.running = false;
  S.messages = [];
  render();
}

// ---------------------------------------------------------------- view embedding

let bridge = null;
let frame = null;

function hostContext() {
  const tool = currentTool();
  const width = DEVICES[S.device];
  return {
    theme: S.theme,
    displayMode: S.mode,
    availableDisplayModes: ["inline", "pip", "fullscreen"],
    locale: S.locale,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: S.device === "desktop" ? "web" : "mobile",
    deviceCapabilities: { touch: S.device !== "desktop", hover: S.device === "desktop" },
    containerDimensions: S.mode === "fullscreen" ? { height: window.innerHeight - 56, width: width ?? 900 } : { maxHeight: S.mode === "pip" ? 420 : 2000, width: Math.min(width ?? 720, 720) - 2 },
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    userAgent: navigator.userAgent,
    toolInfo: tool ? { tool } : undefined,
    styles: { variables: hostVars() },
  };
}

function hostVars() {
  const dark = S.theme === "dark";
  if (S.host === "claude") {
    return {
      "--color-background-primary": dark ? "#262624" : "#ffffff",
      "--color-background-secondary": dark ? "#30302e" : "#f5f4ed",
      "--color-text-primary": dark ? "#f5f4ee" : "#1f1e1d",
      "--color-text-secondary": dark ? "#b8b5a9" : "#6b6a65",
      "--color-border-primary": dark ? "#3e3e38" : "#e6e3d8",
      "--font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      "--border-radius-md": "10px",
    };
  }
  return {
    "--color-background-primary": dark ? "#212121" : "#ffffff",
    "--color-background-secondary": dark ? "#2f2f2f" : "#f4f4f4",
    "--color-text-primary": dark ? "#ececec" : "#0d0d0d",
    "--color-text-secondary": dark ? "#a4a4a4" : "#5d5d5d",
    "--color-border-primary": dark ? "#3a3a3a" : "#e5e5e5",
    "--font-sans": 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
    "--border-radius-md": "12px",
  };
}

/** ChatGPT also exposes window.openai; the dev View page picks this up (same origin only). */
window.__moonpeakOpenAI = (win) => {
  if (S.host !== "chatgpt") return undefined;
  let widgetState = null;
  const api = {
    get theme() { return S.theme; },
    get displayMode() { return S.mode; },
    get locale() { return S.locale; },
    get toolInput() { return S.input; },
    get toolOutput() { return S.result?.structuredContent ?? null; },
    get toolResponseMetadata() { return S.result?._meta ?? null; },
    get widgetState() { return widgetState; },
    get maxHeight() { return S.mode === "pip" ? 420 : 2000; },
    setWidgetState: async (v) => {
      widgetState = v;
      log("←", "openai.setWidgetState", v);
      win.dispatchEvent(new CustomEvent("openai:set_globals", { detail: { globals: { widgetState: v } } }));
    },
    callTool: (name, args) => client.callTool({ name, arguments: args }),
    sendFollowUpMessage: async ({ prompt }) => addUserMessage(prompt),
    openExternal: ({ href }) => window.open(href, "_blank", "noopener"),
    requestDisplayMode: async ({ mode }) => (setMode(mode), { mode }),
    uploadFile: async (file) => (log("←", "openai.uploadFile", file?.name), { fileId: "file_" + Math.random().toString(36).slice(2, 10) }),
  };
  return api;
};

function addUserMessage(text) {
  S.messages.push({ role: "user", text });
  log("←", "ui/message", text);
  renderChatExtras();
}

function setMode(mode) {
  if (S.mode === mode) return;
  S.mode = mode;
  syncUrl();
  renderSide();
  applyMode();
  safeContext({ displayMode: mode, containerDimensions: hostContext().containerDimensions });
}

async function mountView(slot) {
  const tool = currentTool();
  const uri = tool && getToolUiResourceUri(tool);
  teardown();
  if (!uri) return;

  frame = h("iframe", {
    id: "moonpeak-view",
    "data-testid": "view",
    title: "MCP App view",
    class: "view-frame",
    sandbox: S.project?.remote ? "allow-scripts allow-forms allow-popups" : "allow-scripts allow-same-origin allow-forms allow-popups",
    allow: "clipboard-write",
  });
  slot.replaceChildren(frame);

  bridge = new AppBridge(client, HOSTS[S.host].info, {
    openLinks: {},
    downloadFile: {},
    serverTools: {},
    serverResources: {},
    logging: {},
    updateModelContext: { text: {} },
    message: { text: {} },
  }, { hostContext: hostContext() }); // passed up front: setHostContext() before connect() would try to notify a View that isn't there yet

  const input = S.input;
  const result = S.result;
  const b = bridge;
  const fr = frame;
  b.oninitialized = async () => {
    if (b !== bridge) return; // a newer View replaced this one
    log("←", "ui/initialized", b.getAppVersion());
    try {
      await b.sendToolInput({ arguments: input });
      log("→", "ui/notifications/tool-input", input);
      if (result) {
        await b.sendToolResult(result);
        log("→", "ui/notifications/tool-result", result);
      }
    } catch (e) {
      log("!", "send to View failed", e.message);
    }
    fr.setAttribute("data-ready", "true");
  };
  bridge.onsizechange = ({ height }) => {
    if (frame && height && S.mode === "inline") frame.style.height = Math.min(Math.ceil(height), 2000) + "px";
  };
  bridge.onmessage = async (p) => {
    const text = (p.content || []).map((c) => c.text || "").join(" ");
    addUserMessage(text);
    return {};
  };
  bridge.onopenlink = async ({ url }) => {
    log("←", "ui/open-link", url);
    window.open(url, "_blank", "noopener");
    return {};
  };
  bridge.onrequestdisplaymode = async ({ mode }) => {
    log("←", "ui/request-display-mode", mode);
    setMode(mode);
    return { mode };
  };
  bridge.onupdatemodelcontext = async (p) => {
    S.modelContext = p.structuredContent ?? (p.content || []).map((c) => c.text).join(" ");
    log("←", "ui/update-model-context", p);
    renderChatExtras();
    return {};
  };
  bridge.onloggingmessage = (p) => log("←", `log.${p.level}`, p.data);
  bridge.ondownloadfile = async (p) => {
    log("←", "ui/download-file", p);
    for (const item of p.contents || []) {
      const r = item.resource || item;
      const blob = r.blob ? new Blob([Uint8Array.from(atob(r.blob), (ch) => ch.charCodeAt(0))], { type: r.mimeType }) : new Blob([r.text ?? ""], { type: r.mimeType || "text/plain" });
      const a = h("a", { href: URL.createObjectURL(blob), download: (r.uri || "download").split("/").pop() });
      a.click();
    }
    return {};
  };
  bridge.onrequestteardown = () => log("←", "ui/request-teardown");

  await b.connect(new PostMessageTransport(fr.contentWindow, fr.contentWindow));
  if (b !== bridge) {
    // replaced while connecting
    try { b.close?.(); } catch {}
    return;
  }

  if (S.project?.remote) {
    try {
      const res = await client.readResource({ uri });
      const html = res.contents?.[0]?.text ?? "";
      log("→", "resources/read", uri);
      if (b === bridge) fr.srcdoc = html;
    } catch (e) {
      slot.replaceChildren(h("div", { class: "card error" }, `could not read ${uri}: ${e.message}`));
    }
  } else {
    const name = uri.split("/").pop().replace(/\.html$/, "");
    fr.src = `/__moonpeak/view/${encodeURIComponent(name)}`;
  }
}

/** Push a host context change to the live View; a View that is gone is not an error. */
function safeContext(patch) {
  if (!bridge) return;
  try {
    const p = bridge.sendHostContextChange(patch);
    if (p?.catch) p.catch(() => {});
  } catch {}
}

/** After picking a tool or simulation: show it, and call the real handler unless the data is mocked. */
function afterPick() {
  syncUrl();
  render();
  if (!S.result && currentTool()) runLive();
}

function teardown() {
  if (bridge) {
    try {
      bridge.close?.();
    } catch {}
  }
  bridge = null;
  frame = null;
}

// ---------------------------------------------------------------- render

const app = document.getElementById("app");

/** Full rebuild: remounts the View (host, device, tool or data changed). */
function render() {
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.dataset.host = S.host;
  app.replaceChildren(h("div", { class: "shell" }, h("div", { id: "side-wrap" }, sidebar()), stage()));
  renderLog();
  applyMode();
  const slot = document.querySelector(".view-slot");
  if (slot) mountView(slot);
}

/** Sidebar only: the iframe stays mounted (theme, display mode, panel switches). */
function renderSide() {
  document.documentElement.dataset.theme = S.theme;
  const wrap = document.getElementById("side-wrap");
  if (wrap) wrap.replaceChildren(sidebar());
  const tag = document.querySelector(".host-tag");
  if (tag) tag.textContent = hostTag();
  renderLog();
}

const hostTag = () => `${HOSTS[S.host].label}-style host · ${S.theme} · ${S.device}`;

/** Display modes move the card with CSS only. Moving an iframe in the DOM would reload it. */
function applyMode() {
  const card = document.querySelector(".view-card");
  const ghost = document.querySelector(".ghost-card");
  const frameEl = document.getElementById("moonpeak-view");
  if (card) {
    card.classList.remove("mode-inline", "mode-pip", "mode-fullscreen");
    card.classList.add("mode-" + S.mode);
  }
  if (ghost) {
    ghost.hidden = S.mode === "inline";
    ghost.textContent = `${currentTool()?.title || S.tool} is open in ${S.mode === "pip" ? "picture-in-picture" : "fullscreen"}`;
  }
  if (frameEl && S.mode !== "inline") frameEl.style.height = "";
}

function sidebar() {
  const tool = currentTool();
  const sims = simsFor(S.tool);
  return h(
    "aside",
    { class: "side" },
    h("div", { class: "brand" }, moonIcon(), h("div", {}, h("b", {}, "moonpeak"), h("span", {}, S.project?.remote ? "inspecting " + S.project.server : S.project?.name || ""))),

    h("label", { class: "lbl" }, "Tool"),
    h(
      "select",
      { "data-testid": "tool", onchange: (e) => (pickTool(e.target.value), afterPick()) },
      S.tools.length ? null : h("option", {}, "no tools found"),
      S.tools.map((t) => h("option", { value: t.name, selected: t.name === S.tool }, (getToolUiResourceUri(t) ? "◐ " : "  ") + t.name)),
    ),
    tool?.description ? h("p", { class: "desc" }, tool.description) : null,

    h("label", { class: "lbl" }, "Simulation"),
    h(
      "select",
      { "data-testid": "simulation", onchange: (e) => ((S.sim = e.target.value), applySim(), afterPick()) },
      h("option", { value: "", selected: !S.sim }, "none (edit input, then run)"),
      sims.map((s) => h("option", { value: s.id, selected: s.id === S.sim }, s.name + (s.output !== undefined || s.result ? "  · mocked" : ""))),
    ),

    h("label", { class: "lbl" }, "Host"),
    seg("host", S.host, [["chatgpt", "ChatGPT"], ["claude", "Claude"]], (v) => ((S.host = v), syncUrl(), render())),
    h("label", { class: "lbl" }, "Theme"),
    seg("theme", S.theme, [["light", "Light"], ["dark", "Dark"]], (v) => {
      S.theme = v;
      syncUrl();
      renderSide();
      safeContext({ theme: v, styles: { variables: hostVars() } });
    }),
    h("label", { class: "lbl" }, "Device"),
    seg("device", S.device, [["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]], (v) => ((S.device = v), syncUrl(), render())),
    h("label", { class: "lbl" }, "Display mode"),
    seg("mode", S.mode, [["inline", "Inline"], ["pip", "PiP"], ["fullscreen", "Full"]], setMode),

    h(
      "div",
      { class: "tabs" },
      seg("panel", S.panel, [["input", "Input"], ["output", "Output"], ["log", "Log"]], (v) => ((S.panel = v), renderSide())),
    ),
    S.panel === "log" ? h("div", { class: "log", id: "log" }) : editor(),
    h(
      "div",
      { class: "actions" },
      h("button", { class: "primary", "data-testid": "run", onclick: runLive, disabled: !S.tool || S.running }, S.running ? "Running…" : "Run tool"),
      h("button", { "data-testid": "reload", onclick: () => render(), title: "Re-send input and result to the View" }, "Reload view"),
    ),
  );
}

function editor() {
  const isInput = S.panel === "input";
  const value = JSON.stringify(isInput ? S.input : S.result ?? null, null, 2);
  const ta = h("textarea", { class: "json", spellcheck: "false", "data-testid": `editor-${S.panel}` }, value);
  const status = h("div", { class: "hint" }, isInput ? "Edit, then Run tool to call your handler." : "Edit the result to test your View against any data.");
  ta.addEventListener("input", () => {
    try {
      const v = JSON.parse(ta.value || "null");
      ta.classList.remove("bad");
      if (isInput) S.input = v ?? {};
      else S.result = v ?? undefined;
      status.textContent = isInput ? "Valid. Run tool to use it." : "Valid. Click Apply to re-render the View.";
    } catch (e) {
      ta.classList.add("bad");
      status.textContent = e.message;
    }
  });
  return h(
    "div",
    { class: "editor" },
    ta,
    status,
    isInput ? null : h("button", { "data-testid": "apply-output", onclick: () => ((S.messages = []), render()) }, "Apply"),
  );
}

function stage() {
  const tool = currentTool();
  const sim = currentSim();
  const width = DEVICES[S.device];
  const hasView = tool && getToolUiResourceUri(tool);
  const prompt = sim?.prompt || (tool ? `Use ${tool.title || tool.name}` : "");

  const slot = h("div", { class: "view-slot" });

  const viewCard = hasView
    ? h(
        "div",
        { class: "view-card mode-inline", "data-testid": "view-card" },
        h("div", { class: "view-bar" }, h("span", {}, tool.title || tool.name), h("button", { "aria-label": "Exit display mode", onclick: () => setMode("inline") }, "✕")),
        slot,
      )
    : tool
      ? h("pre", { class: "card result", "data-testid": "text-result" }, S.result ? JSON.stringify(S.result, null, 2) : "Run the tool to see its result.")
      : null;

  const chat = h(
    "div",
    { class: "chat", style: width ? `max-width:${width}px` : "" },
    prompt ? h("div", { class: "msg user" }, h("div", { class: "bubble" }, prompt)) : null,
    tool
      ? h(
          "div",
          { class: "msg assistant" },
          h("div", { class: "tool-chip" }, h("span", { class: "dot" }), S.running ? `Calling ${tool.name}…` : `Used ${tool.name}`),
          hasView ? h("div", { class: "card ghost ghost-card", hidden: true }) : null,
          viewCard,
        )
      : h("div", { class: "empty" }, "Add a tool in src/tools to get started."),
    h("div", { id: "chat-extras" }),
    composer(),
  );

  return h(
    "main",
    { class: `stage host-${S.host}`, "data-testid": "stage" },
    h("div", { class: "host-tag" }, hostTag()),
    h("div", { class: "frame-wrap", style: width ? `width:${width}px` : "" }, chat),
  );
}

function composer() {
  return h("div", { class: "composer" }, h("span", {}, S.host === "claude" ? "Reply to Claude…" : "Ask anything"), h("i", {}));
}

function renderChatExtras() {
  const box = document.getElementById("chat-extras");
  if (!box) return;
  box.replaceChildren(
    ...(S.modelContext ? [h("div", { class: "ctx", "data-testid": "model-context" }, h("b", {}, "model context "), typeof S.modelContext === "string" ? S.modelContext : JSON.stringify(S.modelContext))] : []),
    ...S.messages.map((m) => h("div", { class: "msg user", "data-testid": "sent-message" }, h("div", { class: "bubble" }, m.text))),
  );
}

function renderLog() {
  const box = document.getElementById("log");
  if (!box) return;
  box.replaceChildren(
    ...(S.log.length ? [] : [h("div", { class: "hint" }, "Bridge traffic shows up here.")]),
    ...S.log.map((l) => h("details", {}, h("summary", {}, h("span", { class: "t" }, l.t), ` ${l.dir} ${l.method}`), h("pre", {}, JSON.stringify(l.data, null, 2) ?? ""))),
  );
}

function moonIcon() {
  const el = h("span", { class: "moon" });
  el.innerHTML = `<svg viewBox="0 0 32 32" width="26" height="26"><path d="M20 3a13 13 0 1 0 9 21A11 11 0 0 1 20 3z" fill="currentColor"/></svg>`;
  return el;
}

// ---------------------------------------------------------------- boot

async function boot() {
  app.replaceChildren(h("div", { class: "boot" }, moonIcon(), "connecting to /mcp…"));
  try {
    S.project = await (await fetch("/__moonpeak/api/project")).json();
    await connectClient();
    await loadTools();
  } catch (e) {
    app.replaceChildren(h("div", { class: "boot error" }, "Could not connect to your MCP server: " + e.message));
    return;
  }
  const initialSim = S.sim;
  if (!S.tools.find((t) => t.name === S.tool)) S.tool = S.tools[0]?.name || "";
  pickTool(S.tool, { keepSim: true });
  if (initialSim && currentSim()) {
    S.sim = initialSim;
    applySim();
  }
  syncUrl();
  render();
  if (!S.result && S.tool) runLive();
}

boot();
