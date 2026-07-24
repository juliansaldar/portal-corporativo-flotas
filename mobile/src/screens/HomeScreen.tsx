import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { DUMMY_VEHICLE_PROFILE, daysUntil } from '../data/dummyVehicleProfile'

const EXPIRY_WARNING_DAYS = 30

interface HomeScreenProps {
  vehicleId: string
  onVehicleIdChange: (value: string) => void
  isTracking: boolean
  isOnline: boolean
  pendingCount: number
  trackingError: string | null
}

function notImplemented(action: string) {
  Alert.alert('Próximamente', `"${action}" todavía no está disponible en este MVP.`)
}

export function HomeScreen({
  vehicleId,
  onVehicleIdChange,
  isTracking,
  isOnline,
  pendingCount,
  trackingError,
}: HomeScreenProps) {
  const profile = DUMMY_VEHICLE_PROFILE

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.driverInitials}</Text>
        </View>
        <View>
          <Text style={styles.greetingSmall}>Hola, {profile.driverName.split(' ')[0]} 👋</Text>
          <Text style={styles.greetingBig}>
            {profile.model} • <Text style={styles.plate}>{profile.plate}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>
              {isTracking ? 'TRACKING ACTIVO' : 'TRACKING DETENIDO'}
            </Text>
          </View>
          <Text style={styles.signal}>{isOnline ? 'En línea 🟢' : 'Sin conexión 🔴'}</Text>
        </View>
        <Text style={styles.vehicleId}>Vehículo: {vehicleId}</Text>
        <TextInput
          style={styles.input}
          value={vehicleId}
          onChangeText={onVehicleIdChange}
          editable={!isTracking}
          placeholder="ID del vehiculo"
          placeholderTextColor="#a7b4c2"
        />
        {trackingError && <Text style={styles.error}>{trackingError}</Text>}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>PENDIENTES</Text>
            <Text style={styles.metricValue}>{pendingCount}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>CONEXIÓN</Text>
            <Text style={[styles.metricValue, isOnline ? styles.success : styles.destructive]}>
              {isOnline ? 'Estable' : 'Perdida'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickGrid}>
        {[
          { icon: '🛡️', label: 'Geocercas' },
          { icon: '📄', label: 'Guantera' },
          { icon: '🛟', label: 'Asistencia' },
          { icon: '📊', label: 'Reportes' },
        ].map((action) => (
          <View key={action.label} style={styles.actionBtn} onTouchEnd={() => notImplemented(action.label)}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Guantera Digital</Text>
      {profile.documents.map((doc) => {
        const remaining = daysUntil(doc.expiresAt)
        const expiringSoon = remaining <= EXPIRY_WARNING_DAYS
        return (
          <View key={doc.name} style={styles.listCard}>
            <View style={styles.iconBox}>
              <Text>📄</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{doc.name}</Text>
              <Text style={styles.cardSubtitle}>
                {expiringSoon ? `Vence en ${remaining} días` : `Vigente hasta ${doc.expiresAt}`} •{' '}
                {doc.issuer}
              </Text>
            </View>
            {expiringSoon && (
              <View style={styles.tagWarning}>
                <Text style={styles.tagWarningText}>Renovar</Text>
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080808' },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a26',
    borderWidth: 1.5,
    borderColor: '#00ffc2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#00ffc2', fontWeight: '700', fontSize: 13 },
  greetingSmall: { fontSize: 11, color: '#a7b4c2' },
  greetingBig: { fontSize: 13, color: '#f5f7fa', fontWeight: '700' },
  plate: { color: '#00ffc2' },
  heroCard: {
    backgroundColor: '#111b24',
    borderWidth: 1,
    borderColor: 'rgba(0,255,194,0.25)',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,194,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffc2' },
  badgeText: { color: '#00ffc2', fontSize: 10, fontWeight: '700' },
  signal: { fontSize: 10, color: '#a7b4c2' },
  vehicleId: { color: '#f5f7fa', fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    color: '#f5f7fa',
  },
  error: { color: '#ff4d4d', fontSize: 11 },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  metricItem: { gap: 2 },
  metricLabel: { fontSize: 9, color: '#a7b4c2' },
  metricValue: { fontSize: 12, color: '#f5f7fa', fontWeight: '700' },
  success: { color: '#2ad67a' },
  destructive: { color: '#ff4d4d' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#f5f7fa', marginTop: 4 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 10, color: '#a7b4c2' },
  listCard: {
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,255,194,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 12, color: '#f5f7fa', fontWeight: '700' },
  cardSubtitle: { fontSize: 10, color: '#a7b4c2' },
  tagWarning: {
    backgroundColor: 'rgba(255,181,71,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagWarningText: { color: '#ffb547', fontSize: 9, fontWeight: '700' },
})
