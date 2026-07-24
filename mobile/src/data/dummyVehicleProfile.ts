/**
 * Dato de presentacion (demo) del vehiculo del conductor, no telemetria real.
 * Ver design.md de driver-experience-visual-refresh, decision 1.
 *
 * Este es el perfil de referencia: frontend/src/data/dummyVehicleProfiles.ts
 * lo replica para que el vehicle_id por defecto de esta app (DEFAULT_VEHICLE_ID
 * en App.tsx, 'veh-mobile-1') se vea igual en el roster del portal web. Si
 * cambias algo aqui, actualiza tambien ese archivo (ver mobile-web-dummy-
 * profile-match).
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
  plate: 'VIH-100',
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
