import { routeReach, findJourney } from "../core/routing";
import type { RouteRequest } from "./routing-client";
import type { Feed } from "../core/types";
let feed: Feed;
self.onmessage = (
  e: MessageEvent<{ feed?: Feed; query?: Omit<RouteRequest, "feed"> }>,
) => {
  if (e.data.feed) {
    feed = e.data.feed;
    return;
  }
  const q = e.data.query!;
  try {
    const result = q.destination
      ? findJourney(
          feed,
          q.origin,
          q.date,
          q.startSec,
          q.destination,
          q.maxRides,
          90,
          q.mode,
        )
      : routeReach(
          feed,
          q.origin,
          q.date,
          q.startSec,
          q.limitMin,
          q.maxRides,
          q.mode,
        );
    self.postMessage({ ok: true, result });
  } catch (e) {
    self.postMessage({
      ok: false,
      error: e instanceof Error ? e.message : "Routing failed.",
    });
  }
};
