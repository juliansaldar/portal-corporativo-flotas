import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { TelemetryEvent } from '../types'

interface TrackingScreenProps {
  vehicleId: string
  isTracking: boolean
  isOnline: boolean
  pendingCount: number
  lastEvent: TelemetryEvent | null
  onStart: () => void
  onStop: () => void
  onSyncNow: () => void
}

export function TrackingScreen({
  vehicleId,
  isTracking,
  isOnline,
  pendingCount,
  lastEvent,
  onStart,
  onStop,
  onSyncNow,
}: TrackingScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.searchPill}>
          <Text style={styles.searchPillText}>
            {isTracking ? '🟢 Rastreo en Vivo' : '⚪ Rastreo detenido'} • {vehicleId}
          </Text>
        </View>
        <View style={styles.pinWrap}>
          <View style={styles.pulseCircle}>
            <View style={styles.carDot} />
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTitle}>
          <Text style={styles.sheetTitleText}>{vehicleId}</Text>
          <Text style={styles.sheetSubtitle}>
            {lastEvent ? new Date(lastEvent.timestamp).toLocaleTimeString() : 'Sin datos aún'}
          </Text>
        </View>

        <View style={styles.telemetryRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>VELOCIDAD</Text>
            <Text style={styles.pillValue}>{(lastEvent?.speed_kmh ?? 0).toFixed(0)} km/h</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>CONEXIÓN</Text>
            <Text style={[styles.pillValue, isOnline ? styles.success : styles.destructive]}>
              {isOnline ? 'En línea' : 'Offline'}
            </Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>PENDIENTES</Text>
            <Text style={styles.pillValue}>{pendingCount}</Text>
          </View>
        </View>

        {lastEvent && (
          <Text style={styles.coords}>
            Lat {lastEvent.lat.toFixed(4)}, Lon {lastEvent.lon.toFixed(4)}
          </Text>
        )}

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btnAction, styles.btnDanger]}
            onPress={isTracking ? onStop : onStart}
          >
            <Text style={styles.btnDangerText}>
              {isTracking ? '🛑 Detener tracking' : '▶️ Iniciar tracking'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btnAction, styles.btnPrimary, !isOnline && styles.btnDisabled]}
            onPress={onSyncNow}
            disabled={!isOnline}
          >
            <Text style={styles.btnPrimaryText}>⚡ Sincronizar ahora</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1015' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0b1015',
    position: 'relative',
  },
  searchPill: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: '#00ffc2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  searchPillText: { color: '#f5f7fa', fontSize: 11 },
  pinWrap: {
    position: 'absolute',
    top: '40%',
    left: '45%',
  },
  pulseCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,255,194,0.15)',
    borderWidth: 1.5,
    borderColor: '#00ffc2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00ffc2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomSheet: {
    backgroundColor: '#0c0c12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#222230',
    padding: 16,
    gap: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#333344',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sheetTitleText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  sheetSubtitle: { fontSize: 10, color: '#a7b4c2' },
  telemetryRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  pill: {
    flex: 1,
    backgroundColor: '#14141f',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  pillLabel: { fontSize: 8, color: '#a7b4c2' },
  pillValue: { fontSize: 12, color: '#00ffc2', fontWeight: '700' },
  success: { color: '#2ad67a' },
  destructive: { color: '#ff4d4d' },
  coords: { fontSize: 10, color: '#a7b4c2', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnAction: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  btnDanger: { backgroundColor: 'rgba(255,77,77,0.15)', borderWidth: 1, borderColor: '#ff4d4d' },
  btnDangerText: { color: '#ff4d4d', fontSize: 11, fontWeight: '700' },
  btnPrimary: { backgroundColor: '#00ffc2' },
  btnPrimaryText: { color: '#0a0a0a', fontSize: 11, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
})
