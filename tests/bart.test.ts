import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseFeed } from "../src/worker/gtfs.worker";
import { routeReach, isServiceActive } from "../src/core/routing";
it("validates bundled BART GTFS records and computes an active journey field", () => {
  const bytes = readFileSync("public/data/bart.zip");
  const f = parseFeed(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  expect(f.stops.length).toBeGreaterThan(200);
  expect(f.trips.length).toBeGreaterThan(1000);
  expect(f.routes.length).toBeGreaterThan(5);
  const active = f.trips.filter((x) =>
    isServiceActive(f, x.serviceId, "2026-08-24"),
  );
  const reach = routeReach(
    f,
    { lat: 37.7764, lon: -122.4167 },
    "2026-08-24",
    8 * 3600,
    45,
  );
  console.log(
    JSON.stringify({
      stops: f.stops.length,
      routes: f.routes.length,
      trips: f.trips.length,
      activeTrips: active.length,
      reachableStops: reach.length,
      warnings: f.warnings,
    }),
  );
  expect(active.length).toBeGreaterThan(0);
  expect(reach.length).toBeGreaterThan(5);
});
