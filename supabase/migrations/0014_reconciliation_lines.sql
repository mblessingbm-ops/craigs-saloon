-- ============================================================
-- Craig's Saloon — Phase 1: station-level reconciliation
-- Each end-of-day daily_reconciliation row (per location) gets one
-- reconciliation_lines row per station: system total vs till count.
-- ============================================================

create table reconciliation_lines (
  id                uuid primary key default gen_random_uuid(),
  reconciliation_id uuid not null references daily_reconciliation(id) on delete cascade,
  station_id        uuid references rooms(id) on delete set null,
  system_total      numeric(10,2) not null default 0,   -- logged in the system
  till_total        numeric(10,2) not null default 0,   -- counted at the station
  variance          numeric(10,2) generated always as (till_total - system_total) stored,
  variance_status   variance_status not null default 'flagged',
  resolution_note   text,
  created_at        timestamptz not null default now(),
  unique (reconciliation_id, station_id)
);
create index on reconciliation_lines (reconciliation_id);

alter table reconciliation_lines enable row level security;

-- read: owner anywhere; staff at the line's location (via parent reconciliation)
create policy recon_lines_select on reconciliation_lines for select using (
  exists (
    select 1 from daily_reconciliation dr
    where dr.id = reconciliation_id
      and (public.is_owner() or (public.is_staff() and dr.location_id = public.current_location_id()))
  )
);

-- write: owner anywhere; admin only for their own location
create policy recon_lines_manage on reconciliation_lines for all using (
  exists (
    select 1 from daily_reconciliation dr
    where dr.id = reconciliation_id
      and (public.is_owner() or (public.is_admin() and dr.location_id = public.current_location_id()))
  )
) with check (
  exists (
    select 1 from daily_reconciliation dr
    where dr.id = reconciliation_id
      and (public.is_owner() or (public.is_admin() and dr.location_id = public.current_location_id()))
  )
);
