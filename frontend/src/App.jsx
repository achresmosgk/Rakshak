import { useState, useEffect, useRef } from "react";
import MapView from "./MapView";
import { distanceKm, bearingDeg, isAhead } from "./geo";

const ALERT_RADIUS_KM = 2;

function App() {
  const [alert, setAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // Keep a ref in sync so the socket handler always reads fresh position
  const positionRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        setPosition(next);
        positionRef.current = next;
        setGeoError(null);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      const detection = JSON.parse(event.data);

      // Always record it for the map, regardless of relevance
      setDetections((prev) => [detection, ...prev].slice(0, 50));

      const me = positionRef.current;

      // No GPS yet → fail open, warn anyway
      if (!me) {
        setAlert({ ...detection, distanceKm: null });
        return;
      }

      const dist = distanceKm(me.lat, me.lon, detection.latitude, detection.longitude);
      const brng = bearingDeg(me.lat, me.lon, detection.latitude, detection.longitude);
      const ahead = isAhead(me.heading, brng);

      console.log(`detection ${dist.toFixed(2)}km away, ahead: ${ahead}`);

      if (dist <= ALERT_RADIUS_KM && ahead) {
        setAlert({ ...detection, distanceKm: dist });
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, textAlign: "center" }}>
      <p>
        {connected ? "🟢 Connected" : "🔴 Disconnected"}
        {geoError && <span style={{ color: "orange" }}> · GPS: {geoError}</span>}
      </p>

      {alert ? (
        <div>
          <h1 style={{ color: "red" }}>
            ⚠️ {alert.species.toUpperCase()} DETECTED
          </h1>
          <p>
            confidence {(alert.confidence * 100).toFixed(0)}%
            {alert.distanceKm !== null && ` · ${alert.distanceKm.toFixed(1)} km ahead`}
          </p>
        </div>
      ) : (
        <h1 style={{ color: "green" }}>Road clear</h1>
      )}

      <MapView position={position} detections={detections} />
    </div>
  );
}

export default App;