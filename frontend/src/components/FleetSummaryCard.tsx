import type { VehicleState } from '../types'

interface FleetSummaryCardProps {
  vehicles: VehicleState[]
  alerts: VehicleState[]
}

export function FleetSummaryCard({ vehicles, alerts }: FleetSummaryCardProps) {
  const avgSpeed =
    vehicles.length === 0
      ? 0
      : vehicles.reduce((sum, vehicle) => sum + vehicle.speed_kmh, 0) / vehicles.length

  return (
    <div className="panel hero-card">
      <div className="hero-card-top">
        <span className="badge-protected">
          <span className="dot" />
          MONITOREO ACTIVO
        </span>
        <span className="signal">{vehicles.length} vehículo(s) reportando</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-item">
          <span>ACTIVOS</span>
          <strong>{vehicles.length}</strong>
        </div>
        <div className="metric-item">
          <span>EN ALERTA</span>
          <strong className={alerts.length > 0 ? 'text-destructive' : 'text-success'}>
            {alerts.length}
          </strong>
        </div>
        <div className="metric-item">
          <span>VELOCIDAD PROM.</span>
          <strong>{avgSpeed.toFixed(1)} km/h</strong>
        </div>
      </div>
    </div>
  )
}
