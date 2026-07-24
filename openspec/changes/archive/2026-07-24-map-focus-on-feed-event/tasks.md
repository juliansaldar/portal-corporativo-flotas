## 1. Estado compartido en App.tsx

- [x] 1.1 Agregar estado `focusedEvent: TelemetryEvent | null` en `App.tsx`.
- [x] 1.2 `handleSelectVehicle` limpia `focusedEvent` (`setFocusedEvent(null)`) además de actualizar `selectedVehicleId`.
- [x] 1.3 Pasar `focusedEvent`/`onFocusEvent` a `VehicleEventFeedPanel` y `focusedEvent` a `MapView`.

## 2. Feed clickeable

- [x] 2.1 `VehicleEventFeedPanel`: cada `<li>` recibe `onClick` que llama `onFocusEvent(event)`, o `onFocusEvent(null)` si ya era el seleccionado (toggle, mismo patrón que `VehicleRosterPanel`).
- [x] 2.2 Clase `feed-row--selected` (borde de acento) para la fila actualmente enfocada.

## 3. Mapa reacciona al enfoque

- [x] 3.1 `MapView` recibe prop `focusedEvent: TelemetryEvent | null`.
- [x] 3.2 Componente interno `MapFocusController` (usa `useMap()` de react-leaflet) con `useEffect` sobre `[focusedEvent]` que hace `map.flyTo([lat, lon], 16)` cuando no es null.
- [x] 3.3 `<CircleMarker>` adicional en la posición de `focusedEvent` (estilo distinto a los marcadores de vehículo, ej. anillo de acento) con `<Popup>` mostrando hora y velocidad, abierto automáticamente.

## 4. Verificación

- [x] 4.1 `npx tsc -b` en `frontend/` limpio.
- [x] 4.2 Verificación visual en navegador (Playwright headless): seleccionar un vehículo, click en una fila del feed, confirmar que el mapa se centra y aparece el marcador destacado; click de nuevo confirma que desaparece. Confirmado (popup "Envío enfocado" visible, fila resaltada, toggle-off limpia todo, 0 errores de consola).

## 5. Cierre

- [x] 5.1 `openspec validate map-focus-on-feed-event --strict` sin errores.
- [x] 5.2 Commit en Conventional Commits.
- [x] 5.3 `openspec archive map-focus-on-feed-event` al cerrar.
