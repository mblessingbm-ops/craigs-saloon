-- ============================================================
-- Craig's Saloon — fraud guards, audit trail, integrity
-- ============================================================

-- once-only processing of a completed appointment (stops double course
-- decrement + double visit count if an appointment is reopened & re-completed)
alter table appointments add column if not exists completed_processed boolean not null default false;

-- reminder dedup
alter table appointments add column if not exists reminder_24h_sent_at timestamptz;
alter table appointments add column if not exists reminder_1h_sent_at timestamptz;

-- (therapist-overlap exclusion constraint added in 0012 after resolving seed overlaps)

-- append-only audit trail for sensitive actions
create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor      uuid references profiles(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log (created_at desc);
alter table audit_log enable row level security;
create policy audit_select on audit_log for select using (public.is_manager());
create policy audit_insert on audit_log for insert with check (public.is_staff());

-- rebuild the completion trigger: BEFORE UPDATE, once-only, course-safe
drop trigger if exists trg_appointment_completed on appointments;
drop function if exists public.on_appointment_completed();

create or replace function public.on_appointment_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (old.status is distinct from 'completed' and new.status = 'completed' and not new.completed_processed) then
    -- count down a linked course only if it's active and has sessions left
    if new.course_enrolment_id is not null then
      update public.course_enrolments
        set sessions_used = sessions_used + 1
      where id = new.course_enrolment_id and status = 'active' and sessions_remaining > 0;
      update public.course_enrolments
        set status = 'completed'
      where id = new.course_enrolment_id and sessions_remaining <= 0;
    end if;

    -- lifetime visit count (studio-local date)
    if new.client_id is not null then
      update public.clients
        set total_visits   = total_visits + 1,
            last_visit_date = (new.scheduled_start at time zone 'Africa/Harare')::date
      where id = new.client_id;
    end if;

    new.completed_processed := true;
  end if;
  return new;
end;
$$;

create trigger trg_appointment_completed
  before update on appointments
  for each row execute function public.on_appointment_completed();

revoke execute on function public.on_appointment_completed() from public, anon, authenticated;
