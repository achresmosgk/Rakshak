import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// Leaflet's default marker icons break under bundlers — point them at the CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lon], map.getZoom());
  }, [position, map]);
  return null;
}

function FitToRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      map.fitBounds(coords, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

export default function MapView({ position, detections, route, alertRadiusKm = 2 }) {
  const center = position
    ? [position.lat, position.lon]
    : [21.17, 72.83];   // fallback: your test coordinates

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {position && (
        <>
          <Marker position={[position.lat, position.lon]}>
            <Popup>You are here</Popup>
          </Marker>
          <Circle
            center={[position.lat, position.lon]}
            radius={alertRadiusKm * 1000}
            pathOptions={{ color: "#2563eb", fillOpacity: 0.08 }}
          />
        </>
      )}

      {detections.map((d) => (
        <Marker key={d.id} position={[d.latitude, d.longitude]}>
          <Popup>
            <strong>{d.species}</strong><br />
            confidence {(d.confidence * 100).toFixed(0)}%<br />
            {d.device_id}
          </Popup>
        </Marker>
      ))}

      {route && (
        <>
          <Polyline
            positions={route.coords}
            pathOptions={{ color: "#16a34a", weight: 5, opacity: 0.8 }}
          />
          <CircleMarker
            center={[route.start.lat, route.start.lon]}
            radius={8}
            pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 1 }}
          >
            <Popup>Start</Popup>
          </CircleMarker>
          <CircleMarker
            center={[route.end.lat, route.end.lon]}
            radius={8}
            pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }}
          >
            <Popup>Destination</Popup>
          </CircleMarker>
          <FitToRoute coords={route.coords} />
        </>
      )}

      <Recenter position={position} />
    </MapContainer>
  );
}