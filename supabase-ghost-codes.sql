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

-- ── code generator: one line per verified order ─────────
-- admin-only (no grant to anon) — run in SQL editor:
--   select bnd_issue_code(100, 'order BND-03 @somebuyer');
-- returns e.g. 'GHOST-7F3A2C' — paste it into the reply email.
create or replace function bnd_issue_code(p_pts int default 50, p_note text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_code text;
begin
  loop
    v_code := 'GHOST-' || upper(substr(md5(random()::text), 1, 6));
    begin
      insert into ghost_codes (code, pts, note) values (v_code, p_pts, p_note);
      return v_code;
    exception when unique_violation then
      -- collision — retry with a fresh code
    end;
  end loop;
end $$;

-- batch issue (e.g. 20 codes for a drop):
--   select bnd_issue_code(50, 'drop_01 promo') from generate_series(1, 20);
