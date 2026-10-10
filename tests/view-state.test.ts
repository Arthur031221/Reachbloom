import { expect, it } from "vitest";
import { readView, importedView, nearbyOrigin } from "../src/core/view-state";

it("uses the selected city's defaults and rejects malformed URL state", () => {
  const view = readView(
    new URL(
      "https://example.com/?city=yurok&a=,41&b=0,Infinity&time=29:70&timeB=no&date=2026-02-30&rides=99&lang=no",
    ),
  );
  expect(view.packId).toBe("yurok");
  expect(view.origin).toEqual([-124.049903, 41.538536]);
  expect(view.date).toBe("2026-10-12");
  expect(view.clockB).toBe("08:30");
  expect(view.compare).toBe(false);
  expect(view.rides).toBe(4);
  expect(view.locale).toBe("en");
  expect(readView(new URL("https://example.com/?city=missing")).packId).toBe(
    "sf-bart",
  );
});

it("restores both origins and independent departure times without accepting out of range coordinates", () => {
  const view = readView(
    new URL(
      "https://example.com/?a=-122.4,37.7&b=-122.2,37.8&time=23:50&timeB=00:20&minutes=90&rides=8&lang=ja&theme=dark",
    ),
  );
  expect(view).toMatchObject({
    origin: [-122.4, 37.7],
    originB: [-122.2, 37.8],
    compare: true,
    clock: "23:50",
    clockB: "00:20",
    minutes: 90,
    rides: 8,
    locale: "ja",
    dark: true,
  });
  expect(readView(new URL("https://example.com/?b=181,0")).compare).toBe(false);
});

it("finds a later service period when an older calendar has ended", () => {
  const feed = {
    agency: "Test",
    timezone: "UTC",
    stops: [
      { id: "a", name: "a", lat: 30, lon: 130 },
      { id: "b", name: "b", lat: 30.1, lon: 130 },
    ],
    routes: [],
    shapes: {},
    trips: [
      {
        id: "t",
        routeId: "r",
        serviceId: "new",
        calls: [
          {
            stopId: "a",
            arr: 28800,
            dep: 28800,
            seq: 1,
            pickup: 0,
            dropoff: 0,
          },
          {
            stopId: "b",
            arr: 29400,
            dep: 29400,
            seq: 2,
            pickup: 0,
            dropoff: 0,
          },
        ],
      },
    ],
    services: {
      old: {
        start: "20200101",
        end: "20201231",
        days: [true, true, true, true, true, true, true],
      },
      new: {
        start: "20261012",
        end: "20261231",
        days: [true, true, true, true, true, false, false],
      },
    },
    exceptions: {},
    transfers: [],
    warnings: [],
    errors: [],
  };
  expect(importedView(feed)).toEqual({
    date: "2026-10-12",
    clock: "08:00",
    origin: [130, 30],
  });
});

it("keeps the second origin within map bounds beside a border origin", () => {
  expect(nearbyOrigin([179.999, 85])[0]).toBeCloseTo(-179.986);
  expect(nearbyOrigin([179.999, 85])[1]).toBe(85);
  expect(
    readView(new URL("https://example.com/?a=179.999,85")).originB,
  ).toEqual(nearbyOrigin([179.999, 85]));
});
