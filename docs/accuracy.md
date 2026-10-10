# Accuracy and limitations

I use Reachbloom to explore a loaded timetable. Scheduled vehicle dots are interpolated positions, not observations. Confirm an actual journey with the operator.

## Journey model

Access and egress use straight line walking at 4.8 km/h, each capped at 1 km. One transfer walk of at most 400 m is allowed between rides. Streets, stairs, accessibility, terrain, barriers and water are ignored. Initial boarding needs only the access walk. Later changes require two minutes total including walking unless a matching minimum transfer rule overrides it.

The router scans every active trip by ride round, so a later departing overtaking trip can win. Transfer labels keep arriving trip context. Rules follow the GTFS specificity order and consider station parents. Prohibited connections and pickup or dropoff requiring prior arrangement are excluded. Timed holds and in seat continuation are not modeled. These connections can still use ordinary scheduled reboarding with the generic transfer margin.

The reach budget is 15 to 90 minutes. A selected stop itinerary searches 90 minutes, so it may exist beyond the currently drawn reach budget. Maximum rides is configurable from one to eight, default four.

## Geometry

The displayed field samples a 120 m local grid. Every displayed cell fits inside its estimated walking radius, making its boundary conservative. Orange belongs to A, teal to B and purple to their overlap. This is not a street network isochrone or an accessibility analysis. In particular, walking can cross water in this model. The interface and exported images carry this caveat.

The grid is intended for regional feeds in one area. The map uses Web Mercator and imported origins must be within 85 degrees latitude. Projection approximations become less reliable over large distances or near the poles. Common reach suggests a meeting area. It does not solve arrival by a fixed time at two workplaces.

## Time and data

Calendar ranges, additions, removals and previous service day overnight trips are handled. Times use agency wall clock seconds. Dates around a daylight saving offset change are rejected, rather than guessed. Exact frequency service is expanded, while nonexact templates are omitted with a note. Interpolated intermediate stop times are reported.

Feed metadata can disagree with calendars. The map shows the feed validity fields and warns outside them. The BART snapshot defaults to 2026-08-24 and advertises an end date of 2026-08-30, though its calendars continue later. These are dated snapshots, not a claim that current service matches them.

Six fixed BART queries agree with the independent raw CSV event search in [reference results](../benchmarks/reference-results.json). This does not establish operator planner accuracy or correctness for arbitrary feeds. There are no realtime delays, fare calculations or wheelchair routing.
