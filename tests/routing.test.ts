import { describe, expect, it } from "vitest";
import { routeReach, isServiceActive, findJourney } from "../src/core/routing";
import type { Feed } from "../src/core/types";
const feed = (trips: Feed["trips"]): Feed => ({
  agency: "Test",
  timezone: "UTC",
  stops: [
    ["a", 0, 0],
    ["b", 0, 0.01],
    ["c", 0, 0.02],
    ["d", 0.01, 0.01],
  ].map(([id, lat, lon]) => ({
    id: String(id),
    name: String(id),
    lat: +lat,
    lon: +lon,
  })),
  routes: [{ id: "r", short: "R", long: "", color: "#000000", type: 2 }],
  trips,
  shapes: {},
  services: {
    weekday: {
      start: "20260101",
      end: "20261231",
      days: [true, true, true, true, true, true, true],
    },
    other: {
      start: "20260101",
      end: "20261231",
      days: [false, false, false, false, false, false, false],
    },
  },
  exceptions: { other: [20260824], weekday: [-20260824] },
  transfers: [],
  warnings: [],
  errors: [],
});
const trip = (
  id: string,
  calls: [string, number, number][],
  route = "r",
  service = "weekday",
): Feed["trips"][number] => ({
  id,
  routeId: route,
  serviceId: service,
  calls: calls.map(([stopId, arr, dep], seq) => ({
    stopId,
    arr,
    dep,
    seq,
    pickup: 0,
    dropoff: 0,
  })),
});
describe("calendar and scheduled routing", () => {
  it.each([1, 4, 5])(
    "allows scheduled reboarding for transfer type %s",
    (type) => {
      const f = feed([
        trip("first", [
          ["a", 28800, 28800],
          ["b", 29400, 29400],
        ]),
        trip("next", [
          ["b", 29520, 29520],
          ["c", 30000, 30000],
        ]),
      ]);
      f.exceptions = {};
      f.transfers = [
        { from: "b", to: "b", type, min: 0, tripFrom: "first", tripTo: "next" },
      ];
      expect(
        routeReach(f, { lat: 0, lon: 0 }, "2026-08-24", 28800, 30).find(
          (r) => r.stopId === "c",
        )?.minutes,
      ).toBe(20);
    },
  );
  it("applies inclusive service range and additions/removals", () => {
    const f = feed([]);
    expect(isServiceActive(f, "weekday", "2026-08-23")).toBe(true);
    expect(isServiceActive(f, "weekday", "2026-08-24")).toBe(false);
    expect(isServiceActive(f, "other", "2026-08-24")).toBe(true);
  });
  it("finds downstream stops on a service day and preserves overnight trips", () => {
    const f = feed([
      trip("late", [
        ["a", 23 * 3600, 23 * 3600],
        ["b", 25 * 3600, 25 * 3600],
      ]),
    ]);
    const a = routeReach(f, { lat: 0, lon: 0 }, "2026-08-23", 23 * 3600, 150);
    expect(a.find((x) => x.stopId === "b")?.minutes).toBeCloseTo(120, 0);
  });
  it("boards a later overtaking trip when the earlier departure does not reach the destination", () => {
    const f = feed([
      trip("slow", [
        ["a", 8 * 3600, 8 * 3600],
        ["b", 9 * 3600, 9 * 3600],
      ]),
      trip("fast", [
        ["a", 8 * 3600 + 600, 8 * 3600 + 600],
        ["c", 8 * 3600 + 1200, 8 * 3600 + 1200],
        ["d", 8 * 3600 + 1800, 8 * 3600 + 1800],
      ]),
    ]);
    const a = routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 8 * 3600, 45);
    expect(a.some((x) => x.stopId === "d")).toBe(true);
  });
  it("honors pickup and dropoff restrictions", () => {
    const f = feed([
      trip("x", [
        ["a", 8 * 3600, 8 * 3600],
        ["b", 8 * 3600 + 600, 8 * 3600 + 600],
        ["c", 8 * 3600 + 1200, 8 * 3600 + 1200],
      ]),
    ]);
    f.trips[0].calls[0].pickup = 1;
    f.trips[0].calls[1].dropoff = 1;
    const a = routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 8 * 3600, 45);
    expect(a.some((x) => x.stopId === "c")).toBe(false);
  });
});

it("returns timed access, wait and ride legs to the actual destination stop", () => {
  const f = feed([
    trip("journey", [
      ["a", 8 * 3600 + 600, 8 * 3600 + 600],
      ["b", 8 * 3600 + 1200, 8 * 3600 + 1200],
    ]),
  ]);
  const j = findJourney(
    f,
    { lat: 0, lon: 0 },
    "2026-08-25",
    8 * 3600,
    "b",
    4,
    90,
  );
  expect(j?.map((x) => x.kind)).toEqual(["walk", "wait", "ride"]);
  expect(j?.[2].end).toBe(8 * 60 + 20);
});
it("enforces prohibited same-stop transfers", () => {
  const f = feed([
    trip("one", [
      ["a", 8 * 3600, 8 * 3600],
      ["b", 8 * 3600 + 600, 8 * 3600 + 600],
    ]),
    trip("two", [
      ["b", 8 * 3600 + 1200, 8 * 3600 + 1200],
      ["c", 8 * 3600 + 1800, 8 * 3600 + 1800],
    ]),
  ]);
  f.transfers = [{ from: "b", to: "b", type: 3, min: 0 }];
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 8 * 3600, 45).some(
      (x) => x.stopId === "c",
    ),
  ).toBe(false);
});
it("applies a scoped minimum only to the matching departing route", () => {
  const f = feed([
    trip("one", [
      ["a", 8 * 3600, 8 * 3600],
      ["b", 8 * 3600 + 600, 8 * 3600 + 600],
    ]),
    trip("too-early", [
      ["b", 8 * 3600 + 13 * 60, 8 * 3600 + 13 * 60],
      ["c", 8 * 3600 + 20 * 60, 8 * 3600 + 20 * 60],
    ]),
  ]);
  f.transfers = [
    { from: "b", to: "b", type: 2, min: 240, routeFrom: "r", routeTo: "r" },
  ];
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 8 * 3600, 45).some(
      (x) => x.stopId === "c",
    ),
  ).toBe(false);
  f.trips[1].calls[0].arr = f.trips[1].calls[0].dep = 8 * 3600 + 14 * 60;
  f.trips[1].calls[1].arr = f.trips[1].calls[1].dep = 8 * 3600 + 20 * 60;
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 8 * 3600, 45).some(
      (x) => x.stopId === "c",
    ),
  ).toBe(true);
});

it("keeps a later arriving trip when an earlier trip has a prohibited connection", () => {
  const f = feed([
    trip("blocked", [
      ["a", 28800, 28800],
      ["b", 29400, 29400],
    ]),
    trip("usable", [
      ["a", 28800, 28800],
      ["b", 29520, 29520],
    ]),
    trip("onward", [
      ["b", 29700, 29700],
      ["c", 30000, 30000],
    ]),
  ]);
  f.transfers = [
    {
      from: "b",
      to: "b",
      type: 3,
      min: 0,
      tripFrom: "blocked",
      tripTo: "onward",
    },
    {
      from: "b",
      to: "b",
      type: 2,
      min: 0,
      tripFrom: "usable",
      tripTo: "onward",
    },
  ];
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 28800, 45).find(
      (r) => r.stopId === "c",
    )?.minutes,
  ).toBe(20);
});
it("uses a minimum transfer time of zero instead of adding the default slack", () => {
  const f = feed([
    trip("a", [
      ["a", 28800, 28800],
      ["b", 29400, 29400],
    ]),
    trip("b", [
      ["b", 29400, 29400],
      ["c", 30000, 30000],
    ]),
  ]);
  f.transfers = [{ from: "b", to: "b", type: 2, min: 0 }];
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 28800, 45).some(
      (r) => r.stopId === "c",
    ),
  ).toBe(true);
});
it("excludes boarding that requires a prior arrangement", () => {
  const f = feed([
    trip("x", [
      ["a", 28800, 28800],
      ["c", 30000, 30000],
    ]),
  ]);
  f.trips[0].calls[0].pickup = 2;
  expect(
    routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 28800, 45).some(
      (r) => r.stopId === "c",
    ),
  ).toBe(false);
});
it("rejects clock change days rather than returning ambiguous times", () => {
  const f = feed([]);
  f.timezone = "America/Los_Angeles";
  expect(() => routeReach(f, { lat: 0, lon: 0 }, "2026-11-01", 28800)).toThrow(
    /daylight saving/,
  );
});

it("walks between nearby stops across the antimeridian", () => {
  const f = feed([
    trip("first", [
      ["a", 28800, 28800],
      ["b", 29400, 29400],
    ]),
    trip("second", [
      ["c", 29700, 29700],
      ["d", 30000, 30000],
    ]),
  ]);
  f.stops = [
    { id: "a", name: "a", lat: 0, lon: 179.98 },
    { id: "b", name: "b", lat: 0, lon: 179.999 },
    { id: "c", name: "c", lat: 0, lon: -179.999 },
    { id: "d", name: "d", lat: 0, lon: -179.98 },
  ];
  const result = routeReach(
    f,
    { lat: 0, lon: 179.98 },
    "2026-08-25",
    28800,
    45,
    2,
  );
  expect(result.find((r) => r.stopId === "d")?.minutes).toBe(20);
});

it("allows a final walk of 1 km without using it as a long transfer", () => {
  const f = feed([
    trip("first", [
      ["a", 28800, 28800],
      ["b", 29400, 29400],
    ]),
    trip("second", [
      ["c", 30300, 30300],
      ["d", 30600, 30600],
    ]),
  ]);
  f.stops = [
    { id: "a", name: "a", lat: 0, lon: 0 },
    { id: "b", name: "b", lat: 0, lon: 0.02 },
    { id: "c", name: "c", lat: 0, lon: 0.027 },
    { id: "d", name: "d", lat: 0, lon: 0.05 },
  ];
  const result = routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 28800, 45, 2);
  expect(result.find((r) => r.stopId === "c")?.minutes).toBeCloseTo(19.7296, 3);
  expect(result.some((r) => r.stopId === "d")).toBe(false);
  const legs = findJourney(
    f,
    { lat: 0, lon: 0 },
    "2026-08-25",
    28800,
    "c",
    1,
    45,
  );
  expect(legs?.map((l) => l.kind)).toEqual(["walk", "ride", "walk"]);
});
it("retains a usable transit alight when a walking arrival at that stop is earlier", () => {
  const f = feed([
    trip("near", [
      ["a", 28800, 28800],
      ["b", 29400, 29400],
    ]),
    trip("far", [
      ["a", 28800, 28800],
      ["c", 30300, 30300],
    ]),
  ]);
  f.stops = [
    { id: "a", name: "a", lat: 0, lon: 0 },
    { id: "b", name: "b", lat: 0, lon: 0.02 },
    { id: "c", name: "c", lat: 0, lon: 0.023 },
  ];
  const c = routeReach(f, { lat: 0, lon: 0 }, "2026-08-25", 28800, 45, 1).find(
    (r) => r.stopId === "c",
  );
  expect(c?.minutes).toBeLessThan(15);
  expect(c?.alightMinutes).toBe(25);
});
