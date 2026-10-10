<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>See where a transit timetable can take you in 30 minutes.</p>
<p><b>6 selected BART queries match a separate CSV event search.</b> Both use the documented walking model. This checks the calculation. It doesn't check real journey times. <a href="benchmarks/reference-results.json">Cases and method</a>.</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">Open the map</a> / <a href="docs/accuracy.md">Read the assumptions</a></p>
<p><a href="README.zh-TW.md">Traditional Chinese</a> / <a href="README.zh-CN.md">Simplified Chinese</a> / <a href="README.ja.md">Japanese</a> / <a href="README.ko.md">Korean</a> / <a href="README.es.md">Spanish</a> / <a href="README.fr.md">French</a> / <a href="README.de.md">German</a> / <a href="README.pt-BR.md">Portuguese</a></p>
</div>

| Before                                           | With Reachbloom                           |
| :----------------------------------------------- | :---------------------------------------- |
| Trace departures across several timetable tables | Move one pin and see reachable stops      |
| Compare two homes or departure times from memory | Put A and B on the same map               |
| Send a screenshot with no context                | Share the date, origins and travel budget |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![A real BART session: change the travel budget, compare origins and inspect a journey](assets/demo.gif)

A timetable shows the plan. It doesn't track live vehicles.

## Rail, bus and ferry on one map

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="BART reach from Civic Center, with the departure controls and reachable stops visible" width="1200">
</picture>

_New in 1.0: a dated rail timetable, with the walking assumption in view._

Open the [live demo](https://arthur031221.github.io/Reachbloom/) without an account or API key. The bundled examples cover BART rail, the Maywood Express Shuttle and the Yurok River Otter Ferry. They're dated schedule snapshots. They don't show live vehicle locations. Import your own GTFS ZIP to explore another regional network. The file stays in your browser.

Try these five steps:

1. Keep BART on 2026-08-24 at 08:00.
2. Move Origin A near Civic Center in San Francisco.
3. Try the 15, 30 and 45 minute budgets.
4. Enable Origin B and change its departure time.
5. Search for Powell and open its walking, waiting and ride steps.

Orange is A, teal is B and purple is the area both can reach. The grid samples straight line walking. It ignores streets, barriers and water. A shared area suggests a meeting place. It doesn't find homes with a commute to two workplaces.

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Maywood Express Shuttle timetable on the map" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="River Otter Ferry timetable on the map" width="580"></a></td></tr>
<tr><td><i>New in 1.0: a neighborhood shuttle.</i></td><td><i>New in 1.0: a river crossing.</i></td></tr>
</table>

## Why I built it

> _I can read a departure table. I still want to see what that departure gives me._

I built Reachbloom to put the date, waiting time and walking assumptions beside the map. I wanted to move a pin, compare another departure and send someone the same view. You can inspect the schedule, and the calculation stays in the browser.

## What it makes

| Output           | What goes with it                                           |
| :--------------- | :---------------------------------------------------------- |
| A reach map      | Dated departures, a walking estimate and a ride limit       |
| A shared link    | Both origins, times, mode, theme and language               |
| A PNG            | Origin pins, departure times, travel budget and attribution |
| A stop itinerary | Timed walking, waiting and ride steps                       |

## A timetable you can move through

Scheduled vehicles follow the feed's route shapes when available. Play advances the departure clock so you can watch the vehicles and reach result change. Filter rail, bus or ferry, choose one to eight rides, and switch between light and dark themes.

The interface supports English, Traditional Chinese, Simplified Chinese, Japanese, Korean, Spanish, French, German and Brazilian Portuguese. The layout fits a phone. Share a bundled example with its date, departure times, origins, mode, ride count, budget, language and theme. Imported ZIPs must be opened locally again, so sharing is disabled for private feeds.

Export creates a 1080 x 1350 PNG with the map, origin pins, departure times, travel budget and attribution. It includes a walking caveat. Map tiles need an internet connection. Parsing and journey calculations run in workers.

## Run it on your machine

You'll need Node.js 22.12 or newer and Git. The command above downloads the source and build dependencies from GitHub, builds the app locally and opens a server at `http://127.0.0.1:4173`. The first run takes longer than opening the live demo.

<details>
<summary>macOS and Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

For a different port, append it: `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`.

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Open `http://127.0.0.1:4173`. Press Ctrl+C to stop the server.

</details>

<details>
<summary>Build from a checkout or host a static copy</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

Deploy `dist/` on any static host. GitHub Pages uses the included workflow. See [installation](docs/install.md) and [configuration](docs/config.md).

</details>

## What the result means

Transit uses dated scheduled departures and arrivals, calendar exceptions and overnight service. I scan every active trip by ride round, including overtaking trips. Transfer matching keeps route and trip context, follows the GTFS specificity order, and respects minimum times and prohibitions. A generic change takes two minutes total, including the transfer walk. Timed vehicle holds and in seat continuation aren't modeled. Those connections use ordinary scheduled reboarding.

Walking is estimated at 4.8 km/h. Access and egress are capped at 1 km, with one transfer walk of at most 400 m between rides. The displayed 120 m grid keeps whole cells inside the estimated walking radius. It's conservative at the boundary. It isn't a street network isochrone. Stops that require pickup or dropoff by prior arrangement are excluded from those actions. Exact frequency service is expanded. Nonexact frequency templates are omitted with a note.

Dates around daylight saving changes are rejected because this version uses agency wall clock times. There are no realtime delays, fares, wheelchair routes or operator planner accuracy claims. [Supported data and limits](docs/data-support.md) describes rejected and approximated input.

The BART snapshot advertises an end date of 2026-08-30 even though its calendar continues later. The map shows its validity fields and warns outside that range. Each feed keeps its own license. See [data provenance](data/README.md) and [third party notices](THIRD_PARTY_NOTICES.md).

## Check the work

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

The browser check covers the real map, import errors, three examples, itineraries, nine languages, sharing, PNG export and mobile overflow. Install Chromium first with `npx playwright install chromium` if no system Chrome is available. Unit tests and builds run on Node 22 and 24 in CI. Browser, package and reference checks run on Node 22.

`npm run benchmark` measures the bundled feed on your machine. For the independent raw CSV reference check, run `python3 -m venv .venv`, then `PYTHON=.venv/bin/python npm run verify:reference`. The [reference implementation](tests/reference.py) uses an event search. The app uses a round scan. Six fixed queries passing doesn't establish accuracy for every feed.

[Usage](docs/usage.md) / [Architecture](docs/architecture.md) / [Accuracy](docs/accuracy.md) / [Contributing](CONTRIBUTING.md)

MIT for source code. Transit data and map tiles have separate terms.

Assisted by Claude/Codex.
