-- ============================================================
-- Craig's Saloon — seed today's appointments across all 4 locations (idempotent)
-- Anchored to CURRENT_DATE so the franchise dashboard shows live "today" data
-- with a by-location revenue breakdown. Times are Africa/Harare.
-- ============================================================

do $$
declare
  tz text := 'Africa/Harare';
begin
  if exists (select 1 from appointments where scheduled_start::date = current_date) then
    raise notice 'today already seeded — skipping';
    return;
  end if;

  -- helper: insert one appointment by (location, station, technician, service, client) names
  -- done inline via cross-joins so it stays a single idempotent block.

  -- ---------- Avondale ----------
  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '09:30') at time zone tz, (current_date + time '10:15') at time zone tz, 'completed','walk_in',15,'cash'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Avondale' and rm.location_id=l.id and rm.name='Barber Chair 1' and p.short_name='Tafara' and s.name='Haircut & Beard Trim' and c.name='Tendai Mukamuri';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '10:30') at time zone tz, (current_date + time '11:10') at time zone tz, 'completed','whatsapp',12,'mobile_money'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Avondale' and rm.location_id=l.id and rm.name='Barber Chair 1' and p.short_name='Tafara' and s.name='Skin Fade' and c.name='Farai Sibanda';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '11:30') at time zone tz, (current_date + time '12:20') at time zone tz, 'completed','phone',20,'card'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Avondale' and rm.location_id=l.id and rm.name='Nail Desk 1' and p.short_name='Anesu' and s.name='Gel Manicure' and c.name='Chiedza Banda';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '14:00') at time zone tz, (current_date + time '14:45') at time zone tz, 'booked','whatsapp'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Avondale' and rm.location_id=l.id and rm.name='Barber Chair 1' and p.short_name='Tafara' and s.name='Haircut' and c.name='Kuda Moyo';

  -- ---------- Borrowdale ----------
  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '09:00') at time zone tz, (current_date + time '10:00') at time zone tz, 'completed','walk_in',18,'cash'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Borrowdale' and rm.location_id=l.id and rm.name='Hair Chair 1' and p.short_name='Privilege' and s.name='Ladies Cut & Style' and c.name='Rumbi Chari';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '11:00') at time zone tz, (current_date + time '12:00') at time zone tz, 'completed','phone',30,'card'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Borrowdale' and rm.location_id=l.id and rm.name='Facial Room' and p.short_name='Privilege' and s.name='Facial' and c.name='Nyasha Dube';

  -- ---------- Highlands ----------
  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '10:00') at time zone tz, (current_date + time '10:50') at time zone tz, 'completed','whatsapp',20,'mobile_money'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Highlands' and rm.location_id=l.id and rm.name='Nail Desk 1' and p.short_name='Memory' and s.name='Gel Manicure' and c.name='Tendai Mukamuri';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '12:00') at time zone tz, (current_date + time '12:45') at time zone tz, 'completed','walk_in',18,'cash'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Highlands' and rm.location_id=l.id and rm.name='Nail Desk 1' and p.short_name='Memory' and s.name='Classic Pedicure' and c.name='Chiedza Banda';

  -- ---------- Mount Pleasant ----------
  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '09:15') at time zone tz, (current_date + time '09:45') at time zone tz, 'completed','walk_in',10,'cash'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Mount Pleasant' and rm.location_id=l.id and rm.name='Barber Chair 1' and p.short_name='Shamiso' and s.name='Haircut' and c.name='Kuda Moyo';

  insert into appointments (location_id, room_id, therapist_id, client_id, service_id, scheduled_start, scheduled_end, status, source, amount_charged, payment_method)
  select l.id, rm.id, p.id, c.id, s.id, (current_date + time '10:30') at time zone tz, (current_date + time '13:30') at time zone tz, 'completed','phone',35,'card'
  from locations l, rooms rm, profiles p, services s, clients c
  where l.name='Craig''s Saloon — Mount Pleasant' and rm.location_id=l.id and rm.name='Hair Chair 1' and p.short_name='Shamiso' and s.name='Braids — Medium' and c.name='Rumbi Chari';

  raise notice 'today seeded across 4 locations';
end $$;
