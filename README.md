# DJ TZ — Cloudflare independiente

Proyecto completo: sitio público, imágenes originales, paquetes por capacidad, burbujas de selección, información de apartado, calendario anual/mensual, eventos, personal, anticipos y checklist.

Esta versión se instala en **tu propia cuenta de Cloudflare** con Workers + D1 + Access. Ya no depende del inicio de sesión de ChatGPT ni de Sites. GitHub guarda el código. No necesitas mantener encendida tu PC.

**Empieza en [docs/INSTALACION_CLOUDFLARE.md](docs/INSTALACION_CLOUDFLARE.md)**: incluye comandos para CMD/PowerShell, D1, Access, publicación y GitHub.

## Requisitos
- Node.js 22.13 o superior (recomendado Node 24 LTS), npm y Git.
- Cuenta Cloudflare con Workers, D1 y Zero Trust Access.
- Correos exactos autorizados del equipo.

## Comandos principales
```sh
npm ci
npm test
npm run typecheck
npm run db:local
npm run dev
```
La vista pública local funciona con D1 local. El staff exige un JWT válido de Access también en desarrollo: no existe usuario de prueba ni contraseña universal. La prueba interactiva de acceso se realiza en la URL real protegida por Access; no desactives la validación para probarla.

```sh
npx wrangler login
npx wrangler d1 create dj-tz-db
```
Coloca el UUID devuelto en `wrangler.jsonc`, campo `database_id`. Luego sigue la guía completa antes de abrir el dashboard.

## Qué contiene
- `app/`: interfaz, servidor y validación de identidad.
- `public/`: fotografías y recursos originales.
- `worker.ts`, `vite.config.ts`, `wrangler.jsonc`: ejecución independiente en Workers.
- `drizzle/`: migraciones de D1.
- `tests/`: autorización y validación criptográfica de JWT.
- `.dev.vars.example`: ejemplo para desarrollo, sin credenciales.
- `docs/`: instalación, mantenimiento y alcance.

## Estado y alcance
El catálogo inicial está incluido y se importa una sola vez al abrir el dashboard autorizado. La base nueva comienza sin eventos ni clientes; este ZIP **no es una copia de datos operativos de Sites**. Si ya registraste eventos allí, conserva el sitio anterior y solicita una migración/exportación de esos datos antes del cambio definitivo.

Todos los correos autorizados pueden administrar registros operativos. La cuenta administradora gestiona las altas y bajas de usuarios desde **Staff → Accesos**; consulta [Operación](docs/PRODUCCION.md). La firma de contratos se coordina como hasta ahora, fuera del sistema.

El costo depende del consumo y del plan elegido; no se garantiza gratuidad permanente. No hay conexión automática con tu cuenta ni despliegue realizado por descargar este ZIP.
