# Validación de la adaptación

Fecha: 15 de octubre de 2026.

Comprobaciones completadas en Node.js 24.19.0:
- Instalación de dependencias y consistencia del package-lock (`npm ci --dry-run`).
- `npm test`: denegación anónima, lista de correos, bloqueo antes de consultar D1, origen de escrituras, proyección pública sin campos privados, firma RS256, audiencia, emisor y caducidad de JWT.
- `npm run typecheck`: sin errores.
- `npm run deploy:check`: compilación y `wrangler deploy --dry-run` correctos; no publica. Bundle Worker comprimido aproximadamente 234 KiB.
- `npm run db:local`: ambas migraciones aplicadas correctamente sobre D1 local.

Pendiente en la cuenta del propietario:
- Crear D1 remota y configurar los valores reales.
- Configurar Access y verificar recepción del código por correo, entrada, salida y denegación a terceros en navegador.
- Validar creación/edición de eventos, persistencia remota, calendario y presentación móvil.
- Medir consumo real del plan contratado.

No se realizó despliegue externo ni prueba visual en navegador durante esta adaptación. No se exportaron datos operativos del sitio anterior.
