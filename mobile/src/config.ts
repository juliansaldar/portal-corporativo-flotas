// En un dispositivo fisico o emulador, localhost apunta al propio dispositivo,
// no a la maquina host. 10.0.2.2 es el alias estandar del emulador Android
// hacia el host; en iOS Simulator localhost si funciona.
import { Platform } from 'react-native'

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'

export const INGESTION_SERVICE_URL: string =
  process.env.EXPO_PUBLIC_INGESTION_SERVICE_URL ?? `http://${DEV_HOST}:8001`

export const LOCATION_CAPTURE_INTERVAL_MS = 3_000

export const SYNC_RETRY_INTERVAL_MS = 30_000
