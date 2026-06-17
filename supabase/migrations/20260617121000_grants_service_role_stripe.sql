-- El cliente service_role del webhook/checkout salta RLS, pero PostgREST
-- tambien necesita privilegios SQL explicitos sobre las tablas usadas.

grant usage on schema public to service_role;

grant select, update on table
  public.perfiles,
  public.reservas,
  public.pedidos
to service_role;
