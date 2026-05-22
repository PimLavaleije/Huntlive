const EARTH_RADIUS_METERS = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// Haversine formula — returns distance in meters between two GPS coordinates
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

// Format meters to readable string
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// Check if a point is within a circular geofence
export function isInsideGeofence(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  return haversineDistance(lat, lng, centerLat, centerLng) <= radiusMeters
}
