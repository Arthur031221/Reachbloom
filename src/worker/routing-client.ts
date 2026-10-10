import type { Feed, Reach } from "../core/types";
import type { JourneyLeg } from "../core/routing";
export type RouteRequest = {
  feed: Feed;
  origin: { lat: number; lon: number };
  date: string;
  startSec: number;
  limitMin: number;
  maxRides: number;
  mode: string;
  destination?: string;
};
type Slot = { worker: Worker; busy: boolean; cancel?: () => void };
const pools = new WeakMap<Feed, Slot[]>();

export function releaseFeed(feed: Feed) {
  for (const slot of [...(pools.get(feed) || [])]) {
    slot.cancel?.();
    slot.worker.terminate();
  }
  pools.delete(feed);
}

export function calculate(
  q: RouteRequest,
  signal: AbortSignal,
): Promise<Reach[] | JourneyLeg[] | undefined> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    let pool = pools.get(q.feed);
    if (!pool) {
      pool = [];
      pools.set(q.feed, pool);
    }
    let slot = pool.find((s) => !s.busy);
    if (!slot) {
      const worker = new Worker(
        new URL("./routing.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
      slot = { worker, busy: false };
      pool.push(slot);
      worker.postMessage({ feed: q.feed });
    }
    const current = slot;
    const worker = current.worker;
    current.busy = true;
    const discard = () => {
      worker.terminate();
      const i = pool.indexOf(current);
      if (i >= 0) pool.splice(i, 1);
    };
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      worker.onmessage = null;
      worker.onerror = null;
      current.busy = false;
      current.cancel = undefined;
    };
    const abort = () => {
      cleanup();
      discard();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    current.cancel = abort;
    const timer = setTimeout(() => {
      cleanup();
      discard();
      reject(
        Error(
          "This query exceeded 30 seconds. Try a smaller feed or fewer rides.",
        ),
      );
    }, 30000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (e) => {
      cleanup();
      e.data.ok ? resolve(e.data.result) : reject(Error(e.data.error));
    };
    worker.onerror = () => {
      cleanup();
      discard();
      reject(Error("Routing worker failed."));
    };
    const { feed: _, ...query } = q;
    worker.postMessage({ query });
  });
}
