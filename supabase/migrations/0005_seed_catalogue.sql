-- ============================================================
-- Craig's Saloon — catalogue seed (idempotent)
-- 4 franchise locations, stations per location, service menu, clients.
-- Staff (auth users) are created in 0006_seed_staff.sql.
-- ============================================================

do $$
declare
  loc record;
begin
  if exists (select 1 from locations) then
    raise notice 'catalogue already seeded — skipping';
    return;
  end if;

  -- 4 franchise locations
  insert into locations (name, address, contact_number, operating_hours) values
    ('Craig''s Saloon — Avondale',      'Avondale Shopping Centre, Harare',   '+263 242 333 001',
      '{"mon":["08:00","18:00"],"tue":["08:00","18:00"],"wed":["08:00","18:00"],"thu":["08:00","18:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb),
    ('Craig''s Saloon — Borrowdale',    'Sam Levy''s Village, Borrowdale, Harare', '+263 242 333 002',
      '{"mon":["08:00","18:00"],"tue":["08:00","18:00"],"wed":["08:00","18:00"],"thu":["08:00","18:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb),
    ('Craig''s Saloon — Highlands',     'Arundel Village, Highlands, Harare', '+263 242 333 003',
      '{"mon":["08:00","18:00"],"tue":["08:00","18:00"],"wed":["08:00","18:00"],"thu":["08:00","18:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb),
    ('Craig''s Saloon — Mount Pleasant', 'Mount Pleasant Centre, Harare',     '+263 242 333 004',
      '{"mon":["08:00","18:00"],"tue":["08:00","18:00"],"wed":["08:00","18:00"],"thu":["08:00","18:00"],"fri":["08:00","19:00"],"sat":["08:00","17:00"],"sun":null}'::jsonb);

  -- stations: every location gets the same station layout
  for loc in select id from locations loop
    insert into rooms (location_id, name, service_category) values
      (loc.id, 'Hair Chair 1',  'hair'),
      (loc.id, 'Hair Chair 2',  'hair'),
      (loc.id, 'Nail Desk 1',   'nails'),
      (loc.id, 'Barber Chair 1','barber'),
      (loc.id, 'Facial Room',   'beauty');
  end loop;

  -- service menu (shared; base price can be overridden per location later)
  insert into services (name, category, base_price, duration_minutes) values
    -- hair
    ('Ladies Cut & Style',     'hair',   18, 60),
    ('Wash & Blow-dry',        'hair',   12, 45),
    ('Braids — Medium',        'hair',   35, 180),
    ('Relaxer & Treatment',    'hair',   25, 90),
    -- nails
    ('Gel Manicure',           'nails',  20, 50),
    ('Classic Pedicure',       'nails',  18, 45),
    ('Acrylic Full Set',       'nails',  30, 75),
    -- barber
    ('Haircut',                'barber', 10, 30),
    ('Skin Fade',              'barber', 12, 40),
    ('Haircut & Beard Trim',   'barber', 15, 45),
    -- beauty
    ('Facial',                 'beauty', 30, 60),
    ('Eyebrow Threading',      'beauty',  8, 20),
    ('Full Face Makeup',       'beauty', 40, 75);

  -- a few demo clients (WhatsApp-linked, identified by phone)
  insert into clients (phone_number, name, total_visits, marketing_consent) values
    ('+263772100201', 'Tendai Mukamuri', 12, true),
    ('+263772100202', 'Chiedza Banda',    7, true),
    ('+263772100203', 'Farai Sibanda',    3, false),
    ('+263772100204', 'Rumbi Chari',     18, true),
    ('+263772100205', 'Kuda Moyo',        5, true),
    ('+263772100206', 'Nyasha Dube',      9, false);

  raise notice 'catalogue seeded — 4 locations, stations, services, clients';
end $$;
