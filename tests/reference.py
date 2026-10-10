"""Independent raw GTFS event search for fixed-date schedule checks."""

from __future__ import annotations
import bisect
import csv
import datetime as dt
import heapq
import io
import json
import math
import sys
import zipfile


def rows(archive, name):
    if name not in archive.namelist():
        return []
    return list(csv.DictReader(io.StringIO(archive.read(name).decode("utf-8-sig"))))


def meters(a, b):
    r = math.pi / 180
    x = math.sin((b[1] - a[1]) * r / 2) ** 2
    x += math.cos(a[1] * r) * math.cos(b[1] * r) * math.sin((b[0] - a[0]) * r / 2) ** 2
    return 12742000 * math.asin(min(1, math.sqrt(x)))


def seconds(value):
    h, m, s = map(int, value.split(":"))
    return h * 3600 + m * 60 + s


class Oracle:
    def __init__(self, filename, date):
        z = zipfile.ZipFile(filename)
        self.stops = {
            r["stop_id"]: r
            for r in rows(z, "stops.txt")
            if r.get("location_type", "0") in ("", "0")
        }
        self.coords = {
            k: (float(v["stop_lon"]), float(v["stop_lat"]))
            for k, v in self.stops.items()
        }
        calendars = {r["service_id"]: r for r in rows(z, "calendar.txt")}
        exceptions = {
            (r["service_id"], r["date"]): int(r["exception_type"])
            for r in rows(z, "calendar_dates.txt")
        }
        day = dt.date.fromisoformat(date)
        weekday = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        self.trips = []
        trip_rows = {r["trip_id"]: r for r in rows(z, "trips.txt")}
        calls = {}
        for r in rows(z, "stop_times.txt"):
            if r["stop_id"] not in self.stops:
                continue
            calls.setdefault(r["trip_id"], []).append(r)
        for k, items in calls.items():
            items.sort(key=lambda r: int(r["stop_sequence"]))
        for offset in (-2, -1, 0, 1):
            date_i = day + dt.timedelta(days=offset)
            key = date_i.strftime("%Y%m%d")
            for tid, tr in trip_rows.items():
                sid = tr["service_id"]
                c = calendars.get(sid)
                flag = bool(
                    c
                    and c["start_date"] <= key <= c["end_date"]
                    and c[weekday[date_i.weekday()]] == "1"
                )
                e = exceptions.get((sid, key))
                if e is not None:
                    flag = e == 1
                if not flag:
                    continue
                if tid not in calls:
                    continue
                values = [
                    (
                        r["stop_id"],
                        seconds(r["arrival_time"]) + offset * 86400,
                        seconds(r["departure_time"]) + offset * 86400,
                        r.get("pickup_type", "0") or "0",
                        r.get("drop_off_type", "0") or "0",
                    )
                    for r in calls[tid]
                ]
                self.trips.append((tid, tr["route_id"], values))
        self.board = {k: [] for k in self.stops}
        for ti, (_, _, values) in enumerate(self.trips):
            for ci, (sid, _, dep, pickup, _) in enumerate(values):
                if pickup == "0":
                    self.board[sid].append((dep, ti, ci))
        for values in self.board.values():
            values.sort()
        self.rules = rows(z, "transfers.txt")
        self.egress = {
            a: [
                (b, meters(self.coords[a], self.coords[b]) / (80 / 60))
                for b in self.stops
                if meters(self.coords[a], self.coords[b]) <= 1000
            ]
            for a in self.stops
        }
        self.walks = {
            a: [
                (b, meters(self.coords[a], self.coords[b]) / (80 / 60))
                for b in self.stops
                if meters(self.coords[a], self.coords[b]) <= 400
            ]
            for a in self.stops
        }

    def transfer_seconds(self, from_stop, to_stop, last_trip, next_trip, walking):
        tid0, rid0, _ = self.trips[last_trip]
        tid1, rid1, _ = self.trips[next_trip]
        matches = []
        for r in self.rules:
            if any(
                r.get(field) not in (stop, self.stops[stop].get("parent_station"))
                for field, stop in (
                    ("from_stop_id", from_stop),
                    ("to_stop_id", to_stop),
                )
            ):
                continue
            if any(
                r.get(field) and r[field] != value
                for field, value in (
                    ("from_route_id", rid0),
                    ("to_route_id", rid1),
                    ("from_trip_id", tid0),
                    ("to_trip_id", tid1),
                )
            ):
                continue
            ft, tt, fr, tr = (
                bool(r.get(field))
                for field in (
                    "from_trip_id",
                    "to_trip_id",
                    "from_route_id",
                    "to_route_id",
                )
            )
            rank = (
                6
                if ft and tt
                else (
                    5
                    if (ft and tr) or (tt and fr)
                    else 4 if ft or tt else 3 if fr and tr else 2 if fr or tr else 1
                )
            )
            matches.append((rank, r))
        if not matches:
            return max(walking, 120)
        maximum = max(v[0] for v in matches)
        chosen = [r for score, r in matches if score == maximum]
        if any(r.get("transfer_type") == "3" for r in chosen):
            return math.inf
        minimum = max(
            (
                float(r.get("min_transfer_time") or 0)
                for r in chosen
                if r.get("transfer_type") == "2"
            ),
            default=120,
        )
        return max(walking, minimum)

    def search(self, origin, departure, minutes=45, max_rides=4):
        end = departure + minutes * 60
        best = {}
        labels = {}
        queue = []
        counter = 0

        def enqueue(stop, last, rides, arrival):
            nonlocal counter
            if arrival > end:
                return
            key = (stop, last, rides)
            if arrival >= labels.get(key, math.inf):
                return
            labels[key] = arrival
            best[stop] = min(best.get(stop, math.inf), arrival)
            counter += 1
            heapq.heappush(queue, (arrival, counter, key))

        for s, coord in self.coords.items():
            d = meters(origin, coord)
            if d <= 1000:
                enqueue(s, -1, 0, departure + d / (80 / 60))
        while queue:
            arrival, _, (stop, last, rides) = heapq.heappop(queue)
            if arrival != labels[(stop, last, rides)]:
                continue
            if last >= 0:
                for dst, walk in self.egress[stop]:
                    if arrival + walk <= end:
                        best[dst] = min(best.get(dst, math.inf), arrival + walk)
            if rides >= max_rides:
                continue
            links = [(stop, 0)] if last == -1 else self.walks[stop]
            for dst, walk in links:
                entries = self.board[dst]
                start = bisect.bisect_left(entries, (arrival + walk, -1, -1))
                for dep, ti, ci in entries[start:]:
                    if dep > end:
                        break
                    wait = (
                        0
                        if last == -1
                        else self.transfer_seconds(stop, dst, last, ti, walk)
                    )
                    if arrival + wait > dep:
                        continue
                    for sid, arr, _, _, dropoff in self.trips[ti][2][ci + 1 :]:
                        if arr > end:
                            break
                        if dropoff == "0":
                            enqueue(sid, ti, rides + 1, arr)
        return {s: (v - departure) / 60 for s, v in best.items()}


if __name__ == "__main__":
    oracle = Oracle(sys.argv[1], sys.argv[2])
    origin = tuple(map(float, sys.argv[3].split(",")))
    result = oracle.search(origin, int(sys.argv[4]))
    print(json.dumps(result, sort_keys=True))
