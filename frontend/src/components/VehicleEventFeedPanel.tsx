import { useVehicleEventFeed } from '../hooks/useVehicleEventFeed'
import type { TelemetryEvent } from '../types'

interface VehicleEventFeedPanelProps {
  vehicleId: string
  focusedEventId: string | null
  onFocusEvent: (event: TelemetryEvent | null) => void
}

export function VehicleEventFeedPanel({
  vehicleId,
  focusedEventId,
  onFocusEvent,
}: VehicleEventFeedPanelProps) {
  const events = useVehicleEventFeed(vehicleId)

  return (
    <div className="panel feed-panel">
      <h2>Envíos en vivo de {vehicleId}</h2>
      {events.length === 0 ? (
        <p className="muted">Esperando el próximo envío de telemetría...</p>
      ) : (
        <ul className="feed-list">
          {events.map((event) => {
            const isFocused = event.event_id === focusedEventId
            return (
              <li
                key={event.event_id}
                className={`feed-row${isFocused ? ' feed-row--selected' : ''}`}
                onClick={() => onFocusEvent(event)}
              >
                <span className="feed-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span>
                  {event.lat.toFixed(5)}, {event.lon.toFixed(5)}
                </span>
                <span>{event.speed_kmh.toFixed(1)} km/h</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
