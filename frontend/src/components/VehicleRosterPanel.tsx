import { useMemo } from 'react'
import { getVehicleProfile, isMobileAppVehicle } from '../data/dummyVehicleProfiles'
import type { VehicleState } from '../types'

const MAX_VISIBLE_ROWS = 8

interface VehicleRosterPanelProps {
  vehicles: VehicleState[]
  alertVehicleIds: Set<string>
  selectedVehicleId: string | null
  onSelect: (vehicleId: string) => void
}

export function VehicleRosterPanel({
  vehicles,
  alertVehicleIds,
  selectedVehicleId,
  onSelect,
}: VehicleRosterPanelProps) {
  const sorted = useMemo(
    () =>
      [...vehicles].sort((a, b) => {
        const aAlert = alertVehicleIds.has(a.vehicle_id) ? 1 : 0
        const bAlert = alertVehicleIds.has(b.vehicle_id) ? 1 : 0
        if (aAlert !== bAlert) return bAlert - aAlert
        // El vehiculo de la app movil siempre debe ser visible en la demo,
        // sin importar cuantos vehiculos de prueba (k6) esten reportando.
        const aKnown = isMobileAppVehicle(a.vehicle_id) ? 1 : 0
        const bKnown = isMobileAppVehicle(b.vehicle_id) ? 1 : 0
        return bKnown - aKnown
      }),
    [vehicles, alertVehicleIds],
  )

  const visible = sorted.slice(0, MAX_VISIBLE_ROWS)
  const hiddenCount = sorted.length - visible.length

  return (
    <div className="panel roster-panel">
      <h2>Vehículos</h2>
      {visible.length === 0 ? (
        <p className="muted">Sin vehículos reportando todavía.</p>
      ) : (
        <ul className="roster-list">
          {visible.map((vehicle) => {
            const profile = getVehicleProfile(vehicle.vehicle_id)
            const isAlert = alertVehicleIds.has(vehicle.vehicle_id)
            const isSelected = vehicle.vehicle_id === selectedVehicleId
            return (
              <li
                key={vehicle.vehicle_id}
                className={`roster-row${isSelected ? ' roster-row--selected' : ''}`}
                onClick={() => onSelect(vehicle.vehicle_id)}
              >
                <div className="avatar">{profile.driverInitials}</div>
                <div className="roster-info">
                  <h5>
                    {profile.model} <span className="plate">{profile.plate}</span>
                  </h5>
                  <p>
                    {profile.driverName} • {vehicle.speed_kmh.toFixed(0)} km/h
                  </p>
                </div>
                {isAlert && (
                  <span className="tag-alert">
                    {Math.round(vehicle.stopped_duration_seconds / 60)} min
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {hiddenCount > 0 && <p className="muted roster-more">+{hiddenCount} más</p>}
    </div>
  )
}
