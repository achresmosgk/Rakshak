import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import MapView from "../MapView";
import RoutePanel from "../RoutePanel";
import { distanceKm, bearingDeg, isAhead, nearestPointOnRoute, etaMinutes } from "../geo";
import { API_BASE } from "../apiBase";
import { primeAlertAudio, triggerAlert } from "../alerts";

// Widened from 2km to tolerate laptop WiFi-based geolocation, which can drift
// several km off — a phone's real GPS won't need this much slack.
const ALERT_RADIUS_KM = 10;
const ROUTE_CORRIDOR_KM = 0.75; // how far off the planned route a detection can be and still count as "on it" — loose enough to tolerate GPS drift and ORS routing not hugging the exact camera position
const ROUTE_RELEVANCE_KM = 10; // if you're farther than this from the route itself, treat it as stale
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

export default function Dashboard() {
  const [alert, setAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [route, setRoute] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  // Keep refs in sync so the socket handler (mounted once) always reads fresh state
  const positionRef = useRef(null);
  const routeRef = useRef(null);
  const lastAlertIdRef = useRef(null);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Fire the siren/vibration only on a genuinely new alert, not on every
  // re-render while the same one is still showing.
  useEffect(() => {
    if (!alertsEnabled || !alert) return;
    if (alert.id !== lastAlertIdRef.current) {
      lastAlertIdRef.current = alert.id;
      triggerAlert();
    }
  }, [alert, alertsEnabled]);

  function handleToggleAlerts() {
    if (!alertsEnabled) primeAlertAudio();
    setAlertsEnabled((v) => !v);
  }

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
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      const detection = JSON.parse(event.data);
      console.log("[rakshak] detection received:", detection);

      // Always record it for the map, regardless of relevance
      setDetections((prev) => [detection, ...prev].slice(0, 50));

      const me = positionRef.current;
      const activeRoute = routeRef.current;
      console.log("[rakshak] my position:", me, "active route?", !!activeRoute);

      // No GPS yet → fail open, warn anyway
      if (!me) {
        console.log("[rakshak] no GPS position yet — alerting anyway (fail open)");
        setAlert({ ...detection, distanceKm: null, etaMin: null });
        return;
      }

      // Try route-corridor matching (precise) AND the plain radius+heading
      // check (robust) independently, and alert if either says "threat."
      // Route matching alone was too easy to silently defeat with GPS/routing
      // noise — this way a route quirk can never fully block an alert.
      let routeResult = null;
      if (activeRoute) {
        const meOnRoute = nearestPointOnRoute(me.lat, me.lon, activeRoute.coords);
        const routeIsRelevant = meOnRoute && meOnRoute.offsetKm <= ROUTE_RELEVANCE_KM;

        if (routeIsRelevant) {
          const detOnRoute = nearestPointOnRoute(detection.latitude, detection.longitude, activeRoute.coords);
          if (detOnRoute && detOnRoute.offsetKm <= ROUTE_CORRIDOR_KM) {
            const aheadKm = detOnRoute.alongKm - meOnRoute.alongKm;
            // Small negative tolerance absorbs GPS/projection noise right at the route start
            if (aheadKm >= -0.2 && aheadKm <= ALERT_RADIUS_KM) {
              routeResult = { distanceKm: Math.max(0, aheadKm), etaMin: etaMinutes(Math.max(0, aheadKm), me.speed) };
            }
          }
        }
      }

      const dist = distanceKm(me.lat, me.lon, detection.latitude, detection.longitude);
      const brng = bearingDeg(me.lat, me.lon, detection.latitude, detection.longitude);
      const ahead = isAhead(me.heading, brng);
      const radiusResult =
        dist <= ALERT_RADIUS_KM && ahead ? { distanceKm: dist, etaMin: etaMinutes(dist, me.speed) } : null;

      console.log("[rakshak] straight-line distance:", dist.toFixed(3), "km · heading:", me.heading, "bearing to detection:", brng.toFixed(1), "· counted as ahead?", ahead);
      console.log("[rakshak] routeResult:", routeResult, "radiusResult:", radiusResult);

      const result = routeResult ?? radiusResult;
      if (result) {
        console.log("[rakshak] ALERTING:", result);
        setAlert({ ...detection, ...result });
      } else {
        console.log("[rakshak] no match — staying road clear");
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="page">
      <Navbar variant="app" />

      <div className="container" style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-dim)", marginBottom: 12 }}>
          <span style={{ color: connected ? "var(--success)" : "var(--danger)" }}>●</span>{" "}
          {connected ? "Connected" : "Disconnected"}
          {geoError && <span style={{ color: "#f59e0b" }}> · GPS: {geoError}</span>}
        </p>

        <button className="btn btn-ghost" onClick={handleToggleAlerts} style={{ marginBottom: 20 }}>
          {alertsEnabled ? "🔇 Mute siren & vibration" : "🔊 Enable siren & vibration"}
        </button>

        <div
          className="card"
          style={{
            marginBottom: 24,
            borderColor: alert ? "var(--danger)" : "var(--success)",
            boxShadow: alert ? "0 0 0 1px var(--danger-glow)" : "none",
          }}
        >
          {alert ? (
            <div>
              <h1 style={{ color: "var(--danger)", fontSize: 28 }}>
                ⚠️ {alert.species.toUpperCase()} DETECTED
              </h1>
              <p style={{ marginTop: 10 }}>
                confidence {(alert.confidence * 100).toFixed(0)}%
                {alert.distanceKm !== null && ` · ${alert.distanceKm.toFixed(1)} km ahead`}
                {alert.etaMin != null && ` · ETA ${Math.max(0, Math.round(alert.etaMin))} min`}
              </p>
            </div>
          ) : (
            <h1 style={{ color: "var(--success)", fontSize: 28 }}>Road clear</h1>
          )}
        </div>

        <RoutePanel myPosition={position} onRouteChange={setRoute} />

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <MapView position={position} detections={detections} route={route} />
        </div>
      </div>
    </div>
  );
}
