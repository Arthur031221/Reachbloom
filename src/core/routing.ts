import type { Feed, Reach, Stop, Trip, Transfer } from "./types";

const radians = (n: number) => (n * Math.PI) / 180;
export function distance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const x =
    Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(radians(b.lon - a.lon) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, x)));
}
export function matchesMode(type: number, mode: string) {
  if (mode === "all") return true;
  if (mode === "bus")
    return (
      type === 3 ||
      type === 11 ||
      (type >= 200 && type < 300) ||
      (type >= 700 && type < 900)
    );
  if (mode === "ferry")
    return type === 4 || type === 1200 || (type >= 1000 && type < 1100);
  return (
    mode === "rail" &&
    ([0, 1, 2, 5, 6, 7, 12].includes(type) ||
      (type >= 100 && type < 200) ||
      (type >= 300 && type < 700) ||
      (type >= 900 && type < 1000) ||
      (type >= 1300 && type < 1500))
  );
}
function dateObject(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(d.getTime()) ||
    d.toISOString().slice(0, 10) !== date
  )
    throw Error("Choose a valid service date.");
  return d;
}
export function isServiceActive(feed: Feed, service: string, date: string) {
  let d: Date;
  try {
    d = dateObject(date);
  } catch {
    return false;
  }
  const key = Number(date.replaceAll("-", ""));
  const exceptions = feed.exceptions[service] || [];
  if (exceptions.includes(key)) return true;
  if (exceptions.includes(-key)) return false;
  const c = feed.services[service];
  return (
    !!c &&
    String(key) >= c.start &&
    String(key) <= c.end &&
    !!c.days[(d.getUTCDay() + 6) % 7]
  );
}
// Wall-clock trip times are ambiguous on offset-change days. Refuse them rather than guess.
export function validateRoutingDate(feed: Feed, date: string) {
  const d = dateObject(date);
  if (feed.timezone === "Unknown")
    throw Error("This feed needs a valid agency_timezone before routing.");
  try {
    const fmt = new Intl.DateTimeFormat("en", {
      timeZone: feed.timezone,
      timeZoneName: "longOffset",
    });
    const offsets = [-36, -12, 12, 36].map(
      (h) =>
        fmt
          .formatToParts(new Date(d.getTime() + h * 3600000))
          .find((p) => p.type === "timeZoneName")?.value,
    );
    if (new Set(offsets).size > 1)
      throw Error(
        "Routing is unavailable around daylight saving changes. Choose a date at least two days away from the clock change.",
      );
  } catch (e) {
    if (e instanceof RangeError)
      throw Error("This feed has an invalid agency_timezone.");
    throw e;
  }
}
export type JourneyLeg = {
  kind: "walk" | "wait" | "ride";
  from: string;
  to: string;
  start: number;
  end: number;
  route?: string;
};
type Label = {
  stop: string;
  time: number;
  rides: number;
  trip?: Trip;
  alight?: string;
  alightTime?: number;
  legs: JourneyLeg[];
};
type Instance = { trip: Trip; offset: number };
type Index = {
  stops: Map<string, Stop>;
  boardStops: Stop[];
  walks: Map<string, { stop: string; minutes: number }[]>;
  routes: Map<string, Feed["routes"][number]>;
  rules: Map<string, Transfer[]>;
};
const indexes = new WeakMap<Feed, Index>();
function index(feed: Feed): Index {
  const cached = indexes.get(feed);
  if (cached) return cached;
  const stops = new Map(feed.stops.map((s) => [s.id, s]));
  const boardStops = feed.stops.filter((s) => (s.locationType ?? 0) === 0);
  const walks = new Map<string, { stop: string; minutes: number }[]>();
  const buckets = new Map<string, Stop[]>(),
    cell = 0.004;
  for (const s of boardStops) {
    const k = `${Math.floor((((s.lon + 540) % 360) - 180) / cell)},${Math.floor(s.lat / cell)}`;
    const group = buckets.get(k) || [];
    group.push(s);
    buckets.set(k, group);
  }
  for (const a of boardStops) {
    const x = Math.floor((((a.lon + 540) % 360) - 180) / cell),
      y = Math.floor(a.lat / cell),
      span =
        Math.ceil(
          1000 /
            (111000 *
              cell *
              Math.max(0.001, Math.cos((a.lat * Math.PI) / 180))),
        ) + 1;
    const nearby: Stop[] = [];
    if (span > 100) nearby.push(...boardStops);
    else
      for (let dx = -span; dx <= span; dx++)
        for (let dy = -4; dy <= 4; dy++)
          nearby.push(
            ...(buckets.get(
              `${((((x + dx + 45000) % 90000) + 90000) % 90000) - 45000},${y + dy}`,
            ) || []),
          );
    walks.set(
      a.id,
      nearby
        .filter((b) => b.id !== a.id)
        .map((b) => ({ stop: b.id, minutes: distance(a, b) / 80 }))
        .filter((w) => w.minutes <= 12.5),
    );
  }
  const rules = new Map<string, Transfer[]>();
  for (const r of feed.transfers) {
    const k = `${r.from}\0${r.to}`;
    const group = rules.get(k) || [];
    group.push(r);
    rules.set(k, group);
  }
  const value = {
    stops,
    boardStops,
    walks,
    routes: new Map(feed.routes.map((r) => [r.id, r])),
    rules,
  };
  indexes.set(feed, value);
  return value;
}
function instances(feed: Feed, date: string, mode: string): Instance[] {
  const maxTime = feed.trips.reduce(
    (max, t) => Math.max(max, t.calls.at(-1)?.dep ?? 0),
    86400,
  );
  const base = dateObject(date),
    out: Instance[] = [];
  const routes = index(feed).routes;
  for (let offset = -Math.ceil(maxTime / 86400); offset <= 1; offset++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + offset);
    const day = d.toISOString().slice(0, 10);
    for (const trip of feed.trips)
      if (
        matchesMode(routes.get(trip.routeId)?.type ?? -1, mode) &&
        isServiceActive(feed, trip.serviceId, day)
      )
        out.push({ trip, offset: offset * 1440 });
  }
  return out;
}
function connectionTime(
  feed: Feed,
  idx: Index,
  label: Label,
  to: string,
  trip: Trip,
) {
  if (!label.trip || !label.alight) return label.time;
  const fromIds = [label.alight, idx.stops.get(label.alight)?.parent].filter(
    Boolean,
  ) as string[];
  const toIds = [to, idx.stops.get(to)?.parent].filter(Boolean) as string[];
  const rules = fromIds
    .flatMap((a) => toIds.flatMap((b) => idx.rules.get(`${a}\0${b}`) || []))
    .filter(
      (r) =>
        (!r.routeFrom || r.routeFrom === label.trip!.routeId) &&
        (!r.routeTo || r.routeTo === trip.routeId) &&
        (!r.tripFrom ||
          r.tripFrom === (label.trip!.templateId || label.trip!.id)) &&
        (!r.tripTo || r.tripTo === (trip.templateId || trip.id)),
    );
  const rank = (r: Transfer) =>
    r.tripFrom && r.tripTo
      ? 6
      : (r.tripFrom && r.routeTo) || (r.tripTo && r.routeFrom)
        ? 5
        : r.tripFrom || r.tripTo
          ? 4
          : r.routeFrom && r.routeTo
            ? 3
            : r.routeFrom || r.routeTo
              ? 2
              : 1;
  const bestRank = rules.length ? Math.max(...rules.map(rank)) : -1;
  const chosen = rules.filter((r) => rank(r) === bestRank);
  // Timed holds and staying onboard are not modeled. Scheduled reboarding is allowed.
  if (chosen.some((r) => r.type === 3)) return Infinity;
  const mins = chosen.filter((r) => r.type === 2).map((r) => r.min / 60);
  const slack = mins.length ? Math.max(...mins) : 2;
  return Math.max(label.time, label.alightTime! + slack);
}
function solve(
  feed: Feed,
  origin: { lat: number; lon: number },
  date: string,
  startSec: number,
  limitMin: number,
  maxRides: number,
  mode: string,
) {
  validateRoutingDate(feed, date);
  if (
    !Number.isFinite(startSec) ||
    startSec < 0 ||
    startSec >= 86400 ||
    !Number.isFinite(limitMin) ||
    limitMin <= 0 ||
    !Number.isInteger(maxRides) ||
    maxRides < 0 ||
    maxRides > 8 ||
    Math.abs(origin.lat) > 90 ||
    Math.abs(origin.lon) > 180 ||
    !Number.isFinite(origin.lat) ||
    !Number.isFinite(origin.lon)
  )
    throw Error("Invalid origin, departure time or journey limit.");
  const idx = index(feed),
    start = startSec / 60,
    deadline = start + limitMin;
  const best = new Map<string, Label>();
  const alights = new Map<string, Label>();
  let labels: Label[] = [];
  for (const stop of idx.boardStops) {
    const meters = distance(origin, stop),
      time = start + meters / 80;
    if (meters <= 1000 && time <= deadline) {
      const l: Label = {
        stop: stop.id,
        time,
        rides: 0,
        legs: [
          { kind: "walk", from: "Origin", to: stop.name, start, end: time },
        ],
      };
      labels.push(l);
      best.set(stop.id, l);
    }
  }
  const trips = instances(feed, date, mode);
  for (let round = 1; round <= maxRides && labels.length; round++) {
    const boarding = new Map<string, Label[]>();
    for (const l of labels) {
      const group = boarding.get(l.stop) || [];
      group.push(l);
      boarding.set(l.stop, group);
      if (l.trip)
        for (const w of idx.walks.get(l.stop) || []) {
          const time = l.time + w.minutes;
          if (time > deadline || w.minutes > 5) continue;
          const next: Label = {
            ...l,
            stop: w.stop,
            time,
            legs: [
              ...l.legs,
              {
                kind: "walk",
                from: idx.stops.get(l.stop)!.name,
                to: idx.stops.get(w.stop)!.name,
                start: l.time,
                end: time,
              },
            ],
          };
          const dest = boarding.get(w.stop) || [];
          dest.push(next);
          boarding.set(w.stop, dest);
          if (time < (best.get(w.stop)?.time ?? Infinity))
            best.set(w.stop, next);
        }
    }
    const next = new Map<string, Label>();
    for (const { trip, offset } of trips) {
      let boarded: Label | undefined,
        boardTime = 0,
        boardName = "";
      for (const call of trip.calls) {
        const arrival = offset + call.arr / 60,
          departure = offset + call.dep / 60;
        if (boarded && call.dropoff === 0 && arrival <= deadline) {
          const l: Label = {
            stop: call.stopId,
            time: arrival,
            rides: round,
            trip,
            alight: call.stopId,
            alightTime: arrival,
            legs: [
              ...boarded.legs,
              ...(boardTime > boarded.time
                ? [
                    {
                      kind: "wait" as const,
                      from: boardName,
                      to: boardName,
                      start: boarded.time,
                      end: boardTime,
                    },
                  ]
                : []),
              {
                kind: "ride",
                from: boardName,
                to: idx.stops.get(call.stopId)!.name,
                start: boardTime,
                end: arrival,
                route: idx.routes.get(trip.routeId)?.short || trip.routeId,
              },
            ],
          };
          const key = `${call.stopId}\0${trip.id}`;
          if (arrival < (next.get(key)?.time ?? Infinity)) next.set(key, l);
          if (arrival < (best.get(call.stopId)?.time ?? Infinity))
            best.set(call.stopId, l);
          if (arrival < (alights.get(call.stopId)?.time ?? Infinity))
            alights.set(call.stopId, l);
        }
        if (!boarded && call.pickup === 0 && departure <= deadline) {
          const candidates = boarding.get(call.stopId) || [];
          const candidate = candidates.find(
            (l) => connectionTime(feed, idx, l, call.stopId, trip) <= departure,
          );
          if (candidate) {
            boarded = candidate;
            boardTime = departure;
            boardName = idx.stops.get(call.stopId)!.name;
          }
        }
      }
    }
    labels = [...next.values()];
    for (const l of labels)
      for (const w of idx.walks.get(l.stop) || []) {
        const time = l.time + w.minutes;
        if (time <= deadline && time < (best.get(w.stop)?.time ?? Infinity))
          best.set(w.stop, {
            ...l,
            stop: w.stop,
            time,
            legs: [
              ...l.legs,
              {
                kind: "walk",
                from: idx.stops.get(l.stop)!.name,
                to: idx.stops.get(w.stop)!.name,
                start: l.time,
                end: time,
              },
            ],
          });
      }
  }
  return { best, alights, start };
}
export function routeReach(
  feed: Feed,
  origin: { lat: number; lon: number },
  date: string,
  startSec: number,
  limitMin = 45,
  maxRides = 4,
  mode = "all",
): Reach[] {
  const { best, alights, start } = solve(
    feed,
    origin,
    date,
    startSec,
    limitMin,
    maxRides,
    mode,
  );
  return [...best.values()].map((l) => ({
    stopId: l.stop,
    minutes: l.time - start,
    round: l.rides,
    tripId: l.trip?.id,
    alightMinutes: alights.has(l.stop)
      ? alights.get(l.stop)!.time - start
      : undefined,
    prev: l.alight !== l.stop ? l.alight : undefined,
  }));
}
export function routeToStop(
  feed: Feed,
  origin: { lat: number; lon: number },
  date: string,
  startSec: number,
  destination: string,
  limitMin = 90,
) {
  return routeReach(feed, origin, date, startSec, limitMin).find(
    (r) => r.stopId === destination,
  );
}
export function findJourney(
  feed: Feed,
  origin: { lat: number; lon: number },
  date: string,
  startSec: number,
  destination: string,
  maxRides = 4,
  horizonMinutes = 90,
  mode = "all",
): JourneyLeg[] | undefined {
  return solve(
    feed,
    origin,
    date,
    startSec,
    horizonMinutes,
    maxRides,
    mode,
  ).best.get(destination)?.legs;
}
