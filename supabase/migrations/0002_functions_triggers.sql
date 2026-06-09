-- ============================================================
-- Craig's Saloon — functions & triggers
-- Business rules: stock auto-tracking, course countdown, visit counts.
-- ============================================================

-- ---------- new auth user -> staff profile ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, short_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'short_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'technician')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- product sale -> inventory movement ----------
create or replace function public.sale_to_inventory_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.inventory_movements (product_id, type, quantity_change, reason, recorded_by)
  values (new.product_id, 'sale', -new.quantity, 'Retail sale', new.sold_by);
  return new;
end;
$$;

create trigger trg_sale_inventory
  after insert on product_sales
  for each row execute function public.sale_to_inventory_movement();

-- ---------- inventory movement -> adjust product stock (single source of truth) ----------
create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products
    set current_stock = current_stock + new.quantity_change
  where id = new.product_id;
  return new;
end;
$$;

create trigger trg_apply_inventory
  after insert on inventory_movements
  for each row execute function public.apply_inventory_movement();

-- ---------- appointment completed -> course countdown + visit counts ----------
create or replace function public.on_appointment_completed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from 'completed' and new.status = 'completed') then
    -- count a course session down, if linked
    if new.course_enrolment_id is not null then
      update public.course_enrolments
        set sessions_used = least(sessions_used + 1, sessions_total)
      where id = new.course_enrolment_id;

      update public.course_enrolments
        set status = 'completed'
      where id = new.course_enrolment_id and sessions_remaining <= 0;
    end if;

    -- bump the client's lifetime visit count
    if new.client_id is not null then
      update public.clients
        set total_visits   = total_visits + 1,
            last_visit_date = (new.scheduled_start at time zone 'UTC')::date
      where id = new.client_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_appointment_completed
  after update on appointments
  for each row execute function public.on_appointment_completed();

-- ---------- helper: current user's role ----------
create or replace function public.current_role()
returns user_role
language sql
stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin', 'technician')
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;
