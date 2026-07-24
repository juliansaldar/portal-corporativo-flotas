## Why

El panel "Envíos en vivo" (`VehicleEventFeedPanel`) muestra cada evento crudo de telemetría (hora, lat/lon, velocidad) para el vehículo seleccionado, pero es una lista de solo texto — no hay forma de ver *dónde* ocurrió un envío puntual sin leer las coordenadas y buscarlas mentalmente en el mapa. El mapa (`MapView`) solo muestra la posición *actual* de cada vehículo; no tiene ningún concepto de "mirar un punto específico del historial reciente".

## What Changes

- `frontend/src/App.tsx`: nuevo estado `focusedEvent` (el evento del feed seleccionado, o `null`).
- `frontend/src/components/VehicleEventFeedPanel.tsx`: cada fila del feed pasa a ser clickeable; click la selecciona (y la marca visualmente), click de nuevo sobre la misma la deselecciona — mismo patrón ya usado en `VehicleRosterPanel`.
- `frontend/src/components/MapView.tsx`: recibe el evento enfocado y (a) centra/hace zoom el mapa a esa posición sin recargar el resto de marcadores, (b) muestra un marcador destacado (visualmente distinto a los marcadores de posición actual) en ese punto, con popup de hora/velocidad.
- Deseleccionar el vehículo o seleccionar otro limpia el enfoque del mapa.

## Capabilities

### New Capabilities
_Ninguna._

### Modified Capabilities
- `web-portal-dashboard`: se agrega el requirement de enfocar el mapa desde una fila del feed de telemetría en vivo.

## Impact

- Código modificado: `App.tsx`, `VehicleEventFeedPanel.tsx`, `MapView.tsx`, `App.css` (estilos de fila seleccionada y marcador destacado). No afecta `backend/`, `mobile/`, ni el resto del portal.
