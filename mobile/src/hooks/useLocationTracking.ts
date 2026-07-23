import * as Crypto from 'expo-crypto'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LOCATION_CAPTURE_INTERVAL_MS } from '../config'
import type { TelemetryEvent } from '../types'

type OnCapture = (event: TelemetryEvent) => void

export function useLocationTracking(vehicleId: string, onCapture: OnCapture) {
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)

  const start = useCallback(async () => {
    setError(null)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setError('Permiso de ubicacion denegado')
      return
    }

    subscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: LOCATION_CAPTURE_INTERVAL_MS, distanceInterval: 0 },
      (position) => {
        onCapture({
          event_id: Crypto.randomUUID(),
          vehicle_id: vehicleId,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          speed_kmh: Math.max(0, (position.coords.speed ?? 0) * 3.6),
          timestamp: new Date(position.timestamp).toISOString(),
        })
      },
    )
    setIsTracking(true)
  }, [vehicleId, onCapture])

  const stop = useCallback(() => {
    subscriptionRef.current?.remove()
    subscriptionRef.current = null
    setIsTracking(false)
  }, [])

  useEffect(() => () => subscriptionRef.current?.remove(), [])

  return { isTracking, error, start, stop }
}
