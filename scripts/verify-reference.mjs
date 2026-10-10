import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { parseFeed } from "../src/worker/gtfs.worker.ts";
import { format } from "prettier";
import { routeReach } from "../src/core/routing.ts";
const bytes = await readFile("public/data/bart.zip"),
  feed = parseFeed(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
const cases = [
  ["2026-08-24", [-122.4167, 37.7764], 28800],
  ["2026-08-24", [-122.2711, 37.8044], 30600],
  ["2026-08-24", [-122.3532, 37.9368], 61200],
  ["2026-08-22", [-122.4167, 37.7764], 28800],
  ["2026-08-23", [-122.2711, 37.8044], 43200],
  ["2026-08-25", [-122.4167, 37.7764], 600],
];
const results = [];
for (const [date, origin, start] of cases) {
  const expected = JSON.parse(
    execFileSync(
      process.env.PYTHON || "python3",
      [
        "tests/reference.py",
        "public/data/bart.zip",
        date,
        origin.join(","),
        String(start),
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024, timeout: 60000 },
    ),
  );
  const actual = Object.fromEntries(
    routeReach(feed, { lon: origin[0], lat: origin[1] }, date, start).map(
      (r) => [r.stopId, r.minutes],
    ),
  );
  const differences = [
    ...new Set([...Object.keys(actual), ...Object.keys(expected)]),
  ].filter(
    (id) =>
      !(id in actual) ||
      !(id in expected) ||
      Math.abs(actual[id] - expected[id]) > 1e-6,
  );
  if (differences.length)
    throw Error(
      `${date} ${start}: ${differences
        .slice(0, 5)
        .map((id) => `${id}: ${actual[id]} vs ${expected[id]}`)
        .join("; ")}`,
    );
  results.push({
    date,
    origin,
    departureSeconds: start,
    comparedStops: Object.keys(actual).length,
  });
}
await writeFile(
  "benchmarks/reference-results.json",
  await format(
    JSON.stringify(
      {
        method:
          "Round scan in TypeScript versus an independent event search reading the original GTFS CSV in Python. Same walking limits, calendar, transfer and ride constraints. Six fixed BART queries, tolerance 0.000001 minutes. This checks these schedules, not operator accuracy or arbitrary feeds.",
        cases: results,
      },
      null,
      2,
    ),
    { parser: "json" },
  ),
);
console.log(`PASS: ${cases.length} raw GTFS reference queries agree`);
