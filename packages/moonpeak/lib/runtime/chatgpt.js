// ChatGPT-only extras. Every hook here returns a safe fallback outside ChatGPT,
// so the same View keeps working in Claude and other MCP Apps hosts.
import { useCallback, useSyncExternalStore } from "react";

const oa = () => (typeof window !== "undefined" ? window.openai : undefined);

function sub(fn) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("openai:set_globals", fn);
  return () => window.removeEventListener("openai:set_globals", fn);
}

/** Read one of ChatGPT's window.openai globals, re-rendering when it changes. */
export function useOpenAiGlobal(key) {
  return useSyncExternalStore(sub, () => oa()?.[key], () => undefined);
}

export function isChatGPT() {
  return Boolean(oa());
}

export function useIsChatGPT() {
  return useSyncExternalStore(sub, isChatGPT, () => false);
}

/** ChatGPT widget state (persisted per message). Falls back to undefined elsewhere. */
export function useWidgetState() {
  const state = useOpenAiGlobal("widgetState");
  const set = useCallback((v) => oa()?.setWidgetState?.(v), []);
  return [state, set];
}

/** Upload a File through ChatGPT. Resolves to { fileId } or null outside ChatGPT. */
export function useUploadFile() {
  return useCallback(async (file) => (oa()?.uploadFile ? oa().uploadFile(file) : null), []);
}

/** Ask ChatGPT to show a modal hosted by your View. No-op elsewhere. */
export function useRequestModal() {
  return useCallback(async (opts) => (oa()?.requestModal ? oa().requestModal(opts) : null), []);
}

/** The signed-in user's coarse location / locale hints ChatGPT shares, if any. */
export function useUserAgent() {
  return useOpenAiGlobal("userAgent");
}
