# Configuration

Reachbloom needs no account, API key or environment file. The default example is BART on 2026-08-24 at 08:00. Other bundled examples choose a service date and an origin with scheduled trips.

## Map controls

The travel budget ranges from 15 to 90 minutes in 15 minute steps. Maximum rides ranges from one to eight. Four is the default. Departure B can differ from A. Use the same origin button to compare two departure times at one place.

Language and theme are stored in local storage. GTFS imports are held in memory and disappear when the page closes. The app does not upload them or persist them in an external service.

## Shared URLs

The map stores `city`, `date`, `time`, `timeB`, `a`, `b`, `minutes`, `rides`, `mode`, `lang` and `theme` in the query string. Coordinates use longitude,latitude. B is omitted when comparison is off. Only bundled packs can be shared. Imported schedules must be reopened on each device.

## Hosting

`npm run build` creates a static `dist/` directory with its example schedules. By default the app uses `/` as its base. Set `GITHUB_PAGES=1` to build for `/Reachbloom/`, as the Pages workflow does. Change `base` in `vite.config.ts` for another subdirectory.

The CLI accepts a numeric port argument or the `PORT` environment variable, defaulting to 4173. It listens only on `127.0.0.1`. Stop it with Ctrl+C.

The default raster tiles come from OpenStreetMap. Replace the raster source in `src/App.tsx` if hosting requires a different provider, and preserve its attribution and terms. Tile requests expose the visible map area and the usual request metadata to that provider. Imported timetable contents are not sent with them.
