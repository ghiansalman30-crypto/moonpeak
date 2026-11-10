import { useState } from "react";
import {
  useAppState,
  useCallTool,
  useConnection,
  useContainerSize,
  useDisplayMode,
  useDownloadFile,
  useHost,
  useHostCapabilities,
  useLocale,
  useLog,
  useOpenLink,
  usePlatform,
  useRequestDisplayMode,
  useSendMessage,
  useTheme,
  useToolData,
  useUpdateModelContext,
} from "moonpeak";
import { useIsChatGPT, useWidgetState } from "moonpeak/chatgpt";
import { useIsClaude } from "moonpeak/claude";

export const resource = { title: "Kitchen sink", description: "Every hook in one View" };

type Out = { label: string; items: number[]; at: string };

export default function Sink() {
  const { input, output, isPending, isError } = useToolData<{ label: string; count: number }, Out>();
  const { status } = useConnection();
  const host = useHost();
  const caps = useHostCapabilities();
  const theme = useTheme();
  const mode = useDisplayMode();
  const requestMode = useRequestDisplayMode();
  const locale = useLocale();
  const platform = usePlatform();
  const size = useContainerSize();
  const callTool = useCallTool();
  const sendMessage = useSendMessage();
  const openLink = useOpenLink();
  const updateContext = useUpdateModelContext();
  const download = useDownloadFile();
  const log = useLog();
  const isChatGPT = useIsChatGPT();
  const isClaude = useIsClaude();
  const [widget] = useWidgetState();
  const [state, setState] = useAppState({ clicks: 0 }, { share: true });
  const [sum, setSum] = useState<string>("");
  const [err, setErr] = useState<string>("");

  return (
    <div data-theme={theme} style={{ padding: 16, font: "14px system-ui", background: theme === "dark" ? "#111" : "#fff", color: theme === "dark" ? "#eee" : "#111" }}>
      <dl>
        <dt>status</dt><dd data-k="status">{status}</dd>
        <dt>host</dt><dd data-k="host">{host?.name ?? "-"}</dd>
        <dt>caps</dt><dd data-k="caps">{caps ? Object.keys(caps).sort().join(",") : "-"}</dd>
        <dt>theme</dt><dd data-k="theme">{theme}</dd>
        <dt>mode</dt><dd data-k="mode">{mode}</dd>
        <dt>locale</dt><dd data-k="locale">{locale}</dd>
        <dt>platform</dt><dd data-k="platform">{platform}</dd>
        <dt>width</dt><dd data-k="width">{size.width ?? "-"}</dd>
        <dt>pending</dt><dd data-k="pending">{String(isPending)}</dd>
        <dt>error</dt><dd data-k="error">{String(isError)}</dd>
        <dt>input</dt><dd data-k="input">{JSON.stringify(input ?? null)}</dd>
        <dt>output</dt><dd data-k="output">{JSON.stringify(output ?? null)}</dd>
        <dt>chatgpt</dt><dd data-k="chatgpt">{String(isChatGPT)}</dd>
        <dt>claude</dt><dd data-k="claude">{String(isClaude)}</dd>
        <dt>widget</dt><dd data-k="widget">{JSON.stringify(widget ?? null)}</dd>
        <dt>clicks</dt><dd data-k="clicks">{state.clicks}</dd>
        <dt>sum</dt><dd data-k="sum">{sum}</dd>
        <dt>err</dt><dd data-k="err">{err}</dd>
      </dl>
      <button onClick={() => setState((s) => ({ ...s, clicks: s.clicks + 1 }))}>click</button>
      <button onClick={async () => setSum(String((await callTool<{ sum: number }>("add", { a: 2, b: 40 })).structuredContent?.sum))}>add</button>
      <button onClick={async () => { try { await callTool("explode", {}); } catch (e) { setErr((e as Error).message); } }}>explode</button>
      <button onClick={() => sendMessage("hello from the sink")}>message</button>
      <button onClick={() => openLink("https://example.com/moonpeak")}>link</button>
      <button onClick={() => updateContext({ picked: "blue" })}>context</button>
      <button onClick={() => download({ contents: [{ type: "resource", resource: { uri: "file:///sink.txt", mimeType: "text/plain", text: "sink" } }] })}>download</button>
      <button onClick={() => log("info", { from: "sink" })}>log</button>
      <button onClick={() => requestMode("pip")}>pip</button>
      <button onClick={() => requestMode("fullscreen")}>full</button>
      <button onClick={() => requestMode("inline")}>inline</button>
    </div>
  );
}
