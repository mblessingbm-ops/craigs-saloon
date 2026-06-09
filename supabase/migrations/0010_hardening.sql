-- ============================================================
-- Craig's Saloon — integrity hardening
-- #1 no double-booking a room, #4 stock never negative, #6 photo storage
-- ============================================================

-- ---------- #1 prevent overlapping appointments in the same room ----------
create extension if not exists btree_gist;

alter table appointments
  add constraint appointments_no_room_overlap
  exclude using gist (
    room_id with =,
    tstzrange(scheduled_start, scheduled_end) with &&
  )
  where (status <> 'cancelled' and status <> 'no_show' and room_id is not null);

-- ---------- #4 stock can never go negative ----------
alter table products
  add constraint products_stock_nonneg check (current_stock >= 0);

-- ---------- #6 private storage bucket for before/after photos ----------
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', false)
on conflict (id) do nothing;

create policy "staff read client photos"
  on storage.objects for select
  using (bucket_id = 'client-photos' and public.is_staff());

create policy "staff upload client photos"
  on storage.objects for insert
  with check (bucket_id = 'client-photos' and public.is_staff());

create policy "staff update client photos"
  on storage.objects for update
  using (bucket_id = 'client-photos' and public.is_staff());
