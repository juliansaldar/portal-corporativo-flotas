## Why

La pantalla de Rastreo de la app móvil muestra hoy un placeholder estático (un fondo de grid dibujado con CSS y un círculo pulsante fijo en el centro) en vez de un mapa real — funciona visualmente pero no representa la posición GPS real del vehículo. El bloque D del PDF ("Ecosistema Móvil") espera una experiencia de conductor creíble, y el resto de la pantalla (bottom sheet con telemetría real, controles de tracking) ya es funcional; el mapa es el único elemento que sigue siendo decorativo.

## What Changes

- **`mobile/src/screens/TrackingScreen.tsx`**: el placeholder estático se reemplaza por un mapa real (Leaflet + tiles de OpenStreetMap, vía `react-native-webview`) que muestra la posición GPS actual del dispositivo con un marcador, actualizado cada vez que llega un nuevo evento de tracking — sin recargar el mapa completo en cada actualización.
- Se agrega la dependencia `react-native-webview` (Expo Go compatible, sin dev client ni build nativo).
- El bottom sheet de telemetría (velocidad, conexión, pendientes, controles iniciar/detener tracking, sincronizar ahora) no cambia.

## Capabilities

### New Capabilities
_Ninguna._

### Modified Capabilities
- `driver-mobile-app`: se agrega el requirement de mostrar un mapa real con la posición del dispositivo en la pantalla de Rastreo (hoy la capability solo cubre captura/cola/sync/CI, no la presentación de un mapa).

## Impact

- Código nuevo/modificado: `mobile/src/screens/TrackingScreen.tsx` (reemplaza el placeholder), `mobile/src/components/LeafletMapView.tsx` (nuevo, wrapper de `react-native-webview` con el HTML de Leaflet embebido), `mobile/package.json` (nueva dependencia).
- No afecta `backend/`, `frontend/`, `infra/`, `load-testing/`.
- No afecta la lógica real de tracking/sync (`useLocationTracking`, `useTelemetrySync`) ni su contrato — el mapa solo consume `lastEvent`, ya disponible en `App.tsx`.
- Riesgo operativo principal: confirmar que `react-native-webview` efectivamente funciona en Expo Go "vanilla" en el iPhone físico del usuario (mismo dispositivo donde ya se verificó tracking/sync reales) — ver design.md.
