-- Entria production data model
-- Run in a Supabase project before enabling production persistence.
create extension if not exists pgcrypto;

create type public.event_status as enum ('draft','live','ended');
create type public.access_mode as enum ('guest','ticketing','signature');
create type public.rsvp_status as enum ('pending','invited','confirmed','declined','waitlist');
create type public.member_role as enum ('owner','admin','staff','scanner');
create type public.order_status as enum ('paid','free','refunded');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, currency text not null default 'NGN', created_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff', status text not null default 'active', created_at timestamptz not null default now(), primary key (organization_id,user_id)
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, slug text not null, status public.event_status not null default 'draft', access_mode public.access_mode not null default 'ticketing',
  description text not null default '', venue text not null default '', city text not null default '', starts_at timestamptz not null, ends_at timestamptz not null,
  capacity integer not null default 0 check (capacity >= 0), guest_limit integer not null default 0 check (guest_limit >= 0), branding jsonb not null default '{}'::jsonb,
  checkout jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,slug)
);
create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, name text not null,
  description text not null default '', price numeric(14,2) not null default 0, capacity integer not null default 0, sold integer not null default 0, active boolean not null default true
);
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, name text not null, email text not null, phone text,
  invite_code text not null unique, allowed_guests integer not null default 1 check (allowed_guests > 0), confirmed_guests integer not null default 0 check (confirmed_guests >= 0),
  rsvp public.rsvp_status not null default 'invited', table_name text, notes text, qr_issued boolean not null default false, checked_in integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, category text not null, description text not null,
  amount numeric(14,2) not null check (amount >= 0), paid boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.event_tables (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, name text not null,
  capacity integer not null check (capacity > 0), assigned integer not null default 0 check (assigned >= 0)
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, order_number text not null unique,
  buyer jsonb not null default '{}'::jsonb, items jsonb not null default '[]'::jsonb, add_ons jsonb not null default '[]'::jsonb, promo text,
  subtotal numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, fees numeric(14,2) not null default 0, tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0, status public.order_status not null default 'paid', method text not null default 'card', created_at timestamptz not null default now()
);
create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, order_id uuid references public.orders(id) on delete set null,
  guest_id uuid references public.guests(id) on delete set null, signature text not null unique, headcount integer not null default 1 check (headcount > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','USED','REVOKED')), scanned_at timestamptz, scanned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, guest_id uuid references public.guests(id) on delete set null,
  pass_id uuid references public.passes(id) on delete set null, code text not null, result text not null, by_user uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, audience text not null, subject text not null,
  body text not null, recipients integer not null default 0, by_user uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

create index if not exists guests_event_idx on public.guests(event_id);
create index if not exists guests_code_idx on public.guests(invite_code);
create index if not exists expenses_event_idx on public.expenses(event_id);
create index if not exists passes_signature_idx on public.passes(signature);
create index if not exists passes_event_idx on public.passes(event_id,status);
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
alter table public.passes enable row level security;
alter table public.scans enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_org_member(org uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.status='active');
$$;
create or replace function public.is_org_admin(org uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin'));
$$;
create or replace function public.is_org_operator(org uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','staff'));
$$;
create or replace function public.is_event_operator(eid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.events e where e.id=eid and public.is_org_operator(e.organization_id));
$$;
create or replace function public.is_event_member(eid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.events e where e.id=eid and public.is_org_member(e.organization_id));
$$;

create policy "members can read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "members can read memberships" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "admins manage memberships" on public.organization_members for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
create policy "members read events" on public.events for select using (public.is_org_member(organization_id));
create policy "operators manage events" on public.events for insert with check (public.is_org_operator(organization_id));
create policy "operators update events" on public.events for update using (public.is_org_operator(organization_id)) with check (public.is_org_operator(organization_id));
create policy "admins delete events" on public.events for delete using (public.is_org_admin(organization_id));
create policy "operators manage tickets" on public.ticket_types for all using (public.is_event_operator(event_id)) with check (public.is_event_operator(event_id));
create policy "operators manage guests" on public.guests for all using (public.is_event_operator(event_id)) with check (public.is_event_operator(event_id));
create policy "operators manage expenses" on public.expenses for all using (public.is_event_operator(event_id)) with check (public.is_event_operator(event_id));
create policy "operators manage tables" on public.event_tables for all using (public.is_event_operator(event_id)) with check (public.is_event_operator(event_id));
create policy "operators read orders" on public.orders for select using (public.is_event_operator(event_id));
create policy "operators manage passes" on public.passes for all using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
create policy "members scan" on public.scans for all using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
create policy "operators manage messages" on public.messages for all using (public.is_event_operator(event_id)) with check (public.is_event_operator(event_id));

-- Public guest experiences should use narrowly scoped functions/Edge Functions; do not expose guests anonymously.
create or replace function public.rsvp_guest(p_invite_code text, p_status public.rsvp_status, p_confirmed_guests integer default 1)
returns table(ok boolean, status public.rsvp_status, allowed_guests integer) language plpgsql security definer set search_path=public as $$
declare g public.guests;
begin
  select * into g from public.guests where invite_code=p_invite_code for update;
  if not found then return query select false, null::public.rsvp_status, 0; return; end if;
  if p_confirmed_guests < 0 or p_confirmed_guests > g.allowed_guests then return query select false, g.rsvp, g.allowed_guests; return; end if;
  update public.guests set rsvp=p_status, confirmed_guests=p_confirmed_guests, updated_at=now() where id=g.id;
  return query select true, p_status, g.allowed_guests;
end;
$$;
revoke all on function public.rsvp_guest(text,public.rsvp_status,integer) from public;
grant execute on function public.rsvp_guest(text,public.rsvp_status,integer) to anon, authenticated;

-- Atomic one-time verification: lock the pass, reject duplicates/revoked credentials, record the scan, and consume the pass in one transaction.
create or replace function public.verify_pass(p_event_id uuid, p_signature text, p_gatekeeper uuid)
returns table(result text, headcount integer, scanned_at timestamptz) language plpgsql security definer set search_path=public as $$
declare p public.passes; now_ts timestamptz := now();
begin
  select * into p from public.passes where event_id=p_event_id and signature=p_signature for update;
  if not found then
    insert into public.scans(event_id,code,result,by_user) values(p_event_id,p_signature,'INVALID',p_gatekeeper);
    return query select 'INVALID',0,now_ts; return;
  end if;
  if p.status <> 'ACTIVE' then
    insert into public.scans(event_id,pass_id,code,result,by_user) values(p_event_id,p.id,p_signature,case when p.status='USED' then 'ALREADY_USED' else 'REVOKED' end,p_gatekeeper);
    return query select case when p.status='USED' then 'ALREADY_USED' else 'REVOKED' end,p.headcount,p.scanned_at; return;
  end if;
  update public.passes set status='USED', scanned_at=now_ts, scanned_by=p_gatekeeper where id=p.id;
  if p.guest_id is not null then update public.guests set checked_in=least(allowed_guests,checked_in+p.headcount), updated_at=now_ts where id=p.guest_id; end if;
  insert into public.scans(event_id,guest_id,pass_id,code,result,by_user) values(p_event_id,p.guest_id,p.id,p_signature,'SUCCESS',p_gatekeeper);
  return query select 'SUCCESS',p.headcount,now_ts;
end;
$$;
revoke all on function public.verify_pass(uuid,text,uuid) from public;
grant execute on function public.verify_pass(uuid,text,uuid) to authenticated;

create or replace view public.event_financial_summary as
select e.id event_id, e.name,
  coalesce((select sum(o.total) from public.orders o where o.event_id=e.id and o.status in ('paid','free')),0) revenue,
  coalesce((select sum(x.amount) from public.expenses x where x.event_id=e.id),0) expenses,
  coalesce((select sum(o.total) from public.orders o where o.event_id=e.id and o.status in ('paid','free')),0)-coalesce((select sum(x.amount) from public.expenses x where x.event_id=e.id),0) net,
  coalesce((select sum(g.confirmed_guests) from public.guests g where g.event_id=e.id and g.rsvp='confirmed'),0) confirmed_guests,
  coalesce((select sum(g.checked_in) from public.guests g where g.event_id=e.id),0) checked_in
from public.events e;

-- End of production schema. Payment webhooks should verify the gateway signature before inserting/updating orders and passes.
