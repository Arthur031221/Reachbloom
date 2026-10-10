import { spawn, execFile } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
const run = promisify(execFile),
  root = process.cwd(),
  vite = new URL("../node_modules/vite/bin/vite.js", import.meta.url).pathname,
  frames = await mkdtemp(join(tmpdir(), "reachbloom-demo-"));
const port = await new Promise((resolve) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const server = spawn(
  process.execPath,
  [vite, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: root, stdio: "ignore", shell: false },
);
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}`)).ok) break;
    } catch {}
    await sleep(250);
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_BIN || existsSync("/usr/bin/google-chrome")
      ? { executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" }
      : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${port}`);
  await page.getByText(/stops in reach/).waitFor({ timeout: 30000 });
  await page.waitForFunction(
    () =>
      / [1-9][0-9]* stops in reach/.test(
        document.querySelector(".status")?.textContent || "",
      ),
    {},
    { timeout: 30000 },
  );
  await sleep(1500);
  await page.screenshot({ path: "assets/hero-light.png" });
  await page.getByTitle("Dark mode").click();
  await sleep(500);
  await page.screenshot({ path: "assets/hero-dark.png" });
  await page.getByTitle("Dark mode").click();
  await sleep(300);
  const framesCount = 30;
  for (let i = 0; i < framesCount; i++) {
    if (i === 4) {
      await page.locator("input[type=range]").fill("15");
      await sleep(500);
    }
    if (i === 8) {
      await page.locator("input[type=range]").fill("45");
      await sleep(500);
    }
    if (i === 12) {
      await page.getByRole("button", { name: /Compare origins/ }).click();
      await sleep(500);
    }
    if (i === 17) {
      await page.getByRole("button", { name: /Play/ }).click();
    }
    if (i === 22) {
      await page.getByRole("button", { name: /Pause/ }).click();
      await page.getByPlaceholder("Search stops").fill("Powell");
    }
    if (i === 24) {
      await page
        .getByRole("button", { name: /Powell/ })
        .first()
        .click();
      await page.locator(".steps li").first().waitFor({ timeout: 30000 });
    }
    await page.screenshot({
      path: join(frames, `frame-${String(i).padStart(3, "0")}.png`),
    });
    await sleep(500);
  }
  await page.locator(".close").click();
  await page.locator("select").first().selectOption("maywood");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return s.includes("Maywood") && s.includes("stops in reach");
    },
    {},
    { timeout: 30000 },
  );
  await sleep(1200);
  await page.screenshot({ path: "assets/bus.png" });
  await page.locator("select").first().selectOption("yurok");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return s.includes("Yurok") && s.includes("stops in reach");
    },
    {},
    { timeout: 30000 },
  );
  await sleep(1200);
  await page.screenshot({ path: "assets/ferry.png" });
  await run(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "2",
      "-i",
      join(frames, "frame-%03d.png"),
      "-vf",
      "fps=2,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff",
      join(frames, "palette.png"),
    ],
    { cwd: root, maxBuffer: 1024 * 1024 },
  );
  await run(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "2",
      "-i",
      join(frames, "frame-%03d.png"),
      "-i",
      join(frames, "palette.png"),
      "-lavfi",
      "fps=2,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer",
      "-loop",
      "0",
      "assets/demo.gif",
    ],
    { cwd: root, maxBuffer: 1024 * 1024 },
  );
  console.log(
    "Recorded a 15 second browser demo from the running application.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await sleep(300);
  if (server.exitCode === null) server.kill("SIGKILL");
  await rm(frames, { recursive: true, force: true });
}
