-- Blink Reviews: initial schema.
-- Run in the Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id text primary key,                              -- legacy Firebase UID; printed QR codes depend on it
  owner_id uuid null references auth.users (id) on delete set null,
  name text not null default '',
  owner_email text not null default '',
  is_active boolean not null default true,
  link_expires_at timestamptz null,
  created_at timestamptz not null default now(),
  send_email_notifications boolean not null default true,
  gating_enabled boolean not null default true,
  total_reviews integer not null default 0,
  average_rating numeric(3,2) not null default 0,
  rating_distribution jsonb not null default '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  constraint businesses_owner_email_lowercase check (owner_email = lower(btrim(owner_email)))
);

create unique index if not exists businesses_owner_email_key
  on public.businesses (owner_email) where owner_email <> '';
create index if not exists businesses_owner_id_idx on public.businesses (owner_id);

create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  initial_click smallint null check (initial_click is null or initial_click between 1 and 5),
  name text not null default '',
  email text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_business_created_idx on public.reviews (business_id, created_at desc);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tool text not null check (tool in ('qr', 'calculator')),
  business_name text not null default '',
  place_id text null,
  review_link text null,
  current_rating numeric null,
  current_count integer null,
  target_rating numeric null,
  reviews_needed integer null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  consent_marketing boolean not null default false,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  image_url text null,
  link_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Security definer so RLS policies on admin_users cannot recurse into themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- Recompute the cached counters of one business from its reviews.
create or replace function public.recompute_business_stats_for(p_business_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.businesses b
  set total_reviews = s.cnt,
      average_rating = s.avg_rating,
      rating_distribution = s.dist
  from (
    select
      count(*)::integer as cnt,
      coalesce(round(avg(rating)::numeric, 2), 0) as avg_rating,
      jsonb_build_object(
        '1', count(*) filter (where rating = 1),
        '2', count(*) filter (where rating = 2),
        '3', count(*) filter (where rating = 3),
        '4', count(*) filter (where rating = 4),
        '5', count(*) filter (where rating = 5)
      ) as dist
    from public.reviews
    where business_id = p_business_id
  ) s
  where b.id = p_business_id;
$$;

-- Recompute every business. Used by the import script; returns the number processed.
create or replace function public.recompute_business_stats()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
  bid text;
begin
  for bid in select id from public.businesses loop
    perform public.recompute_business_stats_for(bid);
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function public.recompute_business_stats() from public, anon, authenticated;
grant execute on function public.recompute_business_stats() to service_role;
revoke execute on function public.recompute_business_stats_for(text) from public, anon, authenticated;
grant execute on function public.recompute_business_stats_for(text) to service_role;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Statement-level trigger using transition tables, so a batch insert of
-- thousands of reviews recomputes each affected business only once.
create or replace function public.reviews_sync_business_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bid text;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    for bid in select distinct business_id from new_rows loop
      perform public.recompute_business_stats_for(bid);
    end loop;
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    for bid in select distinct business_id from old_rows loop
      perform public.recompute_business_stats_for(bid);
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists reviews_stats_insert on public.reviews;
create trigger reviews_stats_insert
  after insert on public.reviews
  referencing new table as new_rows
  for each statement execute function public.reviews_sync_business_stats();

drop trigger if exists reviews_stats_delete on public.reviews;
create trigger reviews_stats_delete
  after delete on public.reviews
  referencing old table as old_rows
  for each statement execute function public.reviews_sync_business_stats();

drop trigger if exists reviews_stats_update on public.reviews;
create trigger reviews_stats_update
  after update on public.reviews
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.reviews_sync_business_stats();

-- Owners may edit their page but not the fields that control billing/identity.
-- auth.uid() is null for the service role and the SQL editor, so those pass.
create or replace function public.businesses_guard_owner_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id
     or new.link_expires_at is distinct from old.link_expires_at
     or new.is_active is distinct from old.is_active then
    raise exception 'Only an administrator can change this field' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_guard_owner_update on public.businesses;
create trigger businesses_guard_owner_update
  before update on public.businesses
  for each row execute function public.businesses_guard_owner_update();

-- Keep owner_email normalised regardless of who writes it.
create or replace function public.businesses_normalise_email()
returns trigger
language plpgsql
as $$
begin
  new.owner_email := lower(btrim(coalesce(new.owner_email, '')));
  return new;
end;
$$;

drop trigger if exists businesses_normalise_email on public.businesses;
create trigger businesses_normalise_email
  before insert or update of owner_email on public.businesses
  for each row execute function public.businesses_normalise_email();

-- ---------------------------------------------------------------------------
-- Public RPCs (anonymous writes go through these, never straight into tables)
-- ---------------------------------------------------------------------------

create or replace function public.submit_review(
  business_id text,
  rating integer,
  initial_click integer default null,
  name text default '',
  email text default '',
  message text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.businesses%rowtype;
  new_id text;
begin
  select * into b from public.businesses where id = submit_review.business_id;
  if not found or not b.is_active then
    raise exception 'This review page is not available' using errcode = 'P0001';
  end if;
  if b.link_expires_at is not null and b.link_expires_at < now() then
    raise exception 'This review page has expired' using errcode = 'P0001';
  end if;
  if submit_review.rating is null or submit_review.rating < 1 or submit_review.rating > 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = 'P0001';
  end if;

  insert into public.reviews (business_id, rating, initial_click, name, email, message)
  values (
    submit_review.business_id,
    submit_review.rating,
    case when submit_review.initial_click between 1 and 5 then submit_review.initial_click else null end,
    left(coalesce(submit_review.name, ''), 200),
    left(coalesce(submit_review.email, ''), 320),
    left(coalesce(submit_review.message, ''), 5000)
  )
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.submit_review(text, integer, integer, text, text, text) from public;
grant execute on function public.submit_review(text, integer, integer, text, text, text) to anon, authenticated, service_role;

create or replace function public.submit_lead(
  tool text,
  business_name text,
  contact_name text,
  phone text,
  email text,
  place_id text default null,
  review_link text default null,
  current_rating numeric default null,
  current_count integer default null,
  target_rating numeric default null,
  reviews_needed integer default null,
  consent_marketing boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if submit_lead.tool not in ('qr', 'calculator') then
    raise exception 'Unknown lead tool' using errcode = 'P0001';
  end if;
  if coalesce(btrim(submit_lead.business_name), '') = '' then
    raise exception 'Business name is required' using errcode = 'P0001';
  end if;
  if coalesce(btrim(submit_lead.phone), '') = '' and coalesce(btrim(submit_lead.email), '') = '' then
    raise exception 'A phone number or email is required' using errcode = 'P0001';
  end if;

  insert into public.leads (
    tool, business_name, place_id, review_link, current_rating, current_count,
    target_rating, reviews_needed, contact_name, phone, email, consent_marketing
  ) values (
    submit_lead.tool,
    left(btrim(submit_lead.business_name), 200),
    nullif(left(submit_lead.place_id, 200), ''),
    nullif(left(submit_lead.review_link, 2000), ''),
    submit_lead.current_rating,
    submit_lead.current_count,
    submit_lead.target_rating,
    submit_lead.reviews_needed,
    left(coalesce(submit_lead.contact_name, ''), 200),
    left(coalesce(submit_lead.phone, ''), 50),
    left(lower(btrim(coalesce(submit_lead.email, ''))), 320),
    coalesce(submit_lead.consent_marketing, false)
  )
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.submit_lead(text, text, text, text, text, text, text, numeric, integer, numeric, integer, boolean) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text, text, numeric, integer, numeric, integer, boolean) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.reviews enable row level security;
alter table public.leads enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.admin_users enable row level security;

-- businesses -----------------------------------------------------------------
-- Anonymous visitors only ever get the public columns (the review page).
revoke all on table public.businesses from anon;
grant select (id, name, is_active, link_expires_at, gating_enabled, config) on public.businesses to anon;

-- Visitors see only the public columns. Logged-in clients see only their own business.
drop policy if exists "businesses public read" on public.businesses;
create policy "businesses public read" on public.businesses
  for select to anon using (true);

drop policy if exists "businesses owner read" on public.businesses;
create policy "businesses owner read" on public.businesses
  for select to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "businesses owner update" on public.businesses;
create policy "businesses owner update" on public.businesses
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "businesses admin all" on public.businesses;
create policy "businesses admin all" on public.businesses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- reviews ----------------------------------------------------------------------
revoke insert, update on table public.reviews from anon, authenticated;

drop policy if exists "reviews owner or admin read" on public.reviews;
create policy "reviews owner or admin read" on public.reviews
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.businesses b where b.id = reviews.business_id and b.owner_id = auth.uid())
  );

drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews
  for delete to authenticated using (public.is_admin());

-- leads ------------------------------------------------------------------------
revoke all on table public.leads from anon;
revoke insert, delete on table public.leads from authenticated;

drop policy if exists "leads admin read" on public.leads;
create policy "leads admin read" on public.leads
  for select to authenticated using (public.is_admin());

drop policy if exists "leads admin update" on public.leads;
create policy "leads admin update" on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ad_campaigns -----------------------------------------------------------------
revoke all on table public.ad_campaigns from anon;

drop policy if exists "campaigns authenticated read" on public.ad_campaigns;
create policy "campaigns authenticated read" on public.ad_campaigns
  for select to authenticated using (true);

drop policy if exists "campaigns admin write" on public.ad_campaigns;
create policy "campaigns admin write" on public.ad_campaigns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_users ------------------------------------------------------------------
revoke all on table public.admin_users from anon;

drop policy if exists "admin_users self or admin read" on public.admin_users;
create policy "admin_users self or admin read" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_users admin manage" on public.admin_users;
create policy "admin_users admin manage" on public.admin_users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public view for the review page
-- ---------------------------------------------------------------------------

create or replace view public.business_public
with (security_invoker = true) as
  select id, name, is_active, link_expires_at, gating_enabled, config
  from public.businesses;

grant select on public.business_public to anon, authenticated;

-- Storage: the public "logos" bucket is created through the Storage API by the
-- import script. All uploads go through the server with the service key, so no
-- storage policies are needed here.
