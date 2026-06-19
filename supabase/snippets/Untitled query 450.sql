update auth.users u
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('rol', p.rol)
from public.perfiles p
where p.id = u.id;
