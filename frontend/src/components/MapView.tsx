import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { VehicleState } from '../types'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [4.6097, -74.0817] // Bogota

interface MapViewProps {
  vehicles: VehicleState[]
  alertVehicleIds: Set<string>
}

export function MapView({ vehicles, alertVehicleIds }: MapViewProps) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
    </MapContainer>
  )
}
