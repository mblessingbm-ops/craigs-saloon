-- ============================================================
-- Craig's Saloon — core schema
-- Models the data model from the System Design Document (§5).
-- ============================================================

-- ---------- enums ----------
create type user_role        as enum ('owner', 'admin', 'technician', 'client');
create type service_category as enum ('hair', 'nails', 'barber', 'beauty', 'general', 'other');
create type location_status  as enum ('active', 'inactive');
create type room_status      as enum ('active', 'inactive', 'maintenance');
create type enrolment_status as enum ('active', 'completed', 'expired', 'refunded');
create type appt_status      as enum ('booked', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled');
create type appt_source      as enum ('walk_in', 'phone', 'whatsapp');
create type payment_method   as enum ('cash', 'card', 'mobile_money', 'course', 'split');
create type patch_result     as enum ('not_required', 'pending', 'passed', 'reaction');
create type product_category as enum ('serum', 'lotion', 'roll_on', 'gel', 'other');
create type inventory_type   as enum ('restock', 'sale', 'adjustment', 'write_off');
create type variance_status  as enum ('matched', 'flagged', 'resolved');
create type msg_direction    as enum ('inbound', 'outbound');
create type msg_type         as enum ('text', 'interactive', 'template', 'media');
create type convo_state      as enum ('booking_flow', 'reminder', 'self_service', 'human_handoff', 'completed');
create type handled_by       as enum ('bot', 'staff');
create type client_status    as enum ('active', 'blocked');

-- ---------- 5.1 Studio (Location) ----------
create table locations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  contact_number  text,
  operating_hours jsonb,
  status          location_status not null default 'active',
  created_at      timestamptz not null default now()
);

-- ---------- Staff profiles (linked to auth.users) ----------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null default 'technician',
  full_name       text not null,
  short_name      text,
  location_id     uuid references locations(id) on delete set null,
  services_trained service_category[] not null default '{}',
  working_hours   jsonb,
  phone           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ---------- 5.2 Treatment Rooms (Stations) ----------
create table rooms (
  id                    uuid primary key default gen_random_uuid(),
  location_id           uuid not null references locations(id) on delete cascade,
  name                  text not null,
  service_category      service_category not null default 'general',
  assigned_therapist_id uuid references profiles(id) on delete set null,
  status                room_status not null default 'active',
  created_at            timestamptz not null default now()
);

-- ---------- 5.3 Services ----------
create table services (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            service_category not null default 'other',
  base_price          numeric(10,2) not null default 0,
  duration_minutes    integer not null default 30,
  requires_patch_test boolean not null default false,
  is_course_based     boolean not null default false,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ---------- 5.4 Service Courses (Packages) ----------
create table courses (
  id             uuid primary key default gen_random_uuid(),
  service_id     uuid not null references services(id) on delete cascade,
  name           text not null,
  total_sessions integer not null check (total_sessions > 0),
  course_price   numeric(10,2) not null default 0,
  validity_days  integer not null default 180,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------- 5.12 Clients (WhatsApp linked) ----------
create table clients (
  id                    uuid primary key default gen_random_uuid(),
  phone_number          text not null unique,
  name                  text,
  skin_notes            text,
  contraindications     text,
  preferred_therapist_id uuid references profiles(id) on delete set null,
  total_visits          integer not null default 0,
  last_visit_date       date,
  marketing_consent     boolean not null default false,
  status                client_status not null default 'active',
  created_at            timestamptz not null default now()
);

-- ---------- 5.8 Products ----------
create table products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      product_category not null default 'other',
  sku           text,
  cost_price    numeric(10,2) not null default 0,
  retail_price  numeric(10,2) not null default 0,
  current_stock integer not null default 0,
  reorder_level integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- 5.5 Client Course Enrolments ----------
create table course_enrolments (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients(id) on delete cascade,
  course_id         uuid not null references courses(id) on delete restrict,
  sessions_total    integer not null check (sessions_total > 0),
  sessions_used     integer not null default 0,
  sessions_remaining integer generated always as (sessions_total - sessions_used) stored,
  amount_paid       numeric(10,2) not null default 0,
  purchase_date     date not null default current_date,
  expiry_date       date,
  status            enrolment_status not null default 'active',
  created_at        timestamptz not null default now()
);

-- ---------- 5.6 Appointments ----------
create table appointments (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references locations(id) on delete cascade,
  room_id             uuid references rooms(id) on delete set null,
  therapist_id        uuid references profiles(id) on delete set null,
  client_id           uuid references clients(id) on delete set null,
  service_id          uuid references services(id) on delete set null,
  course_enrolment_id uuid references course_enrolments(id) on delete set null,
  scheduled_start     timestamptz not null,
  scheduled_end       timestamptz not null,
  status              appt_status not null default 'booked',
  source              appt_source not null default 'walk_in',
  patch_test_ok       boolean not null default false,
  amount_charged      numeric(10,2) not null default 0,
  payment_method      payment_method,
  notes               text,
  created_at          timestamptz not null default now()
);
create index on appointments (location_id, scheduled_start);
create index on appointments (room_id, scheduled_start);
create index on appointments (client_id);

-- ---------- 5.7 Client Treatment Records ----------
create table treatment_records (
  id                uuid primary key default gen_random_uuid(),
  appointment_id    uuid references appointments(id) on delete set null,
  client_id         uuid not null references clients(id) on delete cascade,
  therapist_id      uuid references profiles(id) on delete set null,
  patch_test_result patch_result not null default 'not_required',
  settings_used     text,
  products_used     text,
  observations      text,
  contraindications text,
  before_photo_ref  text,
  after_photo_ref   text,
  created_at        timestamptz not null default now()
);
create index on treatment_records (client_id, created_at desc);

-- ---------- 5.9 Product Sales ----------
create table product_sales (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete restrict,
  quantity       integer not null check (quantity > 0),
  unit_price     numeric(10,2) not null default 0,
  total          numeric(10,2) generated always as (unit_price * quantity) stored,
  client_id      uuid references clients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  payment_method payment_method not null default 'cash',
  sold_by        uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index on product_sales (created_at);

-- ---------- 5.10 Inventory Movements ----------
create table inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  type            inventory_type not null,
  quantity_change integer not null,
  reason          text,
  recorded_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index on inventory_movements (product_id, created_at desc);

-- ---------- 5.11 Daily Reconciliation ----------
create table daily_reconciliation (
  id              uuid primary key default gen_random_uuid(),
  location_id     uuid not null references locations(id) on delete cascade,
  business_date   date not null,
  service_total   numeric(10,2) not null default 0,
  retail_total    numeric(10,2) not null default 0,
  system_total    numeric(10,2) not null default 0,
  counted_cash    numeric(10,2) not null default 0,
  counted_card    numeric(10,2) not null default 0,
  counted_mobile  numeric(10,2) not null default 0,
  variance        numeric(10,2) generated always as
                    (counted_cash + counted_card + counted_mobile - system_total) stored,
  variance_status variance_status not null default 'flagged',
  resolution_note text,
  confirmed_by    uuid references profiles(id) on delete set null,
  confirmed_at    timestamptz,
  unique (location_id, business_date)
);

-- ---------- 5.13 WhatsApp Conversations ----------
create table whatsapp_conversations (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid references clients(id) on delete cascade,
  direction            msg_direction not null,
  message_type         msg_type not null default 'text',
  content              text,
  conversation_state   convo_state,
  related_appointment_id uuid references appointments(id) on delete set null,
  handled_by           handled_by not null default 'bot',
  created_at           timestamptz not null default now()
);
create index on whatsapp_conversations (client_id, created_at desc);
