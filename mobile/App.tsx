import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { getSetting, setSetting } from './src/db/database'
import { useLocationTracking } from './src/hooks/useLocationTracking'
import { useTelemetrySync } from './src/hooks/useTelemetrySync'

const VEHICLE_ID_SETTING_KEY = 'vehicle_id'
const DEFAULT_VEHICLE_ID = 'veh-mobile-1'

export default function App() {
  const [vehicleId, setVehicleId] = useState(DEFAULT_VEHICLE_ID)
  const { isOnline, pendingCount, recordEvent, syncPending } = useTelemetrySync()
  const { isTracking, error, start, stop } = useLocationTracking(vehicleId, recordEvent)

  useEffect(() => {
    getSetting(VEHICLE_ID_SETTING_KEY).then((stored) => {
      if (stored) setVehicleId(stored)
    })
  }, [])

  const handleVehicleIdChange = useCallback((value: string) => {
    setVehicleId(value)
    void setSetting(VEHICLE_ID_SETTING_KEY, value)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>App del Conductor</Text>

      <Text style={styles.label}>Vehículo</Text>
      <TextInput
        style={styles.input}
        value={vehicleId}
        onChangeText={handleVehicleIdChange}
        editable={!isTracking}
        placeholder="ID del vehiculo"
      />

      <View style={styles.statusRow}>
        <Text style={[styles.statusDot, isOnline ? styles.online : styles.offline]}>●</Text>
        <Text>{isOnline ? 'En línea' : 'Sin conexión'}</Text>
      </View>

      <Text style={styles.pending}>{pendingCount} evento(s) pendientes de sincronizar</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        <Button
          title={isTracking ? 'Detener tracking' : 'Iniciar tracking'}
          onPress={isTracking ? stop : start}
        />
      </View>
      <View style={styles.buttonRow}>
        <Button title="Sincronizar ahora" onPress={() => void syncPending()} disabled={!isOnline} />
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    color: '#a7b4c2',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    color: '#f5f7fa',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  statusDot: {
    fontSize: 12,
  },
  online: {
    color: '#2ad67a',
  },
  offline: {
    color: '#ff4d4d',
  },
  pending: {
    color: '#a7b4c2',
  },
  error: {
    color: '#ff4d4d',
  },
  buttonRow: {
    marginTop: 12,
  },
})
