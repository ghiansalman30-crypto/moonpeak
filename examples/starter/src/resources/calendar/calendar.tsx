import { useRef } from "react";
import { useAppState, useCallTool, useSendMessage, useTheme, useToolData } from "moonpeak";
import { MoonDisc } from "../../lib/moon-disc";

export const resource = {
  title: "Moon calendar",
  description: "Carousel of the upcoming principal moon phases",
  prefersBorder: true,
};

type Event = { date: string; phase: string; illumination: number; waxing: boolean; daysAway: number };
type Output = { from: string; events: Event[] };

const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", ...o });

export default function Calendar() {
  const { output, isPending, isError, content } = useToolData();
  const theme = useTheme();
  const callTool = useCallTool();
  const sendMessage = useSendMessage();
  const track = useRef<HTMLOListElement>(null);
  // Loaded pages and the selected card survive reloads (and are shared with the model).
  const [state, setState] = useAppState<{ more: Event[]; selected: number }>({ more: [], selected: 0 }, { share: true });

  if (isError) {
    const msg = (content as { type: string; text?: string }[] | undefined)?.find((c) => c.type === "text")?.text;
    return <div className={`cal-app ${theme}`}><p className="error">{msg || "Something went wrong."}</p></div>;
  }
  const data = output as Output | undefined;
  if (isPending || !data) return <div className={`cal-app ${theme}`}><div className="skeleton" aria-busy="true">Charting the moon…</div></div>;

  const events = [...data.events, ...state.more];
  const sel = Math.min(state.selected, events.length - 1);

  function scrollBy(dir: 1 | -1) {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }
  async function loadMore() {
    const last = events[events.length - 1];
    const next = new Date(last.date + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    const res = await callTool("moon-calendar", { from: next.toISOString().slice(0, 10), count: 4 });
    const more = (res.structuredContent as Output | undefined)?.events ?? [];
    setState((s) => ({ ...s, more: [...s.more, ...more] }));
    requestAnimationFrame(() => scrollBy(1));
  }

  const picked = events[sel];
  return (
    <div className={`cal-app ${theme}`}>
      <header>
        <div>
          <p className="eyebrow">From {fmt(data.from, { month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>Upcoming moon phases</h1>
        </div>
        <div className="arrows">
          <button aria-label="Previous" onClick={() => scrollBy(-1)}>‹</button>
          <button aria-label="Next" onClick={() => scrollBy(1)}>›</button>
        </div>
      </header>

      <ol className="track" ref={track} aria-label="Moon phases">
        {events.map((e, i) => (
          <li key={e.date + e.phase}>
            <button className={`card${i === sel ? " on" : ""}`} aria-pressed={i === sel} onClick={() => setState((s) => ({ ...s, selected: i }))}>
              <MoonDisc illumination={e.illumination} waxing={e.waxing} size={64} />
              <b>{e.phase}</b>
              <span>{fmt(e.date, { weekday: "short", month: "short", day: "numeric" })}</span>
              <small>{e.daysAway === 0 ? "today" : e.daysAway === 1 ? "tomorrow" : `in ${e.daysAway} days`}</small>
            </button>
          </li>
        ))}
        <li>
          <button className="card more" onClick={loadMore}>Load 4 more</button>
        </li>
      </ol>

      <footer>
        <p className="picked">
          <b>{picked.phase}</b> · {fmt(picked.date, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <button onClick={() => sendMessage(`What should I look for in the sky around the ${picked.phase.toLowerCase()} on ${picked.date}?`)}>Ask about this phase</button>
      </footer>
    </div>
  );
}
