import { useAppState, useCallTool, useSendMessage, useTheme, useToolData, useUpdateModelContext } from "moonpeak";
import { MoonDisc } from "../../lib/moon-disc";

export const resource = {
  title: "Stargazing plan",
  description: "Review a proposed stargazing night and confirm or decline it",
  prefersBorder: true,
};

type Plan = {
  date: string; place: string | null; phase: string; illumination: number; waxing: boolean;
  darkness: "excellent" | "good" | "fair" | "poor"; targets: string[]; betterNight: string | null; status: "proposed";
};
type Decision = { status: "proposed" | "confirmed" | "declined"; ref: string | null; busy: boolean; error: string | null };

const LABEL = { excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor" } as const;
const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });

export default function Review() {
  const { output, isPending, isError, content } = useToolData();
  const theme = useTheme();
  const callTool = useCallTool();
  const sendMessage = useSendMessage();
  const updateModelContext = useUpdateModelContext();
  // The decision survives reloads, so a confirmed plan stays confirmed.
  const [d, setD] = useAppState<Decision>({ status: "proposed", ref: null, busy: false, error: null });

  if (isError) {
    const msg = (content as { type: string; text?: string }[] | undefined)?.find((c) => c.type === "text")?.text;
    return <div className={`review-app ${theme}`}><p className="error">{msg || "Something went wrong."}</p></div>;
  }
  const plan = output as Plan | undefined;
  if (isPending || !plan) return <div className={`review-app ${theme}`}><div className="skeleton" aria-busy="true">Planning your night…</div></div>;

  async function confirm() {
    setD((s) => ({ ...s, busy: true, error: null }));
    try {
      const res = await callTool("confirm-plan", { date: plan!.date, place: plan!.place });
      const out = res.structuredContent as { ref: string } | undefined;
      if (!out) throw new Error("Could not confirm the plan.");
      setD({ status: "confirmed", ref: out.ref, busy: false, error: null });
      await updateModelContext(`The user confirmed the stargazing plan for ${plan!.date}${plan!.place ? ` at ${plan!.place}` : ""} (ref ${out.ref}).`);
    } catch (e) {
      setD((s) => ({ ...s, busy: false, error: e instanceof Error ? e.message : String(e) }));
    }
  }
  async function decline() {
    setD({ status: "declined", ref: null, busy: false, error: null });
    await sendMessage(plan!.betterNight ? `Not that night. What about ${plan!.betterNight} instead?` : "Not that night. Can you suggest another one?");
  }

  return (
    <div className={`review-app ${theme}`}>
      <header>
        <div>
          <p className="eyebrow">Stargazing plan{plan.place ? ` · ${plan.place}` : ""}</p>
          <h1>{fmt(plan.date)}</h1>
          <p className="sub">{plan.phase} · {Math.round(plan.illumination * 100)}% lit</p>
        </div>
        <MoonDisc illumination={plan.illumination} waxing={plan.waxing} size={84} />
      </header>

      <div className={`sky ${plan.darkness}`}>
        <span>Sky darkness</span>
        <b>{LABEL[plan.darkness]}</b>
      </div>

      <section>
        <h2>Worth looking for</h2>
        <ul className="targets">{plan.targets.map((t) => <li key={t}>{t}</li>)}</ul>
        {plan.betterNight && d.status === "proposed" && <p className="hint">Darker sky on {plan.betterNight} (new moon).</p>}
      </section>

      {d.status === "proposed" && (
        <footer>
          <button className="primary" onClick={confirm} disabled={d.busy}>{d.busy ? "Confirming…" : "Confirm plan"}</button>
          <button onClick={decline} disabled={d.busy}>Pick another night</button>
          {d.error && <p className="error" role="alert">{d.error}</p>}
        </footer>
      )}
      {d.status === "confirmed" && <p className="done" role="status">Confirmed · ref <b>{d.ref}</b></p>}
      {d.status === "declined" && <p className="done declined" role="status">Declined. Asked for another night.</p>}
    </div>
  );
}
