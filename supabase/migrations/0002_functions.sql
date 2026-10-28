-- WeBall — 0002_functions.sql
-- Geo RPCs, transactional join/leave, game lifecycle, rating aggregation.

-- ---------------------------------------------------------------------------
-- nearby_courts(lat, lng, radius_m)
-- ---------------------------------------------------------------------------
create or replace function public.nearby_courts(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m double precision default 15000
)
returns table (
  id          uuid,
  name        text,
  address     text,
  city        text,
  surface     text,
  indoor      boolean,
  lighting    boolean,
  hoops_count int,
  amenities   jsonb,
  verified    boolean,
  lat         double precision,
  lng         double precision,
  distance_m  double precision
)
language sql stable
set search_path = public, extensions
as $$
  select
    c.id, c.name, c.address, c.city, c.surface, c.indoor, c.lighting,
    c.hoops_count, c.amenities, c.verified,
    st_y(c.location::geometry)  as lat,
    st_x(c.location::geometry)  as lng,
    st_distance(c.location, st_point(p_lng, p_lat)::geography) as distance_m
  from courts c
  where st_dwithin(c.location, st_point(p_lng, p_lat)::geography, p_radius_m)
  order by distance_m;
$$;

-- ---------------------------------------------------------------------------
-- get_court(id) — single court with lat/lng extracted for the client.
-- ---------------------------------------------------------------------------
create or replace function public.get_court(p_court_id uuid)
returns table (
  id          uuid,
  name        text,
  address     text,
  city        text,
  surface     text,
  indoor      boolean,
  lighting    boolean,
  hoops_count int,
  amenities   jsonb,
  verified    boolean,
  lat         double precision,
  lng         double precision
)
language sql stable
set search_path = public, extensions
as $$
  select
    c.id, c.name, c.address, c.city, c.surface, c.indoor, c.lighting,
    c.hoops_count, c.amenities, c.verified,
    st_y(c.location::geometry) as lat,
    st_x(c.location::geometry) as lng
  from courts c
  where c.id = p_court_id;
$$;

-- ---------------------------------------------------------------------------
-- add_court(...) — user-submitted court (unverified) from lat/lng.
-- ---------------------------------------------------------------------------
create or replace function public.add_court(
  p_name    text,
  p_lat     double precision,
  p_lng     double precision,
  p_address text default null,
  p_city    text default 'Cleveland',
  p_surface text default 'asphalt',
  p_indoor  boolean default false,
  p_lighting boolean default false,
  p_hoops   int default 2
)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  insert into courts (name, location, address, city, surface, indoor, lighting, hoops_count, verified, created_by)
  values (p_name, st_point(p_lng, p_lat)::geography, p_address, p_city, p_surface, p_indoor, p_lighting, p_hoops, false, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- nearby_games(lat, lng, radius_m, hours_ahead)
-- One round trip for the Games map/list: game + court + headcount + my status.
-- ---------------------------------------------------------------------------
create or replace function public.nearby_games(
  p_lat         double precision,
  p_lng         double precision,
  p_radius_m    double precision default 15000,
  p_hours_ahead int default 72
)
returns table (
  id           uuid,
  court_id     uuid,
  court_name   text,
  creator_id   uuid,
  creator_name text,
  start_time   timestamptz,
  duration_min int,
  max_players  int,
  min_skill    numeric,
  max_skill    numeric,
  game_type    text,
  status       text,
  notes        text,
  lat          double precision,
  lng          double precision,
  distance_m   double precision,
  joined_count bigint,
  my_status    text
)
language sql stable
set search_path = public, extensions
as $$
  select
    g.id, g.court_id, c.name as court_name, g.creator_id, p.name as creator_name,
    g.start_time, g.duration_min, g.max_players, g.min_skill, g.max_skill,
    g.game_type, g.status, g.notes,
    st_y(c.location::geometry) as lat,
    st_x(c.location::geometry) as lng,
    st_distance(c.location, st_point(p_lng, p_lat)::geography) as distance_m,
    (select count(*) from game_players gp
      where gp.game_id = g.id and gp.status = 'joined') as joined_count,
    (select gp.status from game_players gp
      where gp.game_id = g.id and gp.user_id = auth.uid()) as my_status
  from games g
  join courts c on c.id = g.court_id
  join profiles p on p.id = g.creator_id
  where g.status in ('upcoming', 'active')
    and g.start_time between now() - interval '2 hours'
                         and now() + make_interval(hours => p_hours_ahead)
    and st_dwithin(c.location, st_point(p_lng, p_lat)::geography, p_radius_m)
  order by g.start_time;
$$;

-- ---------------------------------------------------------------------------
-- join_game(game_id) → 'joined' | 'waitlist' | 'already'
-- SECURITY DEFINER + row lock so two players can't grab the last spot.
-- ---------------------------------------------------------------------------
create or replace function public.join_game(p_game_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_game   games%rowtype;
  v_count  int;
  v_conv   uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_game from games where id = p_game_id for update;
  if not found then
    raise exception 'Game not found';
  end if;
  if v_game.status <> 'upcoming' then
    raise exception 'This game is no longer open';
  end if;

  if exists (
    select 1 from game_players
    where game_id = p_game_id and user_id = auth.uid()
      and status in ('joined', 'waitlist')
  ) then
    return 'already';
  end if;

  select count(*) into v_count
  from game_players
  where game_id = p_game_id and status = 'joined';

  v_status := case when v_count < v_game.max_players then 'joined' else 'waitlist' end;

  insert into game_players (game_id, user_id, status)
  values (p_game_id, auth.uid(), v_status)
  on conflict (game_id, user_id)
  do update set status = excluded.status, joined_at = now();

  select id into v_conv from conversations where game_id = p_game_id;
  if v_conv is not null then
    insert into conversation_members (conversation_id, user_id)
    values (v_conv, auth.uid())
    on conflict do nothing;
  end if;

  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- leave_game(game_id) — marks you 'left' and promotes the first waitlister.
-- ---------------------------------------------------------------------------
create or replace function public.leave_game(p_game_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_game  games%rowtype;
  v_count int;
  v_next  uuid;
  v_conv  uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_game from games where id = p_game_id for update;
  if not found then
    raise exception 'Game not found';
  end if;

  update game_players set status = 'left'
  where game_id = p_game_id and user_id = auth.uid()
    and status in ('joined', 'waitlist');

  select id into v_conv from conversations where game_id = p_game_id;
  if v_conv is not null then
    delete from conversation_members
    where conversation_id = v_conv and user_id = auth.uid();
  end if;

  -- promote from the waitlist if a spot opened up
  select count(*) into v_count
  from game_players where game_id = p_game_id and status = 'joined';

  if v_count < v_game.max_players then
    select user_id into v_next
    from game_players
    where game_id = p_game_id and status = 'waitlist'
    order by joined_at
    limit 1;

    if v_next is not null then
      update game_players set status = 'joined'
      where game_id = p_game_id and user_id = v_next;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- New game housekeeping: create its chat, seat the creator.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_game()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_conv uuid;
begin
  insert into conversations (type, game_id)
  values ('game', new.id)
  returning id into v_conv;

  insert into conversation_members (conversation_id, user_id)
  values (v_conv, new.creator_id);

  insert into game_players (game_id, user_id, status)
  values (new.id, new.creator_id, 'joined');

  return new;
end;
$$;

create trigger on_game_created
  after insert on public.games
  for each row execute function public.handle_new_game();

-- ---------------------------------------------------------------------------
-- Rating aggregation: Bayesian average shrunk toward the player's
-- self-reported skill (prior weight = 5 ratings' worth). SECURITY DEFINER
-- because clients cannot write profiles.computed_skill directly.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_skill()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  c_prior_weight constant numeric := 5;
  v_prior  numeric;
  v_sum    numeric;
  v_count  int;
begin
  select coalesce(self_skill, 5) into v_prior
  from profiles where id = new.ratee_id;

  select coalesce(sum(skill), 0), count(*) into v_sum, v_count
  from ratings where ratee_id = new.ratee_id;

  perform set_config('weball.system_update', '1', true);
  update profiles set
    computed_skill = round((c_prior_weight * v_prior + v_sum) / (c_prior_weight + v_count), 2),
    rating_count   = v_count
  where id = new.ratee_id;

  return new;
end;
$$;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute function public.recompute_skill();

-- ---------------------------------------------------------------------------
-- Lifecycle sweep: flip past games to completed, bump games_played.
-- Schedule with pg_cron (Dashboard → Database → Extensions → enable pg_cron):
--   select cron.schedule('complete-games', '*/15 * * * *',
--                        $cron$select public.complete_past_games()$cron$);
-- ---------------------------------------------------------------------------
create or replace function public.complete_past_games()
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_n int;
begin
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

-- ---------------------------------------------------------------------------
-- Grants: RPCs are for signed-in users only.
-- ---------------------------------------------------------------------------
revoke execute on function public.nearby_courts       from anon, public;
revoke execute on function public.nearby_games        from anon, public;
revoke execute on function public.get_court           from anon, public;
revoke execute on function public.add_court           from anon, public;
revoke execute on function public.join_game           from anon, public;
revoke execute on function public.leave_game          from anon, public;
revoke execute on function public.complete_past_games from anon, public;

grant execute on function public.nearby_courts to authenticated;
grant execute on function public.nearby_games  to authenticated;
grant execute on function public.get_court     to authenticated;
grant execute on function public.add_court     to authenticated;
grant execute on function public.join_game     to authenticated;
grant execute on function public.leave_game    to authenticated;
