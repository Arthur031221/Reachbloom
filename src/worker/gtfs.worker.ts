import { unzipSync } from "fflate";
import type {
  Feed,
  Stop,
  Route,
  Trip,
  Point,
  Call,
  Transfer,
} from "../core/types";
const MAX_ZIP = 50 * 1024 * 1024,
  MAX_EXPANDED = 250 * 1024 * 1024,
  MAX_FILE = 64 * 1024 * 1024;
function csv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      out.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw Error("CSV contains an unterminated quoted field.");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    out.push(row);
  }
  return out;
}
function table(files: Record<string, Uint8Array>, name: string) {
  const key = Object.keys(files).find(
    (k) => k.split("/").pop() === name + ".txt" && !k.includes("__MACOSX/"),
  );
  if (!key) return [];
  const rows = csv(new TextDecoder().decode(files[key]));
  if (!rows.length) return [];
  const h = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v !== ""))
    .map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
const num = (v: string | undefined, d = 0) =>
  v == null || v === "" ? d : Number(v);
const finite = (v: string) => v !== "" && Number.isFinite(Number(v));
function sec(v: string) {
  const m = /^(\d{1,3}):(\d\d):(\d\d)$/.exec(v);
  return m && +m[2] < 60 && +m[3] < 60
    ? +m[1] * 3600 + +m[2] * 60 + +m[3]
    : NaN;
}

function preflightZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lower = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= lower; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw Error("ZIP directory is missing or truncated.");
  const count = view.getUint16(eocd + 10, true),
    size = view.getUint32(eocd + 12, true),
    start = view.getUint32(eocd + 16, true);
  if (count === 0xffff || size === 0xffffffff || start === 0xffffffff)
    throw Error(
      "ZIP64 archives are not supported. Repack this feed as a standard ZIP.",
    );
  if (start + size > bytes.length)
    throw Error("ZIP directory points outside the archive.");
  let cursor = start,
    expanded = 0;
  for (let i = 0; i < count; i++) {
    if (
      cursor + 46 > bytes.length ||
      view.getUint32(cursor, true) !== 0x02014b50
    )
      throw Error("ZIP contains a malformed file directory entry.");
    const uncompressed = view.getUint32(cursor + 24, true),
      nameLength = view.getUint16(cursor + 28, true),
      extraLength = view.getUint16(cursor + 30, true),
      commentLength = view.getUint16(cursor + 32, true);
    if (uncompressed === 0xffffffff)
      throw Error(
        "ZIP64 files are not supported. Repack this feed as a standard ZIP.",
      );
    expanded += uncompressed;
    if (uncompressed > MAX_FILE)
      throw Error("A file in this archive exceeds the 64 MB expanded limit.");
    if (expanded > MAX_EXPANDED)
      throw Error("Expanded feed exceeds the 250 MB limit.");
    cursor += 46 + nameLength + extraLength + commentLength;
  }
}
export function parseFeed(buf: ArrayBuffer): Feed {
  const bytes = new Uint8Array(buf);
  if (bytes.length > MAX_ZIP)
    throw Error("ZIP exceeds the 50 MB compressed limit.");
  preflightZip(bytes);
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw Error("This file is not a valid GTFS ZIP.");
  }
  let total = 0;
  for (const [n, b] of Object.entries(files)) {
    total += b.length;
    if (b.length > MAX_FILE) throw Error(`${n} exceeds the 64 MB file limit.`);
    if (total > MAX_EXPANDED)
      throw Error("Expanded feed exceeds the 250 MB limit.");
  }
  const warnings: string[] = [],
    errors: string[] = [];
  const stopRows = table(files, "stops"),
    routeRows = table(files, "routes"),
    tripRows = table(files, "trips"),
    timeRows = table(files, "stop_times");
  if (
    !stopRows.length ||
    !routeRows.length ||
    !tripRows.length ||
    !timeRows.length
  )
    throw Error(
      "Required GTFS files are missing. Required: stops, routes, trips and stop_times.",
    );
  for (const [rows, key] of [
    [stopRows, "stop_id"],
    [routeRows, "route_id"],
    [tripRows, "trip_id"],
  ] as const) {
    const ids = new Set<string>();
    for (const row of rows) {
      if (!row[key] || ids.has(row[key]))
        throw Error(`GTFS ${key} values must be present and unique.`);
      ids.add(row[key]);
    }
  }
  const stops: Stop[] = stopRows
    .filter(
      (r) =>
        finite(r.stop_lat) &&
        finite(r.stop_lon) &&
        Math.abs(+r.stop_lat) <= 90 &&
        Math.abs(+r.stop_lon) <= 180,
    )
    .map((r) => ({
      id: r.stop_id,
      name: r.stop_name || r.stop_id,
      lat: +r.stop_lat,
      lon: +r.stop_lon,
      parent: r.parent_station || undefined,
      locationType: num(r.location_type),
    }));
  if (stops.length < stopRows.length)
    warnings.push(
      `${stopRows.length - stops.length} stops with invalid coordinates were skipped.`,
    );
  const routes: Route[] = routeRows.map((r) => ({
    id: r.route_id,
    short: r.route_short_name || r.route_id,
    long: r.route_long_name || "",
    color: /^[0-9a-f]{6}$/i.test(r.route_color)
      ? "#" + r.route_color
      : "#285f79",
    type: num(r.route_type),
  }));
  const routeIds = new Set(routes.map((x) => x.id)),
    stopIds = new Set(stops.map((x) => x.id));
  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of timeRows) {
    if (!grouped.has(row.trip_id)) grouped.set(row.trip_id, []);
    grouped.get(row.trip_id)!.push(row);
  }
  const boardingIds = new Set(
    stops.filter((s) => s.locationType === 0).map((s) => s.id),
  );
  const tripById = new Map(tripRows.map((r) => [r.trip_id, r]));
  const trips: Trip[] = [];
  let skipped = 0,
    interpolated = 0;
  for (const [id, rows] of grouped) {
    const meta = tripById.get(id);
    if (!meta || !routeIds.has(meta.route_id)) {
      skipped++;
      continue;
    }
    rows.sort((a, b) => num(a.stop_sequence) - num(b.stop_sequence));
    if (
      rows.some(
        (r, i) =>
          !finite(r.stop_sequence) ||
          !Number.isInteger(num(r.stop_sequence)) ||
          num(r.stop_sequence) < 0 ||
          (i > 0 && num(r.stop_sequence) <= num(rows[i - 1].stop_sequence)),
      )
    ) {
      skipped++;
      continue;
    }
    const calls: Call[] = [];
    for (let i = 0; i < rows.length; i++) {
      let arr = sec(rows[i].arrival_time),
        dep = sec(rows[i].departure_time);
      if (!Number.isFinite(arr)) arr = dep;
      if (!Number.isFinite(dep)) dep = arr;
      if (!Number.isFinite(arr) || !Number.isFinite(dep)) {
        if (!calls.length) {
          skipped++;
          break;
        }
        let a = i + 1;
        while (
          a < rows.length &&
          !Number.isFinite(
            Number.isFinite(sec(rows[a].arrival_time))
              ? sec(rows[a].arrival_time)
              : sec(rows[a].departure_time),
          )
        )
          a++;
        const left = calls.at(-1)!.dep,
          right =
            a < rows.length
              ? Number.isFinite(sec(rows[a].arrival_time))
                ? sec(rows[a].arrival_time)
                : sec(rows[a].departure_time)
              : NaN;
        if (Number.isFinite(right)) {
          const step = (right - left) / (a - i + 1);
          arr = dep = left + step;
          interpolated++;
        } else {
          skipped++;
          break;
        }
      }
      if (
        !stopIds.has(rows[i].stop_id) ||
        !boardingIds.has(rows[i].stop_id) ||
        arr < 0 ||
        dep < arr ||
        dep >= 72 * 3600 ||
        (calls.length > 0 && arr < calls.at(-1)!.dep)
      ) {
        skipped++;
        break;
      }
      calls.push({
        stopId: rows[i].stop_id,
        arr,
        dep,
        seq: num(rows[i].stop_sequence),
        pickup: num(rows[i].pickup_type),
        dropoff: num(rows[i].drop_off_type),
      });
    }
    if (calls.length === rows.length && calls.length > 1)
      trips.push({
        id,
        routeId: meta.route_id,
        serviceId: meta.service_id,
        shapeId: meta.shape_id || undefined,
        calls,
      });
  }
  if (skipped)
    warnings.push(
      `${skipped} trips with missing references, invalid sequences or unusable times were skipped.`,
    );
  if (interpolated)
    warnings.push(
      `${interpolated} stop time(s) were interpolated between provided time anchors.`,
    );
  const frequencyRows = table(files, "frequencies");
  if (frequencyRows.length) {
    const groupedFrequencies = new Map<string, Record<string, string>[]>();
    for (const row of frequencyRows) {
      const group = groupedFrequencies.get(row.trip_id) ?? [];
      group.push(row);
      groupedFrequencies.set(row.trip_id, group);
    }
    const templates = new Map(trips.map((trip) => [trip.id, trip]));
    const generated: Trip[] = [];
    let omitted = 0;
    for (const [tripId, rows] of groupedFrequencies) {
      const template = templates.get(tripId);
      if (!template) continue;
      if (rows.some((row) => row.exact_times !== "1")) {
        omitted++;
        const index = trips.findIndex((trip) => trip.id === tripId);
        if (index >= 0) trips.splice(index, 1);
        continue;
      }
      const index = trips.findIndex((trip) => trip.id === tripId);
      if (index >= 0) trips.splice(index, 1);
      for (const row of rows) {
        const start = sec(row.start_time),
          end = sec(row.end_time),
          headway = num(row.headway_secs);
        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          start < 0 ||
          end <= start ||
          end > 72 * 3600 ||
          !Number.isInteger(headway) ||
          headway <= 0 ||
          template.calls.at(-1)!.dep + end - template.calls[0].dep > 72 * 3600
        ) {
          warnings.push(
            `Invalid exact frequency for trip ${tripId} was skipped.`,
          );
          continue;
        }
        let base = start,
          ordinal = 0;
        while (base < end) {
          if (generated.length >= 10000)
            throw Error(
              "Exact frequency expansion exceeds 10,000 generated trips.",
            );
          const shift = base - template.calls[0].dep;
          generated.push({
            ...template,
            id: `${tripId}~${start}~${ordinal++}`,
            templateId: tripId,
            calls: template.calls.map((call) => ({
              ...call,
              arr: call.arr + shift,
              dep: call.dep + shift,
            })),
          });
          base += headway;
        }
      }
    }
    trips.push(...generated);
    if (omitted)
      warnings.push(
        `${omitted} non-exact frequency template(s) were omitted because they do not define actual departure times.`,
      );
  }
  const services: Feed["services"] = Object.create(null);
  for (const r of table(files, "calendar"))
    services[r.service_id] = {
      start: r.start_date,
      end: r.end_date,
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ].map((d) => r[d] === "1"),
    };
  const exceptions: Feed["exceptions"] = Object.create(null);
  for (const r of table(files, "calendar_dates")) {
    if (r.exception_type === "1" || r.exception_type === "2")
      (exceptions[r.service_id] ??= []).push(
        (r.exception_type === "1" ? 1 : -1) * Number(r.date),
      );
    else
      warnings.push(
        `Unsupported calendar exception type ${r.exception_type} was ignored.`,
      );
  }
  const shapes: Record<string, Point[]> = Object.create(null);
  for (const r of table(files, "shapes")) {
    if (
      finite(r.shape_pt_lat) &&
      finite(r.shape_pt_lon) &&
      Math.abs(+r.shape_pt_lat) <= 90 &&
      Math.abs(+r.shape_pt_lon) <= 180
    ) {
      (shapes[r.shape_id] ??= []).push({
        lat: +r.shape_pt_lat,
        lon: +r.shape_pt_lon,
        seq: num(r.shape_pt_sequence),
        dist: finite(r.shape_dist_traveled)
          ? +r.shape_dist_traveled
          : undefined,
      });
    }
  }
  for (const v of Object.values(shapes)) v.sort((a, b) => a.seq - b.seq);
  const templateTrips = new Map(trips.map((t) => [t.templateId || t.id, t]));
  const transfers: Transfer[] = table(files, "transfers")
    .map((r) => ({
      from:
        r.from_stop_id ||
        ([4, 5].includes(num(r.transfer_type))
          ? templateTrips.get(r.from_trip_id)?.calls.at(-1)?.stopId
          : undefined) ||
        "",
      to:
        r.to_stop_id ||
        ([4, 5].includes(num(r.transfer_type))
          ? templateTrips.get(r.to_trip_id)?.calls[0]?.stopId
          : undefined) ||
        "",
      type: num(r.transfer_type),
      min: num(r.min_transfer_time),
      routeFrom: r.from_route_id || undefined,
      routeTo: r.to_route_id || undefined,
      tripFrom: r.from_trip_id || undefined,
      tripTo: r.to_trip_id || undefined,
    }))
    .filter((r) => r.from && r.to);
  if (transfers.some((x) => [1, 4].includes(x.type)))
    warnings.push(
      "Timed vehicle holds and in-seat continuation are not modeled. These connections use ordinary scheduled reboarding instead.",
    );
  if (trips.some((t) => t.calls.some((c) => c.pickup > 1 || c.dropoff > 1)))
    warnings.push("Pickup and dropoff by prior arrangement are excluded.");
  for (const t of trips)
    if (!services[t.serviceId] && !exceptions[t.serviceId])
      warnings.push(`Service ${t.serviceId} has no calendar information.`);
  const ai = table(files, "agency")[0] || {},
    fi = table(files, "feed_info")[0] || {};
  return {
    agency: ai.agency_name || "Transit agency",
    timezone: ai.agency_timezone || "Unknown",
    validStart: fi.feed_start_date,
    validEnd: fi.feed_end_date,
    stops,
    routes,
    trips,
    shapes,
    services,
    exceptions,
    transfers,
    warnings: [...new Set(warnings)],
    errors,
  };
}
if (typeof self !== "undefined")
  self.onmessage = (e: MessageEvent) => {
    try {
      self.postMessage({ ok: true, feed: parseFeed(e.data) });
    } catch (err) {
      self.postMessage({
        ok: false,
        error: err instanceof Error ? err.message : "Unable to parse feed.",
      });
    }
  };
