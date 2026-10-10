-- MINDNOVA · datos iniciales de demostración (ficticios).
-- Idempotente: se puede ejecutar varias veces. Requiere haber aplicado la migración.
-- Debe coincidir con src/data/actividades.ts (ACTIVIDADES) y src/data/horario.ts (EVENTOS_INICIALES).

insert into public.catalogo_actividades (id, titulo, interes, descripcion, lugar, dias, inicio, fin, orden) values
  ('pintura', 'Pintura', 'arte',
   'Técnicas de acuarela y óleo con materiales incluidos.', 'Taller de Artes, pabellón C',
   array['lunes', 'jueves'], '16:00', '18:00', 1),
  ('taller-dibujo', 'Taller de dibujo', 'arte',
   'Dibujo del natural y bocetos con lápiz y carboncillo.', 'Taller de Artes, pabellón C',
   array['lunes', 'miércoles'], '11:00', '13:00', 2),
  ('danza', 'Danza', 'arte',
   'Clases de expresión corporal y danza contemporánea.', 'Sala multiuso, pabellón A',
   array['martes', 'jueves'], '18:00', '20:00', 3),
  ('ceramica', 'Cerámica', 'arte',
   'Modelado en torno y esmaltado de piezas pequeñas.', 'Taller de cerámica, pabellón C',
   array['viernes'], '19:00', '21:00', 4),
  ('gym', 'Gym', 'gym',
   'Circuito de fuerza y movilidad guiado por un instructor.', 'Gimnasio universitario',
   array['lunes', 'martes', 'miércoles', 'jueves', 'viernes'], '07:00', '08:00', 5),
  ('karate', 'Karate', 'gym',
   'Kata, técnica básica y combate controlado para principiantes.', 'Gimnasio universitario',
   array['lunes', 'miércoles'], '15:00', '17:00', 6),
  ('futbol', 'Fútbol', 'gym',
   'Partidos recreativos y entrenamiento de resistencia en cancha.', 'Campo deportivo, zona norte',
   array['martes', 'jueves'], '12:00', '14:00', 7),
  ('ensayo-banda', 'Ensayo de banda', 'musica',
   'Ensayo grupal de banda con batería, bajo y guitarras.', 'Sala de ensayo 2',
   array['martes', 'jueves'], '20:00', '22:00', 8),
  ('guitarra', 'Guitarra', 'musica',
   'Clases de guitarra acústica para principiantes e intermedios.', 'Sala de ensayo 1',
   array['lunes', 'viernes'], '13:00', '15:00', 9),
  ('canto-coral', 'Canto coral', 'musica',
   'Ensayo de coro a varias voces con práctica de técnica vocal.', 'Auditorio universitario',
   array['martes', 'jueves'], '10:00', '12:00', 10)
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
  ('clase-tipografia', 'demo-sofia-gonzales', 'Tipografía', 'lunes', '08:00', '10:00', 'clase'),
  ('clase-teoria-color', 'demo-sofia-gonzales', 'Teoría del color', 'martes', '08:00', '10:00', 'clase'),
  ('clase-ilustracion', 'demo-sofia-gonzales', 'Ilustración digital', 'martes', '14:00', '16:00', 'clase'),
  ('clase-diseno-editorial', 'demo-sofia-gonzales', 'Diseño editorial', 'miércoles', '09:00', '11:00', 'clase'),
  ('clase-fotografia', 'demo-sofia-gonzales', 'Fotografía publicitaria', 'jueves', '14:00', '16:00', 'clase'),
  ('clase-identidad', 'demo-sofia-gonzales', 'Diseño de identidad visual', 'viernes', '15:00', '17:00', 'clase'),
  ('compromiso-trabajo', 'demo-sofia-gonzales', 'Trabajo', 'miércoles', '15:00', '18:00', 'laboral'),
  ('compromiso-familiar', 'demo-sofia-gonzales', 'Compromiso familiar', 'viernes', '10:00', '12:00', 'familiar')
on conflict (id) do update set
  estudiante_demo_id = excluded.estudiante_demo_id,
  titulo = excluded.titulo,
  dia = excluded.dia,
  inicio = excluded.inicio,
  fin = excluded.fin,
  categoria = excluded.categoria;
