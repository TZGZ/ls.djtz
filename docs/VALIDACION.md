# Validación de la adaptación

Fecha: 15 de octubre de 2026.

## Actualización: contratos y operación

- `npm test`: autorización, JWT, roles y pruebas con SQLite real para guardar eventos, preservar/redactar importes, reportes operativos con versiones, personal obligatorio, horarios con cambio de día, extracción de campos y similitud de paquetes.
- `npm run typecheck`: aprobado.
- `npm run test:browser`: aprobado con Edge sin interfaz, componentes aislados y datos sintéticos. Importación de PDF con texto, OCR de imagen, corrección del borrador antes del único guardado, personal obligatorio, controles financieros por rol, reportes, personalización pública y WhatsApp, navegación contraíble y barra fija. Capturas revisadas a 390 px y escritorio.
- Los documentos de prueba son sintéticos. No se ha validado la plantilla original del propietario: el contenido pegado es un volcado binario del PDF. Falta probar su archivo original para confirmar etiquetas y orden exactos.
- Los nuevos campos usan el JSON existente de `records`; no hay migración de esquema ni reescritura de eventos anteriores.
- Comando de navegador: `npm run test:browser`. Usa Edge instalado en Windows; en otros sistemas necesita Chromium de Playwright. La vista de pruebas vive en `tests/ui` y no forma parte de las rutas de producción ni altera Cloudflare Access.

## Actualización: administración de accesos

Roles publicados: Administrador, Editor y Solo lectura. Migración remota `0003_staff_roles.sql` aplicada. Las pruebas verifican lectura sin escrituras, bloqueo de importaciones para lectores, edición sin administración de cuentas, cambios de rol con la misma sesión y rechazo de roles inválidos. TypeScript y despliegue aprobados. El botón y flujo de contratos se mantienen pendientes de recibir el contrato original y confirmar la dirección del flujo (exportación o importación).

- Publicada en `https://ls.djtz.workers.dev`, con gestión exclusiva para la cuenta administradora desde Staff → Accesos.
- Migración remota `0002_staff_access.sql` aplicada; sin migraciones remotas pendientes.
- Pruebas y TypeScript aprobados después del cambio: listado y mutaciones solo para el administrador, protección de su cuenta, normalización exacta de correos, rechazo de escrituras desde otro origen y revocación en la siguiente solicitud de una sesión vigente.
- Compilación y despliegue reales completados. Portada e imagen pública responden 200; staff y API redirigen a Access sin sesión.
- Access autentica exclusivamente mediante One-time PIN; D1 decide los permisos operativos en cada solicitud. El secreto anterior no se usa para autorización.
- Pendiente: comprobación visual e inicio de sesión con el código del propietario; alta y baja de un segundo correo real en navegador.

El resto de este documento registra las comprobaciones históricas de la adaptación inicial.

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
