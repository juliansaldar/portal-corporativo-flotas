## 1. Dataset dummy compartido en forma (no en código)

- [x] 1.1 Definir la forma del perfil dummy (placa, modelo, conductor, avatar/iniciales, lista de documentos con nombre/aseguradora/fecha de vencimiento) y escribir 4-6 perfiles de ejemplo en `frontend/src/data/dummyVehicleProfiles.ts`.
- [x] 1.2 Escribir un perfil dummy único (el del vehículo del conductor) en `mobile/src/data/dummyVehicleProfile.ts`, misma forma que 1.1.
- [x] 1.3 Escribir la función determinística de asignación `vehicle_id -> perfil` (hash simple sobre la lista de 1.1) usada por el roster web.

## 2. Portal web: resumen de flota y roster

- [x] 2.1 Componente `FleetSummaryCard`: conteo de activos/en alerta/velocidad promedio a partir de `vehicles` + `alerts` ya calculados en `App.tsx`.
- [x] 2.2 Componente `VehicleRosterPanel`: lista combinando telemetría real + perfil dummy (1.3), alertas primero, límite de filas visibles (definir N, ej. 8) con indicador de "+N más" si se trunca.
- [x] 2.3 Componente `GloveboxCard`: documentos dummy de un perfil de ejemplo con badge de "vence pronto" si la fecha simulada está a <30 días.
- [x] 2.4 Restyle de `MapView`, `AlertsPanel`, `ChatPanel` con las clases/tokens visuales del mockup (tarjetas redondeadas, badges, tipografía) reutilizando `theme.css` existente — sin tocar su lógica interna.
- [x] 2.5 Reordenar `App.tsx`/`App.css` para el nuevo layout (hero card arriba, roster + guantera + mapa/alertas/chat abajo) manteniendo responsividad.
- [x] 2.6 `npx tsc -b` limpio y verificación visual en navegador (Playwright headless, como en la sesión anterior): screenshot del nuevo dashboard, sin errores de consola.

## 3. Mobile: navegación y pantallas

- [x] 3.1 `mobile/src/navigation/BottomTabBar.tsx`: componente de presentación puro (4 items, `active`/`onSelect`), estilo del mockup.
- [x] 3.2 `mobile/src/screens/HomeScreen.tsx`: hero card de estado (tracking activo/detenido, `vehicle_id`, conectividad, pendientes) + guantera digital dummy (1.2), recibe todo por props desde `App.tsx`.
- [x] 3.3 `mobile/src/screens/TrackingScreen.tsx`: bottom sheet con última posición conocida, estado online/offline, pendientes, y los controles reales (iniciar/detener tracking, sincronizar ahora) — reutiliza las mismas props/callbacks que hoy usa `App.tsx`, sin nueva lógica de estado.
- [x] 3.4 Vistas placeholder `GloveboxScreen`/`SosScreen`: contenido estático o mensaje "Próximamente", sin llamadas de red.
- [x] 3.5 Reescribir `mobile/App.tsx` para orquestar hooks existentes + estado de tab activo, delegando el render a las pantallas de 3.2-3.4.
- [x] 3.6 `npx tsc --noEmit` limpio.
- [x] 3.7 Verificado en este entorno: `npx expo export --platform android` empaqueta 616 módulos sin errores (mismo método usado en `driver-mobile-app`, sin simulador/dispositivo disponible aquí). Pendiente que el usuario confirme en su terminal con `npx expo start` + Expo Go que el tracking/sync real siguen funcionando con las nuevas pantallas.

## 4. Cierre

- [x] 4.1 Actualizar `README.md`: mencionar el nuevo roster/guantera dummy como datos de presentación (no confundir con telemetría real) y las nuevas pantallas de la app móvil.
- [x] 4.2 `openspec validate driver-experience-visual-refresh --strict` sin errores.
- [ ] 4.3 Commits en Conventional Commits por grupo de tareas completado; merge a `main` cuando el change esté verificado.
- [ ] 4.4 `openspec archive driver-experience-visual-refresh` al cerrar.
