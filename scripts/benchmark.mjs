import { format } from "prettier";
import { readFile } from "node:fs/promises";
import { parseFeed } from "../src/worker/gtfs.worker.ts";
import { routeReach, isServiceActive } from "../src/core/routing.ts";
const bytes = await readFile(
  new URL("../public/data/bart.zip", import.meta.url),
);
const buffer = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
);
const started = performance.now();
const feed = parseFeed(buffer);
const parseMs = Math.round(performance.now() - started);
const demoDate = "2026-08-24",
  activeTrips = feed.trips.filter((t) =>
    isServiceActive(feed, t.serviceId, demoDate),
  ).length;
const routeStarted = performance.now();
const reach = routeReach(
  feed,
  { lat: 37.7764, lon: -122.4167 },
  demoDate,
  8 * 3600,
  45,
  4,
);
const routingMs = Math.round(performance.now() - routeStarted);
const result = {
  generatedAt: new Date().toISOString(),
  feed: "BART GTFS bundled at public/data/bart.zip",
  method:
    "Counts are produced from the same local parser used by the app. Active trips use calendar and calendar_dates on 2026-08-24. Reach uses Origin A at 37.7764,-122.4167, 08:00, a 45 minute horizon and four rides.",
  measurements: {
    validStops: feed.stops.length,
    routes: feed.routes.length,
    usableTrips: feed.trips.length,
    activeTripsOnDemoDate: activeTrips,
    reachableStops: reach.length,
    parseMilliseconds: parseMs,
    routingMilliseconds: routingMs,
    compressedZipBytes: bytes.length,
  },
  warnings: feed.warnings,
};
await (
  await import("node:fs/promises")
).writeFile(
  new URL("../benchmarks/results.json", import.meta.url),
  await format(JSON.stringify(result), { parser: "json" }),
);
console.log(JSON.stringify(result, null, 2));
