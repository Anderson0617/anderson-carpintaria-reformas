create table if not exists public.editable_media_assets (
  media_key text primary key check (
    media_key in (
      'presentationPhoto',
      'carpentryTop',
      'carpentryBottom',
      'masonryTop',
      'masonryBottom'
    )
  ),
  storage_path text not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.editable_media_assets enable row level security;

revoke all on table public.editable_media_assets from anon;
grant select on table public.editable_media_assets to anon;

drop policy if exists "public can read editable media assets" on public.editable_media_assets;
create policy "public can read editable media assets"
on public.editable_media_assets
for select
to anon
using (true);

create or replace function public.admin_upsert_editable_media_asset(
  asset_key text,
  asset_storage_path text,
  admin_password text
)
returns public.editable_media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  upserted_row public.editable_media_assets;
begin
  if admin_password <> '2805' then
    raise exception 'Senha administrativa inválida.';
  end if;

  insert into public.editable_media_assets (media_key, storage_path, updated_at)
  values (asset_key, asset_storage_path, timezone('utc'::text, now()))
  on conflict (media_key) do update
  set
    storage_path = excluded.storage_path,
    updated_at = excluded.updated_at
  returning * into upserted_row;

  return upserted_row;
end;
$$;

revoke all on function public.admin_upsert_editable_media_asset(text, text, text) from public;
grant execute on function public.admin_upsert_editable_media_asset(text, text, text) to anon;
