## 1. Vehicle_id conocido configurable por entorno

- [ ] 1.1 En `frontend/src/data/dummyVehicleProfiles.ts`, reemplazar `MOBILE_APP_DEFAULT_VEHICLE_ID` (constante hardcodeada) por lectura de `import.meta.env.VITE_MOBILE_VEHICLE_ID` con fallback a `'veh-mobile-1'`.
- [ ] 1.2 Actualizar el primer perfil de `DUMMY_VEHICLE_PROFILES` (`plate`) a `XYZ-123` para que coincida exactamente con `mobile/src/data/dummyVehicleProfile.ts` tras su última edición.
- [ ] 1.3 Agregar `VITE_MOBILE_VEHICLE_ID=veh-mobile-1` (valor genérico de ejemplo) a `frontend/.env.example`, con un comentario explicando qué es.
- [ ] 1.4 Agregar `VITE_MOBILE_VEHICLE_ID: xyz-123` al servicio `frontend` en `docker-compose.yml` (el valor real que usa el teléfono del usuario ahora mismo).
- [ ] 1.5 Actualizar el comentario cruzado en `mobile/src/data/dummyVehicleProfile.ts` para referenciar la variable de entorno en vez de `DEFAULT_VEHICLE_ID` hardcodeado.

## 2. Verificación

- [ ] 2.1 `npx tsc -b` en `frontend/` limpio.
- [ ] 2.2 `docker compose up -d --build frontend` y verificación visual en navegador (Playwright headless): enviar telemetría para `xyz-123`, confirmar en el roster que aparece como "Toyota Corolla XYZ-123" / "Julian Saldarriaga".

## 3. Cierre

- [ ] 3.1 Actualizar `README.md`: documentar `VITE_MOBILE_VEHICLE_ID` y el procedimiento a seguir cuando cambie el `vehicle_id` de la app móvil.
- [ ] 3.2 `openspec validate mobile-web-vehicle-id-config --strict` sin errores.
- [ ] 3.3 Commit en Conventional Commits.
- [ ] 3.4 `openspec archive mobile-web-vehicle-id-config` al cerrar.
