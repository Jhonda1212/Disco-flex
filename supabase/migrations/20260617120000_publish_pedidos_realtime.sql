-- Publica solo la tabla que la app escucha con Supabase Realtime.
-- No cambia RLS ni replica identity.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pedidos'
  ) then
    execute 'alter publication supabase_realtime add table public.pedidos';
  end if;
end $$;
