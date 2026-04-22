insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-gallery', 'site-gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.gallery_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('carpintaria', 'alvenaria')),
  name text not null,
  description text not null default '',
  image_path text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  sort_order integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  published_at timestamptz
);

alter table public.gallery_entries enable row level security;

revoke all on table public.gallery_entries from anon;
grant select on table public.gallery_entries to anon;

drop policy if exists "public can read published gallery entries" on public.gallery_entries;
create policy "public can read published gallery entries"
on public.gallery_entries
for select
to anon
using (status = 'published');

drop policy if exists "public can read site-gallery bucket" on storage.objects;
create policy "public can read site-gallery bucket"
on storage.objects
for select
to public
using (bucket_id = 'site-gallery');

drop policy if exists "anon can upload site-gallery files" on storage.objects;
create policy "anon can upload site-gallery files"
on storage.objects
for insert
to anon
with check (bucket_id = 'site-gallery');

drop policy if exists "anon can delete site-gallery files" on storage.objects;
create policy "anon can delete site-gallery files"
on storage.objects
for delete
to anon
using (bucket_id = 'site-gallery');

create or replace function public.admin_list_gallery_entries(admin_password text)
returns setof public.gallery_entries
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
  from public.gallery_entries
  order by created_at desc;
end;
$$;

create or replace function public.admin_insert_gallery_entry(
  entry_category text,
  entry_name text,
  entry_image_path text,
  admin_password text
)
returns public.gallery_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_row public.gallery_entries;
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  insert into public.gallery_entries (category, name, image_path, status)
  values (entry_category, entry_name, entry_image_path, 'draft')
  returning * into inserted_row;

  return inserted_row;
end;
$$;

create or replace function public.admin_update_gallery_entry_description(
  entry_id uuid,
  next_description text,
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

  update public.gallery_entries
  set description = coalesce(next_description, '')
  where id = entry_id;

  if not found then
    raise exception 'Foto não encontrada.';
  end if;
end;
$$;

create or replace function public.admin_publish_gallery_entries(admin_password text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  update public.gallery_entries
  set
    status = 'published',
    published_at = coalesce(published_at, timezone('utc'::text, now()))
  where status = 'draft';

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create or replace function public.admin_delete_gallery_entry(entry_id uuid, admin_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  delete from public.gallery_entries
  where id = entry_id;

  if not found then
    raise exception 'Foto não encontrada.';
  end if;
end;
$$;

revoke all on function public.admin_list_gallery_entries(text) from public;
revoke all on function public.admin_insert_gallery_entry(text, text, text, text) from public;
revoke all on function public.admin_update_gallery_entry_description(uuid, text, text) from public;
revoke all on function public.admin_publish_gallery_entries(text) from public;
revoke all on function public.admin_delete_gallery_entry(uuid, text) from public;

grant execute on function public.admin_list_gallery_entries(text) to anon;
grant execute on function public.admin_insert_gallery_entry(text, text, text, text) to anon;
grant execute on function public.admin_update_gallery_entry_description(uuid, text, text) to anon;
grant execute on function public.admin_publish_gallery_entries(text) to anon;
grant execute on function public.admin_delete_gallery_entry(uuid, text) to anon;
