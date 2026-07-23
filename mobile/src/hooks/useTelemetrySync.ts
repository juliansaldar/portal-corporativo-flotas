import { useCallback, useEffect, useRef, useState } from 'react'
import { postTelemetry, postTelemetryBulk } from '../api/telemetryApi'
import { countPendingEvents, getPendingEvents, insertPendingEvent, markEventsSynced } from '../db/database'
import type { TelemetryEvent } from '../types'
import { useNetworkStatus } from './useNetworkStatus'

/**
 * Offline-first: cada evento se persiste en SQLite antes de intentar
 * enviarlo. Si hay red, se intenta un envio inmediato; si no hay red o el
 * envio falla, el evento queda pendiente. Al detectar la transicion
 * offline -> online se sincroniza todo el pendiente en un solo POST /bulk.
 */
export function useTelemetrySync() {
  const isOnline = useNetworkStatus()
  const wasOnline = useRef(isOnline)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await countPendingEvents())
  }, [])

  const syncPending = useCallback(async () => {
    const pending = await getPendingEvents()
    if (pending.length === 0) return

    const ok = await postTelemetryBulk(pending)
    if (ok) {
      await markEventsSynced(pending.map((event) => event.event_id))
    }
    await refreshPendingCount()
  }, [refreshPendingCount])

  const recordEvent = useCallback(
    async (event: TelemetryEvent) => {
      await insertPendingEvent(event)

      if (isOnline) {
        const ok = await postTelemetry(event)
        if (ok) {
          await markEventsSynced([event.event_id])
        }
      }
      await refreshPendingCount()
    },
    [isOnline, refreshPendingCount],
  )

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      void syncPending()
    }
    wasOnline.current = isOnline
  }, [isOnline, syncPending])

  return { isOnline, pendingCount, recordEvent, syncPending }
}
