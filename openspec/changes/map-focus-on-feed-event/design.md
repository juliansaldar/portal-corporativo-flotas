## Context

`MapView` renderiza un `<MapContainer>` de `react-leaflet` con un `<Marker>` por vehículo en `vehicles` (estado en vivo vía SSE). `react-leaflet` solo usa las props `center`/`zoom` de `MapContainer` en el render inicial — cambiarlas después no mueve el mapa; el patrón estándar de la librería para paneo/zoom imperativo es un componente hijo que usa el hook `useMap()` dentro de un `useEffect`.

`VehicleEventFeedPanel` ya tiene todo el dato necesario (`lat`, `lon`, `speed_kmh`, `timestamp` por evento) vía `useVehicleEventFeed`; solo falta la interacción de click y un canal para comunicar la selección al mapa (hermano en el árbol de componentes, no padre/hijo directo).

## Goals / Non-Goals

**Goals:**
- Click en una fila del feed centra el mapa en esa posición y la resalta con un marcador distinto al de la posición actual del vehículo.
- El mapa sigue mostrando normalmente todos los demás marcadores de vehículos; el enfoque es aditivo, no un modo distinto.

**Non-Goals:**
- No se dibuja una línea/trail conectando los eventos del feed — un único punto enfocado a la vez.
- No se sincroniza el enfoque con el mapa si el usuario lo mueve manualmente después (no hay "volver a seguir"); es una acción puntual de "llévame ahí", no un modo de seguimiento continuo.

## Decisions

1. **Estado `focusedEvent` vive en `App.tsx`, no en `VehicleEventFeedPanel` ni en `MapView`.** Son hermanos en el árbol (ambos hijos de `App`), así que el estado compartido sube al ancestro común más cercano — mismo patrón ya usado para `selectedVehicleId` entre `VehicleRosterPanel` y `VehicleEventFeedPanel`.
2. **Componente interno `MapFocusController` (usa `useMap()`) dentro de `MapView`, no cambiar `center`/`zoom` de `MapContainer`.** Es el patrón estándar de `react-leaflet` para paneo imperativo; cambiar las props de `MapContainer` directamente no tiene efecto tras el render inicial.
3. **Marcador destacado adicional, no reemplaza los marcadores existentes.** Se renderiza un `<CircleMarker>` extra en la posición del evento enfocado con un estilo distinto (anillo de acento) y popup abierto automáticamente — el usuario sigue viendo dónde está el vehículo *ahora* junto con el punto histórico que clickeó.
4. **Deseleccionar el vehículo limpia `focusedEvent` automáticamente.** Si el usuario cambia de vehículo seleccionado en el roster, el enfoque del mapa del vehículo anterior ya no tiene sentido — se resetea junto con `selectedVehicleId` en el mismo manejador.

## Risks / Trade-offs

- **[Trade-off] Sin trail/ruta:** un usuario que quiera ver el recorrido completo del vehículo tendría que clickear evento por evento — aceptable para el alcance de este MVP (Non-Goal explícito).

## Migration Plan

Sin migración. Solo requiere reconstruir `frontend` (`docker compose up -d --build frontend`).

## Open Questions

Ninguna.
