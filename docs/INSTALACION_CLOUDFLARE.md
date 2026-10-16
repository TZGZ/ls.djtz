# Instalación paso a paso — Windows / Cloudflare

Ejecuta los comandos en una terminal normal, sin permisos de administrador. Los bloques son compatibles con CMD y PowerShell, salvo indicación. Si PowerShell bloquea npm, usa CMD o sustituye `npm` por `npm.cmd` y `npx` por `npx.cmd`.

## 1. Preparar el proyecto

Descomprime el ZIP y mueve la carpeta del proyecto a `C:\Projects\DJ_TZ_Cloudflare`. Debe contener `package.json` directamente.

```bat
cd C:\Projects\DJ_TZ_Cloudflare
node --version
npm --version
git --version
npm ci
npm test
npm run typecheck
```

Si un comando de versiones falla, instala Node.js 24 LTS y Git desde sus sitios oficiales, cierra y abre la terminal. No subas `node_modules`, `.dev.vars`, bases ni tokens a GitHub.

## 2. Crear Cloudflare y D1

Crea tu cuenta en https://dash.cloudflare.com/ y activa Workers & Pages. Elige tu subdominio gratuito `workers.dev` cuando lo solicite.

```bat
npx wrangler login
npx wrangler whoami
npx wrangler d1 create dj-tz-db
```

Abre `wrangler.jsonc`. Conserva `binding: "DB"` y sustituye únicamente el UUID de ejemplo en `database_id` por el de la base creada. Puedes cambiar `name: "dj-tz"` antes de desplegar si necesitas otro nombre.

```bat
npm run db:remote
```

Acepta aplicar las migraciones. Esto crea la tabla `records`; la migración se registra y no debe repetirse manualmente con SQL. D1 local y D1 remota son bases diferentes.

## 3. Primera publicación, con staff bloqueado

```bat
npm run deploy
```

Wrangler entrega una URL como `https://dj-tz.TU-SUBDOMINIO.workers.dev`. Conserva la URL real. La portada será pública y el backend rechazará el acceso al staff mientras falten los valores de Access. Este paso no migra el sitio alojado anteriormente.

## 4. Configurar el correo de acceso

1. Abre Cloudflare Zero Trust desde tu cuenta; crea el nombre del equipo y selecciona el plan que desees (revisa condiciones y cuotas del gratuito).
2. Guarda el dominio del equipo, por ejemplo `mi-equipo.cloudflareaccess.com`.
3. En Settings / Authentication / Login methods (o Integrations / Identity providers, según la interfaz), habilita **One-time PIN**.
4. En **Access → Applications → Add application → Self-hosted**, crea `DJ TZ Staff`.
5. Agrega destinos públicos dentro de **la misma aplicación** con el hostname exacto de tu Worker y estas rutas:

| Hostname (ejemplo; sustituir) | Path |
|---|---|
| `dj-tz.TU-SUBDOMINIO.workers.dev` | `/staff` |
| `dj-tz.TU-SUBDOMINIO.workers.dev` | `/staff/*` |
| `dj-tz.TU-SUBDOMINIO.workers.dev` | `/api/*` |

La ruta `/staff` protege la entrada; el comodín cubre sus subrutas, incluida `/staff/access`. Si el formulario separa Path, introduce `staff`, `staff/*` y `api/*` sin repetir el hostname. No crees tres aplicaciones separadas: el código espera un único AUD. No protejas el hostname completo: la portada `/` y las fotografías deben seguir públicas. No actives protección global de todo el Worker.

6. Crea una política **Allow**, selector **Emails**, con tu correo y los correos exactos del staff. No uses `Everyone` ni `Bypass`.
7. Activa One-time PIN como proveedor para esta aplicación. Usa una duración de sesión razonable, por ejemplo 8 horas.
8. Guarda y copia el **Application Audience (AUD) Tag** de la aplicación.

Cloudflare enviará el código temporal cuando cada usuario solicite iniciar sesión. Dar de alta una persona en el catálogo de Personal NO le da acceso: requiere autorización en Access y en el siguiente paso.

## 5. Vincular Access con el servidor

En `wrangler.jsonc`, configura:

```json
"vars": {
  "ACCESS_TEAM_DOMAIN": "mi-equipo.cloudflareaccess.com",
  "ACCESS_AUD": "PEGA_AQUI_EL_AUD_REAL"
}
```

`ACCESS_TEAM_DOMAIN` no lleva `https://` ni `/` al final. El AUD y el dominio son identificadores de configuración, no contraseñas. No uses una clave API como AUD.

```bat
npx wrangler secret put STAFF_ALLOWED_EMAILS
```

Cuando el comando pida el valor, pega tus correos separados por coma:

```text
tu-correo@ejemplo.com,persona2@ejemplo.com
```

No copies esos correos al repositorio. La lista es exacta: no acepta comodines. Luego:

```bat
npm run deploy
```

## 6. Validar antes de compartir

1. En incógnito abre `/`: debe mostrar los paquetes y las fotos sin iniciar sesión.
2. Haz clic en Acceso staff: Cloudflare debe pedir el correo y el código temporal.
3. Con un correo autorizado entra al dashboard. La primera carga incorpora el catálogo una sola vez.
4. Crea personal y un evento de prueba. Selecciona paquete, horarios y anticipo. Recarga y comprueba que se conservan.
5. Intenta asignar el mismo personal a eventos que se traslapen: debe rechazarse.
6. Cierra sesión; vuelve a entrar al área privada y comprueba que se solicita acceso. Cloudflare puede reutilizar una sesión global todavía vigente; para dar de baja a alguien quítalo de ambas listas y revoca sus sesiones en Access.
7. En otra sesión, un correo no autorizado no debe entrar. Una petición sin JWT a `/api/records` debe recibir el desafío de Access o 401 del servidor, nunca registros.
8. Comprueba filtros de capacidad, WhatsApp, calendarios y vista móvil. Borra el evento de prueba.

Si aparece "Acceso no autorizado", comprueba ambas listas de correos. Si no reconoce la sesión, comprueba dominio, AUD, rutas y que todos los destinos pertenezcan a la misma aplicación. No desactives los controles para solucionarlo.

## 7. Subir a GitHub

Crea en GitHub un repositorio vacío, preferentemente privado, sin README automático. Sustituye la URL del ejemplo:

```bat
git init
git branch -M main
git add .
git status
git commit -m "DJ TZ adaptado a Cloudflare Workers D1 y Access"
git remote add origin https://github.com/TU_USUARIO/dj-tz-cloudflare.git
git push -u origin main
```

Antes de confirmar, revisa `git status`: no deben aparecer `.dev.vars`, tokens, respaldos ni `node_modules`. GitHub puede pedir autenticación mediante navegador; no uses la contraseña de tu cuenta como token.

## 8. Actualizaciones

La primera instalación usa Wrangler desde tu PC. GitHub no despliega por sí solo. Para actualizar después:

```bat
npm ci
npm test
npm run typecheck
npm run db:remote
npm run deploy
git add .
git commit -m "Actualiza DJ TZ"
git push
```

Opcional: en Cloudflare, conecta el Worker existente a GitHub desde Builds. Comando de compilación: `npm ci && npm test && npm run build`; comando de despliegue: `npx wrangler deploy`. Selecciona `main` y la carpeta que contiene `package.json`. Las migraciones nuevas deben aplicarse antes del despliegue con `npm run db:remote`; no quedan automatizadas en ese comando. Conserva el secreto `STAFF_ALLOWED_EMAILS` del Worker. Evita desplegar simultáneamente desde tu PC y Builds.

## 9. Prueba local y respaldo

```bat
copy .dev.vars.example .dev.vars
npm run db:local
npm run dev
```

Abre la dirección local que muestre Vite. El staff local permanece cerrado sin un JWT de Access válido; las pruebas automáticas cubren la autorización sin crear una puerta trasera. No pongas datos reales para probar el acceso local.

Antes de cambios importantes:

```bat
mkdir backups
npx wrangler d1 export DB --remote --output backups/dj-tz-respaldo.sql
```

Conserva el respaldo fuera del repositorio. Para consultar errores de producción:

```bat
npx wrangler tail
```

## Fuentes oficiales
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/workers/vite-plugin/get-started/
- https://developers.cloudflare.com/d1/reference/migrations/
