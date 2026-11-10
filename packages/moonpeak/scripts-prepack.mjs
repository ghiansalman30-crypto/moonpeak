// Copies examples/starter into templates/starter so `npx moonpeak new` works from npm.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const from = path.resolve(here, "..", "..", "examples", "starter");
const to = path.join(here, "templates", "starter");
const SKIP = new Set(["node_modules", "dist", "test-results", "playwright-report", ".vite", "__screenshots__"]);

function copy(a, b) {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const src = path.join(a, e.name);
    const dst = path.join(b, e.name === ".gitignore" ? "_gitignore" : e.name);
    if (e.isDirectory()) copy(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

fs.rmSync(to, { recursive: true, force: true });
copy(from, to);
console.error("template copied");
