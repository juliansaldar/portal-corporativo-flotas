export interface TelemetryEvent {
  event_id: string
  vehicle_id: string
  lat: number
  lon: number
  speed_kmh: number
  timestamp: string
}

export interface PendingTelemetryRow extends TelemetryEvent {
  id: number
  synced: number
}
