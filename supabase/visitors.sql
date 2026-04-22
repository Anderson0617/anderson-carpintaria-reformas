create extension if not exists pgcrypto;

create table if not exists public.site_visits (
  id smallint primary key check (id = 1),
  total_visits bigint not null default 0,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.site_visit_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  country text,
  country_code text,
  region text,
  region_code text,
  city text,
  neighborhood text,
  precision text not null default 'unknown' check (precision in ('unknown', 'state', 'city', 'neighborhood')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.site_visits (id, total_visits)
values (1, 0)
on conflict (id) do nothing;

alter table public.site_visits enable row level security;
alter table public.site_visit_events enable row level security;

revoke all on table public.site_visits from anon;
revoke all on table public.site_visit_events from anon;
grant select on table public.site_visits to anon;

drop policy if exists "public can read site visits" on public.site_visits;
create policy "public can read site visits"
on public.site_visits
for select
to anon
using (id = 1);

grant select on table public.site_visit_events to anon;

drop policy if exists "public cannot read visit events" on public.site_visit_events;
create policy "public cannot read visit events"
on public.site_visit_events
for select
to anon
using (false);

drop function if exists public.increment_site_visits();
drop function if exists public.increment_site_visits(text, text, text, text, text, text, text, text);

create or replace function public.increment_site_visits(
  visitor_country text default null,
  visitor_country_code text default null,
  visitor_region text default null,
  visitor_region_code text default null,
  visitor_city text default null,
  visitor_neighborhood text default null,
  visitor_precision text default 'unknown',
  visitor_session_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_total bigint;
begin
  insert into public.site_visits (id, total_visits)
  values (1, 1)
  on conflict (id)
  do update set
    total_visits = public.site_visits.total_visits + 1,
    updated_at = timezone('utc'::text, now())
  returning total_visits into next_total;

  insert into public.site_visit_events (
    session_id,
    country,
    country_code,
    region,
    region_code,
    city,
    neighborhood,
    precision
  )
  values (
    visitor_session_id,
    visitor_country,
    visitor_country_code,
    visitor_region,
    visitor_region_code,
    visitor_city,
    nullif(visitor_neighborhood, ''),
    case
      when visitor_precision in ('unknown', 'state', 'city', 'neighborhood') then visitor_precision
      else 'unknown'
    end
  );

  return next_total;
end;
$$;

create or replace function public.admin_list_recent_visits(admin_password text)
returns setof public.site_visit_events
language plpgsql
security definer
set search_path = ''
as $$
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  return query
  select *
  from public.site_visit_events
  order by created_at desc
  limit 20;
end;
$$;

revoke all on function public.increment_site_visits(text, text, text, text, text, text, text, text) from public;
grant execute on function public.increment_site_visits(text, text, text, text, text, text, text, text) to anon;
revoke all on function public.admin_list_recent_visits(text) from public;
grant execute on function public.admin_list_recent_visits(text) to anon;
