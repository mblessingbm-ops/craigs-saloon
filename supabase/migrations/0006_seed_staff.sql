-- ============================================================
-- Craig's Saloon — staff accounts + linking seed (idempotent)
-- Creates auth users: owner (Craig), 4 location admins, technicians.
-- The on_auth_user_created trigger creates their profiles from metadata.
-- Demo password for all seeded staff: CraigsGold!2026
-- ============================================================

do $$
declare
  rec     record;
  new_id  uuid;
  loc_id  uuid;
  tafara  uuid;
begin
  for rec in select * from (values
    -- email,                              full_name,         short,       role,         location,         services
    ('craig@craigssaloon.co.zw',           'Craig Mhembere',  'Craig',     'owner',      null,             '{hair,barber}'),
    ('avondale@craigssaloon.co.zw',        'Tariro Moyo',     'Tariro',    'admin',      'Avondale',       '{}'),
    ('borrowdale@craigssaloon.co.zw',      'Rufaro Nleya',    'Rufaro',    'admin',      'Borrowdale',     '{}'),
    ('highlands@craigssaloon.co.zw',       'Chipo Dziva',     'Chipo',     'admin',      'Highlands',      '{}'),
    ('mtpleasant@craigssaloon.co.zw',      'Tatenda Phiri',   'Tatenda',   'admin',      'Mount Pleasant', '{}'),
    ('stylist@craigssaloon.co.zw',         'Tafara Chuma',    'Tafara',    'technician', 'Avondale',       '{barber,hair}'),
    ('anesu@craigssaloon.co.zw',           'Anesu Gwasira',   'Anesu',     'technician', 'Avondale',       '{nails,beauty}'),
    ('privilege@craigssaloon.co.zw',       'Privilege Ziyambi','Privilege','technician', 'Borrowdale',     '{hair,beauty}'),
    ('memory@craigssaloon.co.zw',          'Memory Chada',    'Memory',    'technician', 'Highlands',      '{nails}'),
    ('shamiso@craigssaloon.co.zw',         'Shamiso Dziva',   'Shamiso',   'technician', 'Mount Pleasant', '{barber,hair}')
  ) as t(email, full_name, short_name, role, location, services)
  loop
    if exists (select 1 from auth.users where email = rec.email) then
      continue;
    end if;
    new_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      rec.email, crypt('CraigsGold!2026', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.full_name, 'short_name', rec.short_name, 'role', rec.role),
      now(), now(), '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), new_id, new_id::text,
      jsonb_build_object('sub', new_id::text, 'email', rec.email), 'email', now(), now(), now());

    -- link profile to its location (owner stays franchise-wide / null) + trained services
    loc_id := null;
    if rec.location is not null then
      select id into loc_id from locations where name = 'Craig''s Saloon — ' || rec.location;
    end if;
    update public.profiles
      set location_id = loc_id,
          services_trained = rec.services::service_category[]
    where id = new_id;
  end loop;

  -- a sample station assignment (Avondale barber chair → Tafara)
  select id into tafara from profiles where short_name = 'Tafara';
  update rooms r set assigned_therapist_id = tafara
  from locations l
  where r.location_id = l.id and l.name = 'Craig''s Saloon — Avondale' and r.name = 'Barber Chair 1';
end $$;
