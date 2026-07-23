export interface VehicleState {
  vehicle_id: string
  lat: number
  lon: number
  speed_kmh: number
  updated_at: string
  stopped_since: string | null
  stopped_duration_seconds: number
  current_zone_ids: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}
