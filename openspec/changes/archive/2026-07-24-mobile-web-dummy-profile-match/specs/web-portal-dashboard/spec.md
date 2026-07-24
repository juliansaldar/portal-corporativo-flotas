## MODIFIED Requirements

### Requirement: Roster de vehículos con perfil de presentación
El portal SHALL mostrar un panel de roster que liste vehículos combinando su telemetría real (posición, velocidad, zona) con un perfil de presentación dummy local (placa, modelo, conductor) asignado de forma determinística por `vehicle_id`, priorizando en la lista los vehículos con alerta activa. El `vehicle_id` por defecto de la app móvil SHALL resolver siempre al mismo perfil dummy que la app móvil muestra para sí misma, en vez de a uno asignado por el hash genérico.

#### Scenario: Un vehículo sin perfil dedicado igual aparece en el roster
- **WHEN** el stream incluye un `vehicle_id` que no tiene un perfil dummy dedicado (ej. los generados por la prueba de carga k6)
- **THEN** el roster le asigna un perfil dummy de la lista de ejemplo de forma consistente (el mismo `vehicle_id` siempre resuelve al mismo perfil) en vez de omitirlo o dejar campos vacíos

#### Scenario: El roster prioriza alertas
- **WHEN** hay más vehículos que el límite de filas visibles del roster
- **THEN** los vehículos con alerta activa aparecen primero en la lista

#### Scenario: El vehículo de la app móvil coincide en ambas apps
- **WHEN** el roster resuelve el perfil para el `vehicle_id` por defecto de la app móvil (`veh-mobile-1`)
- **THEN** muestra exactamente el mismo nombre de conductor y placa que `mobile/src/data/dummyVehicleProfile.ts` define para esa app, no un perfil elegido por hash
