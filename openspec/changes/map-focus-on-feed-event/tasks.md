## 1. Estado compartido en App.tsx

- [ ] 1.1 Agregar estado `focusedEvent: TelemetryEvent | null` en `App.tsx`.
- [ ] 1.2 `handleSelectVehicle` limpia `focusedEvent` (`setFocusedEvent(null)`) además de actualizar `selectedVehicleId`.
- [ ] 1.3 Pasar `focusedEvent`/`onFocusEvent` a `VehicleEventFeedPanel` y `focusedEvent` a `MapView`.

## 2. Feed clickeable

- [ ] 2.1 `VehicleEventFeedPanel`: cada `<li>` recibe `onClick` que llama `onFocusEvent(event)`, o `onFocusEvent(null)` si ya era el seleccionado (toggle, mismo patrón que `VehicleRosterPanel`).
- [ ] 2.2 Clase `feed-row--selected` (borde de acento) para la fila actualmente enfocada.

## 3. Mapa reacciona al enfoque

- [ ] 3.1 `MapView` recibe prop `focusedEvent: TelemetryEvent | null`.
- [ ] 3.2 Componente interno `MapFocusController` (usa `useMap()` de react-leaflet) con `useEffect` sobre `[focusedEvent]` que hace `map.flyTo([lat, lon], 16)` cuando no es null.
- [ ] 3.3 `<CircleMarker>` adicional en la posición de `focusedEvent` (estilo distinto a los marcadores de vehículo, ej. anillo de acento) con `<Popup>` mostrando hora y velocidad, abierto automáticamente.

## 4. Verificación

- [ ] 4.1 `npx tsc -b` en `frontend/` limpio.
- [ ] 4.2 Verificación visual en navegador (Playwright headless): seleccionar un vehículo, click en una fila del feed, confirmar que el mapa se centra y aparece el marcador destacado; click de nuevo confirma que desaparece.

## 5. Cierre

- [ ] 5.1 `openspec validate map-focus-on-feed-event --strict` sin errores.
- [ ] 5.2 Commit en Conventional Commits.
- [ ] 5.3 `openspec archive map-focus-on-feed-event` al cerrar.
