-- Rollback script: restore legacy behavior (public read + public insert, no self-manage RPC flow)
-- Safe by default: this keeps new columns in place to avoid data loss.
-- Optional cleanup statements are included at the bottom.

create extension if not exists "pgcrypto";

alter table if exists public.community_members enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.community_members to anon, authenticated;
revoke update, delete on public.community_members from anon, authenticated;

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

drop policy if exists "public_can_update_members" on public.community_members;
drop policy if exists "public_can_delete_members" on public.community_members;

drop trigger if exists trg_touch_community_member_updated_at on public.community_members;

drop function if exists public.insert_community_member(
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  boolean,
  text
);
drop function if exists public.update_community_member(
  uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision
);
drop function if exists public.delete_community_member(uuid, text);
drop function if exists public.touch_community_member_updated_at();
drop function if exists public.hash_owner_token(text);

-- Optional hard cleanup (uncomment only if you want to remove new columns/functions footprint):
-- alter table public.community_members drop column if exists owner_token_hash;
-- alter table public.community_members drop column if exists updated_at;
