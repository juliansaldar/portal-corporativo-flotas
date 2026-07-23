## 1. Backend: endpoint de ingesta en bloque

- [ ] 1.1 Implementar `POST /v1/telemetry/bulk` en `ingestion-service` (reutiliza validación/publicación/dedup existentes por evento)
- [ ] 1.2 Test: lote con un evento ya procesado antes no lo duplica; los nuevos sí se publican

## 2. Scaffold de la app

- [ ] 2.1 Crear proyecto Expo (TypeScript) en `mobile/`
- [ ] 2.2 Pantalla simple: configurar `vehicle_id`, botón iniciar/detener tracking, indicador online/offline y contador de eventos pendientes

## 3. Captura y cola offline-first

- [ ] 3.1 Servicio de ubicación (`expo-location`, `watchPositionAsync`) que genera un evento de telemetría por posición
- [ ] 3.2 Cola SQLite (`expo-sqlite`): tabla `pending_telemetry`, insertar cada evento capturado antes de intentar enviarlo
- [ ] 3.3 Envío inmediato si hay red; si falla o no hay red, el evento queda marcado como pendiente

## 4. Sincronización en bloque

- [ ] 4.1 Listener de conectividad (`@react-native-community/netinfo`) que detecta la transición offline→online
- [ ] 4.2 Al reconectar (o al presionar "sincronizar ahora"), enviar todos los eventos pendientes en un único `POST /v1/telemetry/bulk` y marcarlos como sincronizados solo si la respuesta es exitosa

## 5. CI/CD

- [ ] 5.1 Workflow `.github/workflows/mobile-ci.yml`: instala dependencias, corre type-check/lint en cada push a `mobile/`
- [ ] 5.2 Job de build documentado vía EAS (`eas build`), gateado por secret `EXPO_TOKEN` ausente — no se ejecuta un build real

## 6. Verificación funcional

- [ ] 6.1 Correr la app en el simulador/Expo Go, capturar posiciones con el backend arriba, confirmar que llegan a `ingestion-service`
- [ ] 6.2 Simular pérdida de red (modo avión), confirmar que los eventos quedan en la cola local y no se pierden
- [ ] 6.3 Restaurar la red, confirmar que se sincronizan en un único request `bulk` y aparecen en `GET /internal/vehicles/state`
