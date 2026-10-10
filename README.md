# Bootcamp UCV · Hackathon de Salud Mental con IA

Plantilla del equipo.

1. Abre este repo con **Code > Codespaces > Create codespace on main**.
2. En el Codespace, abre el panel de Claude Code y escribe tus pedidos.
3. Para publicar: pídele a Claude «Guarda y publica mis cambios».

## MINDNOVA · Bienestar estudiantil

Plataforma con React + Vite + TypeScript, Tailwind CSS, Supabase (opcional) y funciones serverless de Vercel. Todos los datos son ficticios.

### Desarrollo

```bash
npm install
npm run dev
```

### Pruebas

```bash
npm run typecheck   # TypeScript
npm test            # pruebas unitarias y de componentes (Vitest)
npm run test:e2e    # flujo en navegador (Playwright, escritorio y móvil)
```

Para `test:e2e` la primera vez, instala Chromium con `npx playwright install chromium`.

### Supabase (opcional)

Sin credenciales, la app usa datos de demostración locales y no necesita nada más.

1. En el panel de Supabase, abre el SQL Editor y ejecuta en este orden:
   - `supabase/migrations/20261009120000_mindnova_esquema.sql` (tablas, RLS y permisos).
   - `supabase/seed.sql` (catálogo y horario de demostración; se puede repetir sin duplicar).
   - Opcional, para comprobar las políticas: `supabase/tests/politicas_rls.sql` (termina con ROLLBACK).
2. Copia la URL del proyecto y la clave **publicable** (o anon) en `.env.local` o en las variables de Vercel:
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Nunca pongas la clave `service_role` ni `sb_secret_...` en ninguna variable `VITE_`.

Qué se guarda en Supabase: solo el catálogo y el horario de demostración, en modo solo lectura para el público.
Los cambios personales (horarios, preferencias, avisos) se quedan en el navegador hasta que exista autenticación real.

### Despliegue en Vercel

1. Importa el repositorio en Vercel. El framework se detecta desde `vercel.json` (Vite, salida `dist`).
2. Configura las variables de `.env.example` en Project Settings > Environment Variables.
3. Cada push a la rama principal genera un despliegue nuevo.

### Acceso demostrativo

La bienvenida lleva al formulario de inicio de sesión en `/login`. Por ahora el ingreso es directo: abre el perfil ficticio de Sofía Gonzales sin validar el correo ni la contraseña, y no se conecta a sistemas universitarios.


