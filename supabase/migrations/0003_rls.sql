-- ============================================================
-- Craig's Saloon — Row Level Security
-- Roles (System Design §4):
--   owner       — full access
--   front_desk  — diary, payments, sales, reconciliation; not pricing/staff
--   therapist   — own schedule, treatment logs, client notes; not others' earnings
--   client      — WhatsApp only (served via service role; no dashboard policies)
-- The WhatsApp webhook / seeding use the service role, which bypasses RLS.
-- ============================================================

alter table locations             enable row level security;
alter table profiles              enable row level security;
alter table rooms                 enable row level security;
alter table services              enable row level security;
alter table courses               enable row level security;
alter table clients               enable row level security;
alter table products              enable row level security;
alter table course_enrolments     enable row level security;
alter table appointments          enable row level security;
alter table treatment_records     enable row level security;
alter table product_sales         enable row level security;
alter table inventory_movements   enable row level security;
alter table daily_reconciliation  enable row level security;
alter table whatsapp_conversations enable row level security;

-- ---------- profiles ----------
create policy profiles_select on profiles
  for select using (public.is_staff() or id = auth.uid());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_owner_all on profiles
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- locations (config -> owner) ----------
create policy locations_select on locations
  for select using (public.is_staff());
create policy locations_owner on locations
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- rooms (config -> owner) ----------
create policy rooms_select on rooms
  for select using (public.is_staff());
create policy rooms_owner on rooms
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- services (pricing -> owner) ----------
create policy services_select on services
  for select using (public.is_staff());
create policy services_owner on services
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- courses (pricing -> owner) ----------
create policy courses_select on courses
  for select using (public.is_staff());
create policy courses_owner on courses
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- products (catalogue/pricing -> owner) ----------
create policy products_select on products
  for select using (public.is_staff());
create policy products_owner on products
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- clients (all staff manage; clinical notes needed before treating) ----------
create policy clients_select on clients
  for select using (public.is_staff());
create policy clients_write on clients
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- course enrolments (selling -> manager; therapist read) ----------
create policy enrolments_select on course_enrolments
  for select using (public.is_staff());
create policy enrolments_manage on course_enrolments
  for all using (public.is_manager()) with check (public.is_manager());

-- ---------- appointments (therapist sees only own; manager all) ----------
create policy appts_select on appointments
  for select using (public.is_manager() or therapist_id = auth.uid());
create policy appts_insert on appointments
  for insert with check (public.is_staff());
create policy appts_update on appointments
  for update using (public.is_manager() or therapist_id = auth.uid())
            with check (public.is_manager() or therapist_id = auth.uid());
create policy appts_delete on appointments
  for delete using (public.is_manager());

-- ---------- treatment records (all staff: clinical history) ----------
create policy records_select on treatment_records
  for select using (public.is_staff());
create policy records_write on treatment_records
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- product sales (therapist sees only own; manager all) ----------
create policy sales_select on product_sales
  for select using (public.is_manager() or sold_by = auth.uid());
create policy sales_insert on product_sales
  for insert with check (public.is_staff());

-- ---------- inventory movements (manager restock/adjust; trigger uses definer) ----------
create policy inventory_select on inventory_movements
  for select using (public.is_staff());
create policy inventory_insert on inventory_movements
  for insert with check (public.is_manager());

-- ---------- daily reconciliation (manager closes the day) ----------
create policy recon_select on daily_reconciliation
  for select using (public.is_staff());
create policy recon_manage on daily_reconciliation
  for all using (public.is_manager()) with check (public.is_manager());

-- ---------- whatsapp conversations (staff read; webhook via service role) ----------
create policy convo_select on whatsapp_conversations
  for select using (public.is_staff());
