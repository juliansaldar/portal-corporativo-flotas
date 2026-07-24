## Why

El change anterior (`mobile-web-dummy-profile-match`) hizo coincidir el perfil dummy del portal web con la app móvil, pero solo para un `vehicle_id` hardcodeado (`veh-mobile-1`, el `DEFAULT_VEHICLE_ID` del código). En la práctica, el `vehicle_id` de la app móvil es un campo de texto libre que el usuario edita y que persiste en SQLite entre aperturas de la app — ya cambió al menos dos veces durante las pruebas de esta sesión (`veh-100`, ahora `xyz-123`), y cada vez el hardcodeo en `frontend` quedó desactualizado. Arreglar el string una vez más no resuelve el problema real: la coincidencia depende de un valor que vive en el código y que hay que recordar actualizar manualmente cada vez que cambia el de la app.

## What Changes

- El `vehicle_id` "conocido" que el portal usa para mostrar el perfil de Julian Saldarriaga/VIH-100 pasa de una constante hardcodeada en el código a una **variable de entorno** (`VITE_MOBILE_VEHICLE_ID` en `frontend`), configurada en `docker-compose.yml`/`.env` — un cambio de configuración, no de código, cuando el `vehicle_id` de la app móvil cambie.
- Se actualiza el valor actual a `xyz-123` (el que el usuario confirmó que está usando su teléfono ahora mismo), corrigiendo el desajuste inmediato.
- `README.md` documenta explícitamente el paso manual: "si cambias el `vehicle_id` en el campo de texto de la app móvil, actualiza `VITE_MOBILE_VEHICLE_ID` en `docker-compose.yml` y reconstruye `frontend`."

## Capabilities

### New Capabilities
_Ninguna._

### Modified Capabilities
- `web-portal-dashboard`: el requirement "Roster de vehículos con perfil de presentación" se actualiza para que la coincidencia con el vehículo de la app móvil sea configurable por variable de entorno, no un valor fijo en el código.

## Impact

- Código modificado: `frontend/src/data/dummyVehicleProfiles.ts` (lee `import.meta.env.VITE_MOBILE_VEHICLE_ID`), `frontend/.env.example` (documenta la variable), `docker-compose.yml` (agrega `VITE_MOBILE_VEHICLE_ID: xyz-123` al servicio `frontend`).
- No afecta `mobile/` (su `vehicle_id` sigue siendo el campo de texto ya existente, sin cambios) ni `backend/`.
- Corrige el desajuste actual: `xyz-123` (el `vehicle_id` real configurado en el teléfono del usuario) volverá a mostrarse como "Toyota Corolla VIH-100 / Julian Saldarriaga" en el roster.
