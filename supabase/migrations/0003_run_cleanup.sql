-- ---------------------------------------------------------------------------
-- 0003: cleaning up runs nobody is in.
-- Runs are never deleted — they're marked 'cancelled', which hides them from
-- nearby_games (it only lists 'upcoming' / 'active') but keeps chat + history.
-- Run this whole file once in the Supabase SQL Editor.
-- ---------------------------------------------------------------------------

-- 1. Auto-cancel a run when its last player leaves.
create or replace function public.cancel_empty_game()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from game_players
    where game_id = new.game_id and status in ('joined', 'waitlist')
  ) then
    update games set status = 'cancelled'
    where id = new.game_id and status in ('upcoming', 'active');
  end if;
  return new;
end;
$$;

drop trigger if exists on_roster_emptied on public.game_players;
create trigger on_roster_emptied
  after update of status on public.game_players
  for each row
  when (new.status in ('left', 'no_show'))
  execute function public.cancel_empty_game();

-- 2. Let the host cancel their own run.
create or replace function public.cancel_game(p_game_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  update games set status = 'cancelled'
  where id = p_game_id
    and creator_id = auth.uid()
    and status in ('upcoming', 'active');

  if not found then
    raise exception 'Only the host can cancel this run, and only before it ends.';
  end if;
end;
$$;

revoke execute on function public.cancel_game from anon, public;
grant execute on function public.cancel_game to authenticated;

-- 3. Lifecycle sweep, updated: when a run's time is over, a run that only the
--    host ever joined is marked 'cancelled' (it didn't really happen); the rest
--    become 'completed' and count toward games_played.
create or replace function public.complete_past_games()
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_n int;
begin
  update games g
  set status = 'cancelled'
  where g.status in ('upcoming', 'active')
    and g.start_time + make_interval(mins => g.duration_min) < now()
    and (select count(*) from game_players gp
         where gp.game_id = g.id and gp.status = 'joined') <= 1;

  with done as (
    update games
    set status = 'completed'
    where status in ('upcoming', 'active')
      and start_time + make_interval(mins => duration_min) < now()
    returning id
  )
  select count(*) into v_n from done;

  perform set_config('weball.system_update', '1', true);
  update profiles p set games_played = sub.cnt
  from (
    select gp.user_id, count(*) as cnt
    from game_players gp
    join games g on g.id = gp.game_id
    where g.status = 'completed' and gp.status = 'joined'
    group by gp.user_id
  ) sub
  where p.id = sub.user_id and p.games_played is distinct from sub.cnt;

  return v_n;
end;
$$;

revoke execute on function public.complete_past_games from anon, public;

-- 4. Run the sweep every 15 minutes (pg_cron ships with Supabase).
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'complete-games';
select cron.schedule('complete-games', '*/15 * * * *',
                     $cron$select public.complete_past_games()$cron$);

-- Tidy up anything already stale.
select public.complete_past_games();
