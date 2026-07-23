## Why

El Bloque D del PDF pide una app móvil para conductores que capture coordenadas y funcione offline-first, más CI/CD de despliegue. Ningún cliente móvil existe todavía; el resto de la flota de servicios (`ingestion-service`, `api-gateway`, `frontend`) ya está en pie y solo falta este productor de telemetría real.

## What Changes

- Nueva app Expo/React Native en `mobile/`: pantalla simple para elegir/fijar `vehicle_id`, botón de iniciar/detener tracking, indicador de estado (online/offline, eventos pendientes de sincronizar).
- **Captura de ubicación** (`expo-location`) en background ligero (foreground tracking, intervalo configurable).
- **Cola offline-first en SQLite** (`expo-sqlite`): cada posición capturada se guarda localmente primero; si hay red, se envía de inmediato; si no, queda marcada como pendiente.
- **Sincronización en bloque al reconectar** (`@react-native-community/netinfo` detecta el cambio de conectividad): todos los eventos pendientes se envían en una sola petición a un nuevo endpoint `POST /v1/telemetry/bulk` en `ingestion-service`.
- **CI/CD**: workflow de GitHub Actions (`.github/workflows/mobile-ci.yml`) que instala dependencias, tipa y linta en cada push; un job de build vía EAS (`eas build`) documentado y gateado por un secret (`EXPO_TOKEN`) — no se ejecuta un build real de tienda en esta entrega (requeriría cuentas Apple/Google que no aplican a un MVP de portafolio evaluado en 8-12h).

## Capabilities

### New Capabilities
- `driver-mobile-app`: la app móvil en sí (captura, cola offline, UI mínima) y su pipeline de CI/CD.

### Modified Capabilities
- `telemetry-ingestion`: se añade `POST /v1/telemetry/bulk` para recibir un lote de eventos en una sola petición (en vez de N peticiones individuales), que es lo que la app usa al reconectar. Reutiliza la misma validación/publicación/dedup ya existente por evento — al ser idempotente por `event_id`, reintentar un lote parcialmente fallido es seguro.

## Impact

- Código nuevo: `mobile/` (completo — Expo, TypeScript).
- Modifica: `backend/ingestion-service/app/interface/http.py` (nuevo endpoint bulk).
- Infraestructura: `.github/workflows/mobile-ci.yml`.
- Sin dependencias de pago; EAS Build tiene un free tier suficiente para documentar el flujo sin ejecutarlo.
