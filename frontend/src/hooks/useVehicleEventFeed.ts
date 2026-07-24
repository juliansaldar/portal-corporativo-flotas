import { useEffect, useState } from 'react'
import { API_GATEWAY_URL } from '../config'
import type { TelemetryEvent } from '../types'

const MAX_FEED_EVENTS = 50

export function useVehicleEventFeed(vehicleId: string | null) {
  const [events, setEvents] = useState<TelemetryEvent[]>([])

  useEffect(() => {
    setEvents([])
    if (!vehicleId) return

    const source = new EventSource(`${API_GATEWAY_URL}/v1/vehicles/${vehicleId}/events/stream`)

    source.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as TelemetryEvent
      setEvents((prev) => [parsed, ...prev].slice(0, MAX_FEED_EVENTS))
    }

    return () => source.close()
  }, [vehicleId])

  return events
}
