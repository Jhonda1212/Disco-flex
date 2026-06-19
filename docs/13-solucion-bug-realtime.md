# 13 — Solución: bug de INSERT en Realtime

## El síntoma

El panel de staff recibía correctamente los cambios de estado de los pedidos en tiempo real (UPDATE), pero los pedidos nuevos no aparecían hasta recargar la página (INSERT no llegaba).

---

## Por qué fallaba

Supabase Realtime filtra los eventos usando las políticas RLS antes de enviarlos al cliente. Para un evento INSERT, comprueba si el suscriptor tiene permiso de SELECT sobre la fila nueva.

La política de SELECT del staff era esta:

```sql
create policy "staff: ver todos los pedidos"
  on public.pedidos for select
  using ( public.mi_rol() in ('staff', 'admin') );
```

`mi_rol()` es una función que hace un SELECT a la tabla `perfiles` para obtener el rol del usuario:

```sql
create or replace function public.mi_rol()
returns text language sql stable security definer as $$
  select rol from public.perfiles where id = auth.uid()
$$;
```

El problema: el worker de Realtime de Supabase evalúa las políticas RLS usando el JWT del suscriptor, pero **no puede ejecutar queries adicionales a otras tablas** en ese contexto. `mi_rol()` intenta hacer un SELECT a `perfiles`, falla silenciosamente, devuelve `null`, y la condición `null in ('staff', 'admin')` es `false`. Supabase filtra el evento y nunca llega al cliente.

**¿Por qué UPDATE sí funcionaba?** Supabase evalúa el UPDATE comparando contra la fila antigua, que ya estaba cacheada o cuyo contexto de evaluación es diferente al de INSERT. El resultado era que los cambios de estado llegaban bien, pero los pedidos nuevos no.

---

## La solución

Para que Supabase Realtime pueda evaluar el rol sin hacer queries adicionales, el rol tiene que estar disponible **directamente en el JWT**.

### 1. Guardar el rol en `app_metadata`

Se creó un trigger que cada vez que se crea o actualiza un perfil, copia el rol al campo `app_metadata` del usuario en Supabase Auth:

```sql
create or replace function public.sync_rol_to_jwt()
returns trigger language plpgsql security definer as $$
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
```

### 2. Actualizar la política RLS para leer del JWT

```sql
drop policy "staff: ver todos los pedidos" on public.pedidos;

create policy "staff: ver todos los pedidos"
  on public.pedidos for select
  using (
    (auth.jwt() -> 'app_metadata' ->> 'rol') in ('staff', 'admin')
  );
```

Ahora la evaluación es instantánea: Supabase lee `app_metadata.rol` del token sin necesitar queries adicionales.

### 3. Rellenar usuarios existentes

Los usuarios creados antes del trigger no tenían el rol en `app_metadata`. Se ejecutó este SQL una sola vez para sincronizarlos:

```sql
update auth.users u
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('rol', p.rol)
from public.perfiles p
where p.id = u.id;
```

Tras aplicar el fix, los usuarios existentes tuvieron que cerrar sesión y volver a entrar para obtener un JWT actualizado con el nuevo `app_metadata`.

Esto lo tienes que hacer si no quieres volver a hacer npx supabase db reset. Si has decidido utilizar SQL Editor, puedes correr este comando después del anterior.

---

## Aprendizaje

> Las políticas RLS que usan funciones que hacen queries a otras tablas funcionan bien para operaciones normales (SELECT, UPDATE desde el cliente), pero pueden fallar silenciosamente en el contexto del worker de Supabase Realtime.

Para tablas que usan `postgres_changes`, las políticas RLS deben poder evaluarse solo con los claims del JWT (`auth.uid()`, `auth.jwt()`), sin depender de queries adicionales.
