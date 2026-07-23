import * as SQLite from 'expo-sqlite'
import type { PendingTelemetryRow, TelemetryEvent } from '../types'

const DB_NAME = 'fleet_driver.db'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pending_telemetry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL UNIQUE,
          vehicle_id TEXT NOT NULL,
          lat REAL NOT NULL,
          lon REAL NOT NULL,
          speed_kmh REAL NOT NULL,
          timestamp TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `)
      return db
    })
  }
  return dbPromise
}

export async function insertPendingEvent(event: TelemetryEvent): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    `INSERT OR IGNORE INTO pending_telemetry (event_id, vehicle_id, lat, lon, speed_kmh, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [event.event_id, event.vehicle_id, event.lat, event.lon, event.speed_kmh, event.timestamp],
  )
}

export async function markEventsSynced(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return
  const db = await getDb()
  const placeholders = eventIds.map(() => '?').join(',')
  await db.runAsync(`UPDATE pending_telemetry SET synced = 1 WHERE event_id IN (${placeholders})`, eventIds)
}

export async function getPendingEvents(): Promise<PendingTelemetryRow[]> {
  const db = await getDb()
  return db.getAllAsync<PendingTelemetryRow>('SELECT * FROM pending_telemetry WHERE synced = 0 ORDER BY id ASC')
}

export async function countPendingEvents(): Promise<number> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pending_telemetry WHERE synced = 0',
  )
  return row?.count ?? 0
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key])
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb()
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  )
}
