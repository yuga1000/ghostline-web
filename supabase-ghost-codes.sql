-- GHOST_PTS purchase codes — run once in Supabase SQL Editor.
-- Codes are issued manually (reply to a verified order email),
-- redeemed once on the site via bnd_redeem_code RPC.

create table if not exists ghost_codes (
  code text primary key,            -- e.g. 'GHOST-7F3A'
  pts int not null default 50,
  note text,                        -- e.g. 'order BND-03 @buyer'
  created_at timestamptz default now(),
  used_at timestamptz,
  used_by text
);

alter table ghost_codes enable row level security;
-- no policies on purpose: anon cannot select/insert/update the table directly

create or replace function bnd_redeem_code(p_code text, p_contact text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_pts int;
begin
  update ghost_codes
     set used_at = now(), used_by = coalesce(p_contact, used_by)
   where code = upper(trim(p_code)) and used_at is null
   returning pts into v_pts;
  if v_pts is null then
    return -1;                      -- invalid or already used
  end if;
  return v_pts;
end $$;

grant execute on function bnd_redeem_code(text, text) to anon;

-- ── issuing codes (example) ─────────────────────────────
-- insert into ghost_codes (code, pts, note) values
--   ('GHOST-7F3A', 100, 'order BND-03 @somebuyer');
