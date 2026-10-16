# Operación y alcance

La configuración independiente usa Workers, D1 y Cloudflare Access. El código verifica firma RS256, emisor, audiencia, vigencia e identidad del JWT; después aplica una lista exacta de correos. No confía en los encabezados de identidad de Sites. Si falta configuración o token, deniega acceso. Las escrituras requieren Origin del mismo sitio y JSON. Las rutas internas envían `Cache-Control: private, no-store`.

La cuenta administradora `edwintellez.eatg@gmail.com` gestiona los permisos desde **Staff → Accesos**. Puede consultar, agregar y retirar correos y asignar Editor o Solo lectura; su propio acceso está protegido. Las altas nuevas proponen Solo lectura y exigen un rol válido. Las cuentas existentes conservan Editor al aplicar la migración de roles. El registro de Personal es operativo y no concede acceso.

- Administrador: gestión de accesos y control operativo completo.
- Editor: consulta, creación, modificación y eliminación de registros operativos; no administra cuentas.
- Solo lectura: consulta de agenda, personal, paquetes y detalles, impresión y exportación de datos; las API rechazan sus escrituras y la importación del catálogo.

### Contratos, importes y operación

Nuevo evento incluye importación de PDF, JPG/PNG/WebP y texto. PDF.js lee el texto; Tesseract.js reconoce páginas escaneadas o fotografías en el dispositivo. El OCR descarga herramientas y datos de idioma desde su CDN la primera vez. El documento y su texto completo no se envían al servidor ni se guardan: solo se guardan los campos revisados cuando el usuario confirma Guardar cambios. Límites: 15 MB, 8 páginas y 100.000 caracteres de texto. PDF protegido, imágenes borrosas o etiquetas no reconocidas pueden requerir captura manual.

El formulario sigue la plantilla DJ TZ compartida como texto: servicio, domicilio/fecha/horario/tipo/teléfono, cliente, importes de las cláusulas, observaciones y anticipo/saldo; la coordinación y el staff quedan al final. El lector reconoce Horario y Tel. en líneas compartidas, Nombre de cliente, Servicio o Paquete Contratado, el costo de hora extra de la cláusula I y el total de la cláusula IV (incluida la separación can dad de OCR). Las líneas vacías no consumen cláusulas ni firmas. Importes desplazados sin etiqueta se advierten, no se asignan. Los cargos por ubicación quedan en notas privadas y no se suman automáticamente. Solo con anticipo y RESTAN explícitamente etiquetados se deduce el total y se pide confirmación. Se valida la coherencia entre total, anticipo y RESTAN al guardar. Se probó el texto de la plantilla y un PDF generado con datos sintéticos; falta comprobar el archivo firmado original con su extracción real. No se guarda un evento sin seleccionar personal. Si falta el tipo se usa EVENTO PRIVADO. Las llegadas base son tres horas antes a bodega y una hora antes al lugar, con fecha incluida y ajuste manual permitido.

Solo el administrador recibe total, anticipos, tarifas y notas de administración. Editor y Solo lectura reciben exclusivamente saldo pendiente; la proyección se aplica en el servidor, también para exportaciones. Las ediciones del editor conservan los importes existentes aunque intente enviar otros valores. Un evento nuevo creado por un editor queda con importe por confirmar hasta que lo complete administración.

Administrador y Editor pueden reportar carga, traslado, llegada, montaje, pago y cierre u horas extra. Solo lectura no escribe. El reporte Pagado no modifica anticipos ni saldos contables. Finalizado también marca el evento como finalizado. El historial conserva los últimos 60 reportes por evento y usa versión para rechazar cambios concurrentes obsoletos.

La personalización modifica una copia del equipo elegido, sin alterar el catálogo. La coincidencia exacta de artículos (independiente del orden, mayúsculas y acentos) toma el nombre del paquete correspondiente. Si hay diferencias usa la mayor similitud entre listas y agrega personalizado; no interpreta equivalencias semánticas ni calcula precios nuevos. Las cotizaciones personalizadas requieren revisión de administración.

La barra lateral se puede contraer y recuerda la preferencia en el navegador. La barra superior del staff permanece fija y mide 52 px, sin control para contraerla. El menú público también permanece fijo y compacto, con todos sus enlaces disponibles en móvil. Las tarjetas de paquetes tienen menos espacio interior y la imagen de complementos se muestra completa, sin ampliación ni recorte.

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
