# driver-mobile-app Specification

## Purpose
TBD - created by archiving change driver-mobile-app. Update Purpose after archive.
## Requirements
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

### Requirement: Navegación por pestañas
La app SHALL presentar una barra de navegación inferior con al menos cuatro destinos (Inicio, Rastreo, Guantera, SOS), donde Inicio y Rastreo son pantallas funcionales y Guantera/SOS son vistas placeholder explícitamente marcadas como no funcionales.

#### Scenario: Cambiar de pestaña conserva el estado de tracking
- **WHEN** el conductor tiene el tracking activo en la pantalla de Rastreo y navega a la pestaña Inicio
- **THEN** el tracking sigue activo (no se detiene ni se reinicia) y la pestaña Inicio refleja el mismo estado

### Requirement: Pantalla de Inicio
La app SHALL presentar una pantalla de Inicio con una tarjeta de estado del vehículo (tracking activo/detenido, `vehicle_id` configurado, conectividad, eventos pendientes de sincronizar) y una sección de guantera digital con documentos de ejemplo, usando datos vehiculares dummy locales para los campos que la telemetría no cubre (placa, modelo).

#### Scenario: El estado de tracking real se refleja en la tarjeta de Inicio
- **WHEN** el conductor inicia el tracking desde cualquier pantalla
- **THEN** la tarjeta de estado de la pantalla de Inicio muestra "tracking activo" usando el mismo estado (`isTracking`) que ya expone `useLocationTracking`, sin una fuente de estado duplicada

### Requirement: Pantalla de Rastreo
La app SHALL presentar una pantalla de Rastreo con un bottom sheet que muestre la telemetría real más reciente del dispositivo (última posición conocida, estado online/offline, conteo de eventos pendientes) y los controles ya existentes de iniciar/detener tracking y sincronizar ahora.

#### Scenario: Controles reales siguen funcionando desde la nueva pantalla
- **WHEN** el conductor presiona "Sincronizar ahora" desde el bottom sheet de la pantalla de Rastreo
- **THEN** se invoca el mismo `syncPending` de `useTelemetrySync` ya cubierto por los requirements de sincronización en bloque existentes, sin una implementación paralela

### Requirement: Vistas placeholder sin funcionalidad simulada
Las pestañas Guantera y SOS SHALL mostrar contenido de ejemplo o un mensaje de "próximamente" y SHALL NOT realizar ninguna llamada de red ni simular una acción de backend que no existe (ej. apagado remoto, alerta de emergencia real).

#### Scenario: SOS no dispara ninguna llamada real
- **WHEN** el conductor toca la pestaña SOS
- **THEN** la app muestra una vista informativa sin invocar ningún endpoint ni servicio externo

### Requirement: Mapa real en la pantalla de Rastreo
La pantalla de Rastreo SHALL mostrar un mapa real (no un placeholder estático) con un marcador en la posición GPS actual del dispositivo.

#### Scenario: El mapa se carga con la posición disponible
- **WHEN** el conductor abre la pantalla de Rastreo y ya existe una posición capturada
- **THEN** el mapa se centra en esa posición y muestra un marcador ahí

#### Scenario: Una nueva posición mueve el marcador sin recargar el mapa
- **WHEN** llega un nuevo evento de tracking con una posición distinta a la anterior
- **THEN** el marcador se mueve a la nueva posición sin que el mapa se recargue por completo (no se pierde el zoom/centro que el usuario haya elegido manualmente)

#### Scenario: Sin posición todavía
- **WHEN** el conductor abre la pantalla de Rastreo antes de que exista alguna posición capturada
- **THEN** el mapa se muestra con una vista por defecto, sin marcador, en vez de fallar o mostrar una pantalla en blanco

