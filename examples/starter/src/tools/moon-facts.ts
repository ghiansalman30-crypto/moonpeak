import { z } from "zod";
import { moonOn, parseDate } from "../lib/moon";

// A tool without `resource` is a plain MCP tool: text in, text out, no View.
export const tool = {
  title: "Moon facts",
  description: "Return the moon phase and illumination for a date as plain text. Use for quick factual answers that don't need a visual.",
  annotations: { readOnlyHint: true },
};

export const schema = {
  date: z.string().describe("Date as YYYY-MM-DD"),
};

export default async function moonFacts({ date }: { date: string }) {
  const m = moonOn(parseDate(date));
  return `${m.date}: ${m.phase}, ${Math.round(m.illumination * 100)}% lit, ${m.age} days into the cycle.`;
}
