-- ============================================================
-- Craig's Saloon — prevent a therapist being double-booked
-- (added after 0011; resolves the one seeded overlap first)
-- ============================================================

-- resolve the seeded overlap: move the chemical peel to Nyasha (skin therapist)
update appointments
set therapist_id = (select id from profiles where short_name = 'Nyasha')
where id = '11e0eb83-d0ca-4806-baf4-45af99743f0f';

alter table appointments
  add constraint appointments_no_therapist_overlap
  exclude using gist (
    therapist_id with =,
    tstzrange(scheduled_start, scheduled_end) with &&
  )
  where (status <> 'cancelled' and status <> 'no_show' and therapist_id is not null);
