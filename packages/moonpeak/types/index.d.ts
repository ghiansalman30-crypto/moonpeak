import type { App } from "@modelcontextprotocol/ext-apps";

export type Theme = "light" | "dark";
export type DisplayMode = "inline" | "pip" | "fullscreen";
export type ContentBlock = { type: string; text?: string; [k: string]: unknown };
export type CallToolResult<T = unknown> = {
  content?: ContentBlock[];
  structuredContent?: T;
  isError?: boolean;
  _meta?: Record<string, unknown>;
};
export type HostInfo = { name: string; version?: string } | null;
export type HostContext = {
  theme?: Theme;
  displayMode?: DisplayMode;
  availableDisplayModes?: DisplayMode[];
  locale?: string;
  timeZone?: string;
  platform?: "web" | "desktop" | "mobile";
  deviceCapabilities?: { touch?: boolean; hover?: boolean };
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
  containerDimensions?: { width?: number; height?: number; maxWidth?: number; maxHeight?: number };
  toolInfo?: { id?: string | number; tool: { name: string; title?: string; description?: string; inputSchema?: unknown } };
  styles?: { variables?: Record<string, string | undefined> };
  [k: string]: unknown;
};

export type ToolData<In = Record<string, unknown>, Out = unknown> = {
  tool?: { name: string; title?: string; description?: string };
  input?: In;
  output?: Out;
  content?: ContentBlock[];
  meta?: Record<string, unknown>;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isCancelled: boolean;
  result?: CallToolResult<Out>;
};

/** Resource (View) config, exported as `resource` from src/resources/<name>/<name>.tsx */
export type ResourceConfig = {
  title?: string;
  description?: string;
  prefersBorder?: boolean;
  domain?: string;
  csp?: { connectDomains?: string[]; resourceDomains?: string[]; frameDomains?: string[]; baseUriDomains?: string[] };
  permissions?: { camera?: {}; microphone?: {}; geolocation?: {}; clipboardWrite?: {} };
};

/** Tool config, exported as `tool` from src/tools/<name>.ts */
export type ToolConfig = {
  title?: string;
  description: string;
  /** Name of a folder in src/resources. Makes this an MCP App tool with a View. */
  resource?: string;
  /** Who can call it: the model, the View, or both (default). */
  visibility?: ("model" | "app")[];
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean; title?: string };
  /** ChatGPT status text while running and after. */
  invoking?: string;
  invoked?: string;
  _meta?: Record<string, unknown>;
};

export function connect(info?: { name?: string; version?: string; autoResize?: boolean }): Promise<void>;
export function useApp(): App | null;
export function useConnection(): { status: "connecting" | "ready" | "error"; error: unknown; ready: boolean };
export function useHost(): HostInfo;
export function useHostCapabilities(): Record<string, unknown> | null;
export function useHostContext(): HostContext;
export function useToolData<In = Record<string, unknown>, Out = unknown>(): ToolData<In, Out>;
export function useToolInput<In = Record<string, unknown>>(): In | undefined;
export function useToolOutput<Out = unknown>(): Out | undefined;
export function useToolResult<Out = unknown>(): CallToolResult<Out> | undefined;
export function useTheme(): Theme;
export function useDisplayMode(): DisplayMode;
export function useRequestDisplayMode(): ((mode: DisplayMode) => Promise<DisplayMode>) & { available: DisplayMode[] };
export function useLocale(): string;
export function useTimeZone(): string;
export function usePlatform(): "web" | "desktop" | "mobile";
export function useDeviceCapabilities(): { touch?: boolean; hover?: boolean };
export function useSafeArea(): { top: number; right: number; bottom: number; left: number };
export function useContainerSize(): { width?: number; height?: number; maxWidth?: number; maxHeight?: number };
export function useMaxHeight(): number | undefined;
export function useCallTool(): <Out = unknown>(name: string, args?: Record<string, unknown>) => Promise<CallToolResult<Out>>;
export function useSendMessage(): (text: string) => Promise<unknown>;
export function useOpenLink(): (url: string) => Promise<unknown>;
export function useUpdateModelContext(): (value: string | Record<string, unknown>) => Promise<unknown>;
export function useDownloadFile(): (file: { contents: unknown[] }) => Promise<unknown>;
export function useLog(): (level: "debug" | "info" | "notice" | "warning" | "error", data: unknown) => void;
export function useAppState<S>(initial: S | (() => S), options?: { share?: boolean }): [S, (next: S | ((prev: S) => S)) => S];
export function useResultState<S>(initial: S | ((result: CallToolResult | undefined) => S)): [S, (next: S) => void];
export function isHost(host: HostInfo, name: string): boolean;
