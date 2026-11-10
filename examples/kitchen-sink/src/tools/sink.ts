import { z } from "zod";

// Every View-facing feature in one tool, used by moonpeak's own end-to-end checks.
export const tool = {
  title: "Kitchen sink",
  description: "Demo tool that exercises every moonpeak hook and host action.",
  resource: "sink",
  invoking: "Filling the sink",
  invoked: "Sink ready",
};

export const schema = {
  label: z.string().default("hello").describe("Text echoed back"),
  count: z.number().int().min(0).max(100).default(3),
};

export const outputSchema = {
  label: z.string(),
  items: z.array(z.number()),
  at: z.string(),
};

export default async function sink({ label, count }: { label: string; count: number }) {
  return { label, items: Array.from({ length: count }, (_, i) => i + 1), at: "fixed" };
}
