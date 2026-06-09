-- ============================================================
-- DESTRUCTIVE — run manually, ONCE, before real go-live.
-- Clears all demo transactions + demo clients so the studio starts clean.
-- KEEPS: location, rooms, services, courses, products (your catalogue) and
-- staff accounts. NOT run automatically by any migration.
--
-- Usage: paste into the Supabase SQL editor (or `supabase db execute`).
-- ============================================================

begin;

delete from audit_log;
delete from whatsapp_conversations;
delete from treatment_records;
delete from product_sales;
delete from inventory_movements;
delete from daily_reconciliation;
delete from appointments;
delete from course_enrolments;
delete from clients;

-- Optional: reset product stock to a clean baseline before stock-taking.
-- update products set current_stock = 0;

-- Optional: remove the seeded demo therapists (keep the owner). Replace emails
-- as needed; this also cascades their profiles.
-- delete from auth.users where email in (
--   'rumbidzai@goddessaesthetics.studio',
--   'chiedza@goddessaesthetics.studio',
--   'nyasha@goddessaesthetics.studio',
--   'reception@goddessaesthetics.studio'
-- );

commit;
