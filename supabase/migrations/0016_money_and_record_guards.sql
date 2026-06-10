-- ============================================================
-- Craig's Saloon — money integrity + tighten dormant-table write policies
-- ============================================================

-- 1. Takings can never be negative (a technician could PATCH a negative
--    amount_charged on their own appointment → corrupts reconciliation + revenue).
alter table appointments
  add constraint appointments_amount_nonneg check (amount_charged >= 0);

-- 2. product_sales unit price can never be negative (dormant retail table, but
--    same class of gap as #1).
alter table product_sales
  add constraint product_sales_unit_price_nonneg check (unit_price >= 0);

-- 3. treatment_records had `for all using is_staff()` — any staffer could
--    DELETE/UPDATE any client's clinical record franchise-wide (same hole 0015
--    fixed for clients). Dormant for Craig's, but lock it down: staff write,
--    owner-only delete.
drop policy if exists records_write on treatment_records;
create policy records_insert on treatment_records
  for insert with check (public.is_staff());
create policy records_update on treatment_records
  for update using (public.is_staff()) with check (public.is_staff());
create policy records_delete on treatment_records
  for delete using (public.is_owner());
