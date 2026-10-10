import type { Stop, Reach } from "./types";
const CELL = 120,
  SPEED = 80,
  METERS = 111320;
type Cell = { a: number; b: number; x: number; y: number };
// Sample walking costs on a local metre grid. Row runs keep GeoJSON small.
export function reachArea(
  stops: Stop[],
  a: Reach[],
  b: Reach[],
  origin: [number, number],
  originB: [number, number] | undefined,
  limit: number,
) {
  const cos = Math.max(0.01, Math.cos((origin[1] * Math.PI) / 180));
  const xy = (lon: number, lat: number) => [
    (((lon - origin[0] + 540) % 360) - 180) * METERS * cos,
    (lat - origin[1]) * METERS,
  ];
  const lonlat = (x: number, y: number) => [
    origin[0] + x / (METERS * cos),
    origin[1] + y / METERS,
  ];
  const cells = new Map<string, Cell>(),
    byId = new Map(stops.map((s) => [s.id, s]));
  const fill = (lon: number, lat: number, minutes: number, side: "a" | "b") => {
    const remaining = limit - minutes,
      radius = Math.min(1000, remaining * SPEED);
    if (radius <= 0) return;
    const [cx, cy] = xy(lon, lat);
    for (
      let x = Math.floor((cx - radius) / CELL);
      x <= Math.floor((cx + radius) / CELL);
      x++
    )
      for (
        let y = Math.floor((cy - radius) / CELL);
        y <= Math.floor((cy + radius) / CELL);
        y++
      ) {
        const d = Math.hypot((x + 0.5) * CELL - cx, (y + 0.5) * CELL - cy);
        // Require every corner to fit, so the raster does not expand the walking radius.
        if (d + CELL / Math.sqrt(2) > radius) continue;
        const key = `${x},${y}`,
          cell = cells.get(key) || { x, y, a: Infinity, b: Infinity };
        cell[side] = Math.min(cell[side], minutes + d / SPEED);
        cells.set(key, cell);
      }
  };
  fill(...origin, 0, "a");
  if (originB) fill(...originB, 0, "b");
  for (const [list, side] of [
    [a, "a"],
    [b, "b"],
  ] as const)
    for (const r of list) {
      if (r.alightMinutes === undefined && (r.round === 0 || r.prev)) continue;
      const s = byId.get(r.stopId);
      if (s) fill(s.lon, s.lat, r.alightMinutes ?? r.minutes, side);
    }
  const color = (c: Cell) =>
    Number.isFinite(c.a) && Number.isFinite(c.b)
      ? "#8768b2"
      : Number.isFinite(c.b)
        ? "#168f89"
        : Math.min(c.a, c.b) <= 15
          ? "#f6b75c"
          : Math.min(c.a, c.b) <= 30
            ? "#e69a35"
            : "#c77b20";
  const sorted = [...cells.values()].sort((a, b) => a.y - b.y || a.x - b.x),
    features = [];
  for (let i = 0; i < sorted.length;) {
    const first = sorted[i],
      shade = color(first);
    let end = first.x;
    i++;
    while (
      i < sorted.length &&
      sorted[i].y === first.y &&
      sorted[i].x === end + 1 &&
      color(sorted[i]) === shade
    ) {
      end = sorted[i].x;
      i++;
    }
    features.push({
      type: "Feature" as const,
      properties: { color: shade },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            lonlat(first.x * CELL, first.y * CELL),
            lonlat((end + 1) * CELL, first.y * CELL),
            lonlat((end + 1) * CELL, (first.y + 1) * CELL),
            lonlat(first.x * CELL, (first.y + 1) * CELL),
            lonlat(first.x * CELL, first.y * CELL),
          ],
        ],
      },
    });
  }
  const borders = [];
  for (const c of cells.values()) {
    const shade = color(c);
    for (const [dx, dy, p1, p2] of [
      [-1, 0, [c.x, c.y], [c.x, c.y + 1]],
      [1, 0, [c.x + 1, c.y], [c.x + 1, c.y + 1]],
      [0, -1, [c.x, c.y], [c.x + 1, c.y]],
      [0, 1, [c.x, c.y + 1], [c.x + 1, c.y + 1]],
    ] as [number, number, number[], number[]][]) {
      const neighbor = cells.get(`${c.x + dx},${c.y + dy}`);
      if (neighbor && color(neighbor) === shade) continue;
      borders.push({
        type: "Feature" as const,
        properties: { color: shade },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            lonlat(p1[0] * CELL, p1[1] * CELL),
            lonlat(p2[0] * CELL, p2[1] * CELL),
          ],
        },
      });
    }
  }
  return {
    type: "FeatureCollection" as const,
    features,
    outline: { type: "FeatureCollection" as const, features: borders },
  };
}
