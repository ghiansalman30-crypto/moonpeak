// Real moon phase math, no API needed.
const SYNODIC = 29.530588853; // days between two new moons
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC

export const PHASES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
] as const;

export type MoonDay = {
  date: string; // YYYY-MM-DD
  age: number; // days since new moon
  illumination: number; // 0..1
  phase: (typeof PHASES)[number];
  waxing: boolean;
};

export function moonOn(date: Date): MoonDay {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const index = Math.round((age / SYNODIC) * 8) % 8;
  return {
    date: date.toISOString().slice(0, 10),
    age: Math.round(age * 10) / 10,
    illumination: Math.round(illumination * 1000) / 1000,
    phase: PHASES[index],
    waxing: age < SYNODIC / 2,
  };
}

/** The next calendar day (after `from`) closest to the exact full or new moon. */
export function nextPhase(from: Date, target: "Full Moon" | "New Moon"): string {
  const goal = target === "Full Moon" ? SYNODIC / 2 : 0;
  const days = (from.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  let ahead = (goal - age + SYNODIC) % SYNODIC;
  if (ahead < 0.5) ahead += SYNODIC; // already there today: give the next one
  const exact = new Date(from.getTime() + ahead * 86_400_000);
  return exact.toISOString().slice(0, 10);
}

export function parseDate(input?: string): Date {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) throw new Error(`"${input}" is not a date. Use YYYY-MM-DD.`);
  const d = new Date(input + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) throw new Error(`"${input}" is not a real date.`);
  return d;
}
