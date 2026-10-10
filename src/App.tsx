import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MLMap,
  Marker,
  NavigationControl,
  AttributionControl,
  GeoJSONSource,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";
import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import zhCN from "./locales/zh-CN.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt-BR.json";
import { parseZip } from "./worker/client";
import { isServiceActive, matchesMode } from "./core/routing";
import { calculate, releaseFeed } from "./worker/routing-client";
import { packs } from "./core/packs";
import {
  readView,
  importedView,
  languages,
  nearbyOrigin,
} from "./core/view-state";
import { reachArea } from "./core/reach-area";
import { featureCollection, makeShape } from "./core/map-data";
import { exportImage } from "./core/export-map";
import { scheduledVehicles } from "./core/service";
import type { JourneyLeg } from "./core/routing";
import type { Feed, Reach, Stop } from "./core/types";
import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);
const locales: Record<string, typeof en> = {
  en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  es,
  fr,
  de,
  "pt-BR": pt,
};
const keys = languages;
const toSec = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 3600 + m * 60;
};
const fromSec = (n: number) => {
  n = ((n % 86400) + 86400) % 86400;
  return `${String(Math.floor(n / 3600)).padStart(2, "0")}:${String(Math.floor((n % 3600) / 60)).padStart(2, "0")}`;
};
export default function App() {
  const [initial] = useState(() =>
    readView(
      new URL(location.href),
      localStorage.getItem("rb-locale") || "en",
      localStorage.getItem("rb-dark") === "true",
    ),
  );
  const [mapReady, setMapReady] = useState(false),
    [feed, setFeed] = useState<Feed | null>(null),
    [packId, setPackId] = useState(initial.packId),
    [error, setError] = useState(""),
    [routingError, setRoutingError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [calculating, setCalculating] = useState(false),
    [locale, setLocale] = useState(initial.locale),
    [dark, setDark] = useState(initial.dark),
    [date, setDate] = useState(initial.date),
    [clock, setClock] = useState(initial.clock),
    [clockB, setClockB] = useState(initial.clockB),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(60),
    [mode, setMode] = useState(initial.mode),
    [compare, setCompare] = useState(initial.compare),
    [origin, setOrigin] = useState<[number, number]>(initial.origin),
    [originB, setOriginB] = useState<[number, number]>(initial.originB),
    [activeOrigin, setActiveOrigin] = useState<"A" | "B">("A"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(""),
    [reachMinutes, setReachMinutes] = useState(initial.minutes),
    [maxRides, setMaxRides] = useState(initial.rides),
    [reach, setReach] = useState<Reach[]>([]),
    [reachB, setReachB] = useState<Reach[]>([]),
    [queryEpoch, setQueryEpoch] = useState(0);
  const mapEl = useRef<HTMLDivElement>(null),
    map = useRef<MLMap | null>(null),
    markerA = useRef<Marker | null>(null),
    markerB = useRef<Marker | null>(null),
    fileRef = useRef<HTMLInputElement>(null),
    loadGeneration = useRef(0),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    parserController = useRef<AbortController | null>(null),
    activeOriginRef = useRef(activeOrigin),
    feedRef = useRef<Feed | null>(feed),
    clockRef = useRef(clock),
    dateRef = useRef(date),
    t = locales[locale] || en;
  activeOriginRef.current = activeOrigin;
  feedRef.current = feed;
  clockRef.current = clock;
  dateRef.current = date;
  const pack = packs.find((p) => p.id === packId);
  const load = useCallback(
    async (
      buf: ArrayBuffer,
      custom = false,
      generation = ++loadGeneration.current,
    ) => {
      parserController.current?.abort();
      const controller = new AbortController();
      parserController.current = controller;
      setLoading(true);
      setError("");
      try {
        const f = await parseZip(buf, controller.signal);
        if (generation !== loadGeneration.current) return;
        if (custom) {
          const v = importedView(f);
          setPackId("custom");
          setDate(v.date);
          setClock(v.clock);
          setClockB(v.clock);
          setOrigin(v.origin);
          setOriginB(nearbyOrigin(v.origin));
          setCompare(false);
          setMode("all");
          map.current?.flyTo({ center: v.origin, zoom: 12 });
        }
        setFeed(f);
        setSelected("");
        setQueryEpoch((x) => x + 1);
      } catch (e) {
        if (
          generation === loadGeneration.current &&
          !(e instanceof DOMException && e.name === "AbortError")
        )
          setError(e instanceof Error ? e.message : "Unable to load feed.");
      } finally {
        if (generation === loadGeneration.current) setLoading(false);
      }
    },
    [],
  );
  useEffect(
    () => () => {
      parserController.current?.abort();
      clearTimeout(noticeTimer.current);
    },
    [],
  );
  async function importFile(file: File) {
    const generation = ++loadGeneration.current;
    parserController.current?.abort();
    setPlaying(false);
    setLoading(true);
    setError("");
    if (file.size > 50 * 1024 * 1024) {
      setError("The compressed GTFS file must be smaller than 50 MB.");
      setLoading(false);
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      if (generation === loadGeneration.current)
        await load(bytes, true, generation);
    } catch (e) {
      if (generation === loadGeneration.current) {
        setError(e instanceof Error ? e.message : "Unable to read this file.");
        setLoading(false);
      }
    }
  }
  useEffect(() => {
    if (!pack) return;
    let cancelled = false;
    setLoading(true);
    setPlaying(false);
    setSelected("");
    setReach([]);
    setReachB([]);
    fetch(`${import.meta.env.BASE_URL}data/${pack.file}`)
      .then((r) => {
        if (!r.ok) throw Error("Feed download failed.");
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (!cancelled) return load(buf);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [packId, load]);
  function selectPack(id: string) {
    const p = packs.find((p) => p.id === id);
    if (!p) return;
    ++loadGeneration.current;
    parserController.current?.abort();
    setLoading(true);
    setPackId(id);
    setDate(p.date);
    setClock(p.time);
    setClockB(p.time);
    setOrigin(p.origin);
    setOriginB(nearbyOrigin(p.origin));
    setCompare(false);
    setMode("all");
    map.current?.flyTo({ center: p.origin, zoom: p.zoom });
  }
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = new MLMap({
      container: mapEl.current,
      center: origin,
      zoom: initial.zoom,
      canvasContextAttributes: { preserveDrawingBuffer: true },
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": dark ? "#162b35" : "#f3f1ea" },
          },
          {
            id: "base",
            type: "raster",
            source: "osm",
            paint: {
              "raster-saturation": -1,
              "raster-contrast": -0.25,
              "raster-opacity": dark ? 0.22 : 0.48,
            },
          },
        ],
      },
    });
    map.current = m;
    if (import.meta.env.MODE === "test")
      (window as Window & { reachbloomMap?: MLMap }).reachbloomMap = m;
    m.addControl(new NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new AttributionControl({ compact: true }), "bottom-right");
    m.on("load", () => {
      setMapReady(true);
      m.addSource("routes", { type: "geojson", data: featureCollection() });
      m.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.34,
        },
      });
      m.addSource("reach", { type: "geojson", data: featureCollection() });
      m.addLayer({
        id: "reach-fill",
        type: "fill",
        source: "reach",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.28,
          "fill-antialias": false,
        },
      });
      m.addSource("reach-outline", {
        type: "geojson",
        data: featureCollection(),
      });
      m.addLayer({
        id: "reach-line",
        type: "line",
        source: "reach-outline",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1,
          "line-opacity": 0.85,
        },
      });
      m.addSource("stops", { type: "geojson", data: featureCollection() });
      m.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": ["case", ["get", "selected"], 6, 3],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.2,
        },
      });
      m.addSource("vehicles", { type: "geojson", data: featureCollection() });
      m.addLayer({
        id: "vehicles",
        type: "circle",
        source: "vehicles",
        paint: {
          "circle-radius": 5,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "white",
          "circle-stroke-width": 2,
        },
      });
      m.on("click", "stops", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) setSelected(String(id));
      });
      m.on("click", "vehicles", (e) => {
        const id = String(e.features?.[0]?.properties?.id ?? "");
        const currentFeed = feedRef.current;
        const trip = currentFeed?.trips.find((item) => item.id === id);
        if (!trip || !e.lngLat) return;
        const route = currentFeed?.routes.find(
          (item) => item.id === trip.routeId,
        );
        const node = document.createElement("div");
        node.textContent = `${route?.short || trip.routeId} · Trip ${trip.id} · ${dateRef.current} ${clockRef.current} · Scheduled service`;
        new Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setDOMContent(node)
          .addTo(m);
      });
      m.on("mouseenter", "vehicles", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "vehicles", () => {
        m.getCanvas().style.cursor = "";
      });
      m.on("click", (e) => {
        if ((e.originalEvent.target as HTMLElement).closest(".maplibregl-ctrl"))
          return;
        if (
          m.queryRenderedFeatures(e.point, { layers: ["stops", "vehicles"] })
            .length
        )
          return;
        const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        if (activeOriginRef.current === "A") {
          setOrigin(p);
          markerA.current?.setLngLat(p);
        } else {
          setOriginB(p);
          markerB.current?.setLngLat(p);
        }
      });
      markerA.current = new Marker({
        draggable: true,
        color: "#e99d3d",
      })
        .setLngLat(origin)
        .addTo(m);
      markerA.current.on("dragend", () => {
        const p = markerA.current!.getLngLat();
        setOrigin([p.lng, p.lat]);
      });
      markerB.current = new Marker({
        draggable: true,
        color: "#27b9b1",
      })
        .setLngLat(originB)
        .addTo(m);
      markerB.current.getElement().style.display = compare ? "" : "none";
      markerB.current.on("dragend", () => {
        const p = markerB.current!.getLngLat();
        setOriginB([p.lng, p.lat]);
      });
    });
    return () => {
      m.remove();
      map.current = null;
      if (import.meta.env.MODE === "test")
        delete (window as Window & { reachbloomMap?: MLMap }).reachbloomMap;
    };
  }, []);
  useEffect(() => {
    markerA.current?.setLngLat(origin);
    markerB.current?.setLngLat(originB);
    if (markerB.current)
      markerB.current.getElement().style.display = compare ? "" : "none";
  }, [origin, originB, compare]);
  useEffect(() => {
    localStorage.setItem("rb-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    localStorage.setItem("rb-dark", String(dark));
    document.body.dataset.theme = dark ? "dark" : "light";
    if (mapReady && map.current?.getLayer("base")) {
      map.current.setPaintProperty(
        "background",
        "background-color",
        dark ? "#162b35" : "#f3f1ea",
      );
      map.current.setPaintProperty(
        "base",
        "raster-opacity",
        dark ? 0.22 : 0.48,
      );
    }
  }, [dark, mapReady]);
  useEffect(() => {
    if (!feed) return;
    setCalculating(true);
    const controller = new AbortController();
    const q = {
      feed,
      origin: { lat: origin[1], lon: origin[0] },
      date,
      startSec: toSec(clock),
      limitMin: reachMinutes,
      maxRides,
      mode,
    };
    Promise.all([
      calculate(q, controller.signal),
      compare
        ? calculate(
            {
              ...q,
              origin: { lat: originB[1], lon: originB[0] },
              startSec: toSec(clockB),
            },
            controller.signal,
          )
        : Promise.resolve([]),
    ])
      .then(([a, b]) => {
        if (!controller.signal.aborted) {
          setReach(a as Reach[]);
          setReachB(b as Reach[]);
          setRoutingError("");
          setCalculating(false);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setRoutingError(e.message);
          setReach([]);
          setReachB([]);
          setCalculating(false);
        }
      });
    return () => controller.abort();
  }, [
    feed,
    origin,
    originB,
    date,
    clock,
    clockB,
    reachMinutes,
    compare,
    maxRides,
    mode,
    queryEpoch,
  ]);
  const network = useMemo(() => {
    if (!feed) return;
    const allowed = (r: Feed["routes"][number]) => matchesMode(r.type, mode);
    const routes = feed.routes.filter(allowed);
    const colors = new Map(routes.map((r) => [r.id, r.color]));
    const shape = makeShape({
      ...feed,
      trips: feed.trips.filter((x) => colors.has(x.routeId)),
    });
    shape.features.forEach(
      (f) =>
        (f.properties = {
          ...f.properties,
          color: colors.get(f.properties?.route),
        }),
    );
    const stopColors = new Map<string, string>();
    for (const trip of feed.trips) {
      const color = colors.get(trip.routeId);
      if (!color) continue;
      for (const call of trip.calls)
        if (!stopColors.has(call.stopId)) stopColors.set(call.stopId, color);
    }
    const stops = featureCollection(
      feed.stops
        .filter((s) => stopColors.has(s.id))
        .map((s) => ({
          type: "Feature" as const,
          properties: { id: s.id, color: stopColors.get(s.id) },
          geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
        })),
    );
    return { shape, stops };
  }, [feed, mode]);
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !network) return;
    (m.getSource("routes") as GeoJSONSource)?.setData(network.shape);
    (m.getSource("stops") as GeoJSONSource)?.setData({
      ...network.stops,
      features: network.stops.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          selected: f.properties?.id === selected,
        },
      })),
    });
  }, [network, selected, mapReady]);
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !feed) return;
    const area = reachArea(
      feed.stops,
      reach,
      reachB,
      origin,
      compare ? originB : undefined,
      reachMinutes,
    );
    (m.getSource("reach") as GeoJSONSource)?.setData(area);
    (m.getSource("reach-outline") as GeoJSONSource)?.setData(area.outline);
  }, [feed, reach, reachB, reachMinutes, mapReady, origin, originB, compare]);
  useEffect(() => {
    if (feed) return () => releaseFeed(feed);
  }, [feed]);
  const routeIndex = useMemo(
    () => new Map(feed?.routes.map((r) => [r.id, r]) || []),
    [feed],
  );
  const active = useMemo(
    () =>
      feed
        ? feed.trips.some((x) => isServiceActive(feed, x.serviceId, date))
        : false,
    [feed, date],
  );
  const vehicles = useMemo(
    () => (feed ? scheduledVehicles(feed, date, toSec(clock)) : []),
    [feed, date, clock, queryEpoch],
  );
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m || !feed) return;
    const f = vehicles
      .filter((v) => {
        const r = routeIndex.get(v.trip.routeId);
        return r && matchesMode(r.type, mode);
      })
      .map((v) => {
        const r = routeIndex.get(v.trip.routeId)!;
        return {
          type: "Feature" as const,
          properties: { color: r.color, id: v.trip.id },
          geometry: { type: "Point" as const, coordinates: [v.lon, v.lat] },
        };
      });
    (m.getSource("vehicles") as GeoJSONSource)?.setData(featureCollection(f));
  }, [feed, vehicles, mode, mapReady, routeIndex]);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = toSec(clockRef.current) + speed * 60;
      if (next >= 86400) {
        const d = new Date(`${dateRef.current}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        setDate(d.toISOString().slice(0, 10));
      }
      setClock(fromSec(next));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, speed]);
  const selectedStop = feed?.stops.find((x) => x.id === selected);
  const sorted =
    feed?.stops
      .filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.id.toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 8) || [];
  const dateValid =
    feed &&
    feed.validStart &&
    feed.validEnd &&
    (date.replaceAll("-", "") < feed.validStart ||
      date.replaceAll("-", "") > feed.validEnd);
  async function share() {
    const u = new URL(location.href);
    u.searchParams.set("date", date);
    u.searchParams.set("time", clock);
    u.searchParams.set("a", origin.join(","));
    u.searchParams.set("lang", locale);
    u.searchParams.set("theme", dark ? "dark" : "light");
    u.searchParams.set("mode", mode);
    u.searchParams.set("city", packId);
    u.searchParams.set("minutes", String(reachMinutes));
    u.searchParams.set("rides", String(maxRides));
    u.searchParams.delete("b");
    u.searchParams.delete("timeB");
    if (compare) {
      u.searchParams.set("b", originB.join(","));
      u.searchParams.set("timeB", clockB);
    }
    history.replaceState(null, "", u);
    let copied = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(u.toString());
        copied = true;
      }
    } catch {}
    setNotice(copied ? t.copied : t.copyFallback);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4000);
  }
  function exportMap() {
    const m = map.current;
    if (!m) return;
    try {
      const canvas = m.getCanvas();
      const ratio = canvas.width / m.getContainer().clientWidth;
      const pins = [
        { point: origin, name: "A", color: "#e69a35" },
        ...(compare ? [{ point: originB, name: "B", color: "#168f89" }] : []),
      ].map((p) => {
        const point = m.project(p.point);
        return {
          x: point.x * ratio,
          y: point.y * ratio,
          name: p.name,
          color: p.color,
        };
      });
      const a = document.createElement("a");
      a.download = `reachbloom-${date}.png`;
      a.href = exportImage({
        canvas,
        pins,
        date,
        time: clock,
        timeB: compare ? clockB : undefined,
        minutes: reachMinutes,
        agency: feed?.agency || "GTFS",
        caveat: t.exportCaveat,
        minutesLabel: t.minutes,
        scheduledLabel: t.scheduled,
        dark,
      });
      a.click();
    } catch {
      setError(t.exportUnavailable);
    }
  }
  return (
    <main className={dark ? "app dark" : "app"}>
      <div className="map" ref={mapEl} aria-label={t.mapLabel} />
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <header className="brand">
        <span className="mark">
          <svg viewBox="0 0 40 40">
            <path
              d="M20 3C12 14 7 19 7 26a13 13 0 0 0 26 0C33 19 28 14 20 3Z"
              fill="#27b9b1"
            />
            <path
              d="M20 15c-4 5-7 8-7 12a7 7 0 0 0 14 0c0-4-3-7-7-12Z"
              fill="#f4be58"
            />
          </svg>
        </span>
        <span>
          <b>Reachbloom</b>
          <small>
            {t.scheduled} · {t.live}
          </small>
        </span>
      </header>
      <div className="map-result" aria-live="polite">
        <strong>
          {reachMinutes} {t.minutes}
        </strong>
        <small>
          {calculating ? t.loading : `${reach.length} ${t.destinations}`}
        </small>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{pack?.name || t.localFeed}</span>
            <h1>{t.reach}</h1>
          </div>
          <button
            className="icon-btn"
            onClick={() => setDark(!dark)}
            title={t.dark}
          >
            ◐
          </button>
        </div>
        <label className="field">
          {t.example}
          <select
            aria-label={t.example}
            value={packId}
            onChange={(e) => selectPack(e.target.value)}
          >
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {!pack && <option value="custom">{t.localFeed}</option>}
          </select>
        </label>
        <div className="field-row">
          <label>
            {t.date}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            {t.time}
            <input
              type="time"
              value={clock}
              onChange={(e) => setClock(e.target.value)}
            />
          </label>
        </div>
        {compare && (
          <label className="field">
            {t.departB}
            <input
              type="time"
              value={clockB}
              onChange={(e) => setClockB(e.target.value)}
            />
          </label>
        )}
        <div className="field-row">
          <label>
            {t.mode}
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">{t.all}</option>
              <option value="rail">{t.rail}</option>
              <option value="bus">{t.bus}</option>
              <option value="ferry">{t.ferry}</option>
            </select>
          </label>
          <label>
            {t.language}
            <select value={locale} onChange={(e) => setLocale(e.target.value)}>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {
                    (
                      {
                        en: "English",
                        "zh-TW": "繁體中文",
                        "zh-CN": "简体中文",
                        ja: "日本語",
                        ko: "한국어",
                        es: "Español",
                        fr: "Français",
                        de: "Deutsch",
                        "pt-BR": "Português",
                      } as Record<string, string>
                    )[k]
                  }
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          {t.maxRides}
          <input
            type="number"
            min="1"
            max="8"
            value={maxRides}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n) && n >= 1 && n <= 8) setMaxRides(n);
            }}
          />
        </label>
        <div className="range-head">
          <span>{t.reach}</span>
          <strong>
            {reachMinutes} {t.minutes}
          </strong>
        </div>
        <input
          className="range"
          aria-label={t.reach}
          type="range"
          min="15"
          max="90"
          step="15"
          value={reachMinutes}
          onChange={(e) => setReachMinutes(+e.target.value)}
        />
        <div className="legend">
          <span>
            <i className="dot amber" />A
          </span>
          <span>
            <i className="dot teal" />B
          </span>
          <span>
            <i className="dot purple" />
            {t.meeting}
          </span>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? "Ⅱ" : "▶"} {playing ? t.pause : t.play}
          </button>
          <select
            aria-label={t.speed}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
          >
            <option value="15">15 min/s</option>
            <option value="60">60 min/s</option>
            <option value="300">300 min/s</option>
          </select>
        </div>
        <div className="origin-tools">
          <button
            className={activeOrigin === "A" ? "active" : ""}
            onClick={() => setActiveOrigin("A")}
          >
            A · {t.origin}
          </button>
          <button
            className={activeOrigin === "B" ? "active" : ""}
            onClick={() => {
              setCompare(true);
              setActiveOrigin("B");
            }}
          >
            B · {t.originB}
          </button>
          <button
            className="compare"
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
          >
            {compare ? t.clear : t.compare}
          </button>
        </div>
        {compare && (
          <button
            className="same-origin"
            onClick={() => setOriginB([...origin])}
          >
            {t.sameOrigin}
          </button>
        )}
        <label className="search">
          <span>⌕</span>
          <input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {search && sorted.length > 0 && (
          <div className="suggestions">
            {sorted.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelected(s.id);
                  map.current?.flyTo({ center: [s.lon, s.lat], zoom: 13 });
                  setSearch("");
                }}
              >
                {s.name}
                <small>{s.id}</small>
              </button>
            ))}
          </div>
        )}
        <div className="button-row">
          <button onClick={() => fileRef.current?.click()}>
            ＋ {t.upload}
          </button>
          <button
            onClick={share}
            disabled={!pack}
            title={!pack ? t.customShare : undefined}
          >
            ↗ {t.share}
          </button>
          <button onClick={exportMap} disabled={loading || calculating}>
            ↓ {t.export}
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".zip,application/zip"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="caveat">{t.walk}</p>
        <div className="status">
          {loading || calculating ? (
            <span>{t.loading}</span>
          ) : error || routingError ? (
            <span className="error">{error || routingError}</span>
          ) : !active ? (
            <span className="error">{t.noService}</span>
          ) : (
            <span>
              ● {vehicles.length} {t.vehicles} · {reach.length} {t.stopsReach} ·{" "}
              {feed?.agency}
            </span>
          )}
          {dateValid && (
            <span className="warning">
              {t.dateNote} {feed?.validStart}–{feed?.validEnd}
            </span>
          )}
          {feed && (
            <small>
              {t.clock}: {feed.timezone} · {t.valid}:{" "}
              {feed.validStart || t.notSupplied} –{" "}
              {feed.validEnd || t.notSupplied}
            </small>
          )}
          {feed?.warnings.map((w, i) => (
            <small key={i}>⚠ {w}</small>
          ))}
        </div>
      </section>
      <div className="map-hint">
        {t.drag}{" "}
        <span>
          {t.mapSet} {activeOrigin}
        </span>
      </div>
      {selectedStop && (
        <aside className="itinerary">
          <button
            className="close"
            aria-label={t.close}
            onClick={() => setSelected("")}
          >
            ×
          </button>
          <span className="eyebrow">{t.itinerary}</span>
          <h2>{selectedStop.name}</h2>
          <p>
            {clock} · {date}
          </p>
          <Itinerary
            feed={feed!}
            origin={origin}
            date={date}
            sec={toSec(clock)}
            stop={selectedStop}
            maxRides={maxRides}
            mode={mode}
            t={t}
          />
        </aside>
      )}
      <div className="map-credit">
        {t.scheduled} · {feed?.agency || t.localFeed}{" "}
        <a
          href={pack?.url || "https://gtfs.org/"}
          target="_blank"
          rel="noreferrer"
        >
          {pack?.name || t.localFeed}
        </a>{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </div>
    </main>
  );
}
function Itinerary({
  feed,
  origin,
  date,
  sec,
  stop,
  maxRides,
  mode,
  t,
}: {
  feed: Feed;
  origin: [number, number];
  date: string;
  sec: number;
  stop: Stop;
  maxRides: number;
  mode: string;
  t: typeof en;
}) {
  const [it, setIt] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    setIt([]);
    calculate(
      {
        feed,
        origin: { lat: origin[1], lon: origin[0] },
        date,
        startSec: sec,
        destination: stop.id,
        maxRides,
        limitMin: 90,
        mode,
      },
      controller.signal,
    )
      .then((result) => {
        const legs = result as JourneyLeg[] | undefined;
        const labels = legs?.map((leg, i) => {
          const mins = Math.max(0, Math.round(leg.end - leg.start));
          if (leg.kind === "wait")
            return `${t.wait} · ${mins} ${t.minutes} ${t.at} ${leg.from}`;
          if (leg.kind === "ride")
            return `${t.ride} · ${leg.route} · ${leg.from} ${format(leg.start * 60)} → ${leg.to} ${format(leg.end * 60)}`;
          const label =
            i === 0
              ? t.access
              : legs!.slice(i + 1).some((next) => next.kind === "ride")
                ? t.transferWalk
                : t.egress;
          return `${label} · ${leg.from} → ${leg.to} · ${mins} ${t.minutes}`;
        });
        setIt(labels?.length ? labels : [t.noItinerary]);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setIt([e.message]);
      });
    return () => controller.abort();
  }, [feed, origin, date, sec, stop, maxRides, mode, t]);
  return (
    <ol className="steps">
      {it.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ol>
  );
}
function format(s: number) {
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}
