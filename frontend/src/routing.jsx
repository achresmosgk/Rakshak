const ORS_KEY = import.meta.env.VITE_ORS_KEY;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export function isRoutingConfigured() {
  return Boolean(ORS_KEY) && ORS_KEY !== "your_key_here";
}

// Free OSM geocoder — no API key needed, good enough for place-name search
export async function geocode(query) {
  if (!query || query.trim().length < 3) return [];

  const url = `${NOMINATIM_URL}?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);

  const results = await response.json();
  return results.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  }));
}

export async function fetchRoute(start, end) {
  if (!isRoutingConfigured()) {
    throw new Error("Routing is not configured — set VITE_ORS_KEY in frontend/.env");
  }

  const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: ORS_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [start.lon, start.lat],
        [end.lon, end.lat],
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Routing failed: ${response.status}`);
  }

  const data = await response.json();
  const feature = data.features[0];

  return {
    // GeoJSON gives [lon, lat]; Leaflet wants [lat, lon] — flip them
    coords: feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: feature.properties.summary.distance / 1000,
    durationMin: feature.properties.summary.duration / 60,
  };
}