# Architecture

The static React application uses MapLibre to draw a raster background, schedule shapes, reachable cells, stops and scheduled vehicles. Vite bundles the app and two kinds of workers. No application server or database is needed.

## Data flow

The parser worker reads a compressed GTFS ZIP with fflate, parses quoted CSV and creates a typed Feed. It validates references and times, handles calendars and expands exact frequency service. The main thread holds the resulting feed for the map and copies it once to each calculation worker as needed. Completed workers are reused with their walking indexes. Cancelled or obsolete queries terminate their active workers, so an older response cannot replace a newer result. Replacing a feed or unmounting the app releases its workers.

## Routing

The router scans all active trips by ride round. Labels retain the arriving trip, alighting stop and time so transfer rules can match their route and trip scopes. Stops have separate labels for different arriving trips. A later arrival can therefore remain useful when the earliest arrival has a prohibited transfer. Spatial buckets index walks within 1 km. Boarding a transfer permits at most 400 m of walking, while final egress permits 1 km. Staying on a boarded trip scans its downstream calls without adding another transfer margin.

The same solver constructs timed walking, waiting and riding legs for a selected stop. Calendars and time interpretation are shared by routing and scheduled vehicle display. Vehicle positions project stop calls onto a shape, then interpolate along its cumulative distance. Missing shapes use straight segments.

## Geometry

A local metre grid samples the cost from the origin and transit alighting stops. Walking is capped at 1 km. Whole 120 m cells must fit within the available radius. Adjacent cells with the same color are grouped into row polygons. A and B are sampled independently, so purple requires spatial overlap rather than a common stop ID. This remains a straight line estimate, including across water.

## Verification

Vitest fixtures cover schedule semantics, mode types, boundaries and vehicle paths. The separate Python event search reads original BART CSV through the standard library and compares six fixed queries with TypeScript output. The browser check opens the real app through Playwright. CI repeats formatting, type checking, unit tests, a build and browser checks.
