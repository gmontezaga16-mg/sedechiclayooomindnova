-- MINDNOVA · datos iniciales de demostración (ficticios).
-- Idempotente: se puede ejecutar varias veces. Requiere haber aplicado la migración.
-- Debe coincidir con src/data/actividades.ts (ACTIVIDADES) y src/data/horario.ts (EVENTOS_INICIALES).

insert into public.catalogo_actividades (id, titulo, interes, descripcion, lugar, dias, inicio, fin, orden) values
  ('pintura', 'Pintura', 'arte',
   'Técnicas de acuarela y óleo con materiales incluidos.', 'Taller de Artes, pabellón C',
   array['lunes', 'martes', 'miércoles', 'jueves', 'viernes'], '14:00', '16:00', 1),
  ('gym', 'Gym', 'gym',
   'Circuito de fuerza y movilidad guiado por un instructor.', 'Gimnasio universitario',
   array['lunes', 'martes', 'miércoles', 'jueves', 'viernes'], '15:00', '16:00', 2),
  ('voluntariado', 'Voluntariado', 'voluntariado',
   'Acompañamiento a niños en el programa de lectura comunitaria.', 'Centro comunitario del campus',
   array['lunes', 'martes', 'miércoles'], '10:00', '12:00', 3),
  ('musica', 'Música', 'musica',
   'Ensayo de banda y práctica de instrumentos de cuerda.', 'Sala de ensayo 2',
   array['martes', 'miércoles', 'jueves', 'viernes'], '16:00', '18:00', 4)
on conflict (id) do update set
  titulo = excluded.titulo,
  interes = excluded.interes,
  descripcion = excluded.descripcion,
  lugar = excluded.lugar,
  dias = excluded.dias,
  inicio = excluded.inicio,
  fin = excluded.fin,
  orden = excluded.orden,
  ficticio = true;

insert into public.estudiantes_demo (id, nombre, apellido, codigo, carrera, ciclo, intereses, horas_libres_semana) values
  ('demo-sofia-gonzales', 'Sofía', 'Gonzales', '2025-90001', 'Diseño Gráfico', 3, array['arte', 'musica'], 5)
on conflict (id) do update set
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  codigo = excluded.codigo,
  carrera = excluded.carrera,
  ciclo = excluded.ciclo,
  intereses = excluded.intereses,
  horas_libres_semana = excluded.horas_libres_semana,
  ficticio = true;

insert into public.eventos_demo (id, estudiante_demo_id, titulo, dia, inicio, fin, categoria) values
  ('clase-ingles', 'demo-sofia-gonzales', 'Inglés', 'lunes', '08:00', '10:00', 'clase'),
  ('clase-interpretacion', 'demo-sofia-gonzales', 'Interpretación', 'martes', '14:00', '16:00', 'clase'),
  ('compromiso-trabajo', 'demo-sofia-gonzales', 'Trabajo', 'miércoles', '15:00', '18:00', 'laboral'),
  ('compromiso-familiar', 'demo-sofia-gonzales', 'Compromiso familiar', 'viernes', '10:00', '12:00', 'familiar')
on conflict (id) do update set
  estudiante_demo_id = excluded.estudiante_demo_id,
  titulo = excluded.titulo,
  dia = excluded.dia,
  inicio = excluded.inicio,
  fin = excluded.fin,
  categoria = excluded.categoria;
