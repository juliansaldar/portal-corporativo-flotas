/**
 * Dato de presentacion (demo) del vehiculo del conductor, no telemetria real.
 * Ver design.md de driver-experience-visual-refresh, decision 1.
 *
 * Este es el perfil de referencia: frontend/src/data/dummyVehicleProfiles.ts
 * lo replica para que el vehicle_id real de esta app (el que se edite en el
 * campo de texto de App.tsx) se vea igual en el roster del portal web. Si
 * cambias este perfil o el vehicle_id de la app, actualiza tambien
 * dummyVehicleProfiles.ts y la variable de entorno VITE_MOBILE_VEHICLE_ID
 * en docker-compose.yml (ver mobile-web-vehicle-id-config).
 */
export interface DummyDocument {
  name: string
  issuer: string
  expiresAt: string
}

export interface DummyVehicleProfile {
  plate: string
  model: string
  driverName: string
  driverInitials: string
  documents: DummyDocument[]
}

export const DUMMY_VEHICLE_PROFILE: DummyVehicleProfile = {
  plate: 'XYZ-123',
  model: 'Toyota Corolla',
  driverName: 'Julian Saldarriaga',
  driverInitials: 'JS',
  documents: [
    { name: 'SOAT Vehicular', issuer: 'Sura Seguros', expiresAt: '2026-08-05' },
    { name: 'Tecnomecánica', issuer: 'CDA Autonorte', expiresAt: '2026-11-10' },
  ],
}

export function daysUntil(isoDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / msPerDay)
}
