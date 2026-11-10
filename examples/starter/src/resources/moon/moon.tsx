import {
  useAppState,
  useCallTool,
  useDisplayMode,
  useRequestDisplayMode,
  useSendMessage,
  useTheme,
  useToolData,
} from "moonpeak";

export const resource = {
  title: "Moon phase",
  description: "Moon phase for a date with a 7-day strip",
  prefersBorder: true,
};

type Day = { date: string; age: number; illumination: number; phase: string; waxing: boolean };
type Output = Day & { week: Day[]; nextFull: string; nextNew: string };

/** Draws the lit part of the moon from illumination + waxing/waning. */
function MoonDisc({ illumination, waxing, size = 132 }: { illumination: number; waxing: boolean; size?: number }) {
  const r = size / 2 - 2;
  const c = size / 2;
  // x-radius of the terminator ellipse: +r at new moon, 0 at quarter, -r at full
  const k = r * (1 - 2 * illumination);
  const sweepOuter = waxing ? 1 : 0;
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A ${Math.abs(k)} ${r} 0 0 ${k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0} ${c} ${c - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(illumination * 100)}% illuminated`}>
      <circle cx={c} cy={c} r={r} className="moon-dark" />
      <path d={d} className="moon-lit" />
      <circle cx={c} cy={c} r={r} fill="none" className="moon-rim" />
    </svg>
  );
}

export default function Moon() {
  const { output, isPending, isError, content } = useToolData();
  const data = output as Output | undefined;
  const theme = useTheme();
  const mode = useDisplayMode();
  const requestMode = useRequestDisplayMode();
  const callTool = useCallTool();
  const sendMessage = useSendMessage();
  // One object per View: it survives reloads in ChatGPT and can be shared with the model.
  const [state, setState] = useAppState<{ view: Output | null; selected: number }>({ view: null, selected: 0 });
  const selected = state.selected;
  const setSelected = (i: number) => setState((s) => ({ ...s, selected: i }));

  const current = state.view ?? data;

  if (isError) {
    const msg = (content as { type: string; text?: string }[] | undefined)?.find((c) => c.type === "text")?.text;
    return <div className={`moon-app ${theme}`}><p className="error">{msg || "Something went wrong."}</p></div>;
  }
  if (isPending || !current) {
    return <div className={`moon-app ${theme}`}><div className="skeleton" aria-busy="true">Reading the sky…</div></div>;
  }

  const day = current.week[selected] ?? current;

  async function shift(days: number) {
    const base = new Date(current!.date + "T12:00:00Z");
    base.setUTCDate(base.getUTCDate() + days);
    const res = await callTool("show-moon", { date: base.toISOString().slice(0, 10) });
    setState({ view: res.structuredContent as Output, selected: 0 });
  }

  return (
    <div className={`moon-app ${theme} mode-${mode}`}>
      <header>
        <div>
          <p className="eyebrow">{new Date(day.date + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>{day.phase}</h1>
          <p className="sub">{Math.round(day.illumination * 100)}% lit · day {day.age} of 29.5</p>
        </div>
        <MoonDisc illumination={day.illumination} waxing={day.waxing} />
      </header>

      <ol className="week" aria-label="Next 7 days">
        {current.week.map((d, i) => (
          <li key={d.date}>
            <button className={i === selected ? "on" : ""} onClick={() => setSelected(i)} aria-pressed={i === selected}>
              <span>{new Date(d.date + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short" })}</span>
              <MoonDisc illumination={d.illumination} waxing={d.waxing} size={30} />
              <b>{Math.round(d.illumination * 100)}%</b>
            </button>
          </li>
        ))}
      </ol>

      <dl className="facts">
        <div><dt>Next full moon</dt><dd>{current.nextFull}</dd></div>
        <div><dt>Next new moon</dt><dd>{current.nextNew}</dd></div>
      </dl>

      <footer>
        <button onClick={() => shift(-7)}>← Week</button>
        <button onClick={() => shift(7)}>Week →</button>
        <span className="grow" />
        <button onClick={() => sendMessage(`What's a good thing to photograph during a ${day.phase.toLowerCase()} on ${day.date}?`)}>Ask about this night</button>
        {mode === "inline" ? <button onClick={() => requestMode("fullscreen")}>Expand</button> : <button onClick={() => requestMode("inline")}>Close</button>}
      </footer>
    </div>
  );
}
