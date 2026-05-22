'use client'
import { useState, useEffect, useCallback } from 'react'
import { watchPosition, type GeolocationResult } from '@/lib/geolocation'

interface UseGeolocationReturn {
  position: GeolocationResult | null
  error: string | null
  loading: boolean
  accuracy: 'good' | 'ok' | 'poor' | null
}

export function useGeolocation(enabled = true): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const handleUpdate = useCallback((result: GeolocationResult) => {
    setPosition(result)
    setLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback((err: string) => {
    setError(err)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const stop = watchPosition(handleUpdate, handleError)
    return stop
  }, [enabled, handleUpdate, handleError])

  const accuracy: 'good' | 'ok' | 'poor' | null = position
    ? position.accuracy <= 20 ? 'good' : position.accuracy <= 60 ? 'ok' : 'poor'
    : null

  return { position, error, loading, accuracy }
}
