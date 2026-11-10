#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { c } from "../lib/log.js";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = JSON.parse(fs.readFileSync(path.join(PKG_DIR, "package.json"), "utf8")).version;

const HELP = `
  ${c.bold("moonpeak")} ${c.dim("v" + VERSION)}  MCP App framework + MCP testing framework

  ${c.bold("Usage")}
    moonpeak new [name] [resources]    scaffold a project, e.g. new my-app calendar,review
    moonpeak dev [--port 3000]         MCP server + inspector with hot reload
    moonpeak build                     bundle Views and server into dist/
    moonpeak start [--port 8000]       serve the built project at /mcp
    moonpeak inspect --server <url>    inspect any MCP server in ChatGPT/Claude style hosts
    moonpeak test                      schema checks, View checks and simulations
    moonpeak test init [--server <url>]  write a simulation per tool
    moonpeak test --e2e                Playwright tests against the inspector
    moonpeak test --visual [--update]  screenshot tests (tag them @visual)
    moonpeak test --eval               check models pick the right tool (needs API keys)
    moonpeak test --server <url>       test any MCP server, in any language
    moonpeak upgrade                   update moonpeak in this project

  ${c.bold("Options")}
    --port <n>        port (dev defaults to 3000, start to 8000 or $PORT)
    --open            open the inspector in your browser
    --header k:v      extra header for --server (repeatable), e.g. "authorization:Bearer x"
    --filter <text>   only run tests whose tool or simulation matches
    --install / --no-install   new: install dependencies without asking
    -y, --yes         new: accept the defaults
`;

function parse(argv) {
  const out = { _: [], header: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      const next = argv[i + 1];
      const isFlag = v === undefined && (next === undefined || next.startsWith("--"));
      const val = v !== undefined ? v : isFlag ? true : argv[++i];
      if (k === "header") out.header.push(val);
      else out[k] = val;
    } else if (/^-[a-z]$/i.test(a)) out[a.slice(1)] = true;
    else out._.push(a);
  }
  return out;
}

function headersFrom(list) {
  const h = {};
  for (const item of list) {
    const i = String(item).indexOf(":");
    if (i > 0) h[item.slice(0, i).trim().toLowerCase()] = item.slice(i + 1).trim();
  }
  return Object.keys(h).length ? h : undefined;
}

const quote = (a) => (/^[\w@%+=:,./#-]+$/.test(a) ? a : `"${String(a).replace(/"/g, '\\"')}"`);

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    // One command string (not cmd + args) so npx works on Windows without the shell-args deprecation.
    const p = spawn([cmd, ...args].map(quote).join(" "), { stdio: "inherit", shell: true, ...opts });
    p.on("exit", (code) => resolve(code ?? 1));
  });
}

async function main() {
  const args = parse(process.argv.slice(2));
  const cmd = args._[0];
  const { findRoot } = await import("../lib/project.js");
  const root = findRoot();

  if (cmd === "version" || args.version || args.v) return console.log(VERSION);
  if (!cmd || cmd === "help" || args.help || args.h) return console.log(HELP);

  if (cmd === "new") {
    const { newProject } = await import("../lib/new.js");
    const install = args["no-install"] ? false : args.install ? true : undefined;
    return newProject(args._[1], { version: VERSION, install, yes: Boolean(args.yes || args.y), resources: args._[2] });
  }

  if (cmd === "dev") {
    const { startDev } = await import("../lib/dev.js");
    await startDev({ root, port: Number(args.port) || undefined, open: Boolean(args.open) });
    return;
  }

  if (cmd === "inspect") {
    if (!args.server || args.server === true) throw new Error("usage: moonpeak inspect --server http://localhost:8000/mcp");
    const { startDev } = await import("../lib/dev.js");
    const { discoverSimulations } = await import("../lib/project.js");
    await startDev({ root, port: Number(args.port) || undefined, open: Boolean(args.open), remote: { url: args.server, headers: headersFrom(args.header), simulations: discoverSimulations(root) } });
    return;
  }

  if (cmd === "build") {
    const { buildProject } = await import("../lib/build.js");
    await buildProject({ root, outDir: args.out || "dist" });
    return;
  }

  if (cmd === "start") {
    const { startProd } = await import("../lib/start.js");
    await startProd({ root, port: args.port, outDir: args.out || "dist" });
    return;
  }

  if (cmd === "test") {
    let server = args.server && args.server !== true ? args.server : undefined;
    const cfgFile = path.join(root, "moonpeak.test.json");
    if (!server && fs.existsSync(cfgFile) && !fs.existsSync(path.join(root, "src", "tools"))) server = JSON.parse(fs.readFileSync(cfgFile, "utf8")).server;
    const headers = headersFrom(args.header);

    if (args._[1] === "init") {
      const { initTests } = await import("../lib/test/runner.js");
      const files = await initTests({ root, server, headers });
      console.log(files.length ? `\n  wrote\n${files.map((f) => "    " + c.green(f)).join("\n")}\n\n  next: ${c.cyan("moonpeak test")}\n` : "\n  every tool already has a simulation\n");
      return;
    }

    if (args.e2e || args.visual) {
      const { startDev } = await import("../lib/dev.js");
      const { discoverSimulations } = await import("../lib/project.js");
      const dev = await startDev({ root, quiet: true, port: Number(args.port) || 3100, remote: server ? { url: server, headers, simulations: discoverSimulations(root) } : undefined });
      console.log(`\n  ${c.bold("moonpeak test --e2e")} ${c.dim("inspector at " + dev.url)}\n`);
      // Run the project's own Playwright CLI with node directly: no npx, no shell,
      // so it behaves the same under `npx moonpeak`, npm scripts and CI.
      const { createRequire } = await import("node:module");
      let cli;
      try {
        cli = createRequire(path.join(root, "package.json")).resolve("@playwright/test/cli");
      } catch {
        await dev.close();
        throw new Error("e2e tests need Playwright in this project: npm i -D @playwright/test && npx playwright install chromium");
      }
      const pw = [cli, "test"];
      // --e2e is functional tests only; screenshots are opt-in with --visual
      // (baselines are per machine, so they shouldn't break a plain e2e run).
      if (args.visual) pw.push("--grep", "@visual");
      else pw.push("--grep-invert", "@visual");
      if (args.update) pw.push("--update-snapshots");
      else if (args.visual) pw.push("--update-snapshots=missing"); // first run records baselines instead of failing
      for (const extra of args._.slice(1)) pw.push(extra);
      const code = await new Promise((resolve) => {
        const p = spawn(process.execPath, pw, { cwd: root, stdio: "inherit", env: { ...process.env, MOONPEAK_URL: dev.url } });
        p.on("exit", (c) => resolve(c ?? 1));
      });
      await dev.close();
      process.exit(code);
    }

    if (args.eval) {
      const { runEvals } = await import("../lib/test/eval.js");
      const { failed } = await runEvals({ root, server, headers, filter: args.filter });
      process.exit(failed ? 1 : 0);
    }

    const { runTests } = await import("../lib/test/runner.js");
    const { failed } = await runTests({ root, server, headers, filter: args.filter });
    process.exit(failed ? 1 : 0);
  }

  if (cmd === "upgrade") {
    // Prefer the npm that launched us (npm_execpath), so the right npm is used even under npx.
    const npmCli = process.env.npm_execpath && /npm-cli\.js$/.test(process.env.npm_execpath) ? process.env.npm_execpath : null;
    const code = npmCli
      ? await new Promise((resolve) => spawn(process.execPath, [npmCli, "install", "moonpeak@latest"], { cwd: root, stdio: "inherit" }).on("exit", (c) => resolve(c ?? 1)))
      : await run("npm", ["install", "moonpeak@latest"], { cwd: root });
    process.exit(code);
  }

  console.log(HELP);
  process.exit(1);
}

main().catch((e) => {
  console.error(`\n  ${c.red("error")} ${e?.message || e}\n`);
  if (process.env.DEBUG) console.error(e);
  process.exit(1);
});
