export interface GeolocationResult {
  latitude: number
  longitude: number
  accuracy: number
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5_000,
}

// One-shot location request with a promise interface
export function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wordt niet ondersteund door deze browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(translateGeoError(err)),
      GEO_OPTIONS
    )
  })
}

// Continuous watching — returns a cleanup function
export function watchPosition(
  onUpdate: (result: GeolocationResult) => void,
  onError: (error: string) => void
): () => void {
  if (!navigator.geolocation) {
    onError('Geolocation wordt niet ondersteund door deze browser')
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
    (err) => onError(translateGeoError(err).message),
    GEO_OPTIONS
  )
  return () => navigator.geolocation.clearWatch(id)
}

function translateGeoError(err: GeolocationPositionError): Error {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new Error('Locatietoegang geweigerd. Sta locatietoegang toe in je browser-instellingen.')
    case err.POSITION_UNAVAILABLE:
      return new Error('Locatie niet beschikbaar. Controleer of GPS ingeschakeld is.')
    case err.TIMEOUT:
      return new Error('Locatieverzoek verlopen. Zorg voor een goed GPS-signaal.')
    default:
      return new Error('Onbekende locatiefout.')
  }
}

// Request Wake Lock to keep screen on during game.
// Auto-reacquires if released (e.g. incoming call, battery saver).
// Returns a cleanup function — call it when the game page unmounts.
export async function requestWakeLock(): Promise<() => void> {
  if (!('wakeLock' in navigator)) return () => {}

  type WakeLockNav = Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }
  const nav = navigator as WakeLockNav
  let sentinel: WakeLockSentinel | null = null
  let active = true

  const acquire = async () => {
    if (!active) return
    try {
      sentinel = await nav.wakeLock.request('screen')
      sentinel.addEventListener('release', () => {
        sentinel = null
        if (active && document.visibilityState === 'visible') acquire()
      })
    } catch { sentinel = null }
  }

  const onVisible = () => {
    if (active && document.visibilityState === 'visible' && !sentinel) acquire()
  }

  document.addEventListener('visibilitychange', onVisible)
  await acquire()

  return () => {
    active = false
    document.removeEventListener('visibilitychange', onVisible)
    sentinel?.release().catch(() => {})
  }
}
