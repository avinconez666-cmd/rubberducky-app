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
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([-25.6, 134.3], 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  const you = L.circleMarker([-25.6, 134.3], {
    radius: 9, color: '#F59E0B', weight: 3, fillColor: '#F8FAFC', fillOpacity: 1
  }).addTo(map);
  let layer = L.layerGroup().addTo(map);
  let followed = false;
  window.__rd = function (data) {
    if (!data || typeof data.lat !== 'number') return;
    const ll = [data.lat, data.lng];
    you.setLatLng(ll);
  you.setStyle && you.setStyle({ color: data.paint || '#F59E0B' });
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
      const icon = L.divIcon({
        className: '',
        html: '<div style="font-size:18px">' + (d.emoji || '🚗') + '</div>',
        iconSize: [22, 22], iconAnchor: [11, 11]
      });
      L.marker([d.lat, d.lng], { icon: icon }).addTo(layer).bindPopup((d.name || 'Practice') + ' (practice)');
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
}: {
  latitude: number | null;
  longitude: number | null;
  hazards: HazardReport[];
  drivers: NearbyDriver[];
  cameras?: { lat: number; lng: number; kind: string; label: string }[];
  paint?: string;
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
      })),
      cameras: cameras ?? [],
      paint: paint ?? "#F59E0B",
    });
  }, [latitude, longitude, hazards, drivers, cameras, paint]);

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
