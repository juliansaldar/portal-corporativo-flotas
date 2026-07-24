## Context

`mobile-web-dummy-profile-match` resolvió la coincidencia de perfil con una constante hardcodeada (`MOBILE_APP_DEFAULT_VEHICLE_ID = 'veh-mobile-1'`) en `frontend/src/data/dummyVehicleProfiles.ts`, con un comentario cruzado pidiendo mantenerla sincronizada a mano con `mobile/App.tsx`. La premisa de esa decisión era que el `vehicle_id` de la app móvil es esencialmente fijo (`DEFAULT_VEHICLE_ID`). La evidencia de esta misma sesión contradice esa premisa: el usuario ya cambió el `vehicle_id` de su teléfono al menos dos veces (`veh-100`, ahora `xyz-123`) editando el campo de texto de la pantalla de Inicio, y cada vez el valor hardcodeado del portal quedó desactualizado sin que hubiera ninguna señal de que había que tocarlo.

El perfil dummy de la app móvil (`mobile/src/data/dummyVehicleProfile.ts`) también se actualizó en paralelo: su `plate` ahora es `XYZ-123` (mayúsculas), coherente con que el `vehicle_id` real usado para telemetría es `xyz-123` (minúsculas) — el usuario alineó el nombre de la placa mostrada con el id real que usa para reportar.

## Goals / Non-Goals

**Goals:**
- Corregir el desajuste actual: `xyz-123` debe resolver al perfil de Julian Saldarriaga/`XYZ-123` en el roster del portal.
- Que la próxima vez que el `vehicle_id` de la app móvil cambie, arreglarlo sea editar una variable de entorno y reconstruir `frontend` — no editar código fuente ni recordar dónde está el string.

**Non-Goals:**
- No se automatiza la sincronización (ej. que el portal pregunte a la app móvil cuál es su `vehicle_id` actual en tiempo real) — sigue siendo una coincidencia de configuración, ahora explícita y fácil de ajustar, no implícita y hardcodeada.
- No se restringe el campo de texto de `vehicle_id` en la app móvil a un valor fijo ni se le agrega validación — sigue siendo edición libre, como ya se decidió que era aceptable para un MVP.

## Decisions

1. **Variable de entorno (`VITE_MOBILE_VEHICLE_ID`) en vez de una constante en código.** Se revierte la decisión 1 de `mobile-web-dummy-profile-match` (constante + comentario cruzado) a la luz de la evidencia: un comentario no evita que el valor quede desactualizado, y cada desajuste requirió una intervención de código. Una variable de entorno, seteada en `docker-compose.yml` (`frontend.environment.VITE_MOBILE_VEHICLE_ID`) y documentada en `frontend/.env.example`, convierte el ajuste en un cambio de configuración de una línea + reconstrucción del contenedor — sin tocar `dummyVehicleProfiles.ts`.
2. **`getVehicleProfile` lee `import.meta.env.VITE_MOBILE_VEHICLE_ID` con fallback a `'veh-mobile-1'`** (el mismo default que ya usa `mobile/App.tsx` cuando no hay nada editado), para que el comportamiento no cambie si la variable no está seteada.
3. **El valor real (`xyz-123`) se documenta en `docker-compose.yml`, no en `.env.example`.** `.env.example` mantiene un valor genérico de ejemplo (`veh-mobile-1`) como plantilla; `docker-compose.yml` es el lugar donde vive la configuración real de *este* despliegue de demo, igual que ya hace con `VITE_API_GATEWAY_URL`.
4. **No se cambia `mobile/`.** El `vehicle_id` de la app móvil sigue siendo el campo de texto libre ya existente (con su valor persistido en SQLite tomando precedencia sobre `DEFAULT_VEHICLE_ID`, sin cambios). El único lado que necesita "seguirle el paso" al otro es el portal, que no tiene forma de preguntarle a un teléfono físico cuál es su config — por eso la variable de entorno vive en `frontend`, no en `mobile`.

## Risks / Trade-offs

- **[Riesgo, ya aceptado dos veces] El usuario vuelve a cambiar el `vehicle_id` en su teléfono y olvida actualizar la variable de entorno** → mitigado parcialmente (es un cambio de config de una línea, no de código, más fácil de recordar/ejecutar), pero sigue siendo un paso manual — documentado explícitamente en el README como el procedimiento a seguir.
- **[Trade-off] Cambiar la variable de entorno requiere reconstruir/reiniciar el contenedor `frontend`** (Vite dev server lee `process.env` al arrancar) — aceptable para un MVP local vía Docker Compose, ya es el mismo costo que cambiar `VITE_API_GATEWAY_URL`.

## Migration Plan

Sin migración de datos. Se actualiza `docker-compose.yml` y se reconstruye `frontend` (`docker compose up -d --build frontend`) para aplicar el nuevo valor. Rollback: revertir el commit, sin impacto en backend/datos.

## Open Questions

Ninguna.
