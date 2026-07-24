## ADDED Requirements

### Requirement: Selección de vehículo
El portal SHALL permitir seleccionar un vehículo haciendo click en su fila del roster, mostrando visualmente cuál está seleccionado.

#### Scenario: Seleccionar una fila del roster
- **WHEN** el usuario hace click en una fila del `VehicleRosterPanel`
- **THEN** ese vehículo queda marcado como seleccionado y se abre el panel de feed en vivo para su `vehicle_id`

#### Scenario: Cambiar de selección cierra el feed anterior
- **WHEN** el usuario selecciona un vehículo distinto mientras ya hay un feed en vivo abierto
- **THEN** la conexión SSE del vehículo anterior se cierra antes de abrir la del nuevo vehículo seleccionado

### Requirement: Panel de feed de telemetría en vivo
El portal SHALL mostrar, para el vehículo seleccionado, una lista scrolleable de los eventos crudos de telemetría recibidos por `GET /v1/vehicles/{vehicle_id}/events/stream`, acotada a un número máximo de filas visibles.

#### Scenario: Un nuevo envío aparece en el feed
- **WHEN** llega un nuevo evento por el stream de eventos crudos del vehículo seleccionado
- **THEN** aparece una nueva fila en el feed con su hora, posición y velocidad, sin necesidad de recargar la página

#### Scenario: El feed no crece sin límite
- **WHEN** el número de eventos recibidos supera el máximo de filas configurado
- **THEN** las filas más antiguas se descartan, manteniendo solo las más recientes

#### Scenario: Deseleccionar cierra la conexión
- **WHEN** el usuario deselecciona el vehículo (ej. click de nuevo sobre la misma fila)
- **THEN** el panel de feed se oculta y la conexión SSE correspondiente se cierra
