// Always throws, to check error results end to end.
export const tool = {
  title: "Explode",
  description: "Always fails with a clear message. Used to test error handling.",
};

export default async function explode() {
  throw new Error("boom: this tool always fails");
}
