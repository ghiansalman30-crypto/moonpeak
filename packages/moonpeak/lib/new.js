// `moonpeak new <dir>`: copy the starter template into a fresh folder.
import fs from "node:fs";
import path from "node:path";
import { PKG_DIR } from "./vite.js";
import { c } from "./log.js";

const SKIP = new Set(["node_modules", "dist", "test-results", "playwright-report", ".moonpeak"]);

function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const a = path.join(from, e.name);
    const b = path.join(to, e.name === "_gitignore" ? ".gitignore" : e.name);
    if (e.isDirectory()) copy(a, b);
    else fs.copyFileSync(a, b);
  }
}

export function scaffold(dir, { version }) {
  const target = path.resolve(dir);
  if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${dir} already exists and is not empty`);
  const template = [path.join(PKG_DIR, "templates", "starter"), path.resolve(PKG_DIR, "..", "..", "examples", "starter")].find((p) => fs.existsSync(p));
  if (!template) throw new Error("starter template not found in this moonpeak install");
  copy(template, target);

  const pkgFile = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  pkg.name = path.basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  pkg.version = "0.1.0";
  delete pkg.private;
  pkg.private = true;
  pkg.dependencies = { ...pkg.dependencies, moonpeak: `^${version}` };
  pkg.devDependencies = { "@playwright/test": "^1.56.0", ...(pkg.devDependencies || {}) };
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");

  const rel = path.relative(process.cwd(), target) || ".";
  console.log(`
  ${c.bold("moonpeak")} created ${c.cyan(rel)}

    cd ${rel}
    npm install
    npm run dev        ${c.dim("# inspector at http://localhost:3000")}

  ${c.dim("Tools live in src/tools, Views in src/resources, fixtures in tests/simulations.")}
`);
}
