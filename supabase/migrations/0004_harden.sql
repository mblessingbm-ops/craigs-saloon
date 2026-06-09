-- ============================================================
-- Craig's Saloon — harden SECURITY DEFINER functions
-- Trigger-only functions must not be callable over the REST/RPC API.
-- Role predicates are only needed by authenticated users (for RLS).
-- ============================================================

-- Trigger-only functions: revoke all API execute.
revoke execute on function public.handle_new_user()            from public, anon, authenticated;
revoke execute on function public.sale_to_inventory_movement() from public, anon, authenticated;
revoke execute on function public.apply_inventory_movement()   from public, anon, authenticated;
revoke execute on function public.on_appointment_completed()   from public, anon, authenticated;

-- Role predicates: used inside RLS policies -> keep for authenticated only.
revoke execute on function public.current_role() from public, anon, authenticated;
revoke execute on function public.is_staff()     from public, anon;
revoke execute on function public.is_manager()   from public, anon;
revoke execute on function public.is_owner()     from public, anon;
