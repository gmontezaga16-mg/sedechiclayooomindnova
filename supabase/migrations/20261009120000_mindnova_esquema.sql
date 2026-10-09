-- MINDNOVA · esquema, políticas RLS y permisos.
-- Solo datos ficticios de demostración. No guardar aquí historia clínica ni datos personales reales.
-- Ejecutar en el SQL Editor de Supabase o con `supabase db push`.

-- ---------------------------------------------------------------------------
-- Catálogo de actividades: lectura pública, sin escritura desde la app.
-- ---------------------------------------------------------------------------
create table if not exists public.catalogo_actividades (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  titulo text not null check (char_length(titulo) between 1 and 80),
  interes text not null check (interes in ('arte', 'gym', 'musica', 'voluntariado')),
  descripcion text not null check (char_length(descripcion) between 1 and 300),
  lugar text not null check (char_length(lugar) between 1 and 120),
  dias text[] not null check (
    cardinality(dias) between 1 and 5
    and dias <@ array['lunes', 'martes', 'miércoles', 'jueves', 'viernes']::text[]
  ),
  inicio text not null check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  fin text not null check (fin ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and fin > inicio),
  orden integer not null default 0,
  ficticio boolean not null default true check (ficticio)
);

-- ---------------------------------------------------------------------------
-- Horarios de demostración: un estudiante ficticio y sus compromisos de ejemplo.
-- ---------------------------------------------------------------------------
create table if not exists public.estudiantes_demo (
  id text primary key check (id ~ '^demo-[a-z0-9-]+$'),
  nombre text not null check (char_length(nombre) between 1 and 60),
  apellido text not null check (char_length(apellido) between 1 and 60),
  codigo text not null check (char_length(codigo) between 1 and 30),
  carrera text not null check (char_length(carrera) between 1 and 80),
  ciclo integer not null check (ciclo between 1 and 20),
  intereses text[] not null default '{}',
  horas_libres_semana integer not null check (horas_libres_semana between 0 and 168),
  ficticio boolean not null default true check (ficticio)
);

create table if not exists public.eventos_demo (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  estudiante_demo_id text not null references public.estudiantes_demo (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 80),
  dia text not null check (dia in ('lunes', 'martes', 'miércoles', 'jueves', 'viernes')),
  inicio text not null check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  fin text not null check (fin ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and fin > inicio),
  categoria text not null check (categoria in ('clase', 'personal', 'laboral', 'familiar', 'taller'))
);

create index if not exists eventos_demo_estudiante_idx on public.eventos_demo (estudiante_demo_id);

-- ---------------------------------------------------------------------------
-- Cambios personales: PREPARADO, todavía no usado por la app.
-- Hoy la app guarda estos datos solo en localStorage del navegador.
-- Cuando exista autenticación real, cada fila pertenece a un usuario y solo ese usuario la ve.
-- ---------------------------------------------------------------------------
create table if not exists public.eventos_personales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 80),
  dia text not null check (dia in ('lunes', 'martes', 'miércoles', 'jueves', 'viernes')),
  inicio text not null check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  fin text not null check (fin ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and fin > inicio),
  categoria text not null check (categoria in ('clase', 'personal', 'laboral', 'familiar', 'taller')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists eventos_personales_usuario_idx on public.eventos_personales (user_id);

-- ---------------------------------------------------------------------------
-- RLS: activada en todas las tablas. Sin política de escritura para anon ni authenticated.
-- ---------------------------------------------------------------------------
alter table public.catalogo_actividades enable row level security;
alter table public.estudiantes_demo enable row level security;
alter table public.eventos_demo enable row level security;
alter table public.eventos_personales enable row level security;

drop policy if exists "catálogo: lectura pública" on public.catalogo_actividades;
create policy "catálogo: lectura pública"
  on public.catalogo_actividades for select
  to anon, authenticated
  using (true);

drop policy if exists "demo estudiantes: lectura pública" on public.estudiantes_demo;
create policy "demo estudiantes: lectura pública"
  on public.estudiantes_demo for select
  to anon, authenticated
  using (ficticio);

drop policy if exists "demo eventos: lectura pública" on public.eventos_demo;
create policy "demo eventos: lectura pública"
  on public.eventos_demo for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.estudiantes_demo e
      where e.id = estudiante_demo_id and e.ficticio
    )
  );

drop policy if exists "personales: lectura propia" on public.eventos_personales;
create policy "personales: lectura propia"
  on public.eventos_personales for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "personales: alta propia" on public.eventos_personales;
create policy "personales: alta propia"
  on public.eventos_personales for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "personales: edición propia" on public.eventos_personales;
create policy "personales: edición propia"
  on public.eventos_personales for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "personales: borrado propio" on public.eventos_personales;
create policy "personales: borrado propio"
  on public.eventos_personales for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Permisos: defensa en profundidad. RLS filtra filas; los GRANT limitan las operaciones.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.catalogo_actividades, public.estudiantes_demo, public.eventos_demo to anon, authenticated;
grant select, insert, update, delete on public.eventos_personales to authenticated;
