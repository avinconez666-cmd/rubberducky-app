import { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { HazardReport, NearbyDriver } from "@/contexts/AppContext";
import type { CarStyle } from "@/constants/garage";
import { DEFAULT_CAR } from "@/constants/garage";
import { carSvg } from "@/lib/carSvg";

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #0D1B2A; }
  .leaflet-control-attribution { font-size: 9px; background: rgba(9,11,16,0.55); color: #9AA3B2; }
  .you-marker, .driver-marker { background: none !important; border: none !important; }
  .carblip { width: 104px; height: 56px; transform: rotate(var(--h, -90deg)); transform-origin: 50% 62%; }
  .carblip.go { animation: drive 0.36s ease-in-out infinite; }
  .carblip.go .wheel { animation: spin 0.42s linear infinite; transform-box: fill-box; transform-origin: center; }
  .carblip svg { width: 104px; height: 48px; display: block; }
  .pin { width: 104px; text-align: center; }
  .carname { margin-top: 2px; font: 700 10px sans-serif; color: #F4F0E6; background: rgba(9,11,16,.82); border-radius: 6px; display: inline-block; padding: 1px 4px; }
  @keyframes drive {
    0%, 100% { transform: rotate(var(--h, -90deg)) translateY(0); }
    50% { transform: rotate(var(--h, -90deg)) translateY(-2px); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView([-25.6, 134.3], 4);
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  let you = null;
  let youSvg = '';
  let pos = null;
  let aim = null;
  const drivers = {};
  function face(heading) {
    const h = typeof heading === 'number' && heading >= 0 ? heading : 0;
    return (h - 90) + 'deg';
  }
  function marker(svg, heading, moving, name) {
    const label = name ? '<div class="carname">' + name + '</div>' : '';
    return L.divIcon({
      className: name ? 'driver-marker' : 'you-marker',
      html: '<div class="pin"><div class="carblip' + (moving ? ' go' : '') + '" style="--h:' + face(heading) + '">' + (svg || '') + '</div>' + label + '</div>',
      iconSize: [104, name ? 70 : 56],
      iconAnchor: [52, 34]
    });
  }
  function tick() {
    if (you && pos && aim) {
      const dlat = aim[0] - pos[0];
      const dlng = aim[1] - pos[1];
      if (Math.abs(dlat) > 0.02 || Math.abs(dlng) > 0.02) pos = aim.slice();
      else { pos[0] += dlat * 0.22; pos[1] += dlng * 0.22; }
      you.setLatLng(pos);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  let layer = L.layerGroup().addTo(map);
  let followed = false;
  window.__rd = function (data) {
    if (!data || typeof data.lat !== 'number') return;
    const ll = [data.lat, data.lng];
    const moving = Number(data.speed) > 4;
    const heading = typeof data.heading === 'number' ? data.heading : null;
    if (!you) {
      you = L.marker(ll, { icon: marker(data.svg, heading, moving), zIndexOffset: 800, interactive: false }).addTo(map);
      youSvg = data.svg || '';
      pos = ll.slice();
      aim = ll.slice();
    } else if ((data.svg || '') !== youSvg) {
      you.setIcon(marker(data.svg, heading, moving));
      youSvg = data.svg || '';
    }
    aim = ll;
    const node = you.getElement && you.getElement();
    const car = node && node.querySelector('.carblip');
    if (car) {
      if (heading != null && heading >= 0) car.dataset.h = String(heading);
      car.style.setProperty('--h', face(Number(car.dataset.h || 0)));
      car.classList.toggle('go', moving);
    }
    if (!followed) { map.setView(ll, 15); followed = true; }
    layer.clearLayers();
    (data.hazards || []).forEach(function (h) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="font-size:22px;line-height:22px">' + (h.emoji || '⚠️') + '</div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([h.lat, h.lng], { icon: icon }).addTo(layer).bindPopup(h.label || 'Hazard');
    });
    (data.cameras || []).forEach(function (c) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="font-size:16px">' + (c.kind === 'redlight' ? '🚦' : '📷') + '</div>',
        iconSize: [18, 18], iconAnchor: [9, 9]
      });
      L.marker([c.lat, c.lng], { icon: icon }).addTo(layer).bindPopup(c.label || 'Published camera');
    });
    const seen = {};
    (data.drivers || []).forEach(function (d) {
      if (typeof d.lat !== 'number' || !d.svg) return;
      const id = String(d.id || d.name || d.lat);
      seen[id] = true;
      const existing = drivers[id];
      if (!existing) {
        drivers[id] = L.marker([d.lat, d.lng], {
          icon: marker(d.svg, d.heading, true, d.name || 'Driver'),
          zIndexOffset: 500
        }).addTo(map).bindPopup((d.name || 'Driver') + (d.live ? ' · live' : ''));
        drivers[id]._svg = d.svg;
      } else {
        existing.setLatLng([d.lat, d.lng]);
        if (existing._svg !== d.svg) {
          existing.setIcon(marker(d.svg, d.heading, true, d.name || 'Driver'));
          existing._svg = d.svg;
        }
        const el = existing.getElement && existing.getElement();
        const bit = el && el.querySelector('.carblip');
        if (bit && typeof d.heading === 'number') {
          bit.style.setProperty('--h', face(d.heading));
          bit.classList.add('go');
        }
      }
    });
    Object.keys(drivers).forEach(function (id) {
      if (!seen[id]) { map.removeLayer(drivers[id]); delete drivers[id]; }
    });
  };
</script>
</body>
</html>`;

const HAZARD_EMOJI: Record<string, string> = {
  accident: "💥",
  debris: "🪨",
  breakdown: "🛠️",
  animal: "🦘",
  roadworks: "🚧",
  weather: "🌧️",
  speed_camera: "📷",
  mobile_camera: "🚐",
  police: "🚔",
  driver: "🚙",
};

function driverSvg(driver: NearbyDriver) {
  const car: CarStyle = driver.car ?? { ...DEFAULT_CAR, body: driver.vehicleType === "truck" ? "hilux" : driver.vehicleType === "rv" ? "landcruiser" : "holden" };
  return carSvg(car, driver.id || driver.displayName);
}

export function LiveMap({
  latitude,
  longitude,
  hazards,
  drivers,
  cameras,
  car,
  heading,
  speed,
}: {
  latitude: number | null;
  longitude: number | null;
  hazards: HazardReport[];
  drivers: NearbyDriver[];
  cameras?: { lat: number; lng: number; kind: string; label: string }[];
  car?: CarStyle;
  heading?: number | null;
  speed?: number;
}) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);

  const payload = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return JSON.stringify({
      lat: latitude,
      lng: longitude,
      hazards: hazards
        .filter((h) => h.expiresAt > Date.now())
        .map((h) => ({
          lat: h.latitude,
          lng: h.longitude,
          emoji: HAZARD_EMOJI[h.type] ?? "⚠️",
          label: h.description || h.type,
        })),
      drivers: drivers.map((d) => ({
        id: d.id,
        lat: d.latitude,
        lng: d.longitude,
        name: d.displayName,
        live: d.channelId === "live",
        heading: d.heading,
        svg: driverSvg(d),
      })),
      cameras: cameras ?? [],
      svg: carSvg(car ?? DEFAULT_CAR, "you"),
      heading,
      speed: speed ?? 0,
    });
  }, [latitude, longitude, hazards, drivers, cameras, car, heading, speed]);

  const push = () => {
    if (!ready.current || !payload) return;
    ref.current?.injectJavaScript(`window.__rd && window.__rd(${payload}); true;`);
  };

  useEffect(() => {
    push();
  }, [payload]);

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ html: HTML }}
      style={styles.map}
      onLoadEnd={() => {
        ready.current = true;
        push();
      }}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
    />
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0D1B2A" },
});
