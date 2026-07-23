## ADDED Requirements

### Requirement: Captura periódica de ubicación
La app SHALL capturar la posición del dispositivo a un intervalo configurable mientras el tracking está activo, asociada al `vehicle_id` configurado por el conductor.

#### Scenario: Tracking activo genera eventos
- **WHEN** el conductor activa el tracking con un `vehicle_id` configurado
- **THEN** la app genera un evento de telemetría por cada posición capturada, con `event_id` único

### Requirement: Persistencia local offline-first
La app SHALL guardar cada evento capturado en una cola local (SQLite) antes de intentar enviarlo, sin perder eventos si no hay conectividad.

#### Scenario: Sin red, el evento no se pierde
- **WHEN** el dispositivo no tiene conexión al capturar una posición
- **THEN** el evento queda persistido en la cola local marcado como pendiente, y no se descarta

### Requirement: Envío inmediato con red disponible
La app SHALL intentar enviar un evento recién capturado de inmediato si hay conectividad, en vez de esperar a un sync posterior.

#### Scenario: Con red, el evento se envía sin esperar
- **WHEN** el dispositivo tiene conexión al capturar una posición
- **THEN** la app intenta `POST /v1/telemetry` de inmediato y solo lo deja en la cola si la petición falla

### Requirement: Sincronización en bloque al reconectar
La app SHALL detectar la recuperación de conectividad y enviar todos los eventos pendientes de la cola en una sola petición a `POST /v1/telemetry/bulk`.

#### Scenario: Reconexión dispara el sync en bloque
- **WHEN** la app detecta que la conectividad pasó de offline a online y hay eventos pendientes
- **THEN** envía todos los eventos pendientes en un único request a `POST /v1/telemetry/bulk` y los marca como sincronizados solo si la respuesta es exitosa

### Requirement: CI/CD del proyecto móvil
El repositorio SHALL incluir un workflow de GitHub Actions que instale dependencias y valide (tipos/lint) el proyecto móvil en cada push, y documente (sin ejecutar) el paso de build vía EAS.

#### Scenario: CI corre en cada push
- **WHEN** se hace push a una rama con cambios en `mobile/`
- **THEN** el workflow instala dependencias y corre type-check/lint, fallando el pipeline si alguno falla
