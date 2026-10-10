import { spawn, execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";
const run = promisify(execFile);
const temp = await mkdtemp(join(tmpdir(), "reachbloom-package-"));
const root = process.cwd();
let server;
async function npm(args, cwd) {
  const npmCli = process.env.npm_execpath;
  return npmCli
    ? run(process.execPath, [npmCli, ...args], {
        cwd,
        maxBuffer: 2 * 1024 * 1024,
      })
    : run("npm", args, { cwd, maxBuffer: 2 * 1024 * 1024 });
}
try {
  const { stdout } = await npm(
    ["pack", "--pack-destination", temp, "--json"],
    root,
  );
  const archive = JSON.parse(stdout.slice(stdout.indexOf("[")))[0].filename;
  const install = join(temp, "install");
  const outside = join(temp, "outside");
  await mkdir(install);
  await mkdir(outside);
  await npm(
    ["install", "--omit=dev", "--no-audit", "--no-fund", join(temp, archive)],
    install,
  );
  const cli = join(
    install,
    "node_modules",
    "reachbloom",
    "bin",
    "reachbloom.mjs",
  );
  const version = await run(
    join(install, "node_modules", ".bin", "reachbloom"),
    ["--version"],
    {
      cwd: outside,
    },
  );
  if (
    version.stdout.trim() !==
    JSON.parse(await readFile(join(root, "package.json"), "utf8")).version
  )
    throw Error("Installed CLI version failed.");
  const help = await run(process.execPath, [cli, "--help"], { cwd: outside });
  if (!help.stdout.includes("127.0.0.1"))
    throw Error("Installed CLI help failed.");
  const port = await new Promise((resolve) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const value = s.address().port;
      s.close(() => resolve(value));
    });
  });
  server = spawn(process.execPath, [cli, String(port)], {
    cwd: outside,
    stdio: "ignore",
  });
  const url = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(100);
  }
  if (!ready)
    throw Error("Installed CLI failed to start outside its checkout.");
  const html = await (await fetch(url)).text();
  if (!html.includes("Reachbloom") || !html.includes("/assets/"))
    throw Error("Packed production HTML is missing.");
  const feed = await fetch(`${url}/data/bart.zip`);
  if (!feed.ok || (await feed.arrayBuffer()).byteLength < 800000)
    throw Error("Pack omitted the bundled schedule.");
  if (!(await fetch(`${url}/maplibre-gl-worker.mjs`)).ok)
    throw Error("Pack omitted the map worker.");
  if ((await fetch(`${url}/..%2fpackage.json`)).status !== 404)
    throw Error("Static server allowed a path outside its root.");
  if ((await fetch(url, { method: "POST" })).status !== 405)
    throw Error("Static server accepted an unsupported method.");
  console.log(
    "PASS: packed production CLI, external working directory, static assets and request boundaries",
  );
} catch (error) {
  console.error(
    error.stderr ? String(error.stderr).slice(-1500) : error.message,
  );
  process.exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  if (server) {
    await sleep(300);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  await rm(temp, { recursive: true, force: true });
}
