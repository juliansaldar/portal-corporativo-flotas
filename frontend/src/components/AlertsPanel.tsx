import type { VehicleState } from '../types'

interface AlertsPanelProps {
  alerts: VehicleState[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="panel alerts-panel">
      <h2>Alertas</h2>
      {alerts.length === 0 ? (
        <p className="muted">Sin vehiculos detenidos en zonas criticas.</p>
      ) : (
        <ul>
          {alerts.map((vehicle) => (
            <li key={vehicle.vehicle_id} className="alert-item">
              <strong>{vehicle.vehicle_id}</strong>
              <span>
                {Math.round(vehicle.stopped_duration_seconds / 60)} min detenido en{' '}
                {vehicle.current_zone_ids.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
