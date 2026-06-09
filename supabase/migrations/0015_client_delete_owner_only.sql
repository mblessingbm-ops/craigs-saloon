-- ============================================================
-- Craig's Saloon — security fix: client DELETE is owner-only
-- The old `clients_write for all using is_staff()` let ANY staff member
-- (incl. a technician) delete/update any client via the REST API, contradicting
-- the app's owner-only deleteClient() guard. Split: staff can create/update
-- clients (walk-in capture); only the owner can delete a client record.
-- ============================================================

drop policy if exists clients_write on clients;

create policy clients_insert on clients
  for insert with check (public.is_staff());

create policy clients_update on clients
  for update using (public.is_staff()) with check (public.is_staff());

create policy clients_delete on clients
  for delete using (public.is_owner());
