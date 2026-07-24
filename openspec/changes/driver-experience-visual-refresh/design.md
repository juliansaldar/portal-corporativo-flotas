## Context

`frontend/` es hoy un `App.tsx` de ~30 líneas: header con logo, y un `main.dashboard` con tres paneles (`MapView`, `AlertsPanel`, `ChatPanel`) en grid, todos correctos funcionalmente pero sin más jerarquía visual que el tema de colores (`theme.css`, ya alineado a `info/theme_colors.json`). `mobile/App.tsx` es una única pantalla de formulario (`SafeAreaView` con un input de `vehicle_id`, estado online/offline, contador de pendientes y dos botones) sin navegación — funcionalmente cumple el bloque D del PDF (offline-first, sync en bloque) pero no tiene la experiencia de "app del conductor" que describe el enunciado.

El mockup (`info/simon_app_mockup_preview.html`) es un diseño mobile-first (marco de teléfono, notch, navbar inferior) con dos pantallas: **Dashboard** (hero card de estado, acciones rápidas, guantera digital, últimos recorridos) y **Rastreo** (mapa con bottom sheet de telemetría y acciones). Usa exactamente la paleta ya adoptada (`#00FFC2` primario, `#19B5FF` secundario, dark theme), así que es una extensión del mismo sistema de diseño, no uno nuevo.

Ninguno de los dos clientes tiene hoy un concepto de "perfil de vehículo" (placa, modelo, conductor, documentos) — el dominio de backend solo modela telemetría (`VehicleState`: posición, velocidad, zona, tiempo detenido). El mockup asume ese perfil (placa `XYZ-123`, SOAT, etc.) que no existe en ningún lado del sistema real.

## Goals / Non-Goals

**Goals:**
- Adoptar el lenguaje visual del mockup (tarjetas redondeadas, iconografía, jerarquía tipográfica, badges de estado) en ambos clientes, sin romper ninguna funcionalidad real ya probada (mapa/alertas/chat en web; captura/cola/sync en mobile).
- Dar a la app móvil una navegación real de al menos 2 pantallas (Inicio, Rastreo), acercándola a lo que el bloque D del PDF pide como "app del conductor".
- Usar datos vehiculares dummy (placa, modelo, conductor, documentos/SOAT, viajes) para llenar los huecos de presentación que la telemetría real no cubre, dejando claro (implícita pero consistentemente, ej. sección "Guantera Digital" separada de la telemetría en vivo) que son datos de demo y no simulan un backend que no existe.
- No tocar `backend/`: cero endpoints nuevos, cero cambios al modelo `VehicleState`.

**Non-Goals:**
- No se implementa backend para documentos/perfil de vehículo, geocercas de usuario, apagado remoto, ni SOS real — donde el mockup implica una acción de backend inexistente (botón "Apagado Remoto", pestaña "SOS"), se implementa como control visual deshabilitado o de solo-alerta (`Alert.alert` / tooltip "Próximamente"), nunca como una llamada que finge funcionar.
- No se agrega una librería de navegación (`@react-navigation/*`) para 2 pantallas reales + 2 placeholders — se resuelve con un switch de estado local en `App.tsx` y una barra de tabs propia, consistente con la filosofía ya usada en este repo de no sumar dependencias para patrones triviales (mismo criterio que el circuit breaker a mano o evitar LangChain).
- No se re-arquitectura el estado de la flota en el portal web (`useVehicleStream` sigue siendo la única fuente de verdad de telemetría); el roster de vehículos solo le añade una capa de presentación (`join` en memoria por `vehicle_id`) sobre lo que ya llega por SSE.

## Decisions

1. **Dataset dummy como constante local versionada por cliente, no un servicio compartido.** `frontend/src/data/dummyVehicleProfiles.ts` y `mobile/src/data/dummyVehicleProfile.ts` son archivos separados con la misma forma de datos (placa, modelo, conductor, documentos) pero contenido propio a cada cliente (el portal necesita perfiles para *varios* vehículos simulados por k6/semilla; la app móvil solo necesita el perfil del vehículo que el conductor está usando). Alternativa descartada: un paquete npm compartido `packages/shared-ui` — over-engineering para un fixture de datos de demo que ninguno de los dos clientes consume vía red.
2. **El "join" entre perfil dummy y telemetría real es por `vehicle_id`, tolerante a huecos.** El portal renderiza el roster iterando los vehículos que llegan por `useVehicleStream` (telemetría real, incluyendo los ~200 simulados por k6) y les asigna un perfil dummy determinístico (ej. por hash del `vehicle_id` sobre una lista corta de perfiles de ejemplo) en vez de requerir que cada `vehicle_id` tenga un perfil 1:1 — así el roster no se rompe ni queda vacío si la carga de k6 sigue corriendo con cientos de IDs (`veh-load-*`) que nunca tendrán perfil dedicado.
3. **Mobile: tabs con estado local, no ruteo real.** `App.tsx` mantiene un `useState<'home' | 'tracking' | 'glovebox' | 'sos'>` y renderiza la pantalla correspondiente; `BottomTabBar` es un componente de presentación puro (recibe `active` + `onSelect`). Las pantallas `Glovebox`/`SOS` del navbar son vistas placeholder simples (lista de documentos dummy sin acción; alerta de confirmación sin llamada real), explícitamente fuera de alcance funcional (ver Non-Goals).
4. **Los hooks reales (`useLocationTracking`, `useTelemetrySync`) no cambian de contrato.** `HomeScreen` y `TrackingScreen` reciben sus valores ya combinados vía props desde `App.tsx` (que sigue siendo el único lugar que invoca los hooks), evitando duplicar suscripciones o divergir el estado de tracking entre pantallas.
5. **Restyle del portal web es aditivo sobre lo existente, no una reescritura.** `MapView`, `AlertsPanel` y `ChatPanel` mantienen su lógica y props; solo cambian sus clases CSS y el markup envolvente (`App.tsx` gana un `FleetSummaryCard` arriba y un `VehicleRosterPanel`/`GloveboxCard` nuevos, reorganizando el grid) para no arriesgar regresiones en el streaming SSE, el chat o el mapa ya verificados end-to-end con Gemini.

## Risks / Trade-offs

- **[Riesgo] Confundir datos dummy con telemetría real** (ej. un evaluador podría pensar que el SOAT es un dato real del sistema) → **Mitigación:** la Guantera Digital y el roster de perfiles se documentan explícitamente en el README como datos de presentación/demo, separados visualmente (sección propia) de los paneles que sí muestran telemetría en vivo (mapa, alertas, tracking).
- **[Riesgo] El roster del portal con ~200 vehículos de k6 corriendo se vuelve ilegible** → **Mitigación:** el roster se limita a mostrar los vehículos con alerta activa o los N más relevantes (ej. los primeros por `vehicle_id` o los que tienen alerta), no una tabla de 200 filas; se define el límite exacto en tasks.md al implementar.
- **[Riesgo] Cambiar `App.tsx` de mobile de una pantalla a tabs rompe el flujo ya probado (tracking/sync)** → **Mitigación:** los hooks se reutilizan sin cambios de contrato (decisión 4); se re-ejecuta `npx tsc --noEmit` y se relanza `expo start` para confirmar que tracking/sync siguen funcionando antes de cerrar el change.
- **[Trade-off] Sin librería de navegación**, transiciones entre tabs no tienen animación nativa de stack — aceptable para 2 pantallas reales en un MVP; se documenta como recorte consciente igual que las demás decisiones de "no sumar dependencia" del proyecto.

## Migration Plan

No aplica migración de datos (cambio puramente de presentación en los clientes). Pasos de despliegue: reconstruir `frontend` en `docker compose up -d --build frontend` y relanzar `mobile` con `npx expo start` (el usuario lo hace en su otra terminal). Rollback: `git revert` del merge commit de este change, sin impacto en backend/datos.

## Open Questions

- Ninguna bloqueante. El límite exacto de filas del roster web y la lista concreta de perfiles/documentos dummy se resuelven en tasks.md durante la implementación.
