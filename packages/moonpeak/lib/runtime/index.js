// moonpeak runtime: React hooks for MCP App Views.
// Works in any MCP Apps host (Claude, ChatGPT, VS Code, Goose, the moonpeak inspector).
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getApp, setAppState, snapshot, start, subscribe } from "./store.js";

export { start as connect } from "./store.js";

function useStore(select) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return select ? select(s) : s;
}

const need = () => {
  const app = getApp();
  if (!app) throw new Error("moonpeak: the View is not connected to a host yet");
  return app;
};

// ---------- connection & host ----------

/** The underlying ext-apps `App` instance, for anything the hooks don't cover. */
export function useApp() {
  useStore((s) => s.status);
  return getApp();
}

/** "connecting" | "ready" | "error" */
export function useConnection() {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  return { status, error, ready: status === "ready" };
}

/** Name and version of the host rendering this View, e.g. { name: "claude-ai" }. */
export function useHost() {
  return useStore((s) => s.host);
}

export function useHostCapabilities() {
  return useStore((s) => s.capabilities);
}

/** The full host context object (theme, display mode, locale, dimensions, ...). */
export function useHostContext() {
  return useStore((s) => s.context);
}

// ---------- tool data ----------

/**
 * Everything about the tool call this View was opened for.
 * `output` is the structured content returned by your tool handler.
 */
export function useToolData() {
  const input = useStore((s) => s.input);
  const partialInput = useStore((s) => s.partialInput);
  const result = useStore((s) => s.result);
  const cancelled = useStore((s) => s.cancelled);
  const tool = useStore((s) => s.context?.toolInfo?.tool);
  return useMemo(
    () => ({
      tool,
      input: input ?? partialInput,
      output: result?.structuredContent,
      content: result?.content,
      meta: result?._meta,
      isError: Boolean(result?.isError),
      isPending: result === undefined && !cancelled,
      isStreaming: input === undefined && partialInput !== undefined,
      isCancelled: cancelled,
      result,
    }),
    [tool, input, partialInput, result, cancelled],
  );
}

export function useToolInput() {
  return useStore((s) => s.input ?? s.partialInput);
}

export function useToolOutput() {
  return useStore((s) => s.result?.structuredContent);
}

export function useToolResult() {
  return useStore((s) => s.result);
}

// ---------- host context shortcuts ----------

/** "light" | "dark" */
export function useTheme() {
  return useStore((s) => s.context?.theme ?? "light");
}

/** "inline" | "pip" | "fullscreen" */
export function useDisplayMode() {
  return useStore((s) => s.context?.displayMode ?? "inline");
}

/** Returns a function that asks the host to switch display mode. Resolves to the mode actually granted. */
export function useRequestDisplayMode() {
  const available = useStore((s) => s.context?.availableDisplayModes);
  const request = useCallback(async (mode) => {
    const res = await need().requestDisplayMode({ mode });
    return res?.mode ?? mode;
  }, []);
  return Object.assign(request, { available: available ?? ["inline"] });
}

export function useLocale() {
  return useStore((s) => s.context?.locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-US"));
}

export function useTimeZone() {
  return useStore((s) => s.context?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/** "web" | "desktop" | "mobile" */
export function usePlatform() {
  return useStore((s) => s.context?.platform ?? "web");
}

export function useDeviceCapabilities() {
  return useStore((s) => s.context?.deviceCapabilities ?? { touch: false, hover: true });
}

export function useSafeArea() {
  return useStore((s) => s.context?.safeAreaInsets ?? { top: 0, right: 0, bottom: 0, left: 0 });
}

/** { width?, height?, maxWidth?, maxHeight? } as reported by the host. */
export function useContainerSize() {
  return useStore((s) => s.context?.containerDimensions ?? {});
}

export function useMaxHeight() {
  return useStore((s) => {
    const d = s.context?.containerDimensions;
    return d?.maxHeight ?? d?.height;
  });
}

// ---------- actions ----------

/** Call another tool on your MCP server through the host. */
export function useCallTool() {
  return useCallback(async (name, args = {}) => {
    const res = await need().callServerTool({ name, arguments: args });
    if (res?.isError) {
      const msg = res.content?.find?.((c) => c.type === "text")?.text ?? `${name} failed`;
      const err = new Error(msg);
      err.result = res;
      throw err;
    }
    return res;
  }, []);
}

/** Post a message into the conversation as if the user typed it. */
export function useSendMessage() {
  return useCallback(async (text) => {
    return need().sendMessage({ role: "user", content: [{ type: "text", text: String(text) }] });
  }, []);
}

export function useOpenLink() {
  return useCallback(async (url) => need().openLink({ url: String(url) }), []);
}

/** Tell the model about something that happened in the View without posting a message. */
export function useUpdateModelContext() {
  return useCallback(async (value) => {
    const params = typeof value === "string" ? { content: [{ type: "text", text: value }] } : { structuredContent: value };
    return need().updateModelContext(params);
  }, []);
}

export function useDownloadFile() {
  return useCallback(async (file) => need().downloadFile(file), []);
}

export function useLog() {
  return useCallback((level, data) => {
    const app = getApp();
    if (app) app.sendLog({ level, data }).catch(() => {});
  }, []);
}

// ---------- state ----------

let appStateUsers = 0;
let warned = false;

/**
 * State that belongs to this View instance (one object per View, like ChatGPT
 * widget state). In ChatGPT it is persisted with the message; with
 * `{ share: true }` the model sees it on its next turn. Keep everything in one
 * object: `const [state, setState] = useAppState({ tab: 0, items: [] })`.
 */
export function useAppState(initial, { share = false } = {}) {
  const value = useStore((s) => s.appState);
  useEffect(() => {
    appStateUsers++;
    if (appStateUsers > 1 && !warned) {
      warned = true;
      console.warn("moonpeak: useAppState is used in more than one place. It holds ONE object per View, so the calls overwrite each other. Put all fields in a single useAppState({...}) and pass it down.");
    }
    return () => {
      appStateUsers--;
    };
  }, []);
  const init = useRef(false);
  if (!init.current) {
    init.current = true;
    if (value === undefined) {
      const saved = typeof window !== "undefined" ? window.openai?.widgetState : undefined;
      setAppState(saved ?? (typeof initial === "function" ? initial() : initial));
    }
  }
  const timer = useRef();
  const update = useCallback(
    (next) => {
      const v = setAppState(next);
      if (typeof window !== "undefined" && window.openai?.setWidgetState) {
        try {
          window.openai.setWidgetState(v);
        } catch {}
      }
      if (share) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          const app = getApp();
          if (app?.getHostCapabilities()?.updateModelContext) {
            app.updateModelContext({ structuredContent: v }).catch(() => {});
          }
        }, 400);
      }
      return v;
    },
    [share],
  );
  return [value === undefined ? initial : value, update];
}

/** Like useState, but resets whenever a new tool result arrives. */
export function useResultState(initial) {
  const result = useStore((s) => s.result);
  const [v, setV] = useState(initial);
  useEffect(() => setV(typeof initial === "function" ? initial(result) : initial), [result]);
  return [v, setV];
}

export function isHost(host, name) {
  return Boolean(host?.name && host.name.toLowerCase().includes(name));
}
