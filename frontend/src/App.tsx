import { useMemo, useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import { AlertsPanel } from './components/AlertsPanel'
import { ChatPanel } from './components/ChatPanel'
import { FleetSummaryCard } from './components/FleetSummaryCard'
import { GloveboxCard } from './components/GloveboxCard'
import { MapView } from './components/MapView'
import { VehicleEventFeedPanel } from './components/VehicleEventFeedPanel'
import { VehicleRosterPanel } from './components/VehicleRosterPanel'
import { useVehicleStream } from './hooks/useVehicleStream'
import { deriveAlerts } from './lib/alerts'
import type { TelemetryEvent } from './types'

function App() {
  const { vehicles, streamError } = useVehicleStream()
  const alerts = useMemo(() => deriveAlerts(vehicles), [vehicles])
  const alertVehicleIds = useMemo(() => new Set(alerts.map((v) => v.vehicle_id)), [alerts])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [focusedEvent, setFocusedEvent] = useState<TelemetryEvent | null>(null)

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId((current) => (current === vehicleId ? null : vehicleId))
    setFocusedEvent(null)
  }

  const handleFocusEvent = (event: TelemetryEvent | null) => {
    setFocusedEvent((current) => (current?.event_id === event?.event_id ? null : event))
  }

  return (
    <div className="app">
      <header className="app-header">
        <img src={logo} alt="Portal Corporativo de Monitoreo de Flotas" className="logo" />
        <h1>Monitoreo de Flotas</h1>
        {streamError && <span className="stream-error">{streamError}</span>}
      </header>
      <FleetSummaryCard vehicles={vehicles} alerts={alerts} />
      <main className="dashboard">
        <div className="panel map-panel">
          <MapView vehicles={vehicles} alertVehicleIds={alertVehicleIds} focusedEvent={focusedEvent} />
        </div>
        <div className="side-column">
          <AlertsPanel alerts={alerts} />
          <ChatPanel />
        </div>
        <div className="side-column">
          <VehicleRosterPanel
            vehicles={vehicles}
            alertVehicleIds={alertVehicleIds}
            selectedVehicleId={selectedVehicleId}
            onSelect={handleSelectVehicle}
          />
          <GloveboxCard />
        </div>
      </main>
      {selectedVehicleId && (
        <VehicleEventFeedPanel
          vehicleId={selectedVehicleId}
          focusedEventId={focusedEvent?.event_id ?? null}
          onFocusEvent={handleFocusEvent}
        />
      )}
    </div>
  )
}

export default App
