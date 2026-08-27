-- Production migration for the live event flow.
alter table public.orders add column if not exists payment_reference text;
create unique index if not exists orders_payment_reference_uidx on public.orders(payment_reference) where payment_reference is not null;

-- Scanner credentials must be read/written through the atomic verification function or authenticated staff tooling.
create index if not exists guests_event_rsvp_idx on public.guests(event_id,rsvp);
create index if not exists passes_guest_idx on public.passes(guest_id);

-- Financial summary is intended for authenticated operator dashboards only.
alter view public.event_financial_summary set (security_invoker = true);
