## Why

El perfil dummy de la app móvil (`mobile/src/data/dummyVehicleProfile.ts`) fue personalizado con la placa y el conductor reales del usuario (`VIH-100`, Julian Saldarriaga) para sus pruebas en dispositivo físico. El roster del portal web asigna perfiles dummy por hash determinístico de `vehicle_id` sobre una lista de 6 perfiles genéricos (`frontend/src/data/dummyVehicleProfiles.ts`), y ese hash **no** hace coincidir el `vehicle_id` por defecto de la app móvil (`veh-mobile-1`) con el perfil personalizado — el conductor ve un nombre/placa distintos en cada app para lo que es, en la demo, el mismo vehículo.

## What Changes

- `frontend/src/data/dummyVehicleProfiles.ts`: el primer perfil de la lista pasa a tener los mismos datos que el perfil dummy de la app móvil (`VIH-100`, Toyota Corolla, Julian Saldarriaga, JS) — los documentos (SOAT/tecnomecánica, aseguradora, vencimiento) ya eran idénticos entre ambos archivos.
- `getVehicleProfile(vehicleId)` en el portal web agrega un caso conocido explícito: el `vehicle_id` por defecto de la app móvil (`veh-mobile-1`, debe coincidir con `DEFAULT_VEHICLE_ID` en `mobile/App.tsx`) siempre resuelve al perfil de Julian Saldarriaga, en vez de depender del hash genérico. Cualquier otro `vehicle_id` (ej. los ~200 de la prueba de carga k6) sigue usando la asignación por hash existente.

## Capabilities

### New Capabilities
_Ninguna._

### Modified Capabilities
- `web-portal-dashboard`: se actualiza el requirement de "Roster de vehículos con perfil de presentación" para garantizar que el `vehicle_id` conocido de la app móvil resuelve siempre al mismo perfil dummy que muestra la app móvil para sí misma, no a uno asignado por hash.

## Impact

- Código modificado: `frontend/src/data/dummyVehicleProfiles.ts` únicamente. No se toca `mobile/` (su perfil ya es la fuente de verdad que el portal debe igualar) ni `backend/`.
- Riesgo de desincronización futura si alguien cambia el perfil de un lado sin el otro — se documenta con un comentario cruzado explícito en ambos archivos (ver design.md, decisión 2).
