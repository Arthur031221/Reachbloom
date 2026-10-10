import type { Feed } from "../core/types";
export function parseZip(buffer: ArrayBuffer, signal?: AbortSignal) {
  return new Promise<Feed>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./gtfs.worker.ts", import.meta.url), {
      type: "module",
    });
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(Error("Import exceeded 30 seconds. Try a smaller regional feed."));
    }, 30000);
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (e: MessageEvent) => {
      cleanup();
      e.data.ok ? resolve(e.data.feed) : reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      cleanup();
      reject(Error("GTFS parser worker failed."));
    };
    worker.postMessage(buffer, [buffer]);
  });
}
