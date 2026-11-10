import { z } from "zod";
import { parseDate } from "../lib/moon";

// App-only: the review View calls this when the user presses "Confirm plan".
// The model never sees it, so it can't confirm a plan on the user's behalf.
export const tool = {
  title: "Confirm stargazing plan",
  description: "Confirm a proposed stargazing plan. Called from the review View only.",
  visibility: ["app"] as ("model" | "app")[],
};

export const schema = {
  date: z.string().describe("Night of the plan, YYYY-MM-DD."),
  place: z.string().max(80).nullable().optional(),
};

/** Short, stable reference so the same plan always gets the same code. */
function ref(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return "MP-" + (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

export default async function confirmPlan({ date, place }: { date: string; place?: string | null }) {
  const day = parseDate(date).toISOString().slice(0, 10);
  return { status: "confirmed" as const, date: day, place: place ?? null, ref: ref(`${day}|${place ?? ""}`) };
}
