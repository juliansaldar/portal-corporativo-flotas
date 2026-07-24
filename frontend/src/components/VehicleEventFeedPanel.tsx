import { useVehicleEventFeed } from '../hooks/useVehicleEventFeed'

interface VehicleEventFeedPanelProps {
  vehicleId: string
}

export function VehicleEventFeedPanel({ vehicleId }: VehicleEventFeedPanelProps) {
  const events = useVehicleEventFeed(vehicleId)

  return (
    <div className="panel feed-panel">
      <h2>Envíos en vivo de {vehicleId}</h2>
      {events.length === 0 ? (
        <p className="muted">Esperando el próximo envío de telemetría...</p>
      ) : (
        <ul className="feed-list">
          {events.map((event) => (
            <li key={event.event_id} className="feed-row">
              <span className="feed-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span>
                {event.lat.toFixed(5)}, {event.lon.toFixed(5)}
              </span>
              <span>{event.speed_kmh.toFixed(1)} km/h</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
