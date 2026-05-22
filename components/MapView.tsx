'use client'
import { useEffect, useRef } from 'react'
import type { Location } from '@/types'

interface MapMarker {
  lat: number
  lng: number
  type: 'self' | 'fugitive' | 'hunter' | 'history'
  label?: string
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
  self: '#3b82f6',
  fugitive: '#eab308',
  hunter: '#ef4444',
  history: '#eab308',
}

export function MapView({
  center,
  zoom = 15,
  markers = [],
  fugitiveHistory = [],
  geofence,
  className,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geofenceRef = useRef<any>(null)

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
      const map = L.map(mapRef.current!, { zoomControl: true }).setView(initialCenter, zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Boost contrast so roads and paths stand out sharply
      const tilePane = map.getPanes().tilePane as HTMLElement
      tilePane.style.filter = 'contrast(1.6) brightness(1.2)'

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

  // Update center
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return
    mapInstanceRef.current.setView(center, zoom)
  }, [center, zoom])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      markers.forEach((marker) => {
        const color = markerColors[marker.type]
        const isSelf = marker.type === 'self'
        const isFugitive = marker.type === 'fugitive'
        const size = isFugitive ? 20 : 16

        const html = isSelf
          ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 3px ${color}44,0 2px 8px rgba(0,0,0,0.4)"></div>`
          : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.5)"></div>`

        const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
        const m = L.marker([marker.lat, marker.lng], { icon })
        if (marker.label) m.bindPopup(marker.label)
        m.addTo(mapInstanceRef.current)
        markersRef.current.push(m)
      })
    })
  }, [markers])

  // Fugitive path
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      if (polylineRef.current) polylineRef.current.remove()
      if (fugitiveHistory.length < 2) return
      const latlngs = fugitiveHistory.map((loc) => [loc.latitude, loc.longitude] as [number, number])
      polylineRef.current = L.polyline(latlngs, { color: '#eab308', weight: 3, opacity: 0.7, dashArray: '6 4' })
      polylineRef.current.addTo(mapInstanceRef.current)
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

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div className={`relative ${className ?? 'w-full h-64 rounded-2xl overflow-hidden'}`}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend */}
        {markers.length > 0 && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-gray-900/80 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs flex flex-col gap-1 border border-gray-700">
            {markers.some(m => m.type === 'self') && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 border border-white inline-block" />Jij</div>
            )}
            {markers.some(m => m.type === 'fugitive') && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 border border-white inline-block" />Boef</div>
            )}
            {markers.some(m => m.type === 'hunter') && (
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 border border-white inline-block" />Jager</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
