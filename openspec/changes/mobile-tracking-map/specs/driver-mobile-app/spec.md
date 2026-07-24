## ADDED Requirements

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
