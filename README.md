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
cp .env.example .env.local   # opcional; sin variables, la app usa datos demo
npm run dev
```

### Pruebas

```bash
npm run typecheck   # TypeScript
npm test            # pruebas unitarias y de componentes (Vitest)
npm run test:e2e    # flujo en navegador (Playwright, escritorio y móvil)
```

Para `test:e2e` la primera vez, instala Chromium con `npx playwright install chromium`.

### Despliegue en Vercel

1. Importa el repositorio en Vercel. El framework se detecta desde `vercel.json` (Vite, salida `dist`).
2. Configura las variables de `.env.example` en Project Settings > Environment Variables.
3. Cada push a la rama principal genera un despliegue nuevo.

### Cuentas de demostración

Correos `@universidad-demo.edu` (por ejemplo `ana.torres@universidad-demo.edu`) con la contraseña `MindNova2026`. La autenticación es simulada y no se conecta a sistemas universitarios.


