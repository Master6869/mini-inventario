-- Ejecutar únicamente mediante el MCP del proyecto.
-- Usa un propietario confirmado y una identidad ajena simulada.
-- Toda la prueba se revierte: no conserva productos ni modifica usuarios.
begin;
do $$
declare
  propietario uuid;
  ajeno uuid := gen_random_uuid();
  producto uuid;
  filas integer;
begin
  select id into propietario from auth.users
    where email_confirmed_at is not null order by created_at limit 1;
  if propietario is null then
    raise exception 'Se requiere al menos un usuario confirmado';
  end if;

  perform set_config('request.jwt.claim.sub', propietario::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', propietario, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.productos(nombre,cantidad,minimo)
    values ('Prueba temporal RLS', 4, 2) returning id into producto;
  if not exists(select 1 from public.productos where id = producto) then
    raise exception 'El propietario no puede consultar su producto';
  end if;
  update public.productos set cantidad = 6 where id = producto;
  get diagnostics filas = row_count;
  if filas <> 1 then raise exception 'Fallo UPDATE propio'; end if;

  perform set_config('request.jwt.claim.sub', ajeno::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', ajeno, 'role', 'authenticated')::text, true);
  if exists(select 1 from public.productos where id = producto) then
    raise exception 'Se permite SELECT ajeno';
  end if;
  update public.productos set cantidad = 99 where id = producto;
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'Se permite UPDATE ajeno'; end if;
  delete from public.productos where id = producto;
  get diagnostics filas = row_count;
  if filas <> 0 then raise exception 'Se permite DELETE ajeno'; end if;
  begin
    insert into public.productos(user_id,nombre) values (propietario,'Propietario falso');
    raise exception 'Se permite INSERT con propietario falso';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', propietario::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', propietario, 'role', 'authenticated')::text, true);
  begin
    update public.productos set user_id = ajeno where id = producto;
    raise exception 'Se permite transferir la propiedad';
  exception when insufficient_privilege then null;
  end;
  if (select cantidad from public.productos where id = producto) <> 6 then
    raise exception 'Una operacion ajena cambio el producto';
  end if;
  delete from public.productos where id = producto;
  get diagnostics filas = row_count;
  if filas <> 1 then raise exception 'Fallo DELETE propio'; end if;

  execute 'set local role anon';
  begin
    perform 1 from public.productos limit 1;
    raise exception 'Anon puede consultar productos';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'CRUD propio y aislamiento RLS remoto verificados; prueba revertida' as resultado;
