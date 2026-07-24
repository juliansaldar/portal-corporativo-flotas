## Why

El portal web y la app móvil son funcionalmente correctos pero visualmente crudos: el portal es un mapa + dos paneles sin jerarquía visual más allá del tema de colores, y la app móvil es una única pantalla de formulario plano (sin navegación, sin las pantallas de conductor que pide el bloque D del PDF). El cliente entregó un mockup (`info/simon_app_mockup_preview.html`) con un lenguaje visual ya validado — mismos colores de marca que ya usa el portal (`#00FFC2`/`#19B5FF`, dark theme) — que muestra cómo debería sentirse un producto de este tipo: una tarjeta de estado destacada, acciones rápidas, documentos del vehículo (guantera digital) y un flujo de rastreo con detalle por vehículo. Adoptar ese lenguaje visual en ambos clientes, con datos vehiculares dummy que llenen los huecos que la telemetría real de la simulación no cubre (placa, modelo, SOAT, conductor, viajes), hace que el MVP se sienta como un producto terminado en vez de un panel de depuración — sin inventar funcionalidad de backend que no existe.

## What Changes

- **`frontend/` (portal web):** se agrega una tarjeta de estado de flota estilo "hero card" (resumen: vehículos activos, en alerta, promedio de velocidad), un panel de "roster" de vehículos con datos de presentación dummy (placa, modelo, conductor, foto/avatar) fusionados con la telemetría real ya existente, y una tarjeta de "Guantera Digital" con documentos dummy (SOAT, tecnomecánica) y su vencimiento simulado. El mapa, el panel de alertas y el chat existentes se conservan pero se restylean con el nuevo lenguaje visual (tarjetas redondeadas, iconografía, jerarquía tipográfica del mockup).
- **`mobile/` (app del conductor):** se reemplaza la pantalla única de formulario por dos pantallas navegables con una barra inferior (Inicio, Rastreo, Guantera, SOS — estilo del mockup): **Inicio** replica la hero card del mockup (estado de tracking real: activo/detenido, último evento enviado) más acciones rápidas y guantera digital con datos dummy; **Rastreo** replica la pantalla de mapa del mockup con un bottom sheet mostrando la telemetría real del dispositivo (última posición, estado online/offline, pendientes por sincronizar) y los controles reales ya existentes (iniciar/detener tracking, sincronizar ahora). "Guantera" y "SOS" en la navbar son vistas placeholder explícitas (sin funcionalidad de backend), consistente con el alcance de un MVP.
- Ambos clientes usan un pequeño dataset dummy local (placa, modelo, conductor, documentos, vencimientos) — sin nuevos endpoints de backend; la telemetría real (posición, velocidad, estado de zona/tracking) sigue viniendo de los servicios existentes y nunca se mezcla con datos inventados de forma ambigua para el usuario.

## Capabilities

### New Capabilities
_Ninguna — no se introduce un dominio o servicio nuevo, solo presentación._

### Modified Capabilities
- `web-portal-dashboard`: se agregan requirements de presentación (resumen de flota, roster de vehículos con perfil dummy, guantera digital) y de restyling del mapa/alertas/chat existentes con el lenguaje visual del mockup.
- `driver-mobile-app`: se agregan requirements de UI (navegación por pestañas, pantalla Inicio, pantalla Rastreo con bottom sheet) que antes no existían — la app pasa de una pantalla de formulario a la experiencia de conductor descrita en el bloque D del PDF, sin alterar los requirements ya archivados de captura/cola offline/sync/CI.

## Impact

- Código nuevo/modificado: `frontend/src/components/*` (nuevos: `FleetSummaryCard`, `VehicleRosterPanel`, `GloveboxCard`; restyle de `MapView`, `AlertsPanel`, `ChatPanel`), `frontend/src/data/dummyVehicleProfiles.ts`, `frontend/src/theme.css`/`App.css`.
- `mobile/App.tsx` se reorganiza en `mobile/src/screens/{HomeScreen,TrackingScreen}.tsx` + `mobile/src/navigation/BottomTabBar.tsx` + `mobile/src/data/dummyVehicleProfile.ts`; hooks existentes (`useLocationTracking`, `useTelemetrySync`) se reutilizan sin cambios de contrato.
- No afecta `backend/`, `infra/`, `load-testing/` ni el modelo de dominio de vehículos — es un cambio de presentación en los dos clientes.
