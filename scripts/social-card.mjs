import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const asset = async (name) =>
  (await readFile(new URL(`../assets/${name}`, import.meta.url))).toString(
    "base64",
  );
const [logo, map] = await Promise.all([
  asset("logo.svg"),
  asset("hero-light.png"),
]);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_BIN || existsSync("/usr/bin/google-chrome")
    ? { executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" }
    : {}),
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
  * {box-sizing:border-box} body {margin:0;background:#132a38;color:#f4f8fa;font-family:Arial,sans-serif}
  .card {width:1200px;height:675px;position:relative;overflow:hidden}
  .brand {position:absolute;left:55px;top:48px;display:flex;align-items:center;gap:14px;font-size:28px;font-weight:700;letter-spacing:-.7px}
  .brand img {width:48px;height:48px}.eyebrow {position:absolute;left:60px;top:190px;color:#6bd2c8;font-size:15px;letter-spacing:2px;font-weight:700}
  h1 {position:absolute;left:55px;top:220px;margin:0;font-size:64px;line-height:1.03;letter-spacing:-3px;font-weight:700}
  .copy {position:absolute;left:60px;top:468px;width:365px;color:#c7dce2;font-size:21px;line-height:1.45}
  .url {position:absolute;left:60px;bottom:50px;font-size:17px;color:#6bd2c8}
  .preview {position:absolute;left:465px;top:154px;width:810px;height:540px;transform:rotate(-3deg);border:7px solid #2c4654;border-radius:18px;box-shadow:0 20px 60px #03131c99;object-fit:contain}
  .label {position:absolute;right:55px;top:63px;font-size:15px;color:#c7dce2;border:1px solid #547582;border-radius:24px;padding:11px 17px}
  </style></head><body><div class="card"><div class="brand"><img alt="" src="data:image/svg+xml;base64,${logo}">Reachbloom</div><div class="label">A real BART session</div><div class="eyebrow">MOVE A PIN. READ THE TIMETABLE.</div><h1>See where<br>30 minutes<br>can take you.</h1><p class="copy">Scheduled departures.<br>Straight line walking.<br>One map to compare both.</p><img class="preview" alt="Reachbloom map with a scheduled transit reach result" src="data:image/png;base64,${map}"><div class="url">github.com/Arthur031221/Reachbloom</div><div style="position:absolute;right:18px;bottom:12px;font-size:11px;color:#20323c;background:#f4f8fa;padding:3px 6px">© OpenStreetMap contributors</div></div></body></html>`);
  await page.screenshot({ path: "assets/social-card.png" });
} finally {
  await browser.close();
}
