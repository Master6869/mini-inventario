-- Revisar y ejecutar únicamente en un proyecto de pruebas autorizado.
-- Sustituir ambos marcadores en el editor, sin registrar la contraseña en Git.
begin;
create role inventario_lector login password 'CAMBIA_ESTA_CLAVE';
grant usage on schema public to inventario_lector;
grant select (id, nombre, cantidad, minimo) on public.productos to inventario_lector;

create policy productos_lectura_mcp_pruebas on public.productos
  for select to inventario_lector
  using (user_id = 'UUID_DE_LA_CUENTA_DE_PRUEBAS'::uuid);
commit;
