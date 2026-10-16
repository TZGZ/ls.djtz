# Operación y alcance

La configuración independiente usa Workers, D1 y Cloudflare Access. El código verifica firma RS256, emisor, audiencia, vigencia e identidad del JWT; después aplica una lista exacta de correos. No confía en los encabezados de identidad de Sites. Si falta configuración o token, deniega acceso. Las escrituras requieren Origin del mismo sitio y JSON. Las rutas internas envían `Cache-Control: private, no-store`.

La cuenta administradora `edwintellez.eatg@gmail.com` gestiona los permisos desde **Staff → Accesos**. Puede consultar, agregar y retirar correos y asignar Editor o Solo lectura; su propio acceso está protegido. Las altas nuevas proponen Solo lectura y exigen un rol válido. Las cuentas existentes conservan Editor al aplicar la migración de roles. El registro de Personal es operativo y no concede acceso.

- Administrador: gestión de accesos y control operativo completo.
- Editor: consulta, creación, modificación y eliminación de registros operativos; no administra cuentas.
- Solo lectura: consulta de agenda, personal, paquetes y detalles, impresión y exportación de datos; las API rechazan sus escrituras y la importación del catálogo.

Los cambios de rol se verifican en D1 en cada solicitud, incluso con sesiones existentes. La interfaz refleja el rol recibido al cargar la página; recarga tras un cambio para actualizar los botones.

Cloudflare Access verifica la identidad con One-time PIN. La política de la aplicación permite el método de inicio de sesión OTP; la autorización operativa se decide en D1 (`staff_access`) en cada solicitud, después de verificar el JWT. Un correo verificado sin alta ve acceso no autorizado y recibe 403 en las API. El secreto antiguo `STAFF_ALLOWED_EMAILS` ya no se consulta. No hacen falta claves de la API de Cloudflare para gestionar usuarios.

Retirar un correo bloquea las siguientes solicitudes, incluso con un JWT todavía vigente. No borra información ya descargada ni registros operativos; una solicitud que ya estaba en curso puede finalizar. La cuenta administradora está definida en el servidor; cambiarla requiere un despliegue.

## Datos
- La base remota comienza vacía: los paquetes se importan una sola vez en el primer acceso autorizado.
- Se conserva el diseño y los archivos originales; no se incluyen clientes, eventos o pagos guardados en el alojamiento anterior.
- No borres la instancia anterior si necesitas recuperar su agenda.
- Los precios públicos se mantienen ocultos; las cotizaciones de eventos se registran internamente.
- Exporta D1 regularmente; la exportación de agenda de la interfaz no reemplaza un respaldo completo.

## Límites que se conservan
- Los permisos operativos dependen del rol. Solo la cuenta administradora gestiona accesos; no se incorpora editor visual completo.
- Firma de contrato y pagos coordinados fuera del sitio; no hay cobro bancario automático ni proveedor de firma electrónica integrado.
- Los cambios concurrentes sobre un mismo registro usan versión. La detección de traslapes es una validación de aplicación; dos creaciones simultáneas pueden superar esa comprobación. Coordina las reservas desde una persona hasta implementar bloqueo transaccional de agenda si hay varios operadores simultáneos.
- Vinext se conserva del proyecto original y está fijado en el archivo de dependencias; revisa futuras actualizaciones antes de aplicarlas.

## Publicación y costos
El ZIP está preparado para desplegarse, pero requiere los identificadores reales de tu cuenta, D1, la política Access y el secreto de correos. No se desplegó en tu cuenta durante la adaptación. Comprueba consumo y cuotas; el funcionamiento real dentro del plan gratuito debe medirse, en particular CPU del renderizado y autenticación.

Las vistas previas de versiones están desactivadas en Wrangler. Si habilitas otra URL o dominio, añade protección Access para sus rutas internas y vuelve a probar que el sitio público siga abierto. No registres JWT, códigos de correo o datos de clientes en logs.
