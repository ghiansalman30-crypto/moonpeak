import { z } from "zod";

// App-only helper: the View calls it, the model never sees it.
export const tool = {
  title: "Add",
  description: "Add two numbers. Called from the kitchen-sink View.",
  visibility: ["app"] as ("model" | "app")[],
};

export const schema = { a: z.number(), b: z.number() };

export default async function add({ a, b }: { a: number; b: number }) {
  return { content: [{ type: "text", text: String(a + b) }], structuredContent: { sum: a + b } };
}
