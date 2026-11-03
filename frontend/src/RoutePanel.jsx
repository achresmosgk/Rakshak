import { useEffect, useRef, useState } from "react";
import { fetchRoute, geocode, isRoutingConfigured } from "./routing";
import DemoMode from "./components/demo_mode";

function useSuggestions(query, skip) {
  const [suggestions, setSuggestions] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (skip || !query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        setSuggestions(await geocode(query));
      } catch {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [query, skip]);

  return suggestions;
}

function PlaceInput({ label, query, onQueryChange, picked, onPick, onClear }) {
  const suggestions = useSuggestions(query, Boolean(picked));

  return (
    <div style={{ position: "relative", flex: 1, textAlign: "left" }}>
      <label style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</label>
      <div style={{ display: "flex", gap: 4 }}>
        <input
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            if (picked) onClear();
          }}
          placeholder="Search a place…"
          style={{
            width: "100%",
            padding: "9px 12px",
            boxSizing: "border-box",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-input)",
            color: "var(--text)",
          }}
        />
        {picked && (
          <button type="button" className="btn btn-ghost" onClick={onClear} title="Clear" style={{ padding: "0 14px" }}>
            ×
          </button>
        )}
      </div>

      {!picked && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 1000,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            listStyle: "none",
            margin: "4px 0 0",
            padding: 0,
            width: "100%",
            maxHeight: 160,
            overflowY: "auto",
            textAlign: "left",
          }}
        >
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPick(s)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  background: "none",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RoutePanel({ myPosition, onRouteChange }) {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  function useMyLocation() {
    if (!myPosition) {
      setError("Current location isn't available yet");
      return;
    }
    setStart({ lat: myPosition.lat, lon: myPosition.lon });
    setStartQuery("My current location");
  }

  async function handleGetRoute() {
    if (!start || !end) {
      setError("Pick a start and destination first");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await fetchRoute(start, end);
      setSummary(result);
      onRouteChange({ coords: result.coords, start, end });
    } catch (err) {
      setError(err.message);
      setSummary(null);
      onRouteChange(null);
    } finally {
      setLoading(false);
    }
  }

  function clearRoute() {
    setStart(null);
    setEnd(null);
    setStartQuery("");
    setEndQuery("");
    setSummary(null);
    setError(null);
    onRouteChange(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 480,
        margin: "0 auto 12px",
      }}
    >
      <div className="route-fields" style={{ display: "flex", gap: 8 }}>
        <PlaceInput
          label="Start"
          query={startQuery}
          onQueryChange={setStartQuery}
          picked={start}
          onPick={(s) => {
            setStart({ lat: s.lat, lon: s.lon });
            setStartQuery(s.label);
          }}
          onClear={() => {
            setStart(null);
            setStartQuery("");
          }}
        />
        <PlaceInput
          label="Destination"
          query={endQuery}
          onQueryChange={setEndQuery}
          picked={end}
          onPick={(s) => {
            setEnd({ lat: s.lat, lon: s.lon });
            setEndQuery(s.label);
          }}
          onClear={() => {
            setEnd(null);
            setEndQuery("");
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost" onClick={useMyLocation}>
          📍 Use my location
        </button>
        <button type="button" className="btn btn-primary" onClick={handleGetRoute} disabled={loading}>
          {loading ? "Routing…" : "Get route"}
        </button>
        <DemoMode />
        {(start || end || summary) && (
          <button type="button" className="btn btn-ghost" onClick={clearRoute}>
            Clear
          </button>
        )}
      </div>

      {!isRoutingConfigured() && (
        <p style={{ color: "#f59e0b", fontSize: 13 }}>
          Routing isn't configured yet — set VITE_ORS_KEY in frontend/.env.
        </p>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {summary && (
        <p style={{ fontSize: 14, color: "var(--text)" }}>
          {summary.distanceKm.toFixed(1)} km · {Math.round(summary.durationMin)} min
        </p>
      )}
    </div>
  );
}
