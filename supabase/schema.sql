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
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.community_members enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.community_members to anon, authenticated;

drop policy if exists "public_can_read_members" on public.community_members;
create policy "public_can_read_members"
  on public.community_members
  for select
  to public
  using (true);

drop policy if exists "public_can_insert_members" on public.community_members;
create policy "public_can_insert_members"
  on public.community_members
  for insert
  to public
  with check (
    city = 'Hyderabad'
    and lat = round(lat::numeric, 3)::double precision
    and lng = round(lng::numeric, 3)::double precision
  );

revoke update, delete on public.community_members from anon, authenticated;
