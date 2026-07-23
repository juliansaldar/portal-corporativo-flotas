import { useMemo } from 'react'
import './App.css'
import logo from './assets/logo.png'
import { AlertsPanel } from './components/AlertsPanel'
import { ChatPanel } from './components/ChatPanel'
import { MapView } from './components/MapView'
import { useVehicleStream } from './hooks/useVehicleStream'
import { deriveAlerts } from './lib/alerts'

function App() {
  const { vehicles, streamError } = useVehicleStream()
  const alerts = useMemo(() => deriveAlerts(vehicles), [vehicles])
  const alertVehicleIds = useMemo(() => new Set(alerts.map((v) => v.vehicle_id)), [alerts])

  return (
    <div className="app">
      <header className="app-header">
        <img src={logo} alt="Portal Corporativo de Monitoreo de Flotas" className="logo" />
        <h1>Monitoreo de Flotas</h1>
        {streamError && <span className="stream-error">{streamError}</span>}
      </header>
      <main className="dashboard">
        <div className="panel map-panel">
          <MapView vehicles={vehicles} alertVehicleIds={alertVehicleIds} />
        </div>
        <AlertsPanel alerts={alerts} />
        <ChatPanel />
      </main>
    </div>
  )
}

export default App
