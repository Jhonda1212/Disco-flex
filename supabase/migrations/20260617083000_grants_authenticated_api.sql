-- La Data API necesita privilegios SQL ademas de policies RLS.
-- RLS sigue activo y limita filas/operaciones segun las policies existentes.

grant usage on schema public to authenticated;

grant select on table
  public.perfiles,
  public.mesas,
  public.productos,
  public.pedidos,
  public.pedido_items,
  public.salas_vip,
  public.reservas
to authenticated;

grant insert, update, delete on table
  public.perfiles,
  public.mesas,
  public.productos,
  public.pedidos,
  public.pedido_items,
  public.salas_vip,
  public.reservas
to authenticated;

grant usage, select on all sequences in schema public to authenticated;
