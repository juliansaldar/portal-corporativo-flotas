## 1. Alinear el dataset dummy del portal con la app móvil

- [ ] 1.1 En `frontend/src/data/dummyVehicleProfiles.ts`, reemplazar el primer perfil (`XYZ-123`/Juan Delgado/JD) por los datos exactos de `mobile/src/data/dummyVehicleProfile.ts` (`VIH-100`, Toyota Corolla, Julian Saldarriaga, JS) — los documentos ya son idénticos.
- [ ] 1.2 Agregar `MOBILE_APP_DEFAULT_VEHICLE_ID = 'veh-mobile-1'` con un comentario que referencie `mobile/App.tsx`'s `DEFAULT_VEHICLE_ID` como la fuente que debe coincidir.
- [ ] 1.3 `getVehicleProfile(vehicleId)`: devolver el perfil de Julian Saldarriaga si `vehicleId === MOBILE_APP_DEFAULT_VEHICLE_ID`, antes de caer al hash existente para cualquier otro id.
- [ ] 1.4 Agregar el comentario cruzado equivalente en `mobile/src/data/dummyVehicleProfile.ts` (referenciando `frontend/src/data/dummyVehicleProfiles.ts`) para que un cambio futuro en cualquiera de los dos lados sea visible al leer el otro.

## 2. Verificación

- [ ] 2.1 `npx tsc -b` en `frontend/` limpio.
- [ ] 2.2 Verificación visual en navegador (Playwright headless): enviar telemetría para `veh-mobile-1`, confirmar en el roster que aparece como "Toyota Corolla • VIH-100" / "Julian Saldarriaga", no el perfil anterior.

## 3. Cierre

- [ ] 3.1 `openspec validate mobile-web-dummy-profile-match --strict` sin errores.
- [ ] 3.2 Commit en Conventional Commits.
- [ ] 3.3 `openspec archive mobile-web-dummy-profile-match` al cerrar.
