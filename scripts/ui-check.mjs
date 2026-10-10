import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import { setTimeout as sleep } from "node:timers/promises";
const root = process.cwd(),
  vite = new URL("../node_modules/vite/bin/vite.js", import.meta.url).pathname,
  chrome =
    process.env.CHROME_BIN ||
    (existsSync("/usr/bin/google-chrome")
      ? "/usr/bin/google-chrome"
      : undefined);
const port = await new Promise((resolve) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const server = spawn(
  process.execPath,
  [
    vite,
    "--mode",
    "test",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, stdio: "ignore", shell: false },
);
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}`);
      if (r.ok) break;
    } catch {}
    await sleep(250);
  }
  browser = await chromium.launch({
    headless: true,
    ...(chrome ? { executablePath: chrome } : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
  const status = await page.locator(".status").innerText();
  await page.waitForFunction(
    () =>
      ["routes", "stops", "vehicles", "reach-fill"].every(
        (layer) =>
          window.reachbloomMap?.queryRenderedFeatures({ layers: [layer] })
            .length > 0,
      ),
    {},
    { timeout: 30000 },
  );
  if (
    !status.includes("scheduled vehicles") ||
    !status.includes("stops in reach")
  )
    throw Error(
      "Bundled GTFS did not render scheduled vehicles and a reach result.",
    );
  await page.getByPlaceholder("Search stops").fill("Powell");
  await page
    .getByRole("button", { name: /Powell/ })
    .first()
    .click();
  await page.getByText("Selected stop itinerary").waitFor({ timeout: 10000 });
  await page.locator(".steps li").first().waitFor({ timeout: 10000 });
  for (let i = 0; i < 9; i++) {
    await page.locator("select").nth(2).selectOption({ index: i });
    await page.waitForTimeout(80);
  }
  await page.locator("select").nth(2).selectOption("en");
  await page.getByTitle("Dark mode").click();
  if ((await page.locator("body").getAttribute("data-theme")) !== "dark")
    throw Error("Dark theme failed.");
  await page.getByTitle("Dark mode").click();
  await page.locator("input[type=date]").fill("2026-09-03");
  await page.getByRole("button", { name: /Share/ }).click();
  if (!new URL(page.url()).searchParams.has("a"))
    throw Error("Share URL did not retain origin A.");
  const restore = await browser.newPage({
    viewport: { width: 1000, height: 700 },
  });
  await restore.goto(page.url());
  await restore.waitForTimeout(500);
  if ((await restore.locator("input[type=date]").inputValue()) !== "2026-09-03")
    throw Error("Share URL did not restore service date.");
  await restore.close();
  await page.locator("input[type=file]").setInputFiles({
    name: "broken.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("not a zip"),
  });
  await page.locator(".error").waitFor({ timeout: 10000 });
  if ((await page.locator("select").first().inputValue()) !== "sf-bart")
    throw Error("Failed import changed the current example.");
  if (await page.getByRole("button", { name: /Share/ }).isDisabled())
    throw Error("Failed import disabled sharing of the current example.");
  await page.locator("input[type=range]").fill("15");
  await page.waitForTimeout(600);
  if (!(await page.locator(".error").isVisible()))
    throw Error("A route query hid the failed import error.");
  await page
    .locator("input[type=file]")
    .setInputFiles("public/data/maywood.zip");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return s.includes("Maywood") && s.includes("stops in reach");
    },
    {},
    { timeout: 30000 },
  );
  await page.waitForTimeout(1500);
  const pin = await page.locator(".maplibregl-marker").first().boundingBox();
  if (!pin || pin.x < 0 || pin.x > 1440 || pin.y < 0 || pin.y > 1000)
    throw Error("Imported feed did not recenter its origin pin.");
  if (!(await page.getByRole("button", { name: /Share/ }).isDisabled()))
    throw Error("Private feed sharing was enabled.");
  await page.locator("select").first().selectOption("maywood");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return s.includes("Maywood") && s.includes("stops in reach");
    },
    {},
    { timeout: 30000 },
  );
  await page.locator("select").first().selectOption("yurok");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return s.includes("Yurok") && s.includes("stops in reach");
    },
    {},
    { timeout: 30000 },
  );
  await page.locator("select").first().selectOption("sf-bart");
  await page.waitForFunction(
    () => {
      const s = document.querySelector(".status")?.textContent || "";
      return (
        s.includes("Bay Area Rapid Transit") && s.includes("stops in reach")
      );
    },
    {},
    { timeout: 30000 },
  );
  for (const value of ["15", "90", "30", "45", "15", "30"])
    await page.locator("input[type=range]").fill(value);
  await page.waitForFunction(
    () =>
      /stops in reach/.test(
        document.querySelector(".status")?.textContent || "",
      ),
    {},
    { timeout: 30000 },
  );
  if ((await page.locator("input[type=range]").inputValue()) !== "30")
    throw Error("Rapid queries did not retain the latest budget.");
  if (page.workers().length > 6)
    throw Error("Completed queries left too many workers alive.");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export map/ }).click();
  const exported = await download;
  const png = await readFile((await exported.path()) ?? "");
  if (
    png.toString("ascii", 1, 4) !== "PNG" ||
    png.readUInt32BE(16) !== 1080 ||
    png.readUInt32BE(20) !== 1350
  )
    throw Error("Map export was not a 1080 × 1350 PNG.");
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    window.exportText = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      window.exportText.push(String(text));
      return original.call(this, text, ...args);
    };
  });
  for (const locale of [
    "de",
    "fr",
    "zh-TW",
    "ja",
    "ko",
    "es",
    "pt-BR",
    "zh-CN",
    "en",
  ]) {
    const translation = JSON.parse(
      await readFile(`src/locales/${locale}.json`, "utf8"),
    );
    await page.locator("select").nth(2).selectOption(locale);
    await page.evaluate(() => {
      window.exportText = [];
    });
    const nextDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: translation.export }).click();
    await nextDownload;
    const text = await page.evaluate(() => window.exportText);
    if (!text.some((line) => line.includes(translation.scheduled)))
      throw Error(`PNG schedule label is not translated for ${locale}.`);
    const captionStart =
      text.findIndex((line) => line.includes(translation.scheduled)) + 1;
    const printed = text.slice(captionStart, -1).join("").replace(/\s/g, "");
    if (printed !== translation.exportCaveat.replace(/\s/g, ""))
      throw Error(`PNG caveat was truncated for ${locale}.`);
  }
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await mobile.goto(`http://127.0.0.1:${port}`);
  await mobile.getByText(/stops in reach/).waitFor({ timeout: 30000 });
  const dims = await mobile.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  if (dims.scroll > dims.width)
    throw Error(
      `Mobile layout overflows horizontally (${dims.scroll}px > ${dims.width}px).`,
    );
  for (const language of ["zh-TW", "ja", "de", "pt-BR"]) {
    await mobile.locator("select").nth(2).selectOption(language);
    const width = await mobile.evaluate(
      () => document.documentElement.scrollWidth,
    );
    if (width > 390) throw Error(`${language} mobile layout overflows.`);
  }
  const malformed = await browser.newPage();
  malformed.on("pageerror", (error) => errors.push(error.message));
  await malformed.goto(
    `http://127.0.0.1:${port}/?city=missing&date=2026-02-30&timeB=bad&a=,37&b=0,Infinity`,
  );
  await malformed.waitForFunction(
    () =>
      / [1-9][0-9]* stops in reach/.test(
        document.querySelector(".status")?.textContent || "",
      ),
    {},
    { timeout: 30000 },
  );
  if ((await malformed.locator("select").first().inputValue()) !== "sf-bart")
    throw Error("Unknown shared city did not fall back to BART.");
  await malformed.close();
  if (errors.length) throw Error(`Browser errors: ${errors.join(", ")}`);
  console.log(
    JSON.stringify({
      desktop: "passed",
      mobile: "passed",
      locales: 9,
      share: "passed",
      import: "passed",
      export: "passed",
      selectedStop: "passed",
      map: status,
    }),
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await sleep(300);
  if (server.exitCode === null) server.kill("SIGKILL");
}
