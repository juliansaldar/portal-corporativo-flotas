## Context

Primer y único cliente productor de telemetría "real" (hasta ahora solo se ha probado con `curl`/k6 simulado). Debe funcionar sin red de forma confiable y sincronizar sin duplicar datos al volver a tener conexión, reusando el pipeline de ingesta ya construido en `telemetry-ingestion`.

## Goals / Non-Goals

**Goals**
- Ningún evento de ubicación se pierde por falta de red.
- Sincronización en bloque, no N peticiones sueltas al reconectar.
- CI que valida el proyecto en cada push.

**Non-Goals**
- Tracking en background real (con la app cerrada) — se implementa foreground tracking; se documenta como límite conocido.
- Build/publish real a App Store o Play Store — requeriría cuentas de desarrollador que no aplican a este MVP de portafolio.
- Autenticación de conductores.

## Decisions

### 1. Expo (managed workflow), no React Native CLI puro
Expo integra `expo-location` y `expo-sqlite` sin configuración nativa manual, y su CI/CD (`eas build`) es el camino idiomático para una app managed — reduce drásticamente el tiempo de setup frente a un proyecto RN CLI bare, sin perder ninguna capacidad que este MVP necesite.

### 2. `expo-sqlite` (una tabla) en vez de WatermelonDB
WatermelonDB es un motor de sincronización reactivo pensado para múltiples entidades relacionadas con conflictos de sync complejos. Aquí solo existe una cola de eventos pendientes (`pending_telemetry`); una tabla SQLite simple con una columna `synced` es suficiente y evita sumar un ORM completo con su propia configuración nativa.

### 3. `POST /v1/telemetry/bulk` en vez de N llamadas a `POST /v1/telemetry`
Sincronizar "en bloque" (requisito literal del PDF) se interpreta como una sola petición de red que transporta todos los eventos pendientes, no como N llamadas secuenciales disfrazadas de "bloque". Se modifica `telemetry-ingestion` para exponerlo, reutilizando la validación/publicación/dedup existentes por evento — sin lógica nueva de negocio.

### 4. Foreground tracking (`expo-location.watchPositionAsync`), no background real
El tracking en background verdadero (app cerrada) requiere permisos adicionales (`ACCESS_BACKGROUND_LOCATION` en Android, modos especiales en iOS) y tareas registradas (`expo-task-manager`) que añaden complejidad de configuración nativa no justificable en el tiempo disponible. Se documenta como límite conocido; el offline-first (que es el requisito central del bloque D) no depende de esto.

### 5. `@react-native-community/netinfo` para detectar reconexión
Es el estándar de facto en el ecosistema Expo/RN para detectar cambios de conectividad; dispara el sync en bloque en la transición offline→online, además de un botón manual de "sincronizar ahora".

### 6. CI/CD con GitHub Actions + EAS documentado (no Fastlane)
Fastlane es la herramienta idiomática para pipelines nativos de Xcode/Gradle; para un proyecto Expo managed, `eas build`/`eas submit` es el equivalente directo del propio ecosistema Expo. El PDF menciona Fastlane como ejemplo ("ej."), no como requisito — se documenta el job de EAS en el workflow, gateado por el secret `EXPO_TOKEN`, pero no se ejecuta un build real (requeriría cuenta Expo/Apple/Google).

## Risks / Trade-offs

- **[Riesgo]** Foreground-only tracking no captura posiciones con la app cerrada → **Mitigación**: aceptable para demo de portafolio; documentado en README como siguiente paso.
- **[Riesgo]** Un lote (`bulk`) grande podría exceder límites razonables de tamaño de petición → **Mitigación**: fuera de alcance para el volumen de un solo conductor/dispositivo; no se pagina en este MVP.
- **[Riesgo]** Sin cuenta EAS/Apple/Google, el job de build de CI no se puede ejecutar realmente → **Mitigación**: el workflow se documenta y se deja gateado por secret ausente (se salta o falla explícitamente, no se simula un éxito falso).

## Migration Plan

No aplica (nuevo cliente, sin datos previos).

## Open Questions

Ninguna bloqueante.
