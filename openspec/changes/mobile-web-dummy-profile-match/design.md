## Context

`driver-experience-visual-refresh` decidió explícitamente mantener el dataset dummy como una constante local por cliente (no un servicio/paquete compartido) porque unificar un fixture de 6 campos entre un bundler Vite (frontend) y Metro (mobile, en un directorio de paquete npm distinto) era over-engineering para el alcance de este MVP. Esa decisión sigue siendo válida — el problema real no es *dónde vive el dato*, sino que la función de asignación del portal (`getVehicleProfile`, basada en hash) nunca garantizó que un `vehicle_id` *conocido y con significado especial* (el de la app móvil real del usuario) coincidiera con su propio perfil personalizado.

## Goals / Non-Goals

**Goals:**
- El vehículo que la app móvil reporta con su `vehicle_id` por defecto se ve, en el roster del portal, con el mismo nombre/placa que la propia app móvil muestra.
- El resto del roster (vehículos de la prueba de carga k6, cualquier otro `vehicle_id`) sigue con la asignación por hash existente, sin requerir un perfil dedicado por cada uno.

**Non-Goals:**
- No se crea un paquete/servicio compartido de datos dummy entre `frontend/` y `mobile/` — se mantiene la decisión ya tomada en `driver-experience-visual-refresh`.
- No se resuelve el caso general de que el usuario cambie el `vehicle_id` de la app móvil a un valor arbitrario por el input de texto — solo se garantiza la coincidencia para el `vehicle_id` **por defecto**, que es el que se usa a menos que el conductor lo edite explícitamente.

## Decisions

1. **Caso conocido explícito en `getVehicleProfile`, no una tabla de mapeo genérica `vehicle_id -> perfil`.** Se agrega una constante `MOBILE_APP_DEFAULT_VEHICLE_ID = 'veh-mobile-1'` en `dummyVehicleProfiles.ts` con un comentario que referencia literalmente `mobile/App.tsx`'s `DEFAULT_VEHICLE_ID` (el valor real que debe coincidir), y `getVehicleProfile` retorna el perfil de Julian Saldarriaga si `vehicleId === MOBILE_APP_DEFAULT_VEHICLE_ID`, antes de caer al hash para cualquier otro id. Una tabla de mapeo genérica sería prematura: hoy solo hay un caso real que necesita esta garantía.
2. **Comentario cruzado explícito en ambos archivos, no un test automatizado de sincronización.** Dado que los datos duplicados entre `frontend` y `mobile` son solo de presentación (no afectan comportamiento del sistema real), un comentario que apunte al archivo hermano es proporcional; un test cross-package que compare ambos módulos añadiría acoplamiento de build entre dos proyectos independientes por un beneficio marginal.
3. **El primer elemento de `DUMMY_VEHICLE_PROFILES` se reemplaza en vez de agregar un séptimo perfil.** Mantiene la lista en 6 perfiles (ya cubre sobradamente la variedad visual del roster) y evita que el perfil de Julian Saldarriaga aparezca dos veces (una vía hash accidental, otra vía el caso conocido) si el hash de algún otro `vehicle_id` cayera en un índice nuevo separado.

## Risks / Trade-offs

- **[Riesgo] El usuario cambia el `vehicle_id` de la app móvil en el input de texto** → el caso conocido deja de aplicar y el portal vuelve a mostrar un perfil por hash para el nuevo id — comportamiento aceptado (Non-Goal explícito), documentado en el comentario del código.
- **[Riesgo] `DEFAULT_VEHICLE_ID` cambia en `mobile/App.tsx` sin actualizar `dummyVehicleProfiles.ts`** → mitigado solo por el comentario cruzado (ver decisión 2); si esto se vuelve un problema recurrente, vale la pena reconsiderar un dataset compartido real.

## Migration Plan

Sin migración. Solo requiere reconstruir `frontend` (`docker compose up -d --build frontend`) para ver el cambio reflejado.

## Open Questions

Ninguna.
