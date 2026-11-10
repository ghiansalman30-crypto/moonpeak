import { z } from "zod";
import { darkness, moonOn, nextPhase, parseDate } from "../lib/moon";

export const tool = {
  title: "Plan a stargazing night",
  description:
    "Propose a stargazing plan for a night and let the user confirm or decline it in the UI. Use when the user wants to go stargazing, photograph the night sky or pick a good night to observe. Do not treat the plan as booked until the user confirms it.",
  resource: "review",
  invoking: "Planning your night",
  invoked: "Plan ready for review",
  annotations: { readOnlyHint: true },
};

export const schema = {
  date: z.string().describe("Night to plan, as YYYY-MM-DD."),
  place: z.string().max(80).optional().describe("Where the user will observe, e.g. a town or park."),
};

const TARGETS = {
  excellent: ["Milky Way core", "Andromeda Galaxy", "Faint meteors", "Star clusters"],
  good: ["Bright star clusters", "Planets", "Double stars"],
  fair: ["Planets", "Bright double stars", "The Moon's terminator through binoculars"],
  poor: ["The Moon itself", "Planets", "Bright stars only"],
} as const;

export default async function planNight({ date, place }: { date: string; place?: string }) {
  const day = moonOn(parseDate(date));
  const dark = darkness(day.illumination);
  const better = dark === "poor" || dark === "fair" ? nextPhase(parseDate(date), "New Moon") : null;
  return {
    date: day.date,
    place: place?.trim() || null,
    phase: day.phase,
    illumination: day.illumination,
    waxing: day.waxing,
    darkness: dark,
    targets: [...TARGETS[dark]],
    betterNight: better,
    status: "proposed" as const,
  };
}
