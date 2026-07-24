/**
 * Script de carga y caos para ingestion-service (POST /v1/telemetry).
 *
 * Simula cientos de vehiculos concurrentes (VUs de k6). De cada envio valido:
 *   - ~5% son payloads invalidos (falta lat/lon), esperando 422.
 *   - ~10% de los validos se reenvian con el mismo event_id (duplicado real).
 *
 * Uso:
 *   k6 run load-testing/fleet-simulation.js
 *   INGESTION_SERVICE_URL=http://localhost:8001 k6 run load-testing/fleet-simulation.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const BASE_URL = __ENV.INGESTION_SERVICE_URL || 'http://localhost:8001'
const INVALID_PAYLOAD_RATE = 0.05
const DUPLICATE_RATE = 0.10

const invalidPayloadsSent = new Counter('chaos_invalid_payloads')
const duplicatesSent = new Counter('chaos_duplicate_payloads')

export const options = {
  scenarios: {
    fleet_simulation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    // El caos inyectado (5% payloads invalidos) responde 422 a proposito;
    // este threshold detecta fallas REALES del sistema, no el caos esperado.
    http_req_failed: ['rate<0.20'],
  },
}

function randomVehiclePosition() {
  return {
    lat: 4.5 + Math.random() * 0.4,
    lon: -74.3 + Math.random() * 0.4,
  }
}

function buildValidPayload(vehicleId, eventId) {
  const { lat, lon } = randomVehiclePosition()
  return {
    event_id: eventId,
    vehicle_id: vehicleId,
    lat,
    lon,
    speed_kmh: Math.round(Math.random() * 80 * 10) / 10,
    timestamp: new Date().toISOString(),
  }
}

function buildInvalidPayload(vehicleId, eventId) {
  // Falta lat/lon/speed_kmh a proposito -> el servicio debe responder 422.
  return { event_id: eventId, vehicle_id: vehicleId }
}

export default function () {
  const vehicleId = `veh-load-${__VU}`
  const eventId = `evt-load-${__VU}-${__ITER}`
  const headers = { 'Content-Type': 'application/json' }

  if (Math.random() < INVALID_PAYLOAD_RATE) {
    const invalidPayload = buildInvalidPayload(vehicleId, eventId)
    const res = http.post(`${BASE_URL}/v1/telemetry`, JSON.stringify(invalidPayload), { headers })
    invalidPayloadsSent.add(1)
    check(res, { 'invalid payload rejected with 422': (r) => r.status === 422 })
  } else {
    const payload = JSON.stringify(buildValidPayload(vehicleId, eventId))
    const res = http.post(`${BASE_URL}/v1/telemetry`, payload, { headers })
    check(res, { 'valid payload accepted with 202': (r) => r.status === 202 })

    if (Math.random() < DUPLICATE_RATE) {
      const dup = http.post(`${BASE_URL}/v1/telemetry`, payload, { headers })
      duplicatesSent.add(1)
      check(dup, { 'duplicate also accepted with 202 (dedup happens downstream)': (r) => r.status === 202 })
    }
  }

  sleep(1)
}
