import type { VehicleState } from '../types'

/**
 * Mismo umbral que usa la tool query_vehicle_state del agente (fleet-ai-agent),
 * documentado tambien en el README. No hay una fuente de verdad compartida en
 * runtime entre frontend y backend para este valor (ver design.md, Riesgos).
 */
export const ALERT_STOPPED_SECONDS_THRESHOLD = 1200

export function deriveAlerts(states: VehicleState[]): VehicleState[] {
  return states.filter(
    (vehicle) =>
      vehicle.current_zone_ids.length > 0 &&
      vehicle.stopped_duration_seconds >= ALERT_STOPPED_SECONDS_THRESHOLD,
  )
}
