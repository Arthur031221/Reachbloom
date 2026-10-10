import type { Feed, Trip, Point } from "./types";
import { isServiceActive, distance, validateRoutingDate } from "./routing";
type Path = { points: Point[]; cumulative: number[]; positions: number[] };
const paths = new WeakMap<Feed, Map<string, Path>>();
const stopIndexes = new WeakMap<Feed, Map<string, Feed["stops"][number]>>();
function stopsFor(feed: Feed) {
  let stops = stopIndexes.get(feed);
  if (!stops) {
    stops = new Map(feed.stops.map((s) => [s.id, s]));
    stopIndexes.set(feed, stops);
  }
  return stops;
}
function pathFor(feed: Feed, trip: Trip): Path | undefined {
  const points = trip.shapeId ? feed.shapes[trip.shapeId] : undefined;
  if (!points || points.length < 2) return;
  let cache = paths.get(feed);
  if (!cache) {
    cache = new Map();
    paths.set(feed, cache);
  }
  const key = `${trip.shapeId}:${trip.calls.map((c) => c.stopId).join(",")}`;
  const prior = cache.get(key);
  if (prior) return prior;
  const cumulative = [0];
  for (let i = 1; i < points.length; i++)
    cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
  const positions: number[] = [];
  for (const call of trip.calls) {
    const stop = stopsFor(feed).get(call.stopId);
    if (!stop) return;
    let best = Infinity,
      position = positions.at(-1) ?? 0;
    for (let i = 1; i < points.length; i++) {
      if (cumulative[i] < position) continue;
      const a = points[i - 1],
        b = points[i],
        cos = Math.cos((stop.lat * Math.PI) / 180),
        dx = (b.lon - a.lon) * cos,
        dy = b.lat - a.lat;
      const p = Math.max(
        0,
        Math.min(
          1,
          ((stop.lon - a.lon) * cos * dx + (stop.lat - a.lat) * dy) /
            (dx * dx + dy * dy || 1),
        ),
      );
      const along = cumulative[i - 1] + p * (cumulative[i] - cumulative[i - 1]);
      if (along < (positions.at(-1) ?? 0)) continue;
      const projected = {
          lon: a.lon + (b.lon - a.lon) * p,
          lat: a.lat + (b.lat - a.lat) * p,
        },
        d = distance(stop, projected);
      if (d < best) {
        best = d;
        position = along;
      }
    }
    positions.push(position);
  }
  const value = { points, cumulative, positions };
  cache.set(key, value);
  return value;
}
function pointAt(path: Path, along: number) {
  along = Math.max(0, Math.min(along, path.cumulative.at(-1)!));
  let i = path.cumulative.findIndex((d) => d >= along);
  if (i < 1) i = 1;
  const a = path.points[i - 1],
    b = path.points[i],
    p =
      (along - path.cumulative[i - 1]) /
      (path.cumulative[i] - path.cumulative[i - 1] || 1);
  return { lon: a.lon + (b.lon - a.lon) * p, lat: a.lat + (b.lat - a.lat) * p };
}
export function validServiceDate(feed: Feed, date: string) {
  return feed.trips.some((t) => isServiceActive(feed, t.serviceId, date));
}
export function scheduledVehicles(feed: Feed, date: string, seconds: number) {
  const out: {
    trip: Trip;
    lat: number;
    lon: number;
    stop: string;
    progress: number;
  }[] = [];
  if (!Number.isFinite(seconds)) return out;
  try {
    validateRoutingDate(feed, date);
  } catch {
    return out;
  }
  const base = new Date(`${date}T12:00:00Z`);
  for (let day = -2; day <= 0; day++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + day);
    const serviceDate = d.toISOString().slice(0, 10),
      time = seconds - day * 86400;
    for (const trip of feed.trips) {
      if (!isServiceActive(feed, trip.serviceId, serviceDate)) continue;
      const c = trip.calls;
      if (time < c[0].arr || time > c.at(-1)!.dep) continue;
      let i = c.findIndex(
        (a, j) => j < c.length - 1 && a.arr <= time && c[j + 1].arr >= time,
      );
      if (i < 0) i = c.length - 2;
      const a = c[i],
        b = c[i + 1],
        s1 = stopsFor(feed).get(a.stopId),
        s2 = stopsFor(feed).get(b.stopId);
      if (!s1 || !s2) continue;
      const p = Math.max(0, Math.min(1, (time - a.dep) / (b.arr - a.dep || 1))),
        path = pathFor(feed, trip);
      const point = path
        ? pointAt(
            path,
            path.positions[i] + (path.positions[i + 1] - path.positions[i]) * p,
          )
        : {
            lat: s1.lat + (s2.lat - s1.lat) * p,
            lon: s1.lon + (s2.lon - s1.lon) * p,
          };
      out.push({ trip, ...point, stop: a.stopId, progress: p });
    }
  }
  return out;
}
