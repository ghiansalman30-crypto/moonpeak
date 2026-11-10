import { z } from "zod";
import { parseDate, upcomingPhases } from "../lib/moon";

export const tool = {
  title: "Moon calendar",
  description:
    "List the upcoming principal moon phases (new moon, first quarter, full moon, last quarter) as a swipeable calendar. Use when the user asks when the next phases are, or wants to plan around the moon over the coming weeks.",
  resource: "calendar",
  invoking: "Charting the moon",
  invoked: "Upcoming phases",
  annotations: { readOnlyHint: true },
};

export const schema = {
  from: z.string().optional().describe("Start date as YYYY-MM-DD. Defaults to today."),
  count: z.number().int().min(1).max(12).optional().describe("How many phases to list, 1-12. Defaults to 8."),
};

export default async function moonCalendar({ from, count = 8 }: { from?: string; count?: number }) {
  const start = parseDate(from);
  return { from: start.toISOString().slice(0, 10), events: upcomingPhases(start, count) };
}
