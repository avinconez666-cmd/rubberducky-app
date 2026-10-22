import { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { HazardReport, NearbyDriver } from "@/contexts/AppContext";

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #0D1B2A; }
  .leaflet-control-attribution { font-size: 9px; background: rgba(9,11,16,0.55); color: #9AA3B2; }
  .you-marker { background: none !important; border: none !important; }
  .you { width: 48px; height: 72px; transform: rotate(var(--h, 0deg)); transform-origin: 50% 58%; }
  .you.go { animation: drive 0.42s ease-in-out infinite; }
  .you .dust { opacity: 0; }
  .you.go .dust { animation: dust 0.5s linear infinite; }
  @keyframes drive {
    0%, 100% { transform: rotate(var(--h, 0deg)) translateY(0); }
    50% { transform: rotate(var(--h, 0deg)) translateY(-3px); }
  }
  @keyframes dust {
    0% { opacity: 0.0; transform: translateY(0) scaleX(0.6); }
    40% { opacity: 0.45; }
    100% { opacity: 0; transform: translateY(10px) scaleX(1.3); }
  }
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
  let shown = { body: '', paint: '' };
  let pos = null;
  let aim = null;
  function vehicleSvg(body, paint) {
    const wide = body === 'truck' || body === 'rig' || body === 'suv' ? 26 : body === 'bike' ? 10 : 20;
    const long = body === 'rig' || body === 'truck' || body === 'van' ? 50 : body === 'coupe' ? 40 : 46;
    const x = (40 - wide) / 2;
    const y = (58 - long) / 2;
    if (body === 'bike') {
      return '<svg viewBox="0 0 40 64" width="40" height="64"><ellipse class="dust" cx="20" cy="58" rx="8" ry="3" fill="#000"/>' +
        '<circle cx="20" cy="16" r="6" fill="#1c2128"/><circle cx="20" cy="48" r="6" fill="#1c2128"/>' +
        '<rect x="16" y="18" width="8" height="26" rx="3" fill="' + paint + '"/>' +
        '<rect x="17" y="20" width="6" height="8" rx="2" fill="#d7eef8"/></svg>';
    }
    const tray = body === 'ute' ? '<rect x="' + (x + 2) + '" y="' + (y + long - 16) + '" width="' + (wide - 4) + '" height="12" rx="2" fill="#1c2128" opacity="0.55"/>' : '';
    return '<svg viewBox="0 0 40 64" width="40" height="64">' +
      '<ellipse class="dust" cx="20" cy="60" rx="11" ry="3" fill="#000"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + wide + '" height="' + long + '" rx="6" fill="' + paint + '"/>' +
      '<rect x="' + (x - 2) + '" y="' + (y + 10) + '" width="3" height="8" rx="1" fill="#1c2128"/>' +
      '<rect x="' + (x + wide - 1) + '" y="' + (y + 10) + '" width="3" height="8" rx="1" fill="#1c2128"/>' +
      '<rect x="' + (x - 2) + '" y="' + (y + long - 16) + '" width="3" height="8" rx="1" fill="#1c2128"/>' +
      '<rect x="' + (x + wide - 1) + '" y="' + (y + long - 16) + '" width="3" height="8" rx="1" fill="#1c2128"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 6) + '" width="' + (wide - 6) + '" height="' + (body === 'van' ? 10 : 14) + '" rx="2" fill="#d7eef8"/>' +
      '<rect x="' + (x + 4) + '" y="' + (y + 2) + '" width="4" height="3" rx="1" fill="#fff6d0"/>' +
      '<rect x="' + (x + wide - 8) + '" y="' + (y + 2) + '" width="4" height="3" rx="1" fill="#fff6d0"/>' +
      tray +
      '</svg>';
  }
  function drawYou(body, paint) {
    return L.divIcon({
      className: 'you-marker',
      html: '<div class="you-wrap"><div class="you" style="--h:0deg">' + vehicleSvg(body, paint) + '</div></div>',
      iconSize: [48, 72],
      iconAnchor: [24, 42]
    });
  }
  function tick() {
    if (you && pos && aim) {
      const dlat = aim[0] - pos[0];
      const dlng = aim[1] - pos[1];
      if (Math.abs(dlat) > 0.02 || Math.abs(dlng) > 0.02) {
        pos = aim.slice();
      } else {
        pos[0] += dlat * 0.22;
        pos[1] += dlng * 0.22;
      }
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
    const body = data.body || 'sedan';
    const paint = data.paint || '#E4B15A';
    if (!you) {
      you = L.marker(ll, { icon: drawYou(body, paint), zIndexOffset: 800, interactive: false }).addTo(map);
      shown = { body: body, paint: paint };
      pos = ll.slice();
      aim = ll.slice();
    } else if (shown.body !== body || shown.paint !== paint) {
      you.setIcon(drawYou(body, paint));
      shown = { body: body, paint: paint };
    }
    aim = ll;
    const node = you.getElement && you.getElement();
    if (node) {
      const car = node.querySelector('.you');
      if (car) {
        if (typeof data.heading === 'number' && data.heading >= 0) car.dataset.h = String(data.heading);
        const heading = Number(car.dataset.h || 0);
        car.style.setProperty('--h', heading + 'deg');
        car.classList.toggle('go', Number(data.speed) > 4);
      }
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
    (data.drivers || []).forEach(function (d) {
      const live = d.live === true;
      const icon = L.divIcon({
        className: '',
        html: '<div style="text-align:center;font-family:sans-serif"><div style="font-size:20px;line-height:20px">' + (d.emoji || '🚗') + '</div><div style="margin-top:2px;font-size:10px;font-weight:700;color:#F4F0E6;background:rgba(9,11,16,.82);border-radius:6px;padding:1px 4px;white-space:nowrap">' + (d.name || 'Driver') + '</div></div>',
        iconSize: [72, 36], iconAnchor: [36, 16]
      });
      L.marker([d.lat, d.lng], { icon: icon }).addTo(layer).bindPopup((d.name || 'Driver') + (live ? ' · live' : ' · practice'));
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

const VEHICLE_EMOJI: Record<string, string> = {
  car: "🚗",
  truck: "🚛",
  motorcycle: "🏍️",
  rv: "🚐",
};

export function LiveMap({
  latitude,
  longitude,
  hazards,
  drivers,
  cameras,
  paint,
  body,
  heading,
  speed,
}: {
  latitude: number | null;
  longitude: number | null;
  hazards: HazardReport[];
  drivers: NearbyDriver[];
  cameras?: { lat: number; lng: number; kind: string; label: string }[];
  paint?: string;
  body?: string;
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
        lat: d.latitude,
        lng: d.longitude,
        emoji: VEHICLE_EMOJI[d.vehicleType] ?? "🚗",
        name: d.displayName,
        live: d.channelId === "live",
      })),
      cameras: cameras ?? [],
      paint: paint ?? "#E4B15A",
      body: body ?? "sedan",
      heading,
      speed: speed ?? 0,
    });
  }, [latitude, longitude, hazards, drivers, cameras, paint, body, heading, speed]);

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
