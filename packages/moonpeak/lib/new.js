// `moonpeak new [name]`: copy the starter template into a fresh folder.
// Interactive when run in a terminal (asks for a name and whether to install),
// silent and predictable everywhere else (CI, scripts): no prompts, no install.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { PKG_DIR } from "./vite.js";
import { c } from "./log.js";

const SKIP = new Set(["node_modules", "dist", "test-results", "playwright-report", ".moonpeak", ".vite", "__screenshots__"]);
const DEFAULT_NAME = "moonpeak-app";

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

/** npm, pnpm, yarn or bun: whichever ran us (npx, pnpm dlx, yarn dlx, bunx). */
export function packageManager(ua = process.env.npm_config_user_agent || "") {
  const name = ua.split("/")[0];
  return ["pnpm", "yarn", "bun"].includes(name) ? name : "npm";
}

const validName = (s) => /^[a-z0-9][a-z0-9._-]*$/i.test(s) && !/^(node_modules|favicon\.ico)$/i.test(s);

function templateDir() {
  // In the monorepo the live example wins; an npm install only has the packed copy.
  const t = [path.resolve(PKG_DIR, "..", "..", "examples", "starter"), path.join(PKG_DIR, "templates", "starter")].find((p) => fs.existsSync(path.join(p, "package.json")));
  if (!t) throw new Error("starter template not found in this moonpeak install");
  return t;
}

/** Resources the starter offers: { moon: { description, files }, ... } */
export function templateResources() {
  const f = path.join(templateDir(), "moonpeak.template.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).resources : {};
}

/** "calendar,review" -> ["calendar","review"], checked against what the template offers. */
export function pickResources(input, available) {
  const all = Object.keys(available);
  if (input === undefined || input === true || String(input).trim() === "" || String(input).trim() === "all") return all;
  const picked = [...new Set(String(input).split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  const unknown = picked.filter((r) => !all.includes(r));
  if (unknown.length) throw new Error(`unknown resource ${unknown.join(", ")}. Available: ${all.join(", ")}`);
  if (!picked.length) throw new Error(`pick at least one resource: ${all.join(", ")}`);
  return picked;
}

export function scaffold(dir, { version, resources } = {}) {
  const target = path.resolve(dir);
  if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${dir} already exists and is not empty`);
  const template = templateDir();
  copy(template, target);

  // Drop the resources that weren't picked, then the manifest itself.
  const offered = templateResources();
  const keep = new Set(resources || Object.keys(offered));
  for (const [name, r] of Object.entries(offered)) {
    if (keep.has(name)) continue;
    for (const f of r.files) fs.rmSync(path.join(target, f), { recursive: true, force: true });
  }
  fs.rmSync(path.join(target, "moonpeak.template.json"), { force: true });

  const pkgFile = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  pkg.name = path.basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  pkg.version = "0.1.0";
  pkg.private = true;
  pkg.dependencies = { ...pkg.dependencies, moonpeak: `^${version}` };
  pkg.devDependencies = { "@playwright/test": "^1.56.0", ...(pkg.devDependencies || {}) };
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
  return target;
}

function install(pm, cwd) {
  return new Promise((resolve) => {
    const p = spawn(`${pm} install`, { cwd, stdio: "inherit", shell: true });
    p.on("exit", (code) => resolve(code ?? 1));
    p.on("error", () => resolve(1));
  });
}

export async function newProject(name, { version, install: wantInstall, yes = false, resources: resourceArg } = {}) {
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !yes;
  const pm = packageManager();
  let rl;
  const ask = async (q, def) => {
    rl ||= createInterface({ input: process.stdin, output: process.stdout });
    const a = (await rl.question(`  ${c.cyan("?")} ${q} ${c.dim(`(${def})`)} `)).trim();
    return a || def;
  };

  try {
    if (!name) {
      name = DEFAULT_NAME;
      if (tty) {
        for (;;) {
          name = await ask("Project name", DEFAULT_NAME);
          if (validName(name)) break;
          console.log(`    ${c.red("use letters, numbers, dots, dashes or underscores")}`);
        }
      }
    }
    const target = path.resolve(name);
    if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${name} already exists and is not empty`);

    const offered = templateResources();
    const names = Object.keys(offered);
    let resources;
    if (resourceArg !== undefined || !tty || names.length < 2) resources = pickResources(resourceArg, offered);
    else {
      console.log(`\n  ${c.bold("Resources")} ${c.dim("(the Views your app starts with)")}`);
      for (const n of names) console.log(`    ${c.cyan(n.padEnd(10))} ${c.dim(offered[n].description)}`);
      for (;;) {
        try {
          resources = pickResources(await ask("Which resources? comma separated", "all"), offered);
          break;
        } catch (e) {
          console.log(`    ${c.red(e.message)}`);
        }
      }
    }

    let doInstall = wantInstall;
    if (doInstall === undefined) doInstall = tty ? /^y/i.test(await ask(`Install dependencies with ${pm}?`, "Y")) : false;
    rl?.close();
    rl = null;

    scaffold(name, { version, resources });
    const rel = path.relative(process.cwd(), target) || ".";
    console.log(`\n  ${c.bold("moonpeak")} created ${c.cyan(rel)} ${c.dim(`with ${resources.join(", ")}`)}\n`);

    let installed = false;
    if (doInstall) {
      console.log(c.dim(`  ${pm} install\n`));
      installed = (await install(pm, target)) === 0;
      if (!installed) console.log(`\n  ${c.red("install failed")}, run it yourself inside ${rel}`);
    }
    const run = pm === "npm" ? "npm run" : pm;
    console.log(`
  Next:

    cd ${rel}${installed ? "" : `\n    ${pm} install`}
    ${run} dev          ${c.dim("# inspector at http://localhost:3000, MCP server at /mcp")}

  ${c.dim("Tools live in src/tools, Views in src/resources, fixtures in tests/simulations.")}
  ${c.dim("Before the first e2e run: npx playwright install chromium")}
  ${c.dim("Docs: https://moonpeak-ai.com/docs/")}
`);
  } finally {
    rl?.close();
  }
}
