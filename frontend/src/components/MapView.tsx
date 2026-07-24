import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { TelemetryEvent, VehicleState } from '../types'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [4.6097, -74.0817] // Bogota
const FOCUS_ZOOM = 16

interface MapViewProps {
  vehicles: VehicleState[]
  alertVehicleIds: Set<string>
  focusedEvent: TelemetryEvent | null
}

function MapFocusController({ focusedEvent }: { focusedEvent: TelemetryEvent | null }) {
  const map = useMap()

  useEffect(() => {
    if (!focusedEvent) return
    map.flyTo([focusedEvent.lat, focusedEvent.lon], FOCUS_ZOOM)
  }, [focusedEvent, map])

  return null
}

// Ajusta el encuadre para incluir todos los vehiculos cuando aparece uno con
// un vehicle_id nunca antes visto (ej. al cargar el portal, o cuando la app
// movil empieza a reportar) — sin esto, un vehiculo fuera del centro fijo en
// Bogota (ej. Medellin) queda invisible aunque el marcador exista.
function MapBoundsController({ vehicles }: { vehicles: VehicleState[] }) {
  const map = useMap()
  const knownIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (vehicles.length === 0) return
    const hasNewVehicle = vehicles.some((v) => !knownIds.current.has(v.vehicle_id))
    knownIds.current = new Set(vehicles.map((v) => v.vehicle_id))
    if (!hasNewVehicle) return

    const bounds = L.latLngBounds(vehicles.map((v): [number, number] => [v.lat, v.lon]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [vehicles, map])

  return null
}

function FocusedEventMarker({ event }: { event: TelemetryEvent }) {
  const markerRef = useRef<L.CircleMarker>(null)

  useEffect(() => {
    markerRef.current?.openPopup()
  }, [])

  return (
    <CircleMarker
      ref={markerRef}
      center={[event.lat, event.lon]}
      radius={14}
      pathOptions={{ color: '#00ffc2', weight: 3, fillOpacity: 0.15 }}
    >
      <Popup>
        <strong>Envío enfocado</strong>
        <br />
        {new Date(event.timestamp).toLocaleTimeString()}
        <br />
        {event.speed_kmh.toFixed(1)} km/h
      </Popup>
    </CircleMarker>
  )
}

export function MapView({ vehicles, alertVehicleIds, focusedEvent }: MapViewProps) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocusController focusedEvent={focusedEvent} />
      <MapBoundsController vehicles={vehicles} />
      {vehicles.map((vehicle) => (
        <Marker key={vehicle.vehicle_id} position={[vehicle.lat, vehicle.lon]}>
          <Popup>
            <strong>{vehicle.vehicle_id}</strong>
            <br />
            {vehicle.speed_kmh.toFixed(1)} km/h
            {alertVehicleIds.has(vehicle.vehicle_id) && (
              <>
                <br />
                <span className="alert-text">
                  Detenido {Math.round(vehicle.stopped_duration_seconds / 60)} min en zona critica
                </span>
              </>
            )}
          </Popup>
        </Marker>
      ))}
      {focusedEvent && <FocusedEventMarker key={focusedEvent.event_id} event={focusedEvent} />}
    </MapContainer>
  )
}
