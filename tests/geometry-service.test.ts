import { it, expect } from "vitest";
import { reachArea } from "../src/core/reach-area";
import { scheduledVehicles } from "../src/core/service";
import { matchesMode } from "../src/core/routing";
import type { Feed } from "../src/core/types";
it("classifies both standard and extended modes", () => {
  for (const t of [3, 11, 200, 700, 800])
    expect(matchesMode(t, "bus")).toBe(true);
  for (const t of [4, 1000, 1200]) expect(matchesMode(t, "ferry")).toBe(true);
  expect(matchesMode(3, "rail")).toBe(false);
  expect(matchesMode(2, "rail")).toBe(true);
});
it("uses direct alighting time even when walking reaches the stop earlier", () => {
  const stop = { id: "s", name: "s", lon: 0.017, lat: 0 };
  const field = reachArea(
    [stop],
    [{ stopId: "s", minutes: 20, round: 1, prev: "nearby", alightMinutes: 25 }],
    [],
    [0, 0],
    undefined,
    30,
  );
  const transitPoints = field.features
    .flatMap((f) => f.geometry.coordinates[0])
    .filter((p) => p[0] > 0.01);
  expect(transitPoints.length).toBeGreaterThan(0);
  expect(Math.max(...transitPoints.map((p) => p[0]))).toBeLessThan(0.021);
  const walkingOnly = reachArea(
    [stop],
    [{ stopId: "s", minutes: 20, round: 1, prev: "nearby" }],
    [],
    [0, 0],
    undefined,
    30,
  );
  expect(
    walkingOnly.features.every((f) =>
      f.geometry.coordinates[0].every((p) => p[0] < 0.01),
    ),
  ).toBe(true);
});
it("recognizes overlapping origins across the antimeridian", () => {
  const field = reachArea([], [], [], [179.999, 0], [-179.999, 0], 30);
  expect(field.features.some((f) => f.properties.color === "#8768b2")).toBe(
    true,
  );
});
it("does not draw travel area with no time remaining", () => {
  const far = { id: "s", name: "s", lon: 0.1, lat: 0 };
  const field = reachArea(
    [far],
    [{ stopId: "s", minutes: 45, round: 1 }],
    [],
    [0, 0],
    undefined,
    45,
  );
  expect(
    field.features.every((f) =>
      f.geometry.coordinates[0].every((p) => p[0] < 0.02),
    ),
  ).toBe(true);
});
it("keeps disconnected walking areas separate and detects overlapping areas", () => {
  const f = reachArea([], [], [], [0, 0], [0.001, 0], 30);
  expect(f.features.some((p) => p.properties.color === "#8768b2")).toBe(true);
  const separate = reachArea([], [], [], [0, 0], [0.1, 0], 30);
  expect(separate.features.some((p) => p.properties.color === "#8768b2")).toBe(
    false,
  );
});
it("moves vehicles along a curved shape and retains yesterday's overnight trip", () => {
  const feed: Feed = {
    agency: "Test",
    timezone: "UTC",
    stops: [
      { id: "a", name: "a", lon: 0, lat: 0 },
      { id: "b", name: "b", lon: 0.01, lat: 0.01 },
    ],
    routes: [],
    trips: [
      {
        id: "t",
        routeId: "r",
        serviceId: "s",
        shapeId: "p",
        calls: [
          {
            stopId: "a",
            arr: 86400,
            dep: 86400,
            seq: 1,
            pickup: 0,
            dropoff: 0,
          },
          {
            stopId: "b",
            arr: 87600,
            dep: 87600,
            seq: 2,
            pickup: 0,
            dropoff: 0,
          },
        ],
      },
    ],
    shapes: {
      p: [
        { lon: 0, lat: 0, seq: 1 },
        { lon: 0, lat: 0.01, seq: 2 },
        { lon: 0.01, lat: 0.01, seq: 3 },
      ],
    },
    services: {
      s: {
        start: "20260824",
        end: "20260824",
        days: [true, true, true, true, true, true, true],
      },
    },
    exceptions: {},
    transfers: [],
    warnings: [],
    errors: [],
  };
  const v = scheduledVehicles(feed, "2026-08-25", 600);
  expect(v).toHaveLength(1);
  expect(v[0].lat).toBeCloseTo(0.01, 5);
  expect(v[0].lon).toBeCloseTo(0, 5);
  const end = scheduledVehicles(feed, "2026-08-25", 1200)[0];
  expect(end.lat).toBeCloseTo(0.01, 5);
  expect(end.lon).toBeCloseTo(0.01, 5);
});
