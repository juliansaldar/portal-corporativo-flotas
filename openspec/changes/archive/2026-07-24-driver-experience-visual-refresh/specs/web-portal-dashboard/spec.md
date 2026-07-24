## ADDED Requirements

### Requirement: Resumen de flota
El portal SHALL mostrar una tarjeta de resumen destacada (hero card) con el conteo de vehículos activos, el conteo de vehículos en alerta (dentro de una `CriticalZone` con `stopped_duration_seconds` sobre el umbral) y la velocidad promedio de la flota, calculados en el cliente a partir del mismo stream de telemetría que ya consume el mapa.

#### Scenario: El resumen se actualiza con el stream
- **WHEN** llega un nuevo evento de `GET /v1/vehicles/stream` que cambia el número de vehículos en alerta
- **THEN** la tarjeta de resumen refleja el nuevo conteo sin recargar la página

### Requirement: Roster de vehículos con perfil de presentación
El portal SHALL mostrar un panel de roster que liste vehículos combinando su telemetría real (posición, velocidad, zona) con un perfil de presentación dummy local (placa, modelo, conductor) asignado de forma determinística por `vehicle_id`, priorizando en la lista los vehículos con alerta activa.

#### Scenario: Un vehículo sin perfil dedicado igual aparece en el roster
- **WHEN** el stream incluye un `vehicle_id` que no tiene un perfil dummy dedicado (ej. los generados por la prueba de carga k6)
- **THEN** el roster le asigna un perfil dummy de la lista de ejemplo de forma consistente (el mismo `vehicle_id` siempre resuelve al mismo perfil) en vez de omitirlo o dejar campos vacíos

#### Scenario: El roster prioriza alertas
- **WHEN** hay más vehículos que el límite de filas visibles del roster
- **THEN** los vehículos con alerta activa aparecen primero en la lista

### Requirement: Guantera digital de ejemplo
El portal SHALL mostrar una tarjeta de "Guantera Digital" con documentos vehiculares de ejemplo (ej. SOAT, tecnomecánica) y su fecha de vencimiento simulada, claramente separada de los paneles que muestran telemetría en vivo.

#### Scenario: Documento por vencer se resalta
- **WHEN** un documento dummy tiene una fecha de vencimiento simulada dentro de los próximos 30 días
- **THEN** se muestra con una etiqueta de advertencia visualmente distinta a un documento vigente

### Requirement: Lenguaje visual del mockup en los paneles existentes
El mapa, el panel de alertas y el chat SHALL adoptar el lenguaje visual del mockup (`info/simon_app_mockup_preview.html`: tarjetas redondeadas, iconografía, jerarquía tipográfica, badges de estado) sin alterar su comportamiento funcional ya especificado (actualización en tiempo real del mapa, aparición/desaparición de alertas, streaming del chat).

#### Scenario: El restyling no rompe el streaming
- **WHEN** se aplica el nuevo estilo visual a `MapView`, `AlertsPanel` y `ChatPanel`
- **THEN** el mapa sigue actualizándose por SSE, las alertas siguen apareciendo/desapareciendo según `stopped_duration_seconds`, y el chat sigue mostrando la respuesta incrementalmente, sin regresiones
