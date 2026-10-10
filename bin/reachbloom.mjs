#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
if (process.argv.includes("--help")) {
  console.log(
    "Usage: reachbloom [port]\nServes the bundled map on 127.0.0.1. Default port: 4173.",
  );
  process.exit(0);
}
if (process.argv.includes("--version")) {
  console.log(
    JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ).version,
  );
  process.exit(0);
}
const value = process.argv[2] || process.env.PORT || "4173";
if (!/^\d{1,5}$/.test(value) || +value < 1 || +value > 65535) {
  console.error("Choose a port between 1 and 65535.");
  process.exit(2);
}
if (!existsSync(resolve(root, "index.html"))) {
  console.error("Built files are missing. Run npm run build in the checkout.");
  process.exit(1);
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".zip": "application/zip",
};
const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }
  let file;
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    );
    file = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (
    !file.startsWith(root.endsWith(sep) ? root : root + sep) ||
    !existsSync(file) ||
    !statSync(file).isFile()
  ) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  const stream = createReadStream(file);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
});
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `Port ${value} is in use. Try reachbloom ${+value + 1}.`
      : e.message,
  );
  process.exitCode = 1;
});
server.listen(+value, "127.0.0.1", () =>
  console.log(`Reachbloom: http://127.0.0.1:${value}\nPress Ctrl+C to stop.`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.close(() => process.exit(0)));
