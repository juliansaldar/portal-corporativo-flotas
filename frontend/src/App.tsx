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

function App() {
  const { vehicles, streamError } = useVehicleStream()
  const alerts = useMemo(() => deriveAlerts(vehicles), [vehicles])
  const alertVehicleIds = useMemo(() => new Set(alerts.map((v) => v.vehicle_id)), [alerts])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId((current) => (current === vehicleId ? null : vehicleId))
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
          <MapView vehicles={vehicles} alertVehicleIds={alertVehicleIds} />
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
      {selectedVehicleId && <VehicleEventFeedPanel vehicleId={selectedVehicleId} />}
    </div>
  )
}

export default App
