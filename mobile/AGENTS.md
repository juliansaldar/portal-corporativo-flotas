# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# App del conductor — reglas específicas

Ver `AGENTS.md` en la raíz del repo para las reglas generales del proyecto. Aquí, lo específico de este paquete:

- Offline-first no es opcional: toda posición capturada se persiste primero en la cola SQLite (`pending_telemetry`), y solo después se intenta enviar. Nunca al revés.
- Sincronización en bloque: al reconectar, un único `POST /v1/telemetry/bulk` con todos los eventos pendientes — no un loop de peticiones individuales.
- Foreground tracking únicamente (sin `expo-task-manager`/background real) — decisión documentada en `openspec/changes/archive/*-driver-mobile-app/design.md`.
- Sin credenciales de Apple/Google ni build real de EAS en este repo — el workflow de CI/CD se documenta, no se ejecuta.
