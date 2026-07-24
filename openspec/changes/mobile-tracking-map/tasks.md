## 1. Dependencia y componente de mapa

- [x] 1.1 Agregar `react-native-webview` a `mobile/package.json` (versión compatible con Expo SDK 54, revisar con `npx expo install react-native-webview` para que Expo resuelva la versión correcta).
- [x] 1.2 `mobile/src/components/LeafletMapView.tsx`: wrapper de `WebView` con HTML de Leaflet + tiles OSM embebido (mismo estilo visual oscuro que el resto de la app). Props: `lat`, `lon`, `speedKmh` (opcional, para el popup/label del marcador).
- [x] 1.3 Actualización de posición vía `injectJavaScript` en un `useEffect([lat, lon])`, sin recargar el `source.html` del WebView.
- [x] 1.4 Manejar el caso sin posición todavía (`lat`/`lon` null): mostrar el mapa centrado en una vista por defecto sin marcador.

## 2. Integración en TrackingScreen

- [x] 2.1 Reemplazar el placeholder estático (`mapPlaceholder`/`pulseCircle`/`carDot`) en `mobile/src/screens/TrackingScreen.tsx` por `LeafletMapView`, pasando `lastEvent?.lat`/`lastEvent?.lon`/`lastEvent?.speed_kmh`.
- [x] 2.2 Conservar el `searchPill` superior y el `bottomSheet` con telemetría/controles exactamente igual (sin cambios de props ni lógica).

## 3. Verificación

- [x] 3.1 `npx tsc --noEmit` limpio.
- [x] 3.2 `npx expo export --platform ios` bundle limpio (mismo método de verificación headless ya usado en este proyecto). 626 módulos, sin errores.
- [ ] 3.3 Verificación en vivo pedida al usuario: reabrir la app en su iPhone físico vía Expo Go, confirmar que el mapa carga, muestra la posición real, y el marcador se mueve al capturar una nueva posición sin recargar el mapa.

## 4. Cierre

- [x] 4.1 Actualizar `README.md` (sección de la app móvil / decisiones) mencionando el mapa real y la elección de `react-native-webview` sobre `react-native-maps`/`expo-maps`.
- [ ] 4.2 `openspec validate mobile-tracking-map --strict` sin errores.
- [ ] 4.3 Commits en Conventional Commits.
- [ ] 4.4 `openspec archive mobile-tracking-map` al cerrar.
