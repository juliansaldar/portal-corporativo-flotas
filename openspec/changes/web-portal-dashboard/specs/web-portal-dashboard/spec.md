## ADDED Requirements

### Requirement: Mapa reactivo de la flota
El portal SHALL mostrar un mapa con la posición actual de cada vehículo, actualizado en tiempo real a partir de `GET /v1/vehicles/stream`.

#### Scenario: Un vehículo se mueve
- **WHEN** llega un nuevo evento del stream con una posición distinta para un vehículo
- **THEN** el marcador de ese vehículo en el mapa se actualiza sin recargar la página

### Requirement: Panel de alertas derivadas
El portal SHALL listar, en un panel separado del mapa, los vehículos cuyo `stopped_duration_seconds` supere un umbral configurable mientras estén dentro de una `CriticalZone` (`current_zone_ids` no vacío).

#### Scenario: Vehículo entra en alerta
- **WHEN** el estado de un vehículo tiene `current_zone_ids` no vacío y `stopped_duration_seconds >= umbral`
- **THEN** aparece en el panel de alertas con su nombre de zona y tiempo detenido

#### Scenario: Vehículo sale de alerta
- **WHEN** el vehículo vuelve a moverse (`stopped_duration_seconds` se reinicia a 0)
- **THEN** desaparece del panel de alertas

### Requirement: Chat con el agente
El portal SHALL incluir un panel de chat que envíe mensajes a `POST /v1/agent/chat` y muestre la respuesta a medida que llega (streaming SSE), conservando el historial de la sesión.

#### Scenario: Usuario hace una pregunta
- **WHEN** el usuario escribe un mensaje y lo envía
- **THEN** el mensaje se agrega al historial y la respuesta del agente se muestra incrementalmente conforme llegan los eventos SSE

### Requirement: Branding corporativo
El portal SHALL usar los assets de `./info/` (tema de colores, logo, favicon) en vez de un tema/placeholder genérico.

#### Scenario: Tema aplicado
- **WHEN** se carga el portal
- **THEN** los colores, el logo en el header y el favicon corresponden a los definidos en `./info/theme_colors.json`, `./info/logo.png` y `./info/favicon.svg`
