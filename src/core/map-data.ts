import type { Feature, FeatureCollection, Geometry, LineString } from "geojson";
import type { Feed } from "./types";

export function featureCollection<G extends Geometry = Geometry>(
  features: Feature<G>[] = [],
): FeatureCollection<G> {
  return { type: "FeatureCollection", features };
}

export function makeShape(feed: Feed) {
  const features: Feature<LineString>[] = [];
  const stops = new Map(feed.stops.map((s) => [s.id, s]));
  const seen = new Set<string>();
  for (const trip of feed.trips) {
    const key = `${trip.routeId}:${trip.shapeId || trip.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const shape = trip.shapeId && feed.shapes[trip.shapeId];
    const coordinates =
      shape && shape.length > 1
        ? shape.map((p) => [p.lon, p.lat])
        : trip.calls.flatMap((c) => {
            const stop = stops.get(c.stopId);
            return stop ? [[stop.lon, stop.lat]] : [];
          });
    if (coordinates.length > 1)
      features.push({
        type: "Feature",
        properties: { route: trip.routeId },
        geometry: { type: "LineString", coordinates },
      });
  }
  return featureCollection(features);
}
