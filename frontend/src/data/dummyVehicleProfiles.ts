/**
 * Datos de presentacion (demo), no telemetria real. Rellenan lo que el dominio
 * de backend no modela (placa, modelo, conductor, documentos) para que el
 * roster/guantera del portal se sientan como un producto terminado. Ver
 * design.md de driver-experience-visual-refresh, decision 1 y 2.
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

// Debe coincidir con mobile/src/data/dummyVehicleProfile.ts (el perfil que la
// app movil muestra para si misma) — ver getVehicleProfile mas abajo.
export const DUMMY_VEHICLE_PROFILES: DummyVehicleProfile[] = [
  {
    plate: 'XYZ-123',
    model: 'Toyota Corolla',
    driverName: 'Julian Saldarriaga',
    driverInitials: 'JS',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'Sura Seguros', expiresAt: '2026-08-05' },
      { name: 'Tecnomecánica', issuer: 'CDA Autonorte', expiresAt: '2026-11-10' },
    ],
  },
  {
    plate: 'HGK-882',
    model: 'Chevrolet NPR',
    driverName: 'María Torres',
    driverInitials: 'MT',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'Allianz Seguros', expiresAt: '2026-09-14' },
      { name: 'Tecnomecánica', issuer: 'CDA Country', expiresAt: '2026-08-02' },
    ],
  },
  {
    plate: 'QWE-451',
    model: 'Renault Duster',
    driverName: 'Carlos Ramírez',
    driverInitials: 'CR',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'Seguros Bolívar', expiresAt: '2026-12-01' },
      { name: 'Tecnomecánica', issuer: 'CDA Chapinero', expiresAt: '2027-01-20' },
    ],
  },
  {
    plate: 'LMN-207',
    model: 'Kia Sportage',
    driverName: 'Diana Gómez',
    driverInitials: 'DG',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'Positiva Seguros', expiresAt: '2026-08-10' },
      { name: 'Tecnomecánica', issuer: 'CDA Suba', expiresAt: '2026-10-05' },
    ],
  },
  {
    plate: 'RTY-635',
    model: 'Hino 300',
    driverName: 'Andrés Beltrán',
    driverInitials: 'AB',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'AXA Colpatria', expiresAt: '2026-11-28' },
      { name: 'Tecnomecánica', issuer: 'CDA Fontibón', expiresAt: '2026-09-01' },
    ],
  },
  {
    plate: 'FGH-914',
    model: 'Nissan Frontier',
    driverName: 'Laura Sánchez',
    driverInitials: 'LS',
    documents: [
      { name: 'SOAT Vehicular', issuer: 'Mapfre Seguros', expiresAt: '2026-12-18' },
      { name: 'Tecnomecánica', issuer: 'CDA Engativá', expiresAt: '2026-08-22' },
    ],
  },
]

// Configurable por entorno (VITE_MOBILE_VEHICLE_ID en docker-compose.yml/.env)
// en vez de hardcodeado: el vehicle_id real de la app movil es un campo de
// texto libre que el usuario edita y persiste en SQLite, asi que cambia con
// el tiempo — ver design.md de mobile-web-vehicle-id-config. Sin la variable
// seteada, cae al DEFAULT_VEHICLE_ID de mobile/App.tsx ('veh-mobile-1').
const MOBILE_APP_VEHICLE_ID = import.meta.env.VITE_MOBILE_VEHICLE_ID ?? 'veh-mobile-1'

export function getVehicleProfile(vehicleId: string): DummyVehicleProfile {
  if (vehicleId === MOBILE_APP_VEHICLE_ID) {
    return DUMMY_VEHICLE_PROFILES[0]
  }
  const hash = Array.from(vehicleId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return DUMMY_VEHICLE_PROFILES[hash % DUMMY_VEHICLE_PROFILES.length]
}

export function daysUntil(isoDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / msPerDay)
}
