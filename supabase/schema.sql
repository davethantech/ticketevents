-- Entria production data model
-- Run in a Supabase project before enabling production persistence.
create extension if not exists pgcrypto;

create type public.event_status as enum ('draft','live','ended');
create type public.access_mode as enum ('guest','ticketing','signature');
create type public.rsvp_status as enum ('pending','invited','confirmed','declined','waitlist');
create type public.member_role as enum ('owner','admin','staff','scanner');
create type public.order_status as enum ('paid','free','refunded');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.event_status not null default 'draft',
  access_mode public.access_mode not null default 'ticketing',
  description text not null default '',
  venue text not null default '',
  city text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 0 check (capacity >= 0),
  guest_limit integer not null default 0 check (guest_limit >= 0),
  branding jsonb not null default '{}'::jsonb,
  checkout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,slug)
);

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(14,2) not null default 0,
  capacity integer not null default 0,
  sold integer not null default 0,
  active boolean not null default true
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  invite_code text not null unique,
  allowed_guests integer not null default 1 check (allowed_guests > 0),
  confirmed_guests integer not null default 0 check (confirmed_guests >= 0),
  rsvp public.rsvp_status not null default 'invited',
  table_name text,
  notes text,
  qr_issued boolean not null default false,
  checked_in integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null,
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  paid boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  capacity integer not null check (capacity > 0),
  assigned integer not null default 0 check (assigned >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  order_number text not null unique,
  buyer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  promo text,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  fees numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status public.order_status not null default 'paid',
  method text not null default 'card',
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  code text not null,
  result text not null,
  by_user uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  audience text not null,
  subject text not null,
  body text not null,
  recipients integer not null default 0,
  by_user uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists guests_event_idx on public.guests(event_id);
create index if not exists guests_code_idx on public.guests(invite_code);
create index if not exists expenses_event_idx on public.expenses(event_id);
create index if not exists scans_event_idx on public.scans(event_id,created_at desc);
create index if not exists orders_event_idx on public.orders(event_id,created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.guests enable row level security;
alter table public.expenses enable row level security;
alter table public.event_tables enable row level security;
alter table public.orders enable row level security;
alter table public.scans enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.status='active');
$$;

create or replace function public.is_org_admin(org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin'));
$$;

create policy "members can read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "members can read memberships" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "admins manage memberships" on public.organization_members for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "members read events" on public.events for select using (public.is_org_member(organization_id));
create policy "staff manage events" on public.events for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage tickets" on public.ticket_types for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members manage guests" on public.guests for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members manage expenses" on public.expenses for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members manage tables" on public.event_tables for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members read orders" on public.orders for select using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members manage scans" on public.scans for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
create policy "members manage messages" on public.messages for all using (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.is_org_member(e.organization_id)));
