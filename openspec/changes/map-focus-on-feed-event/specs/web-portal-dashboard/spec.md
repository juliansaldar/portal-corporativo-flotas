## ADDED Requirements

### Requirement: Enfocar el mapa desde el feed en vivo
El portal SHALL permitir hacer click en una fila del panel de feed de telemetría en vivo para centrar el mapa en la posición de ese envío y resaltarla con un marcador distinto al de la posición actual del vehículo.

#### Scenario: Click en una fila centra el mapa
- **WHEN** el usuario hace click en una fila del feed de telemetría en vivo
- **THEN** el mapa se centra/hace zoom en la posición de ese evento y muestra un marcador destacado ahí, sin ocultar los marcadores de posición actual de los demás vehículos

#### Scenario: Click de nuevo quita el enfoque
- **WHEN** el usuario hace click de nuevo sobre la misma fila ya seleccionada
- **THEN** el marcador destacado desaparece y el mapa deja de estar enfocado en ese punto

#### Scenario: Cambiar de vehículo limpia el enfoque anterior
- **WHEN** el usuario selecciona un vehículo distinto en el roster mientras había un evento del feed enfocado
- **THEN** el marcador destacado del vehículo anterior desaparece
