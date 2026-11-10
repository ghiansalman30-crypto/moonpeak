// Claude-specific helpers. Claude speaks plain MCP Apps, so these are thin
// conveniences over the portable hooks in "moonpeak".
import { useHost, useHostContext } from "./index.js";

export function useIsClaude() {
  const host = useHost();
  return Boolean(host?.name && /claude/i.test(host.name));
}

/** Claude passes its design tokens as CSS variables in host styles. */
export function useClaudeStyles() {
  return useHostContext()?.styles?.variables ?? {};
}
