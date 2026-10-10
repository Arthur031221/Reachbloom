# Install and run

Use Node.js 22.12 or newer, Git and a browser with WebGL. To start the published GitHub package:

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

The first installation downloads the source and dependencies and builds the app. The CLI then serves the built files at `http://127.0.0.1:4173`. Open that address. Pass a port such as `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180` to choose another. Stop it with Ctrl+C.

For a local checkout:

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run dev
```

`npm ci` runs the package preparation build. `npm run dev` starts the development server. `npm run build` creates `dist/`. `node bin/reachbloom.mjs` serves that production build. `--help` and `--version` are available.

The same npm commands work in macOS, Linux and Windows PowerShell. A production build can be hosted on any static host. The included GitHub Pages workflow builds for the repository subdirectory.

The app reads the bundled schedules or an imported ZIP locally. Map tiles come from OpenStreetMap and need a network connection. No API key or account is required. See [configuration](config.md) for URL parameters and privacy details.
