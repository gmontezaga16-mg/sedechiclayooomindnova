-- MINDNOVA · comprobación de políticas RLS.
-- Ejecutar después de la migración y de seed.sql. Todo ocurre dentro de una transacción que termina en ROLLBACK,
-- así que no deja datos. Si una comprobación falla, el script se detiene con un error que indica cuál.

begin;

-- ---- 1. Visitante anónimo (anon): lectura pública, nada de escritura ----

set local role anon;

do $$
begin
  if (select count(*) from public.catalogo_actividades) <> 10 then
    raise exception 'FALLO 1a: anon debe ver las 10 actividades del catálogo';
  end if;
  if (select count(*) from public.eventos_demo) <> 8 then
    raise exception 'FALLO 1b: anon debe ver los 8 compromisos de demostración';
  end if;
end $$;

do $$
begin
  begin
    insert into public.catalogo_actividades (id, titulo, interes, descripcion, lugar, dias, inicio, fin)
    values ('intruso', 'Intruso', 'arte', 'x', 'x', array['lunes'], '08:00', '09:00');
    raise exception 'FALLO 1c: anon pudo insertar en el catálogo';
  exception when insufficient_privilege then
    null; -- esperado: sin permiso ni política de escritura
  end;
end $$;

-- Sin privilegio de UPDATE/DELETE, PostgreSQL rechaza la orden; con privilegio, RLS deja 0 filas.
-- Cualquiera de los dos resultados significa que no hubo cambio.
do $$
declare filas integer := 0;
begin
  begin
    update public.catalogo_actividades set titulo = 'Hackeado' where id = 'gym';
    get diagnostics filas = row_count;
  exception when insufficient_privilege then
    filas := 0;
  end;
  if filas <> 0 then raise exception 'FALLO 1d: anon modificó el catálogo'; end if;

  filas := 0;
  begin
    delete from public.catalogo_actividades where id = 'gym';
    get diagnostics filas = row_count;
  exception when insufficient_privilege then
    filas := 0;
  end;
  if filas <> 0 then raise exception 'FALLO 1e: anon borró del catálogo'; end if;
end $$;

do $$
begin
  begin
    perform 1 from public.eventos_personales;
    raise exception 'FALLO 1f: anon pudo leer cambios personales';
  exception when insufficient_privilege then
    null; -- esperado
  end;
end $$;

-- ---- 2. Usuarios autenticados: cada uno solo ve y cambia lo suyo ----

-- Las filas de eventos_personales referencian auth.users. En un proyecto de Supabase real,
-- crea dos usuarios de prueba y sustituye estos IDs por los suyos, o ejecuta este bloque solo en local.
reset role;
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222')
on conflict do nothing;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
begin
  insert into public.eventos_personales (user_id, titulo, dia, inicio, fin, categoria)
  values ('11111111-1111-1111-1111-111111111111', 'Mi cita', 'jueves', '09:00', '10:00', 'personal');
end $$;

do $$
begin
  if (select count(*) from public.eventos_personales) <> 1 then
    raise exception 'FALLO 2a: el usuario A debe ver su propio cambio';
  end if;
  begin
    insert into public.eventos_personales (user_id, titulo, dia, inicio, fin, categoria)
    values ('22222222-2222-2222-2222-222222222222', 'Suplantación', 'jueves', '11:00', '12:00', 'personal');
    raise exception 'FALLO 2b: el usuario A insertó una fila a nombre de B';
  exception when insufficient_privilege then
    null; -- esperado: la política with check lo impide
  end;
end $$;

do $$
declare filas integer;
begin
  update public.eventos_personales set titulo = 'Editado' where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics filas = row_count;
  if filas <> 1 then raise exception 'FALLO 2c: el usuario A no pudo editar su propio cambio'; end if;
end $$;

-- Cambiar de usuario: B no debe ver ni tocar lo de A.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare filas integer := 0;
begin
  if (select count(*) from public.eventos_personales) <> 0 then
    raise exception 'FALLO 2d: el usuario B ve cambios de A';
  end if;

  update public.eventos_personales set titulo = 'Robado' where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLO 2e: el usuario B editó cambios de A'; end if;

  delete from public.eventos_personales where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'FALLO 2f: el usuario B borró cambios de A'; end if;
end $$;

-- Sin sesión (auth.uid() nulo), no se ve nada.
set local request.jwt.claim.sub = '';

do $$
begin
  if (select count(*) from public.eventos_personales) <> 0 then
    raise exception 'FALLO 2g: sin sesión se ven cambios personales';
  end if;
end $$;

-- Un usuario autenticado tampoco puede tocar el catálogo.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare filas integer := 0;
begin
  begin
    update public.catalogo_actividades set titulo = 'Hackeado' where id = 'pintura';
    get diagnostics filas = row_count;
  exception when insufficient_privilege then
    filas := 0;
  end;
  if filas <> 0 then raise exception 'FALLO 2h: un autenticado modificó el catálogo'; end if;
end $$;

reset role;

-- Comprobación final, como propietario: el catálogo sigue intacto.
do $$
begin
  if (select titulo from public.catalogo_actividades where id = 'gym') <> 'Gym' then
    raise exception 'FALLO 3: el catálogo cambió durante las pruebas';
  end if;
  raise notice 'RLS: todas las comprobaciones pasaron';
end $$;

rollback;
