-- PHASE 9: run after Phase 8. Creates a commissioner-approved account linking flow.
-- Do not run as a browser user. Run in Supabase SQL Editor.
create table if not exists public.player_registration_requests (
 user_id uuid primary key references auth.users(id) on delete cascade,
 league_id uuid not null references public.leagues(id) on delete cascade,
 requested_name text not null check (length(btrim(requested_name)) between 2 and 120),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 golfer_id uuid references public.golfers(id) on delete set null,
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id)
);
create index if not exists player_requests_league_status_idx on public.player_registration_requests(league_id,status);
alter table public.player_registration_requests enable row level security;
-- Requests are accessed through narrowly scoped RPCs, not direct table policies.
revoke all on public.player_registration_requests from anon,authenticated;

-- A verified account can submit its own name; commissioner chooses the roster match.
create or replace function public.submit_player_registration(p_name text)
returns text language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid(); v_league uuid; v_status text;
begin
 if v_user is null then raise exception 'Sign in first'; end if;
 if length(btrim(coalesce(p_name,''))) not between 2 and 120 then raise exception 'Enter first and last name'; end if;
 if not exists(select 1 from auth.users where id=v_user and email_confirmed_at is not null) then
  raise exception 'Confirm your email before requesting approval';
 end if;
 select id into v_league from public.leagues where season=2027 order by created_at limit 1;
 if v_league is null then raise exception '2027 league is not configured'; end if;
 if exists(select 1 from public.memberships where user_id=v_user and league_id=v_league) then return 'already_member'; end if;
 insert into public.player_registration_requests(user_id,league_id,requested_name)
 values(v_user,v_league,btrim(p_name))
 on conflict(user_id) do update set requested_name=excluded.requested_name,requested_at=now()
 where player_registration_requests.status='pending';
 select status into v_status from public.player_registration_requests where user_id=v_user;
 return v_status;
end $$;

create or replace function public.my_player_registration()
returns table(requested_name text,registration_status text,player_name text,player_id uuid,league_id uuid)
language sql stable security definer set search_path='' as $$
 select r.requested_name,r.status,g.display_name,g.id,r.league_id
 from public.player_registration_requests r left join public.golfers g on g.id=r.golfer_id
 where r.user_id=auth.uid();
$$;

create or replace function public.pending_player_registrations(p_league uuid)
returns table(user_id uuid,requested_name text,requested_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.has_league_role(p_league,array['commissioner']) then raise exception 'Commissioner only'; end if;
 return query select r.user_id,r.requested_name,r.requested_at from public.player_registration_requests r
 where r.league_id=p_league and r.status='pending' order by r.requested_at;
end $$;

-- Atomic, server-authorized approval. p_golfer is NULL to create a new ACTIVE golfer.
create or replace function public.approve_player_registration(p_user uuid,p_league uuid,p_golfer uuid default null,p_flight text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_req public.player_registration_requests%rowtype; v_golfer uuid; v_name text; v_flight text;
begin
 if not public.has_league_role(p_league,array['commissioner']) then raise exception 'Commissioner only'; end if;
 select * into v_req from public.player_registration_requests
 where user_id=p_user and league_id=p_league and status='pending' for update;
 if not found then raise exception 'Pending request not found'; end if;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'Email not confirmed'; end if;
 if exists(select 1 from public.memberships where user_id=p_user and league_id=p_league) then raise exception 'Account already has membership'; end if;
 if p_golfer is null then
  if p_flight is not null and p_flight not in ('A','B') then raise exception 'Invalid flight'; end if;
  insert into public.golfers(league_id,display_name,kind,flight,user_id,active)
  values(p_league,v_req.requested_name,'member',p_flight,p_user,true) returning id,display_name,flight into v_golfer,v_name,v_flight;
 else
  select id,display_name,flight into v_golfer,v_name,v_flight from public.golfers
  where id=p_golfer and league_id=p_league and kind='member' and user_id is null for update;
  if not found then raise exception 'Golfer is already linked, is a guest, or belongs to another league'; end if;
  update public.golfers set user_id=p_user,active=true where id=v_golfer;
 end if;
 insert into public.memberships(league_id,user_id,role,display_name,flight)
 values(p_league,p_user,'player',v_name,v_flight);
 update public.player_registration_requests set status='approved',golfer_id=v_golfer,reviewed_at=now(),reviewed_by=auth.uid() where user_id=p_user;
 return v_golfer;
end $$;

create or replace function public.reject_player_registration(p_user uuid,p_league uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_league_role(p_league,array['commissioner']) then raise exception 'Commissioner only'; end if;
 update public.player_registration_requests set status='rejected',reviewed_at=now(),reviewed_by=auth.uid()
 where user_id=p_user and league_id=p_league and status='pending';
 if not found then raise exception 'Pending request not found'; end if;
end $$;

-- Approved players can see their own roster row and sign up ONLY as themselves.
drop policy if exists golfers_player_self_read on public.golfers;
create policy golfers_player_self_read on public.golfers for select to authenticated
 using(user_id=(select auth.uid()) and public.is_league_member(league_id));
drop policy if exists attendance_signups_player_insert on public.attendance_signups;
create policy attendance_signups_player_insert on public.attendance_signups for insert to authenticated
 with check(exists(select 1 from public.golfers g join public.weeks w on w.id=week_id
 where g.id=golfer_id and g.league_id=attendance_signups.league_id and g.user_id=(select auth.uid())
 and g.active and g.kind='member' and w.league_id=g.league_id and w.status='open'));
drop policy if exists attendance_signups_player_update on public.attendance_signups;
create policy attendance_signups_player_update on public.attendance_signups for update to authenticated
 using(exists(select 1 from public.golfers g join public.weeks w on w.id=week_id
 where g.id=golfer_id and g.user_id=(select auth.uid()) and g.league_id=attendance_signups.league_id and w.league_id=g.league_id and w.status='open'))
 with check(exists(select 1 from public.golfers g join public.weeks w on w.id=week_id
 where g.id=golfer_id and g.user_id=(select auth.uid()) and g.active and g.kind='member' and g.league_id=attendance_signups.league_id and w.league_id=g.league_id and w.status='open'));
drop policy if exists attendance_signups_player_delete on public.attendance_signups;
create policy attendance_signups_player_delete on public.attendance_signups for delete to authenticated
 using(exists(select 1 from public.golfers g join public.weeks w on w.id=week_id
 where g.id=golfer_id and g.user_id=(select auth.uid()) and g.league_id=attendance_signups.league_id and w.league_id=g.league_id and w.status='open'));
-- Important: Phase 8's attendance_signups_read policy already requires league membership.
revoke all on function public.submit_player_registration(text) from public;
revoke all on function public.my_player_registration() from public;
revoke all on function public.pending_player_registrations(uuid) from public;
revoke all on function public.approve_player_registration(uuid,uuid,uuid,text) from public;
revoke all on function public.reject_player_registration(uuid,uuid) from public;
grant execute on function public.submit_player_registration(text),public.my_player_registration(),public.pending_player_registrations(uuid),public.approve_player_registration(uuid,uuid,uuid,text),public.reject_player_registration(uuid,uuid) to authenticated;
