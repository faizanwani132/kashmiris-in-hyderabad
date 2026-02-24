create extension if not exists "pgcrypto";

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  area text,
  origin text,
  lat double precision not null,
  lng double precision not null,
  city text not null default 'Hyderabad',
  visible boolean not null default true,
  owner_token_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.community_members
  add column if not exists owner_token_hash text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.community_members enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.community_members to anon, authenticated;
revoke insert, update, delete on public.community_members from anon, authenticated;
revoke select (owner_token_hash) on public.community_members from anon, authenticated;

drop policy if exists "public_can_read_members" on public.community_members;
create policy "public_can_read_members"
  on public.community_members
  for select
  to public
  using (true);

drop policy if exists "public_can_insert_members" on public.community_members;
drop policy if exists "public_can_update_members" on public.community_members;
drop policy if exists "public_can_delete_members" on public.community_members;

create or replace function public.touch_community_member_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_community_member_updated_at on public.community_members;
create trigger trg_touch_community_member_updated_at
  before update on public.community_members
  for each row
  execute function public.touch_community_member_updated_at();

create or replace function public.hash_owner_token(owner_token text)
returns text
language sql
immutable
strict
as $$
  select encode(digest(owner_token, 'sha256'), 'hex');
$$;

create or replace function public.insert_community_member(
  p_name text,
  p_area text default null,
  p_origin text default null,
  p_lat double precision,
  p_lng double precision,
  p_city text default 'Hyderabad',
  p_visible boolean default true,
  p_owner_token text default null
)
returns table (
  id uuid,
  name text,
  area text,
  origin text,
  lat double precision,
  lng double precision,
  city text,
  visible boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner_token is null or char_length(trim(p_owner_token)) < 16 then
    raise exception 'invalid_owner_token';
  end if;

  return query
  insert into public.community_members (
    name,
    area,
    origin,
    lat,
    lng,
    city,
    visible,
    owner_token_hash
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_area, '')), ''),
    nullif(trim(coalesce(p_origin, '')), ''),
    round(p_lat::numeric, 3)::double precision,
    round(p_lng::numeric, 3)::double precision,
    coalesce(nullif(trim(coalesce(p_city, '')), ''), 'Hyderabad'),
    coalesce(p_visible, true),
    public.hash_owner_token(p_owner_token)
  )
  returning
    community_members.id,
    community_members.name,
    community_members.area,
    community_members.origin,
    community_members.lat,
    community_members.lng,
    community_members.city,
    community_members.visible,
    community_members.created_at,
    community_members.updated_at;
end;
$$;

create or replace function public.update_community_member(
  p_member_id uuid,
  p_owner_token text,
  p_name text,
  p_area text default null,
  p_origin text default null,
  p_lat double precision,
  p_lng double precision
)
returns table (
  id uuid,
  name text,
  area text,
  origin text,
  lat double precision,
  lng double precision,
  city text,
  visible boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner_token is null or char_length(trim(p_owner_token)) < 16 then
    raise exception 'invalid_owner_token';
  end if;

  return query
  update public.community_members
  set
    name = trim(p_name),
    area = nullif(trim(coalesce(p_area, '')), ''),
    origin = nullif(trim(coalesce(p_origin, '')), ''),
    lat = round(p_lat::numeric, 3)::double precision,
    lng = round(p_lng::numeric, 3)::double precision,
    visible = true
  where community_members.id = p_member_id
    and community_members.owner_token_hash = public.hash_owner_token(p_owner_token)
  returning
    community_members.id,
    community_members.name,
    community_members.area,
    community_members.origin,
    community_members.lat,
    community_members.lng,
    community_members.city,
    community_members.visible,
    community_members.created_at,
    community_members.updated_at;

  if not found then
    raise exception 'pin_not_found_or_unauthorized';
  end if;
end;
$$;

create or replace function public.delete_community_member(
  p_member_id uuid,
  p_owner_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if p_owner_token is null or char_length(trim(p_owner_token)) < 16 then
    raise exception 'invalid_owner_token';
  end if;

  delete from public.community_members
  where community_members.id = p_member_id
    and community_members.owner_token_hash = public.hash_owner_token(p_owner_token);

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.insert_community_member(
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  boolean,
  text
) from public;
revoke all on function public.update_community_member(
  uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision
) from public;
revoke all on function public.delete_community_member(uuid, text) from public;

grant execute on function public.insert_community_member(
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  boolean,
  text
) to anon, authenticated;
grant execute on function public.update_community_member(
  uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision
) to anon, authenticated;
grant execute on function public.delete_community_member(uuid, text) to anon, authenticated;
