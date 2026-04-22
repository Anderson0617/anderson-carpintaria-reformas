create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  comment text not null check (char_length(trim(comment)) between 3 and 1500),
  stars smallint not null check (stars between 1 and 5),
  status text not null check (status in ('private', 'pending', 'approved', 'hidden')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  approved_at timestamptz
);

alter table public.reviews enable row level security;

revoke all on table public.reviews from anon;
grant select, insert on table public.reviews to anon;

drop policy if exists "public can read approved reviews" on public.reviews;
create policy "public can read approved reviews"
on public.reviews
for select
to anon
using (status = 'approved');

drop policy if exists "public can create reviews" on public.reviews;
create policy "public can create reviews"
on public.reviews
for insert
to anon
with check (
  stars between 1 and 5
  and status in ('private', 'pending')
  and char_length(trim(comment)) between 3 and 1500
);

create or replace function public.admin_list_reviews(admin_password text)
returns setof public.reviews
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
  from public.reviews
  order by created_at desc;
end;
$$;

create or replace function public.admin_update_review_status(
  review_id uuid,
  next_status text,
  admin_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  if next_status not in ('private', 'pending', 'approved', 'hidden') then
    raise exception 'Status inválido.';
  end if;

  update public.reviews
  set
    status = next_status,
    approved_at = case
      when next_status = 'approved' then timezone('utc'::text, now())
      else null
    end
  where id = review_id;

  if not found then
    raise exception 'Avaliação não encontrada.';
  end if;
end;
$$;

create or replace function public.admin_delete_review(review_id uuid, admin_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  delete from public.reviews
  where id = review_id;

  if not found then
    raise exception 'Avaliação não encontrada.';
  end if;
end;
$$;

revoke all on function public.admin_list_reviews(text) from public;
revoke all on function public.admin_update_review_status(uuid, text, text) from public;
revoke all on function public.admin_delete_review(uuid, text) from public;

grant execute on function public.admin_list_reviews(text) to anon;
grant execute on function public.admin_update_review_status(uuid, text, text) to anon;
grant execute on function public.admin_delete_review(uuid, text) to anon;
