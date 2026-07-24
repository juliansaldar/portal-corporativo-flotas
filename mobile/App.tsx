import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { BottomTabBar, type TabKey } from './src/navigation/BottomTabBar'
import { GloveboxScreen } from './src/screens/GloveboxScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { SosScreen } from './src/screens/SosScreen'
import { TrackingScreen } from './src/screens/TrackingScreen'
import { getSetting, setSetting } from './src/db/database'
import { useLocationTracking } from './src/hooks/useLocationTracking'
import { useTelemetrySync } from './src/hooks/useTelemetrySync'
import type { TelemetryEvent } from './src/types'

const VEHICLE_ID_SETTING_KEY = 'vehicle_id'
const DEFAULT_VEHICLE_ID = 'ABC-123'

export default function App() {
  const [vehicleId, setVehicleId] = useState(DEFAULT_VEHICLE_ID)
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [lastEvent, setLastEvent] = useState<TelemetryEvent | null>(null)
  const { isOnline, pendingCount, recordEvent, syncPending } = useTelemetrySync()

  const handleCapture = useCallback(
    (event: TelemetryEvent) => {
      setLastEvent(event)
      void recordEvent(event)
    },
    [recordEvent],
  )

  const { isTracking, error, start, stop } = useLocationTracking(vehicleId, handleCapture)

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
      {activeTab === 'home' && (
        <HomeScreen
          vehicleId={vehicleId}
          onVehicleIdChange={handleVehicleIdChange}
          isTracking={isTracking}
          isOnline={isOnline}
          pendingCount={pendingCount}
          trackingError={error}
        />
      )}
      {activeTab === 'tracking' && (
        <TrackingScreen
          vehicleId={vehicleId}
          isTracking={isTracking}
          isOnline={isOnline}
          pendingCount={pendingCount}
          lastEvent={lastEvent}
          onStart={start}
          onStop={stop}
          onSyncNow={() => void syncPending()}
        />
      )}
      {activeTab === 'glovebox' && <GloveboxScreen />}
      {activeTab === 'sos' && <SosScreen />}

      <BottomTabBar active={activeTab} onSelect={setActiveTab} />
      <StatusBar style="light" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
})
