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

// Color palette per marker type
const markerColors: Record<MapMarker['type'], string> = {
  self: '#3b82f6',
  fugitive: '#f97316',
  hunter: '#60a5fa',
  history: '#f97316',
}

export function MapView({ center, zoom = 14, markers = [], fugitiveHistory = [], geofence, className }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geofenceRef = useRef<any>(null)

  // Lazy-load Leaflet to avoid SSR issues
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const initialCenter: [number, number] = center ?? [52.3676, 4.9041] // Amsterdam fallback
      const map = L.map(mapRef.current!).setView(initialCenter, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
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

  // Update center when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return
    mapInstanceRef.current.setView(center, zoom)
  }, [center, zoom])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      // Remove old markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      markers.forEach((marker) => {
        const color = markerColors[marker.type]
        const size = marker.type === 'fugitive' ? 18 : 14
        const icon = L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
        const m = L.marker([marker.lat, marker.lng], { icon })
        if (marker.label) m.bindPopup(marker.label)
        m.addTo(mapInstanceRef.current)
        markersRef.current.push(m)
      })
    })
  }, [markers])

  // Draw fugitive path history
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      if (polylineRef.current) polylineRef.current.remove()
      if (fugitiveHistory.length < 2) return
      const latlngs = fugitiveHistory.map((loc) => [loc.latitude, loc.longitude] as [number, number])
      polylineRef.current = L.polyline(latlngs, { color: '#f97316', weight: 3, opacity: 0.7, dashArray: '6 4' })
      polylineRef.current.addTo(mapInstanceRef.current)
    })
  }, [fugitiveHistory])

  // Draw geofence circle
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
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={mapRef} className={className ?? 'w-full h-64 rounded-2xl overflow-hidden'} />
    </>
  )
}
