-- Sincroniza el campo 'rol' de perfiles a app_metadata del JWT.
-- Supabase Realtime evalúa políticas RLS desde el JWT sin poder hacer queries
-- adicionales, así que el rol debe estar disponible directamente en el token.

create or replace function public.sync_rol_to_jwt()
returns trigger
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('rol', new.rol)
  where id = new.id;
  return new;
end;
$$;

create trigger on_perfil_upsert
  after insert or update of rol on public.perfiles
  for each row execute function public.sync_rol_to_jwt();

-- Reemplazar la política que usaba mi_rol() (no funciona en contexto realtime)
-- por una que lee el rol directamente del JWT.
drop policy "staff: ver todos los pedidos" on public.pedidos;

create policy "staff: ver todos los pedidos"
  on public.pedidos for select
  using (
    (auth.jwt() -> 'app_metadata' ->> 'rol') in ('staff', 'admin')
  );
