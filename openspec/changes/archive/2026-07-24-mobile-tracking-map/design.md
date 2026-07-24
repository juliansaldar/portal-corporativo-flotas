## Context

`TrackingScreen.tsx` (agregado en `driver-experience-visual-refresh`) tiene un `View` con `backgroundColor` fijo simulando un mapa, un `pulseCircle` centrado con posición absoluta fija, y encima un bottom sheet con telemetría real (`lastEvent`, `isOnline`, `pendingCount`) y los controles reales de `useLocationTracking`/`useTelemetrySync`. El único dato real que el placeholder no usa es la posición GPS (`lastEvent.lat`/`lastEvent.lon`), que ya llega a `App.tsx` vía el callback de captura y se pasa como prop.

El proyecto ya resolvió este mismo problema en el portal web: `frontend/src/components/MapView.tsx` usa Leaflet + tiles de OpenStreetMap (sin API key, sin costo) via `react-leaflet`. React Native no tiene un equivalente directo de `react-leaflet` (es una librería DOM), pero sí puede embeber una página web con Leaflet dentro de un `WebView`.

Restricción dura confirmada con el usuario: la app se prueba en un iPhone físico con **Expo Go sin dev client**, ya verificado end-to-end (GPS real, cola offline, sync en bloque) en el change anterior. Cualquier librería que exija `expo prebuild`/EAS build/dev client queda descartada de entrada, sin importar qué tan superior sea en otros aspectos.

## Goals / Non-Goals

**Goals:**
- Reemplazar el placeholder por un mapa real que muestre la posición GPS actual del dispositivo con un marcador.
- Actualizar la posición del marcador cuando llega un nuevo evento de tracking, sin recargar el mapa completo (evita parpadeo/reset de zoom cada vez).
- Seguir funcionando en Expo Go sin build nativo custom.

**Non-Goals:**
- Sin tiles offline (el conductor necesita red para los tiles igual que para enviar telemetría — no es un requisito nuevo, ya se asume conectividad intermitente en el resto de la app).
- Sin dibujar el historial de recorrido (solo la posición actual, un único marcador).
- Sin controles de mapa adicionales (buscar dirección, capas, etc.) — son fuera de alcance de un MVP.

## Decisions

1. **`react-native-webview` + Leaflet embebido, no `react-native-maps` ni `expo-maps`.** Se evaluaron las tres:
   - `expo-maps`: requiere dev client (no funciona en Expo Go) — descartado de entrada por la restricción operativa.
   - `react-native-maps`: soporte en Expo Go "vanilla" para SDKs recientes es frágil/no garantizado, y en Android requiere una API key de Google Maps configurada en `app.json` — fricción de setup adicional (una cuenta de Google Cloud) que no se justifica para un MVP cuando ya existe una alternativa sin ese requisito.
   - `react-native-webview`: paquete ampliamente compatible con Expo Go sin plugins de config nativos, permite reutilizar exactamente Leaflet + OpenStreetMap — la misma librería y proveedor de tiles que ya está probado y funcionando en el portal web. Es la opción de menor riesgo y más consistente con el resto del proyecto.
2. **El HTML de Leaflet vive embebido en el código RN (string template), no un archivo estático servido por HTP.** Se carga con `source={{ html: ... }}` en el `WebView` — no depende de ningún servidor (ni siquiera del propio `ingestion-service`/`api-gateway`), solo de acceso a internet para los tiles de OpenStreetMap. Alternativa descartada: servir un HTML/JS bundle separado — complejidad innecesaria para una sola página estática.
3. **Actualizaciones de posición vía `injectJavaScript`, no recargando el `WebView`.** El componente `LeafletMapView` recibe `lat`/`lon`/`speedKmh` como props; en un `useEffect` que depende de esos valores, llama a `webviewRef.current.injectJavaScript(...)` para mover el marcador Leaflet ya existente (`marker.setLatLng(...)`) en vez de cambiar el `html` del `WebView` (que recargaría toda la página y perdería el estado de zoom/centro que el usuario haya elegido).
4. **Un único marcador, sin trail/polyline.** Consistente con el non-goal — mantiene el componente simple y evita crecer sin límite un array de puntos en el WebView.

## Risks / Trade-offs

- **[Riesgo] `react-native-webview` podría no funcionar en Expo Go para la versión de SDK usada (54)** → **Mitigación:** se verifica con `npx expo export --platform ios` (bundle limpio) y, fundamentalmente, pidiendo al usuario que confirme en su iPhone físico — mismo patrón de verificación ya usado para el resto de la app móvil en este proyecto. Si falla en vivo, la alternativa de respaldo documentada aquí es `react-native-maps` aceptando el requisito de API key de Google Maps en Android.
- **[Riesgo] Tiles de OpenStreetMap requieren conexión a internet activa** → aceptado como Non-Goal explícito; no es peor que el resto de la app (que ya requiere red para enviar telemetría).
- **[Trade-off] Un WebView es más pesado en memoria que un mapa nativo** → aceptable para un MVP con una sola pantalla de mapa activa a la vez (no hay múltiples mapas simultáneos en la app).

## Migration Plan

Sin migración de datos. Se agrega la dependencia, se reemplaza el placeholder, se reconstruye el bundle de Expo (`npx expo export` para verificación headless) y se pide al usuario reabrir la app en Expo Go para confirmar visualmente. Rollback: revertir el commit, sin impacto en backend/datos.

## Open Questions

Ninguna bloqueante — el riesgo principal (compatibilidad real con Expo Go) se resuelve con verificación en vivo, no con una decisión de diseño previa.
