import type { CallToolResult } from "./index";
import type { Expect, PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestType } from "@playwright/test";

export function partialMatch(got: unknown, want: unknown, at?: string): string[];
export function checkResult(res: CallToolResult, expect?: { isError?: boolean; output?: unknown; text?: string | string[] }): string[];

type Inspector = {
  page: any;
  open(opts?: { tool?: string; sim?: string; host?: "chatgpt" | "claude"; theme?: "light" | "dark"; device?: "desktop" | "tablet" | "mobile"; mode?: "inline" | "pip" | "fullscreen" }): Promise<any>;
  view(): any;
  sentMessages(): any;
  modelContext(): any;
  setTheme(v: "light" | "dark"): Promise<void>;
  setDisplayMode(v: "inline" | "pip" | "fullscreen"): Promise<void>;
};
type Mcp = { client: any; call(name: string, args?: Record<string, unknown>): Promise<CallToolResult>; listTools(): Promise<any[]> };

export const test: TestType<PlaywrightTestArgs & PlaywrightTestOptions & { inspector: Inspector; mcp: Mcp }, PlaywrightWorkerArgs & PlaywrightWorkerOptions>;
export const expect: Expect<{
  toHaveStructuredContent(result: CallToolResult, want: unknown): any;
  toBeError(result: CallToolResult): any;
  toHaveTextContent(result: CallToolResult, text: string): any;
}>;
