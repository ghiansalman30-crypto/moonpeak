// One connection per View. Holds everything the host has told us and lets
// React subscribe to it without each hook opening its own channel.
import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

const listeners = new Set();
let state = {
  status: "connecting", // connecting | ready | error
  error: null,
  host: null, // { name, version }
  capabilities: null,
  context: {},
  input: undefined,
  partialInput: undefined,
  result: undefined,
  cancelled: false,
  appState: undefined,
};

function set(patch) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function snapshot() {
  return state;
}

let app = null;
let started = null;

export function getApp() {
  return app;
}

export function start(info = {}) {
  if (started) return started;
  app = new App(
    { name: info.name || "moonpeak-app", version: info.version || "0.0.0" },
    {},
    { autoResize: info.autoResize !== false },
  );

  app.ontoolinput = (p) => set({ input: p.arguments ?? {}, partialInput: undefined, cancelled: false });
  app.ontoolinputpartial = (p) => set({ partialInput: p.arguments ?? {} });
  app.ontoolresult = (r) => set({ result: r, cancelled: false });
  app.ontoolcancelled = () => set({ cancelled: true });
  app.onhostcontextchanged = (ctx) => set({ context: { ...state.context, ...ctx } });
  app.onteardown = async () => ({});

  const target = typeof window !== "undefined" ? window.parent : undefined;
  started = app
    .connect(new PostMessageTransport(target, target))
    .then(() => {
      set({
        status: "ready",
        host: app.getHostVersion() ?? null,
        capabilities: app.getHostCapabilities() ?? null,
        context: app.getHostContext() ?? {},
      });
      applyDocumentTheme(state.context);
    })
    .catch((error) => set({ status: "error", error }));

  subscribe(() => applyDocumentTheme(state.context));
  return started;
}

let lastTheme;
function applyDocumentTheme(ctx) {
  if (typeof document === "undefined") return;
  const theme = ctx?.theme;
  if (theme && theme !== lastTheme) {
    lastTheme = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
  const vars = ctx?.styles?.variables;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      if (v != null) document.documentElement.style.setProperty(k, String(v));
    }
  }
}

export function setAppState(next) {
  const value = typeof next === "function" ? next(state.appState) : next;
  set({ appState: value });
  return value;
}
