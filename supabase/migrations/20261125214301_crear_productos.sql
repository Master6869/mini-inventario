-- Borrador: aplicar solo al proyecto nkmxpxhxyqwleubukfvs mediante MCP.
-- Antes de aplicar, comprobar que no existe una tabla productos previa.
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  nombre text not null
    check (char_length(nombre) between 1 and 100 and nombre = btrim(nombre)),
  cantidad integer not null default 0 check (cantidad >= 0),
  minimo integer not null default 0 check (minimo >= 0),
  created_at timestamptz not null default now()
);

create index productos_user_id_idx on public.productos (user_id);

alter table public.productos enable row level security;

revoke all on table public.productos from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.productos to authenticated;

create policy productos_select_propios
  on public.productos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy productos_insert_propios
  on public.productos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy productos_update_propios
  on public.productos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy productos_delete_propios
  on public.productos for delete to authenticated
  using ((select auth.uid()) = user_id);
