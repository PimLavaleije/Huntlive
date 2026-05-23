'use client'
import { useEffect, useRef } from 'react'
import type { Location } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface MapMarker {
  id: string
  lat: number
  lng: number
  type: 'admin' | 'fugitive' | 'hunter'
  label?: string
  isSelf?: boolean
}

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  fugitiveHistory?: Location[]
  geofence?: { lat: number; lng: number; radius: number } | null
  className?: string
}

const markerColors: Record<MapMarker['type'], string> = {
  admin: '#eab308',    // yellow
  fugitive: '#3b82f6', // blue
  hunter: '#ef4444',   // red
}

export function MapView({
  center,
  zoom = 15,
  markers = [],
  fugitiveHistory = [],
  geofence,
  className,
}: MapViewProps) {
  const { t } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersMapRef = useRef<Map<string, { m: any; type: MapMarker['type'] }>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyDotsRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geofenceRef = useRef<any>(null)
  const hasSetInitialCenterRef = useRef(false)
  const markersPropsRef = useRef(markers)
  markersPropsRef.current = markers

  // Lazy-load Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const initialCenter: [number, number] = center ?? [52.3676, 4.9041]
      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false }).setView(initialCenter, zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Center on self once when GPS first becomes available — then leave map free
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return
    if (hasSetInitialCenterRef.current) return
    hasSetInitialCenterRef.current = true
    mapInstanceRef.current.setView(center, zoom)
  }, [center, zoom])

  // Update markers — diff-based to avoid flicker
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      const incoming = new Map(markers.map((m) => [m.id, m]))

      // Remove stale markers
      for (const [id, tracked] of markersMapRef.current) {
        if (!incoming.has(id)) {
          tracked.m.remove()
          markersMapRef.current.delete(id)
        }
      }

      // Update existing or add new
      for (const [id, marker] of incoming) {
        const tracked = markersMapRef.current.get(id)
        if (tracked && tracked.type === marker.type) {
          // Same marker — just move it
          tracked.m.setLatLng([marker.lat, marker.lng])
          if (marker.label) { tracked.m.unbindPopup(); tracked.m.bindPopup(marker.label) }
        } else {
          // New marker or type changed — (re)create
          if (tracked) { tracked.m.remove(); markersMapRef.current.delete(id) }

          const color = markerColors[marker.type]
          const size = marker.isSelf ? 18 : marker.type === 'fugitive' ? 20 : 16
          const html = marker.isSelf
            ? `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;"><div class="marker-pulse" style="position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${color};"></div><div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 3px ${color}44,0 2px 8px rgba(0,0,0,0.4)"></div></div>`
            : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.5)"></div>`
          const iconSize: [number, number] = marker.isSelf ? [40, 40] : [size, size]
          const iconAnchor: [number, number] = marker.isSelf ? [20, 20] : [size / 2, size / 2]
          const icon = L.divIcon({ html, className: '', iconSize, iconAnchor })
          const m = L.marker([marker.lat, marker.lng], { icon })
          if (marker.label) m.bindPopup(marker.label)
          m.addTo(mapInstanceRef.current)
          markersMapRef.current.set(id, { m, type: marker.type })
        }
      }
    })
  }, [markers])

  // Fugitive path + ping dots
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null }
      historyDotsRef.current.forEach((m) => m.remove())
      historyDotsRef.current = []

      if (fugitiveHistory.length === 0) return

      if (fugitiveHistory.length >= 2) {
        const latlngs = fugitiveHistory.map((loc) => [loc.latitude, loc.longitude] as [number, number])
        polylineRef.current = L.polyline(latlngs, { color: '#3b82f6', weight: 2, opacity: 0.35 })
        polylineRef.current.addTo(mapInstanceRef.current)
      }

      fugitiveHistory.forEach((loc, i) => {
        const time = new Date(loc.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        const dot = L.circleMarker([loc.latitude, loc.longitude], {
          radius: 5,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.75,
          opacity: 0.9,
        })
        dot.bindPopup(`Ping ${i + 1} — ${time}`)
        dot.addTo(mapInstanceRef.current)
        historyDotsRef.current.push(dot)
      })
    })
  }, [fugitiveHistory])

  // Geofence circle
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      if (geofenceRef.current) geofenceRef.current.remove()
      if (!geofence) return
      geofenceRef.current = L.circle([geofence.lat, geofence.lng], {
        radius: geofence.radius,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.08,
        dashArray: '8 4',
      })
      geofenceRef.current.addTo(mapInstanceRef.current)
    })
  }, [geofence])

  const handleCenterOnSelf = () => {
    const self = markersPropsRef.current.find((m) => m.isSelf)
    if (self && mapInstanceRef.current) {
      mapInstanceRef.current.setView([self.lat, self.lng], 16)
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <style>{`.leaflet-control-zoom { display: none; } @media (min-width: 768px) { .leaflet-control-zoom { display: block; } } @keyframes marker-pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.8); opacity: 0; } } .marker-pulse { animation: marker-pulse 3s ease-out infinite; }`}</style>
      <div className={`relative ${className ?? 'w-full h-64 rounded-2xl overflow-hidden'}`}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Center-on-me button */}
        {markers.some((m) => m.isSelf) && (
          <button
            onClick={handleCenterOnSelf}
            className="absolute bottom-16 right-3 z-[1000] text-white rounded-lg p-2 transition-colors shadow-lg"
            style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid #1a2540' }}
            title={t('map_centerOnMe')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          </button>
        )}

        {/* Legend */}
        {markers.length > 0 && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-gray-900/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs flex flex-col gap-1 border border-gray-700">
            {markers.some(m => m.isSelf) && (
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full border border-white inline-block ${
                  markers.find(m => m.isSelf)?.type === 'admin' ? 'bg-yellow-400' :
                  markers.find(m => m.isSelf)?.type === 'fugitive' ? 'bg-blue-500' : 'bg-red-500'
                }`} />{t('map_you')}
              </div>
            )}
            {markers.some(m => m.type === 'fugitive' && !m.isSelf) && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 border border-white inline-block" />{t('map_fugitive')}</div>
            )}
            {markers.some(m => m.type === 'hunter' && !m.isSelf) && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 border border-white inline-block" />{t('map_hunter')}</div>
            )}
            {markers.some(m => m.type === 'admin' && !m.isSelf) && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 border border-white inline-block" />{t('map_admin')}</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
