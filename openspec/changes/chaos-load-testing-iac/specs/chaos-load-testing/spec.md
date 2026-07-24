## ADDED Requirements

### Requirement: Simulación de carga con múltiples vehículos
El script SHALL simular cientos de vehículos concurrentes enviando telemetría a `POST /v1/telemetry` mediante VUs (usuarios virtuales) de k6.

#### Scenario: Carga sostenida
- **WHEN** se ejecuta el script con el perfil de carga por defecto
- **THEN** el número de VUs concurrentes escala hasta al menos 200 durante la fase sostenida

### Requirement: Inyección de duplicados
El script SHALL reenviar aproximadamente el 10% de los eventos válidos con el mismo `event_id`, para ejercitar la deduplicación real del sistema.

#### Scenario: Duplicado real ejercitado
- **WHEN** corre el script de carga
- **THEN** ~10% de los eventos válidos se envían dos veces con idéntico `event_id`

### Requirement: Inyección de errores
El script SHALL enviar aproximadamente el 5% de los eventos como payloads inválidos (campos faltantes), esperando que el sistema responda `422` sin caerse.

#### Scenario: Error real ejercitado
- **WHEN** corre el script de carga
- **THEN** ~5% de las peticiones son payloads inválidos y el sistema responde `422` consistentemente, sin afectar al resto del tráfico
