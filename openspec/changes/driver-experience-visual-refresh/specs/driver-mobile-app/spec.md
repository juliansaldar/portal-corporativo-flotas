## ADDED Requirements

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
