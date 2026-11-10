import { z } from "zod";
import { moonOn, nextPhase, parseDate } from "../lib/moon";

export const tool = {
  title: "Show moon phase",
  description: "Show the moon phase for a date, with the next 7 days and the next full and new moon. Use when the user asks about the moon, moon phases or the night sky on a date.",
  resource: "moon",
  invoking: "Looking up",
  invoked: "Here's the moon",
  annotations: { readOnlyHint: true },
};

export const schema = {
  date: z.string().optional().describe("Date as YYYY-MM-DD. Defaults to today."),
};

export default async function showMoon({ date }: { date?: string }) {
  const day = parseDate(date);
  const week = Array.from({ length: 7 }, (_, i) => moonOn(new Date(day.getTime() + i * 86_400_000)));
  return {
    ...week[0],
    week,
    nextFull: nextPhase(day, "Full Moon"),
    nextNew: nextPhase(day, "New Moon"),
  };
}
