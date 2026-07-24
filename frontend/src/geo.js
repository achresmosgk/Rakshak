const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Haversine great-circle distance between two points
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Initial compass bearing from point 1 to point 2, in degrees [0, 360)
export function bearingDeg(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Is a detection at `targetBearing` roughly in front of someone heading `heading`?
export function isAhead(heading, targetBearing, toleranceDeg = 60) {
  // No heading data (stationary or unsupported) → fail open, treat as ahead
  if (heading === null || heading === undefined || Number.isNaN(heading)) return true;

  const diff = Math.abs(((targetBearing - heading + 540) % 360) - 180);
  return diff <= toleranceDeg;
}

const KM_PER_DEG_LAT = 111.32;

function kmPerDegLon(latDeg) {
  return 111.32 * Math.cos(toRad(latDeg));
}

// Projects a point onto a segment using a local flat-earth frame — accurate
// enough for the short (city/highway scale) segments a route is made of.
function projectOntoSegment(lat, lon, aLat, aLon, bLat, bLon) {
  const xPerDeg = kmPerDegLon(aLat);

  const px = (lon - aLon) * xPerDeg;
  const py = (lat - aLat) * KM_PER_DEG_LAT;
  const bx = (bLon - aLon) * xPerDeg;
  const by = (bLat - aLat) * KM_PER_DEG_LAT;

  const segLenSq = bx * bx + by * by;
  let t = segLenSq === 0 ? 0 : (px * bx + py * by) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const offsetKm = Math.hypot(px - t * bx, py - t * by);
  const segFracKm = t * Math.hypot(bx, by);

  return { offsetKm, segFracKm };
}

// Finds the closest point on a route polyline to (lat, lon). Returns how far
// off the route that point is (offsetKm) and how far along the route it sits,
// measured from the route's start (alongKm) — or null if there's no route.
export function nearestPointOnRoute(lat, lon, routeCoords) {
  if (!routeCoords || routeCoords.length < 2) return null;

  let cumulativeKm = 0;
  let best = null;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [aLat, aLon] = routeCoords[i];
    const [bLat, bLon] = routeCoords[i + 1];
    const segLenKm = distanceKm(aLat, aLon, bLat, bLon);

    const { offsetKm, segFracKm } = projectOntoSegment(lat, lon, aLat, aLon, bLat, bLon);
    const alongKm = cumulativeKm + segFracKm;

    if (best === null || offsetKm < best.offsetKm) {
      best = { offsetKm, alongKm };
    }
    cumulativeKm += segLenKm;
  }

  return { ...best, totalKm: cumulativeKm };
}

// Minutes to cover distanceKm at the given GPS speed (m/s), falling back to
// fallbackKmh when speed is missing or too small to be a moving reading.
export function etaMinutes(distanceKm, speedMps, fallbackKmh = 40) {
  const speedKmh = speedMps && speedMps > 1 ? speedMps * 3.6 : fallbackKmh;
  return (distanceKm / speedKmh) * 60;
}
