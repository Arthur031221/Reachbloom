import { packs } from "./packs";
import { isServiceActive, validateRoutingDate } from "./routing";
import type { Feed } from "./types";

export type Coordinates = [number, number];
const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
export const languages = [
  "en",
  "zh-TW",
  "zh-CN",
  "ja",
  "ko",
  "es",
  "fr",
  "de",
  "pt-BR",
];

export function nearbyOrigin(origin: Coordinates): Coordinates {
  return [
    ((origin[0] + 0.015 + 540) % 360) - 180,
    Math.min(85, origin[1] + 0.01),
  ];
}

export function readView(url: URL, savedLanguage = "en", savedDark = false) {
  const q = url.searchParams;
  const pack = packs.find((p) => p.id === q.get("city")) || packs[0];
  const coordinates = (value: string | null): Coordinates | undefined => {
    if (!value || value.split(",").some((v) => !v.trim())) return;
    const parts = value.split(",").map(Number);
    if (
      parts.length === 2 &&
      parts.every(Number.isFinite) &&
      Math.abs(parts[0]) <= 180 &&
      Math.abs(parts[1]) <= 85
    )
      return parts as Coordinates;
  };
  const b = coordinates(q.get("b"));
  const date = q.get("date") || "";
  const parsedDate = new Date(`${date}T12:00:00Z`);
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  const locale = q.get("lang") || savedLanguage;
  return {
    packId: pack.id,
    origin: coordinates(q.get("a")) || pack.origin,
    originB: b || nearbyOrigin(coordinates(q.get("a")) || pack.origin),
    compare: !!b,
    date: validDate ? date : pack.date,
    clock: clock.test(q.get("time") || "") ? q.get("time")! : pack.time,
    clockB: clock.test(q.get("timeB") || "") ? q.get("timeB")! : pack.time,
    mode: ["all", "rail", "bus", "ferry"].includes(q.get("mode") || "")
      ? q.get("mode")!
      : "all",
    minutes: [15, 30, 45, 60, 75, 90].includes(Number(q.get("minutes")))
      ? Number(q.get("minutes"))
      : 30,
    rides: /^[1-8]$/.test(q.get("rides") || "") ? Number(q.get("rides")) : 4,
    locale: languages.includes(locale) ? locale : "en",
    dark: q.has("theme") ? q.get("theme") === "dark" : savedDark,
    zoom: pack.zoom,
  };
}

export function importedView(feed: Feed) {
  const stops = new Map(feed.stops.map((s) => [s.id, s]));
  const calls = new Map<string, Feed["trips"][number]["calls"][number]>();
  const score = (departure: number) =>
    departure >= 6 * 3600 ? departure : departure + 86400;
  for (const trip of feed.trips)
    for (const call of trip.calls.slice(0, -1)) {
      const stop = stops.get(call.stopId);
      if (
        call.pickup !== 0 ||
        call.dep >= 86400 ||
        !stop ||
        Math.abs(stop.lat) > 85
      )
        continue;
      const previous = calls.get(trip.serviceId);
      if (!previous || score(call.dep) < score(previous.dep))
        calls.set(trip.serviceId, call);
    }
  let selected:
    { date: string; call: Feed["trips"][number]["calls"][number] } | undefined;
  const floor = /^\d{8}$/.test(feed.validStart || "")
    ? feed.validStart!
    : "00000000";
  for (const [service, call] of calls) {
    const dates = (feed.exceptions[service] || [])
      .filter((d) => d > 0 && String(d) >= floor)
      .map(String);
    const calendar = feed.services[service];
    if (calendar) {
      const start = [calendar.start, floor].sort().at(-1)!;
      const d = new Date(
        `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6)}T12:00:00Z`,
      );
      if (Number.isFinite(d.getTime()))
        for (let day = 0; day < 370; day++) {
          const key = d.toISOString().slice(0, 10).replaceAll("-", "");
          if (key > calendar.end) break;
          dates.push(key);
          d.setUTCDate(d.getUTCDate() + 1);
        }
    }
    for (const key of [...new Set(dates)].sort()) {
      const date = `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6)}`;
      if (!isServiceActive(feed, service, date)) continue;
      try {
        validateRoutingDate(feed, date);
      } catch {
        continue;
      }
      if (
        !selected ||
        date < selected.date ||
        (date === selected.date && score(call.dep) < score(selected.call.dep))
      )
        selected = { date, call };
      break;
    }
  }
  if (!selected)
    throw Error(
      "No boardable trip with a valid calendar and agency timezone was found. Routing skips dates around daylight saving changes.",
    );
  const stop = stops.get(selected.call.stopId)!;
  return {
    date: selected.date,
    clock: `${String(Math.floor(selected.call.dep / 3600)).padStart(2, "0")}:${String(Math.floor((selected.call.dep % 3600) / 60)).padStart(2, "0")}`,
    origin: [stop.lon, stop.lat] as Coordinates,
  };
}
