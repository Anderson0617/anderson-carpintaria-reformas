create table if not exists public.site_visits (
  id smallint primary key check (id = 1),
  total_visits bigint not null default 0,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.site_visits (id, total_visits)
values (1, 0)
on conflict (id) do nothing;

alter table public.site_visits enable row level security;

revoke all on table public.site_visits from anon;
grant select on table public.site_visits to anon;

drop policy if exists "public can read site visits" on public.site_visits;
create policy "public can read site visits"
on public.site_visits
for select
to anon
using (id = 1);

create or replace function public.increment_site_visits()
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

  return next_total;
end;
$$;

revoke all on function public.increment_site_visits() from public;
grant execute on function public.increment_site_visits() to anon;
