-- ============================================================
-- Craig's Saloon — Phase 1: per-location admin scoping (RLS)
-- Owner       → all locations
-- Admin       → only their own location_id
-- Technician  → only their own appointments
-- Clients are franchise-wide (no location_id) and stay staff-visible.
-- The catalogue (services/products/courses) is franchise-wide too.
-- ============================================================

-- caller's location (NULL for owner / unassigned). SECURITY DEFINER so it
-- can read the caller's own profile row regardless of profiles RLS.
create or replace function public.current_location_id()
returns uuid language sql stable security definer set search_path = public as $$
  select location_id from public.profiles where id = auth.uid();
$$;
revoke execute on function public.current_location_id() from public, anon;

-- is the caller an admin? (separate from is_manager(), which also matches owner)
-- NOTE: granted to `authenticated` (revoked only from public/anon) so RLS policies
-- can call it. public.current_role() is NOT usable here — 0004 revoked it from authenticated.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;

-- ---------- appointments ----------
drop policy if exists appts_select on appointments;
drop policy if exists appts_insert on appointments;
drop policy if exists appts_update on appointments;
drop policy if exists appts_delete on appointments;

create policy appts_select on appointments for select using (
  public.is_owner()
  or (public.is_admin() and location_id = public.current_location_id())
  or therapist_id = auth.uid()
);
create policy appts_insert on appointments for insert with check (
  public.is_owner()
  or (public.is_admin() and location_id = public.current_location_id())
  or (public.is_staff() and therapist_id = auth.uid())
);
create policy appts_update on appointments for update using (
  public.is_owner()
  or (public.is_admin() and location_id = public.current_location_id())
  or therapist_id = auth.uid()
) with check (
  public.is_owner()
  or (public.is_admin() and location_id = public.current_location_id())
  or therapist_id = auth.uid()
);
create policy appts_delete on appointments for delete using (
  public.is_owner()
  or (public.is_admin() and location_id = public.current_location_id())
);

-- ---------- daily reconciliation ----------
drop policy if exists recon_select on daily_reconciliation;
drop policy if exists recon_manage on daily_reconciliation;
create policy recon_select on daily_reconciliation for select using (
  public.is_owner() or (public.is_staff() and location_id = public.current_location_id())
);
create policy recon_manage on daily_reconciliation for all using (
  public.is_owner() or (public.is_admin() and location_id = public.current_location_id())
) with check (
  public.is_owner() or (public.is_admin() and location_id = public.current_location_id())
);

-- ---------- rooms / stations ----------
drop policy if exists rooms_select on rooms;
create policy rooms_select on rooms for select using (
  public.is_owner() or location_id = public.current_location_id()
);
-- rooms_owner (owner full config) is unchanged.

-- ---------- locations ----------
drop policy if exists locations_select on locations;
create policy locations_select on locations for select using (
  public.is_owner() or id = public.current_location_id()
);
-- locations_owner (owner full config) is unchanged.

-- ---------- profiles (team) ----------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (
  public.is_owner()
  or id = auth.uid()
  or location_id = public.current_location_id()
);
-- profiles_update_self and profiles_owner_all are unchanged.
