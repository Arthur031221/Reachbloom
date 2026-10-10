<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>Sieh, welche Ziele du mit öffentlichen Verkehrsmitteln in 30 Minuten erreichst.</p>
<p><b>6 ausgewählte BART-Abfragen stimmen mit einer unabhängigen CSV-Ereignissuche überein.</b> Beide verwenden das dokumentierte Fußwegmodell. Das prüft die Berechnung, nicht die tatsächlichen Fahrzeiten. <a href="benchmarks/reference-results.json">Fälle und Methode</a>.</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">Karte öffnen</a> / <a href="docs/accuracy.md">Annahmen lesen</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| Vorher                                                           | Mit Reachbloom                                           |
| :--------------------------------------------------------------- | :------------------------------------------------------- |
| Abfahrten in mehreren Fahrplantabellen nachverfolgen             | Einen Pin verschieben und erreichbare Haltestellen sehen |
| Zwei Wohnorte oder Abfahrtszeiten aus dem Gedächtnis vergleichen | A und B auf derselben Karte platzieren                   |
| Einen Screenshot ohne Kontext senden                             | Datum, Startpunkte und Zeitbudget teilen                 |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![Eine echte BART-Sitzung: Zeitbudget ändern, Startpunkte vergleichen und eine Verbindung ansehen](assets/demo.gif)

Ein Fahrplan ist ein Plan, keine Live-Position eines Fahrzeugs.

## Bahn, Bus und Fähre auf einer Karte

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="BART-Reichweite ab Civic Center mit Abfahrtssteuerung und erreichbaren Haltestellen" width="1200">
</picture>

_Neu in 1.0: ein datierter Bahnfahrplan mit sichtbarer Fußwegannahme._

Öffne die [Live-Demo](https://arthur031221.github.io/Reachbloom/) ohne Konto oder API-Schlüssel. Die enthaltenen Beispiele umfassen die BART-Bahn, den Maywood Express Shuttle und die Yurok River Otter Ferry. Es sind datierte Fahrplan-Schnappschüsse, keine Live-Positionen von Fahrzeugen. Importiere eine eigene GTFS-ZIP-Datei, um ein anderes regionales Netz zu erkunden. Die Datei bleibt in deinem Browser.

Probiere diese fünf Schritte auf der Karte aus:

1. BART beibehalten und den 2026-08-24 um 08:00 einstellen.
2. Startpunkt A in die Nähe des Civic Center in San Francisco verschieben.
3. Die Zeitbudgets von 15, 30 und 45 Minuten ausprobieren.
4. Startpunkt B aktivieren und dessen Abfahrtszeit ändern.
5. Nach Powell suchen und die Abschnitte für Fußweg, Wartezeit und Fahrt öffnen.

Orange steht für A, Blaugrün für B und Violett für den Bereich, den beide erreichen. Das Raster schätzt Fußwege anhand der Luftlinie und berücksichtigt weder Straßen noch Hindernisse oder Wasser. Ein gemeinsamer Bereich kann einen Treffpunkt nahelegen. Es sucht keine Wohnungen, von denen aus zwei Arbeitsplätze erreichbar sind.

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Fahrplan-Karte des Maywood Express Shuttle" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="Fahrplan-Karte der River Otter Ferry" width="580"></a></td></tr>
<tr><td><i>Neu in 1.0: ein Shuttle im Viertel.</i></td><td><i>Neu in 1.0: eine Flussfähre.</i></td></tr>
</table>

## Warum ich es gebaut habe

> _Ich kann einen Abfahrtsplan lesen. Trotzdem möchte ich sehen, wohin mich diese Abfahrt bringt._

Ich habe Reachbloom gebaut, weil Datum, Wartezeit und Fußwegannahmen neben der Karte stehen sollten. Ich wollte einen Pin verschieben, eine andere Abfahrtszeit vergleichen und dieselbe Ansicht teilen. Der Fahrplan lässt sich prüfen und die Berechnung läuft im Browser.

## Ausgaben

| Ausgabe           | Enthält                                                       |
| :---------------- | :------------------------------------------------------------ |
| Reichweitenkarte  | Datierte Abfahrten, Fußwegschätzung und Fahrtlimit            |
| Geteilter Link    | Beide Startpunkte, Zeiten, Verkehrsmittel, Design und Sprache |
| PNG               | Startpunkt-Pins, Abfahrtszeiten, Zeitbudget und Quellenangabe |
| Haltestellenroute | Zeitangaben für Fußweg, Warten und Fahrt                      |

## Ein Fahrplan, den du durchlaufen kannst

Wenn der Feed Linienverläufe enthält, folgen die planmäßigen Fahrzeuge diesen Verläufen. Bei der Wiedergabe läuft die Abfahrtszeit weiter, sodass du die Änderungen bei Fahrzeugen und Reichweite beobachten kannst. Filtere Bahn, Bus oder Fähre, wähle ein bis acht Fahrten und wechsle zwischen hellem und dunklem Design.

Die Oberfläche unterstützt Englisch, traditionelles Chinesisch, vereinfachtes Chinesisch, Japanisch, Koreanisch, Spanisch, Französisch, Deutsch und brasilianisches Portugiesisch. Das Layout passt sich an Smartphones an. Ein geteilter integrierter Beispieldatensatz enthält Datum, Abfahrtszeiten, Startpunkte, Verkehrsmittel, Fahrtanzahl, Zeitbudget, Sprache und Design. Eine importierte ZIP-Datei muss auf dem jeweiligen Gerät erneut lokal geöffnet werden. Deshalb ist das Teilen privater Feeds deaktiviert.

Der Export erstellt ein PNG mit 1080 x 1350 Pixeln, das Karte, Startpunkt-Pins, Abfahrtszeiten, Zeitbudget und Quellenangabe enthält. Ein Hinweis erklärt die Fußwegschätzung. Für Kartenkacheln ist eine Internetverbindung nötig. Das Einlesen der Daten und die Routenberechnung laufen in Workern.

## Auf dem eigenen Rechner ausführen

Node.js 22.12 oder neuer und Git werden benötigt. Der obige Befehl lädt den Quellcode von GitHub herunter, erstellt lokal den Build und startet einen Server unter `http://127.0.0.1:4173`. Der erste Start dauert länger als das Öffnen der Live-Demo.

<details>
<summary>macOS und Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Für einen anderen Port hängst du ihn an den Befehl an: `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`.

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Öffne `http://127.0.0.1:4173`. Mit Strg+C stoppst du den Server.

</details>

<details>
<summary>Aus einem Checkout erstellen oder eine statische Kopie hosten</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

Stelle `dist/` auf einem beliebigen statischen Host bereit. GitHub Pages verwendet den enthaltenen Workflow. Siehe [Installation](docs/install.md) und [Konfiguration](docs/config.md).

</details>

## Was das Ergebnis aussagt

Die Berechnung verwendet datierte planmäßige Abfahrts- und Ankunftszeiten, Kalenderausnahmen und Fahrten über Mitternacht. In jeder Fahrtrunde werden alle aktiven Fahrten durchsucht, auch solche, die andere überholen. Beim Abgleich von Umstiegen bleiben Linien- und Fahrtkontext erhalten. Dabei gilt die GTFS-Reihenfolge nach Spezifität. Mindestzeiten und Umstiegsverbote werden berücksichtigt. Ein allgemeiner Umstieg erfordert insgesamt mindestens zwei Minuten einschließlich des Fußwegs. Fahrzeughalte für Anschlüsse und die Weiterfahrt im selben Fahrzeug werden nicht modelliert. Diese Verbindungen nutzen stattdessen gewöhnliches Umsteigen nach Fahrplan.

Die Gehgeschwindigkeit wird mit 4,8 km/h angesetzt. Zu- und Abgang zu Haltestellen sind auf jeweils 1 km begrenzt. Zwischen Fahrten ist ein Umstiegsfußweg von höchstens 400 m möglich. Das angezeigte 120-m-Raster enthält nur Zellen, die vollständig im geschätzten Gehbereich liegen. An dessen Rand ist die Schätzung vorsichtig. Es handelt sich nicht um eine Isochrone auf Basis des Straßennetzes. Für die jeweiligen Aktionen werden Haltestellen ausgeschlossen, bei denen Abholung oder Ausstieg vorab vereinbart werden müssen. Exakte Taktverkehre werden aufgelöst. Vorlagen mit ungenauen Takten werden mit einem Hinweis ausgelassen.

Daten für Tage rund um die Zeitumstellung werden abgelehnt, da diese Version die Ortszeit der Verkehrsagentur verwendet. Es gibt keine Echtzeitverspätungen, Fahrpreise oder rollstuhlgerechten Routen. Eine mit der Routenplanung des Verkehrsunternehmens vergleichbare Genauigkeit wird nicht behauptet. [Unterstützte Daten und Grenzen](docs/data-support.md) beschreibt abgelehnte und angenäherte Eingaben.

Der BART-Schnappschuss gibt den 2026-08-30 als Enddatum an, obwohl der Kalender darüber hinausgeht. Die Karte zeigt die Gültigkeitsfelder und warnt bei Daten außerhalb dieses Zeitraums. Jeder Feed hat eine eigene Lizenz. Siehe [Datenherkunft](data/README.md) und [Hinweise zu Drittanbietern](THIRD_PARTY_NOTICES.md).

## Ergebnisse prüfen

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

Die Browserprüfung umfasst die echte Karte, Importfehler, drei Beispiele, Routen, neun Sprachen, Teilen, PNG-Export und überlaufende Inhalte auf Mobilgeräten. Falls kein System-Chrome verfügbar ist, installiere zuerst Chromium mit `npx playwright install chromium`. Unit-Tests und Builds laufen in CI mit Node 22 und 24. Browser-, Paket- und Referenzprüfungen laufen mit Node 22.

`npm run benchmark` misst den enthaltenen Feed auf deinem Rechner. Für die unabhängige Prüfung mit den originalen CSV-Daten richtest du eine Python-Umgebung ein und führst `PYTHON=.venv/bin/python npm run verify:reference` aus. Die [Referenzimplementierung](tests/reference.py) verwendet eine Ereignissuche statt der Rundensuche der App. Sechs bestandene feste Abfragen belegen keine Genauigkeit für alle Feeds.

[Nutzung](docs/usage.md) / [Architektur](docs/architecture.md) / [Genauigkeit](docs/accuracy.md) / [Mitwirken](CONTRIBUTING.md)

Der Quellcode steht unter MIT-Lizenz. Für Verkehrsdaten und Kartenkacheln gelten eigene Bedingungen.

Assisted by Claude/Codex.
