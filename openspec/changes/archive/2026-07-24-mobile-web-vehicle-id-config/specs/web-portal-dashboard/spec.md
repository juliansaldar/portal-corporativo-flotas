## MODIFIED Requirements

### Requirement: Roster de vehículos con perfil de presentación
El portal SHALL mostrar un panel de roster que liste vehículos combinando su telemetría real (posición, velocidad, zona) con un perfil de presentación dummy local (placa, modelo, conductor) asignado de forma determinística por `vehicle_id`, priorizando en la lista los vehículos con alerta activa. El `vehicle_id` que coincide con el de la app móvil SHALL ser configurable por variable de entorno (`VITE_MOBILE_VEHICLE_ID`), no un valor fijo en el código, y SHALL resolver siempre al mismo perfil dummy que la app móvil muestra para sí misma.

#### Scenario: Un vehículo sin perfil dedicado igual aparece en el roster
- **WHEN** el stream incluye un `vehicle_id` que no tiene un perfil dummy dedicado (ej. los generados por la prueba de carga k6)
- **THEN** el roster le asigna un perfil dummy de la lista de ejemplo de forma consistente (el mismo `vehicle_id` siempre resuelve al mismo perfil) en vez de omitirlo o dejar campos vacíos

#### Scenario: El roster prioriza alertas
- **WHEN** hay más vehículos que el límite de filas visibles del roster
- **THEN** los vehículos con alerta activa aparecen primero en la lista

#### Scenario: El vehículo de la app móvil coincide en ambas apps mediante configuración
- **WHEN** el roster resuelve el perfil para el `vehicle_id` configurado en `VITE_MOBILE_VEHICLE_ID`
- **THEN** muestra exactamente el mismo nombre de conductor y placa que `mobile/src/data/dummyVehicleProfile.ts` define para esa app

#### Scenario: Cambiar el vehicle_id de la app móvil no requiere tocar código
- **WHEN** el `vehicle_id` real de la app móvil cambia (el usuario edita el campo de texto de su teléfono)
- **THEN** hacer coincidir el roster con el nuevo valor solo requiere actualizar la variable de entorno `VITE_MOBILE_VEHICLE_ID` y reconstruir `frontend`, sin editar `dummyVehicleProfiles.ts`
