/**
 * Dato de presentacion (demo) del vehiculo del conductor, no telemetria real.
 * Ver design.md de driver-experience-visual-refresh, decision 1.
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
  driverName: 'Juan Delgado',
  driverInitials: 'JD',
  documents: [
    { name: 'SOAT Vehicular', issuer: 'Sura Seguros', expiresAt: '2026-08-05' },
    { name: 'Tecnomecánica', issuer: 'CDA Autonorte', expiresAt: '2026-11-10' },
  ],
}

export function daysUntil(isoDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / msPerDay)
}
