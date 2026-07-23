import { useEffect, useState } from 'react'
import { API_GATEWAY_URL } from '../config'
import type { VehicleState } from '../types'

export function useVehicleStream() {
  const [vehicles, setVehicles] = useState<VehicleState[]>([])
  const [streamError, setStreamError] = useState<string | null>(null)

  useEffect(() => {
    const source = new EventSource(`${API_GATEWAY_URL}/v1/vehicles/stream`)

    source.onmessage = (event) => {
      setVehicles(JSON.parse(event.data) as VehicleState[])
      setStreamError(null)
    }

    source.addEventListener('stream-error', (event) => {
      const messageEvent = event as MessageEvent<string>
      try {
        setStreamError(JSON.parse(messageEvent.data).message as string)
      } catch {
        setStreamError('Error desconocido en el stream de la flota')
      }
    })

    source.onerror = () => {
      setStreamError('Conexion con el portal interrumpida, reintentando...')
    }

    return () => source.close()
  }, [])

  return { vehicles, streamError }
}
