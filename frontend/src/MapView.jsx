import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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

export default function MapView({ position, detections, alertRadiusKm = 2 }) {
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

      <Recenter position={position} />
    </MapContainer>
  );
}