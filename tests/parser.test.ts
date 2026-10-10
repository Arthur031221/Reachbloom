import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { parseFeed } from "../src/worker/gtfs.worker";
const zip = (files: Record<string, string>) => {
  const bytes = zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])),
  );
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
};
describe("local GTFS parser", () => {
  it("handles quoted commas, BOM, reordered columns, folder prefixes and calendar_dates-only service", () => {
    const b = zip({
      "folder/stops.txt":
        '\uFEFFstop_name,stop_lon,stop_id,stop_lat\r\n"A, Central",-122,1,37\r\nB,-121,2,38\r\n',
      "folder/routes.txt": "route_type,route_id,route_short_name\n2,R,R\n",
      "folder/trips.txt": "service_id,trip_id,route_id\nS,T,R\n",
      "folder/stop_times.txt":
        "departure_time,stop_id,stop_sequence,arrival_time,trip_id\n08:00:00,1,1,08:00:00,T\n08:10:00,2,2,08:10:00,T\n",
      "folder/calendar_dates.txt":
        "service_id,date,exception_type\nS,20260824,1\n",
    });
    const f = parseFeed(b);
    expect(f.stops[0].name).toBe("A, Central");
    expect(f.trips[0].calls[1].arr).toBe(29400);
    expect(f.exceptions.S).toEqual([20260824]);
  });
  it("expands exact frequency service", () => {
    const b = zip({
      "stops.txt":
        "stop_id,stop_name,stop_lat,stop_lon\n1,A,37,-122\n2,B,37.01,-122\n",
      "routes.txt": "route_id,route_type\nR,2\n",
      "trips.txt": "route_id,service_id,trip_id\nR,S,T\n",
      "stop_times.txt":
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence\nT,08:00:00,08:00:00,1,1\nT,08:10:00,08:10:00,2,2\n",
      "frequencies.txt":
        "trip_id,start_time,end_time,headway_secs,exact_times\nT,08:00:00,09:00:00,1800,1\n",
      "calendar_dates.txt": "service_id,date,exception_type\nS,20260824,1\n",
    });
    const f = parseFeed(b);
    expect(f.trips).toHaveLength(2);
    expect(f.trips[1].calls[0].dep).toBe(30600);
  });
  it("rejects invalid archive bytes with an actionable error", () =>
    expect(() => parseFeed(new ArrayBuffer(16))).toThrow(
      /ZIP directory|valid GTFS ZIP/,
    ));
});

const minimal = (times: string, extra: Record<string, string> = {}) =>
  zip({
    "agency.txt": "agency_name,agency_timezone\nTest,UTC\n",
    "stops.txt":
      "stop_id,stop_name,stop_lat,stop_lon\n1,A,0,0\n2,B,0,0.01\n3,C,0,0.02\n",
    "routes.txt": "route_id,route_type\nR,2\n",
    "trips.txt": "route_id,service_id,trip_id\nR,S,T\n",
    "calendar_dates.txt": "service_id,date,exception_type\nS,20260824,1\n",
    "stop_times.txt":
      "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n" + times,
    ...extra,
  });
it("retains linked trip rules with optional stop identifiers", () => {
  const f = parseFeed(
    minimal(
      "T,08:00:00,08:00:00,1,1\nT,08:10:00,08:10:00,2,2\nU,08:12:00,08:12:00,2,1\nU,08:20:00,08:20:00,3,2\n",
      {
        "trips.txt": "route_id,service_id,trip_id\nR,S,T\nR,S,U\n",
        "transfers.txt": "from_trip_id,to_trip_id,transfer_type\nT,U,5\n",
      },
    ),
  );
  expect(f.transfers).toEqual([
    {
      from: "2",
      to: "2",
      type: 5,
      min: 0,
      tripFrom: "T",
      tripTo: "U",
      routeFrom: undefined,
      routeTo: undefined,
    },
  ]);
});
it("omits unscheduled frequency templates rather than inventing departures", () => {
  const f = parseFeed(
    minimal("T,08:00:00,08:00:00,1,1\nT,08:10:00,08:10:00,2,2\n", {
      "frequencies.txt":
        "trip_id,start_time,end_time,headway_secs,exact_times\nT,08:00:00,09:00:00,600,0\n",
    }),
  );
  expect(f.trips).toHaveLength(0);
  expect(f.warnings.join(" ")).toMatch(/non-exact frequency/);
});
it("rejects duplicate identifiers and skips bad sequences and decreasing times", () => {
  expect(() =>
    parseFeed(
      minimal("T,08:00:00,08:00:00,1,1\nT,08:10:00,08:10:00,2,2\n", {
        "stops.txt":
          "stop_id,stop_name,stop_lat,stop_lon\n1,A,0,0\n1,B,0,0.01\n",
      }),
    ),
  ).toThrow(/unique/);
  for (const times of [
    "T,08:00:00,08:00:00,1,bad\nT,08:10:00,08:10:00,2,2\n",
    "T,08:00:00,08:00:00,1,1\nT,07:50:00,07:50:00,2,2\n",
  ])
    expect(parseFeed(minimal(times)).trips).toHaveLength(0);
});
it("interpolates only intermediate anchors and refuses an untimed endpoint", () => {
  const f = parseFeed(
    minimal("T,08:00:00,08:00:00,1,1\nT,,,2,2\nT,08:20:00,08:20:00,3,3\n"),
  );
  expect(f.trips[0].calls[1].arr).toBe(29400);
  expect(
    parseFeed(minimal("T,,,1,1\nT,08:20:00,08:20:00,3,3\n")).trips,
  ).toHaveLength(0);
});
