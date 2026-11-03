
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import MapView from "../MapView";
import RoutePanel from "../RoutePanel";
import {
  distanceKm,
  bearingDeg,
  isAhead,
  nearestPointOnRoute,
  etaMinutes,
} from "../geo";
import { API_BASE } from "../apiBase";
import { primeAlertAudio, triggerAlert } from "../alerts";

const ALERT_RADIUS_KM = 10;
const ROUTE_CORRIDOR_KM = 0.75;
const ROUTE_RELEVANCE_KM = 10;
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

export default function Dashboard() {
  const [alert, setAlert] = useState(null);
  const [connected, setConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [route, setRoute] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const positionRef = useRef(null);
  const routeRef = useRef(null);
  const lastAlertIdRef = useRef(null);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Siren/vibration only for a genuinely new alert.
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

  // Get user's GPS position.
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
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Listen for real detections and demo events.
  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      const detection = JSON.parse(event.data);

      console.log("[rakshak] event received:", detection);

      // DEMO: bypass route and GPS filtering.
      if (
        detection.is_demo &&
        detection.event_type === "demo_started"
      ) {
        setAlert({
          ...detection,
          distanceKm: null,
          etaMin: null,
        });
        return;
      }

      // DEMO: backend sends this after 30 seconds.
      if (
        detection.is_demo &&
        detection.event_type === "road_clear"
      ) {
        setAlert(null);
        return;
      }

      // REAL detections: existing pipeline remains unchanged.
      setDetections((prev) =>
        [detection, ...prev].slice(0, 50)
      );

      const me = positionRef.current;
      const activeRoute = routeRef.current;

      console.log(
        "[rakshak] my position:",
        me,
        "active route?",
        !!activeRoute
      );

      // No GPS yet → fail open.
      if (!me) {
        console.log(
          "[rakshak] no GPS position yet — alerting anyway"
        );

        setAlert({
          ...detection,
          distanceKm: null,
          etaMin: null,
        });
        return;
      }

      // Route-corridor matching.
      let routeResult = null;

      if (activeRoute) {
        const meOnRoute = nearestPointOnRoute(
          me.lat,
          me.lon,
          activeRoute.coords
        );

        const routeIsRelevant =
          meOnRoute &&
          meOnRoute.offsetKm <= ROUTE_RELEVANCE_KM;

        if (routeIsRelevant) {
          const detOnRoute = nearestPointOnRoute(
            detection.latitude,
            detection.longitude,
            activeRoute.coords
          );

          if (
            detOnRoute &&
            detOnRoute.offsetKm <= ROUTE_CORRIDOR_KM
          ) {
            const aheadKm =
              detOnRoute.alongKm - meOnRoute.alongKm;

            if (
              aheadKm >= -0.2 &&
              aheadKm <= ALERT_RADIUS_KM
            ) {
              routeResult = {
                distanceKm: Math.max(0, aheadKm),
                etaMin: etaMinutes(
                  Math.max(0, aheadKm),
                  me.speed
                ),
              };
            }
          }
        }
      }

      // Straight-line radius + heading matching.
      const dist = distanceKm(
        me.lat,
        me.lon,
        detection.latitude,
        detection.longitude
      );

      const brng = bearingDeg(
        me.lat,
        me.lon,
        detection.latitude,
        detection.longitude
      );

      const ahead = isAhead(me.heading, brng);

      const radiusResult =
        dist <= ALERT_RADIUS_KM && ahead
          ? {
              distanceKm: dist,
              etaMin: etaMinutes(dist, me.speed),
            }
          : null;

      console.log(
        "[rakshak] straight-line distance:",
        dist.toFixed(3),
        "km · heading:",
        me.heading,
        "bearing to detection:",
        brng.toFixed(1),
        "· counted as ahead?",
        ahead
      );

      console.log(
        "[rakshak] routeResult:",
        routeResult,
        "radiusResult:",
        radiusResult
      );

      const result = routeResult ?? radiusResult;

      if (result) {
        console.log("[rakshak] ALERTING:", result);
        setAlert({ ...detection, ...result });
      } else {
        console.log(
          "[rakshak] no match — staying road clear"
        );
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="page">
      <Navbar variant="app" />

      <div
        className="container"
        style={{ padding: "24px", textAlign: "center" }}
      >
        <p style={{ color: "var(--text-dim)", marginBottom: 12 }}>
          <span
            style={{
              color: connected
                ? "var(--success)"
                : "var(--danger)",
            }}
          >
            ●
          </span>{" "}
          {connected ? "Connected" : "Disconnected"}

          {geoError && (
            <span style={{ color: "#f59e0b" }}>
              {" "}· GPS: {geoError}
            </span>
          )}
        </p>

        <button
          className="btn btn-ghost"
          onClick={handleToggleAlerts}
          style={{ marginBottom: 20 }}
        >
          {alertsEnabled
            ? "🔇 Mute siren & vibration"
            : "🔊 Enable siren & vibration"}
        </button>

        {/* Alert / Road Clear Card */}
        <div
          className="card"
          style={{
            marginBottom: 24,
            borderColor: alert
              ? "var(--danger)"
              : "var(--success)",
            boxShadow: alert
              ? "0 0 0 1px var(--danger-glow)"
              : "none",
          }}
        >
          {alert ? (
            <div>
              <h1
                style={{
                  color: "var(--danger)",
                  fontSize: 28,
                }}
              >
                ⚠️{" "}
                {alert.is_demo
                  ? "LARGE MAMMAL"
                  : alert.species.toUpperCase()}{" "}
                DETECTED
              </h1>

              {alert.is_demo && (
                <p
                  style={{
                    color: "#f59e0b",
                    marginTop: 8,
                  }}
                >
                  🧪 SIMULATION MODE
                </p>
              )}

              <p style={{ marginTop: 10 }}>
                confidence{" "}
                {(alert.confidence * 100).toFixed(0)}%

                {alert.distanceKm !== null &&
                  ` · ${alert.distanceKm.toFixed(1)} km ahead`}

                {alert.etaMin != null &&
                  ` · ETA ${Math.max(
                    0,
                    Math.round(alert.etaMin)
                  )} min`}
              </p>
            </div>
          ) : (
            <h1
              style={{
                color: "var(--success)",
                fontSize: 28,
              }}
            >
              Road clear
            </h1>
          )}
        </div>

        <RoutePanel
          myPosition={position}
          onRouteChange={setRoute}
        />

        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <MapView
            position={position}
            detections={detections}
            route={route}
          />
        </div>
      </div>
    </div>
  );
}
