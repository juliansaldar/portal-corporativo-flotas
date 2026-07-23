## 1. Backend: endpoint de ingesta en bloque

- [x] 1.1 Implementar `POST /v1/telemetry/bulk` en `ingestion-service` (reutiliza validación/publicación/dedup existentes por evento)
- [x] 1.2 Test: lote con un evento ya procesado antes no lo duplica; los nuevos sí se publican — verificado además en vivo contra Docker (`veh-mobile-1` llegó correctamente vía `/v1/telemetry/bulk`)

## 2. Scaffold de la app

- [x] 2.1 Crear proyecto Expo (TypeScript) en `mobile/`
- [x] 2.2 Pantalla simple: configurar `vehicle_id`, botón iniciar/detener tracking, indicador online/offline y contador de eventos pendientes

## 3. Captura y cola offline-first

- [x] 3.1 Servicio de ubicación (`expo-location`, `watchPositionAsync`) que genera un evento de telemetría por posición
- [x] 3.2 Cola SQLite (`expo-sqlite`): tabla `pending_telemetry`, insertar cada evento capturado antes de intentar enviarlo
- [x] 3.3 Envío inmediato si hay red; si falla o no hay red, el evento queda marcado como pendiente

## 4. Sincronización en bloque

- [x] 4.1 Listener de conectividad (`@react-native-community/netinfo`) que detecta la transición offline→online
- [x] 4.2 Al reconectar (o al presionar "sincronizar ahora"), enviar todos los eventos pendientes en un único `POST /v1/telemetry/bulk` y marcarlos como sincronizados solo si la respuesta es exitosa

## 5. CI/CD

- [x] 5.1 Workflow `.github/workflows/mobile-ci.yml`: instala dependencias, corre type-check en cada push a `mobile/`
- [x] 5.2 Job de build documentado vía EAS (`eas build`), gateado por secret `EXPO_TOKEN` ausente — no se ejecuta un build real

## 6. Verificación funcional

- [ ] 6.1 **No verificable en este entorno**: no hay simulador iOS/Android ni Expo Go disponibles en este contenedor headless. Se verificó en su lugar: `npx tsc --noEmit` sin errores, y `npx expo export --platform ios` bundlea los 642 módulos sin fallos (confirma que todo el grafo de imports resuelve correctamente). Pendiente de correr en un dispositivo/simulador real por el usuario.
- [ ] 6.2 No verificable en este entorno (requiere dispositivo real para simular modo avión). Cubierto a nivel de diseño: cada evento se inserta en SQLite antes de intentar el envío (ver `useTelemetrySync.recordEvent`), por lo que la pérdida de red no puede perder el evento.
- [x] 6.3 El extremo backend de la sincronización en bloque sí se verificó en vivo: `POST /v1/telemetry/bulk` con 2 eventos → `202` → visibles en `GET /internal/vehicles/state`.
