// One docs page per hook. Plain strings (not template literals) so Markdown backticks are safe.
const F = "```";
const code = (lang, lines) => [F + lang, ...lines, F].join("\n");

const HOOKS = [
  // ---------------------------------------------------------------- tool data
  {
    name: "useToolData", from: "moonpeak", group: "Tool data",
    sig: "useToolData<In, Out>(): ToolData<In, Out>",
    desc: "Everything about the tool call this View was opened for: the input, your handler's structured output, the raw result and its state.",
    returns: [
      ["input", "In | undefined", "Tool arguments. While the model is still writing them, the partial input."],
      ["output", "Out | undefined", "The `structuredContent` your handler returned."],
      ["content", "ContentBlock[] | undefined", "The result's content blocks (text the model sees)."],
      ["isPending", "boolean", "No result yet and not cancelled. Show a skeleton."],
      ["isStreaming", "boolean", "The host is still streaming the input."],
      ["isError", "boolean", "The tool returned `isError: true` (your handler threw)."],
      ["isCancelled", "boolean", "The user or host cancelled the call."],
      ["tool", "{ name, title?, description? }", "Which tool this View belongs to."],
      ["result", "CallToolResult | undefined", "The whole result, including `_meta`."],
    ],
    example: [
      'import { useToolData } from "moonpeak";',
      "",
      "export default function Moon() {",
      "  const { output, isPending, isError, content } = useToolData<{ date?: string }, { phase: string }>();",
      "  if (isError) return <p>{content?.[0]?.text}</p>;",
      "  if (isPending) return <p>Reading the sky…</p>;",
      "  return <h1>{output?.phase}</h1>;",
      "}",
    ],
    notes: ["Handle `isError` and `isPending` before reading `output`.", "Call every hook before the first early `return`."],
  },
  { name: "useToolInput", from: "moonpeak", group: "Tool data", sig: "useToolInput<In>(): In | undefined", desc: "Just the tool input (or the partial input while it streams).", example: ["const input = useToolInput<{ date?: string }>();"] },
  { name: "useToolOutput", from: "moonpeak", group: "Tool data", sig: "useToolOutput<Out>(): Out | undefined", desc: "Just the structured content your handler returned.", example: ["const output = useToolOutput<{ phase: string }>();"] },
  { name: "useToolResult", from: "moonpeak", group: "Tool data", sig: "useToolResult<Out>(): CallToolResult<Out> | undefined", desc: "The raw `CallToolResult`: `content`, `structuredContent`, `isError` and `_meta`.", example: ["const result = useToolResult();", "const meta = result?._meta;"] },

  // ---------------------------------------------------------------- host context
  { name: "useTheme", from: "moonpeak", group: "Host context", sig: "useTheme(): \"light\" | \"dark\"", desc: "The host's theme. Defaults to `\"light\"` before the host reports one. moonpeak also applies the host's CSS variables to the document.", example: ["const theme = useTheme();", "return <div className={`card ${theme}`}>…</div>;"], notes: ["Style both themes: hosts switch at any time without reloading the View."] },
  { name: "useDisplayMode", from: "moonpeak", group: "Host context", sig: "useDisplayMode(): \"inline\" | \"pip\" | \"fullscreen\"", desc: "How the host is showing the View right now.", example: ["const mode = useDisplayMode();", "return <div className={`app mode-${mode}`}>…</div>;"] },
  { name: "useRequestDisplayMode", from: "moonpeak", group: "Host context", sig: "useRequestDisplayMode(): ((mode) => Promise<DisplayMode>) & { available: DisplayMode[] }", desc: "Ask the host to switch display mode. Resolves to the mode the host actually granted; `available` lists what this host allows.", example: ["const requestMode = useRequestDisplayMode();", "", "{requestMode.available.includes(\"fullscreen\") && (", "  <button onClick={() => requestMode(\"fullscreen\")}>Expand</button>", ")}"], notes: ["Hosts may refuse a mode. Render from `useDisplayMode()`, not from what you asked for."] },
  { name: "useHostContext", from: "moonpeak", group: "Host context", sig: "useHostContext(): HostContext", desc: "The whole host context object: theme, display modes, locale, time zone, platform, device capabilities, safe areas, container dimensions, tool info and style variables.", example: ["const ctx = useHostContext();", "console.log(ctx.platform, ctx.containerDimensions);"] },
  { name: "useLocale", from: "moonpeak", group: "Host context", sig: "useLocale(): string", desc: "The host's locale (BCP 47), falling back to the browser's. Use it for `Intl` formatting.", example: ["const locale = useLocale();", "const day = new Date(date).toLocaleDateString(locale, { weekday: \"long\" });"] },
  { name: "useTimeZone", from: "moonpeak", group: "Host context", sig: "useTimeZone(): string", desc: "The user's IANA time zone as reported by the host, falling back to the browser's.", example: ["const tz = useTimeZone(); // \"Asia/Jakarta\""] },
  { name: "usePlatform", from: "moonpeak", group: "Host context", sig: "usePlatform(): \"web\" | \"desktop\" | \"mobile\"", desc: "Where the host is running. Defaults to `\"web\"`.", example: ["const compact = usePlatform() === \"mobile\";"] },
  { name: "useDeviceCapabilities", from: "moonpeak", group: "Host context", sig: "useDeviceCapabilities(): { touch?: boolean; hover?: boolean }", desc: "Whether the device has touch input and hover. Use it instead of guessing from screen size.", example: ["const { hover } = useDeviceCapabilities();", "// show tooltips only when hover exists"] },
  { name: "useSafeArea", from: "moonpeak", group: "Host context", sig: "useSafeArea(): { top; right; bottom; left }", desc: "Insets (px) the View must keep clear, for notches and host chrome, mostly in fullscreen on mobile.", example: ["const s = useSafeArea();", "return <div style={{ paddingTop: s.top, paddingBottom: s.bottom }}>…</div>;"] },
  { name: "useContainerSize", from: "moonpeak", group: "Host context", sig: "useContainerSize(): { width?; height?; maxWidth?; maxHeight? }", desc: "The space the host gives the View, as reported in host context.", example: ["const { width } = useContainerSize();", "const columns = (width ?? 600) > 520 ? 7 : 4;"] },
  { name: "useMaxHeight", from: "moonpeak", group: "Host context", sig: "useMaxHeight(): number | undefined", desc: "The tallest the View may grow (`maxHeight`, or `height` when the host sets a fixed size).", example: ["const max = useMaxHeight();", "return <div style={{ maxHeight: max, overflowY: \"auto\" }}>…</div>;"] },

  // ---------------------------------------------------------------- host
  { name: "useHost", from: "moonpeak", group: "Host", sig: "useHost(): { name: string; version?: string } | null", desc: "Name and version of the host rendering the View. `isHost(host, \"claude\")` is a forgiving check.", example: ["import { useHost, isHost } from \"moonpeak\";", "const host = useHost();", "const inClaude = isHost(host, \"claude\");"] },
  { name: "useHostCapabilities", from: "moonpeak", group: "Host", sig: "useHostCapabilities(): Record<string, unknown> | null", desc: "What the host supports (for example `updateModelContext`, `openLinks`, `downloadFile`). Feature-detect before showing a control.", example: ["const caps = useHostCapabilities();", "const canDownload = Boolean(caps?.downloadFile);"] },
  { name: "useConnection", from: "moonpeak", group: "Host", sig: "useConnection(): { status: \"connecting\" | \"ready\" | \"error\"; error; ready: boolean }", desc: "State of the postMessage connection to the host.", example: ["const { ready, error } = useConnection();", "if (error) return <p>Could not reach the host.</p>;"] },
  { name: "useApp", from: "moonpeak", group: "Host", sig: "useApp(): App | null", desc: "The underlying `App` instance from the official MCP Apps SDK (`@modelcontextprotocol/ext-apps`), for anything the hooks don't cover.", example: ["const app = useApp();", "await app?.readServerResource({ uri: \"ui://my-app/data\" });"], notes: ["`null` until the View has connected."] },

  // ---------------------------------------------------------------- actions
  { name: "useCallTool", from: "moonpeak", group: "Actions", sig: "useCallTool(): (name: string, args?: object) => Promise<CallToolResult>", desc: "Call a tool on your MCP server through the host. Throws an `Error` with the tool's text when the result has `isError: true` (the result is on `err.result`).", example: ["const callTool = useCallTool();", "", "async function nextWeek() {", "  const res = await callTool(\"show-moon\", { date: \"2026-12-01\" });", "  setState({ view: res.structuredContent, selected: 0 });", "}"], notes: ["Tools marked `visibility: [\"app\"]` can be called here even though the model never sees them."] },
  { name: "useSendMessage", from: "moonpeak", group: "Actions", sig: "useSendMessage(): (text: string) => Promise<unknown>", desc: "Post a message into the conversation as the user, which starts a new model turn.", example: ["const sendMessage = useSendMessage();", "<button onClick={() => sendMessage(\"What should I photograph tonight?\")}>Ask</button>"] },
  { name: "useUpdateModelContext", from: "moonpeak", group: "Actions", sig: "useUpdateModelContext(): (value: string | object) => Promise<unknown>", desc: "Tell the model what happened in the View without posting a message. A string becomes text content; an object becomes structured content. The model sees it on its next turn.", example: ["const updateModelContext = useUpdateModelContext();", "await updateModelContext(\"The user confirmed the plan for 2026-12-09 (ref MP-1A2B3C).\");"] },
  { name: "useOpenLink", from: "moonpeak", group: "Actions", sig: "useOpenLink(): (url: string) => Promise<unknown>", desc: "Ask the host to open a URL. Views run sandboxed, so plain `<a target=\"_blank\">` may be blocked.", example: ["const openLink = useOpenLink();", "<button onClick={() => openLink(\"https://moonpeak-ai.com\")}>Docs</button>"] },
  { name: "useDownloadFile", from: "moonpeak", group: "Actions", sig: "useDownloadFile(): (file: { contents: unknown[] }) => Promise<unknown>", desc: "Ask the host to save a file for the user, using MCP resource contents.", example: ["const download = useDownloadFile();", "await download({ contents: [{ uri: \"file:///moon.csv\", mimeType: \"text/csv\", text: csv }] });"] },
  { name: "useLog", from: "moonpeak", group: "Actions", sig: "useLog(): (level, data) => void", desc: "Send a log message to the host (levels: debug, info, notice, warning, error). The inspector shows them in its Log tab. Never throws.", example: ["const log = useLog();", "log(\"info\", { loaded: events.length });"] },

  // ---------------------------------------------------------------- state
  {
    name: "useAppState", from: "moonpeak", group: "State",
    sig: "useAppState<S>(initial: S, options?: { share?: boolean }): [S, (next: S | (prev: S) => S) => S]",
    desc: "State that belongs to this View instance. In ChatGPT it is saved with the message (widget state), so it survives reloads. With `{ share: true }` the model also sees it on its next turn (debounced 400 ms).",
    example: ["const [state, setState] = useAppState({ selected: 0, more: [] }, { share: true });", "setState((s) => ({ ...s, selected: 2 }));"],
    notes: ["It holds ONE object per View. Use it once, put every field in that object and pass pieces down. moonpeak warns in the console if it is used twice."],
  },
  { name: "useResultState", from: "moonpeak", group: "State", sig: "useResultState<S>(initial: S | (result) => S): [S, (next: S) => void]", desc: "Like `useState`, but resets whenever a new tool result arrives. Good for UI state tied to one result, like an open row.", example: ["const [open, setOpen] = useResultState<number | null>(null);"] },

  // ---------------------------------------------------------------- ChatGPT
  { name: "useIsChatGPT", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useIsChatGPT(): boolean  ·  isChatGPT(): boolean", desc: "True when the View runs inside ChatGPT (the `window.openai` global is present).", example: ["import { useIsChatGPT } from \"moonpeak/chatgpt\";", "const chatgpt = useIsChatGPT();"] },
  { name: "useWidgetState", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useWidgetState<S>(): [S | undefined, (v: S) => void]", desc: "ChatGPT's raw widget state. Prefer `useAppState`, which uses it in ChatGPT and works in every other host too.", example: ["const [saved, save] = useWidgetState<{ tab: number }>();"] },
  { name: "useOpenAiGlobal", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useOpenAiGlobal<T>(key: string): T | undefined", desc: "Read a `window.openai` global (for example `maxHeight`, `locale`, `userAgent`) and re-render when ChatGPT changes it. `undefined` outside ChatGPT.", example: ["const maxHeight = useOpenAiGlobal<number>(\"maxHeight\");"] },
  { name: "useUploadFile", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useUploadFile(): (file: File) => Promise<{ fileId: string } | null>", desc: "Upload a file through ChatGPT. Resolves to `null` in hosts without uploads.", example: ["const upload = useUploadFile();", "const res = await upload(input.files[0]);"] },
  { name: "useRequestModal", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useRequestModal(): (opts: object) => Promise<unknown>", desc: "Ask ChatGPT to open a modal. A no-op elsewhere.", example: ["const requestModal = useRequestModal();"] },
  { name: "useUserAgent", from: "moonpeak/chatgpt", group: "ChatGPT", sig: "useUserAgent(): unknown", desc: "ChatGPT's user agent info (device type, capabilities). `undefined` outside ChatGPT.", example: ["const ua = useUserAgent();"] },

  // ---------------------------------------------------------------- Claude
  { name: "useIsClaude", from: "moonpeak/claude", group: "Claude", sig: "useIsClaude(): boolean", desc: "True when the host reports itself as Claude.", example: ["import { useIsClaude } from \"moonpeak/claude\";", "const claude = useIsClaude();"] },
  { name: "useClaudeStyles", from: "moonpeak/claude", group: "Claude", sig: "useClaudeStyles(): Record<string, string | undefined>", desc: "The style variables Claude sends in host context (fonts, colors), so a View can match the chat around it.", example: ["const vars = useClaudeStyles();", "<div style={{ fontFamily: vars[\"--font-sans\"] }}>…</div>"] },
];

const slugOf = (h) => "hooks/" + h.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").toLowerCase();

export function hookPages() {
  return HOOKS.map((h) => {
    const md = [
      code("ts", [`import { ${h.name} } from "${h.from}";`, "", h.sig]),
      "",
      h.desc,
      "",
      ...(h.returns ? ["## Returns", "", "| Field | Type | Meaning |", "|---|---|---|", ...h.returns.map(([f, t, m]) => `| \`${f}\` | \`${t}\` | ${m} |`), ""] : []),
      "## Example",
      "",
      code("tsx", h.example),
      "",
      ...(h.notes ? ["## Notes", "", ...h.notes.map((n) => `- ${n}`), ""] : []),
      "## Works in",
      "",
      h.from === "moonpeak"
        ? "Every MCP Apps host: ChatGPT, Claude, VS Code, Goose and the moonpeak inspector."
        : h.from === "moonpeak/chatgpt"
          ? "ChatGPT. Safe to call anywhere: elsewhere it returns an empty value or does nothing."
          : "Claude. Safe to call anywhere: elsewhere it returns an empty value.",
      "",
      `See all hooks in [Runtime APIs](/docs/app-framework/runtime-apis).`,
    ].join("\n");
    return { slug: slugOf(h), title: h.name, nav: h.name, description: `${h.group} hook from ${h.from}.`, md };
  });
}

export const HOOK_LIST = HOOKS.map((h) => ({ name: h.name, from: h.from, group: h.group, slug: slugOf(h), desc: h.desc }));
