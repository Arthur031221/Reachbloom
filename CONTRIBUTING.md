# Contributing

I welcome reproducible routing bugs, improvements to the map and corrections to translations. For a schedule problem, include the source feed URL, license, service date, departure time, origin coordinates and the stop or connection that differs. Keep private feeds and personal locations out of public issues.

## Local setup

Use Node.js 22 or 24. Run `npm ci`, then `npm run dev`. Before sending a change:

```sh
npm run format:check
npm run typecheck
npm test
npm run build
npm run check:ui
```

Install Chromium with `npx playwright install chromium` if needed. Python is only needed for the independent reference check. Create `.venv` with `python3 -m venv .venv`, then run `PYTHON=.venv/bin/python npm run verify:reference` on macOS or Linux. On Windows, set `PYTHON` to `.venv/Scripts/python.exe`.

## Changes worth testing

Keep routing changes small. Add a timetable fixture that demonstrates the failure, especially for calendar exceptions, overnight trips, pickup rules or scoped transfers. Check the raw GTFS specification when changing semantics. The Python event search deliberately reads the original CSV instead of sharing the app parser.

Locale files live in `src/locales`. Add the same keys to every locale, preserve placeholders and use the language's usual transit terms. Agency names and feed messages come from the loaded data.

New example packs need a verified redistribution license, source attribution and a date with actual service. Source code is MIT. A data feed keeps its separate terms.

I review changes through pull requests. Explain the user problem, the change and the checks you ran.
