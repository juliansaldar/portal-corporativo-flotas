import { INGESTION_SERVICE_URL } from '../config'
import type { TelemetryEvent } from '../types'

export async function postTelemetry(event: TelemetryEvent): Promise<boolean> {
  try {
    const response = await fetch(`${INGESTION_SERVICE_URL}/v1/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function postTelemetryBulk(events: TelemetryEvent[]): Promise<boolean> {
  if (events.length === 0) return true
  try {
    const response = await fetch(`${INGESTION_SERVICE_URL}/v1/telemetry/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    })
    return response.ok
  } catch {
    return false
  }
}
