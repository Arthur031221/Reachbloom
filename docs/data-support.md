# GTFS support

Import a regional GTFS Schedule ZIP. The file is parsed in a worker and never uploaded. A new import replaces the current schedule after successful parsing. It starts on a boardable trip date and centers the map at its departure stop. Superseded imports are cancelled.

## Supported input

Required files are `stops.txt`, `routes.txt`, `trips.txt` and `stop_times.txt`. Agency timezone is required for routing. Regular calendars and `calendar_dates.txt` additions or removals are supported, including dates only service. UTF8 BOM, quoted commas, CRLF and a containing folder are accepted.

Stop sequences are sorted and validated. Missing references, unusable times and trips with decreasing times are skipped with a note. Intermediate untimed calls can be interpolated between provided anchors. Untimed first or last calls are not guessed. Times must remain below 72 hours. Station records are retained for transfer matching, while only boarding stop locations participate in routing.

Standard and extended rail, bus and ferry route types are grouped for filtering. Shapes are used when available. Missing shapes fall back to straight segments. Minimum and prohibited transfers retain stop, route and trip scopes. The greatest matching GTFS specificity wins.

Exact frequencies expand into scheduled trips. Nonexact frequency templates are omitted. Pickup or dropoff that requires prior arrangement is excluded for that action. Transfer types 1, 4 and 5 allow ordinary scheduled reboarding with the usual transfer margin. Timed vehicle holds and staying onboard across linked trips are not modeled. Pathways, block continuity, fares, GTFS Flex, realtime data and accessible routing are planned areas, not implemented features.

## Limits and errors

Archives are limited to 50 MB compressed, 250 MB expanded and 64 MB per expanded file. ZIP64 is rejected. Exact frequency expansion is capped at 10,000 generated trips. Calculation workers time out after 30 seconds. Dense or large feeds may exceed these limits and need a smaller regional extract.

Malformed ZIP or CSV, missing required files and invalid timezone produce visible errors. The map can still show its previous parsed feed after an import fails. Imported feeds cannot be shared by URL because other devices do not have the file.

## Bundled examples

BART, Maywood Express Shuttle and Yurok River Otter Ferry are official schedule snapshots with separate licenses. Their download sources and default dates are documented in [data provenance](../data/README.md). The UI displays agency timezone, validity fields and parser notes.
