-- WeBall — 0001_schema.sql
-- Core schema: profiles, courts, leagues, games, rosters, ratings, messaging.
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           text not null,
  avatar_url     text,
  position       text not null default 'ANY'
                 check (position in ('PG', 'SG', 'SF', 'PF', 'C', 'ANY')),
  height_cm      int check (height_cm between 100 and 250),
  bio            text,
  self_skill     numeric(3, 1) check (self_skill between 1 and 10),
  computed_skill numeric(4, 2),          -- derived from ratings; never client-written
  rating_count   int not null default 0, -- derived
  games_played   int not null default 0, -- derived
  created_at     timestamptz not null default now()
);

-- Auto-create a profile row on signup (name comes from auth metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, self_skill)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'self_skill', '')::numeric
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Courts
-- ---------------------------------------------------------------------------
create table public.courts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    extensions.geography(point, 4326) not null,
  address     text,
  city        text not null default 'Cleveland',
  surface     text not null default 'asphalt'
              check (surface in ('asphalt', 'concrete', 'hardwood', 'sport-court', 'other')),
  indoor      boolean not null default false,
  lighting    boolean not null default false,
  hoops_count int not null default 2 check (hoops_count between 1 and 20),
  amenities   jsonb not null default '{}'::jsonb, -- {water, restrooms, parking, ...}
  verified    boolean not null default false,     -- curated vs. user-submitted
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index courts_location_idx on public.courts using gist (location);

-- ---------------------------------------------------------------------------
-- Leagues
-- ---------------------------------------------------------------------------
create table public.leagues (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  description   text,
  home_court_id uuid references public.courts (id) on delete set null,
  season_start  date,
  season_end    date,
  recurrence    text, -- rrule string, e.g. FREQ=WEEKLY;BYDAY=TU;BYHOUR=19
  max_teams     int check (max_teams between 2 and 64),
  created_at    timestamptz not null default now()
);

create table public.league_teams (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues (id) on delete cascade,
  name       text not null,
  captain_id uuid references public.profiles (id) on delete set null,
  wins       int not null default 0,
  losses     int not null default 0,
  unique (league_id, name)
);

create table public.league_team_members (
  team_id uuid not null references public.league_teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (team_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
create table public.games (
  id           uuid primary key default gen_random_uuid(),
  court_id     uuid not null references public.courts (id) on delete cascade,
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  start_time   timestamptz not null,
  duration_min int not null default 90 check (duration_min between 15 and 480),
  max_players  int not null default 10 check (max_players between 2 and 30),
  min_skill    numeric(3, 1) check (min_skill between 1 and 10),
  max_skill    numeric(3, 1) check (max_skill between 1 and 10),
  game_type    text not null default '5v5'
               check (game_type in ('5v5', '4v4', '3v3', '21', 'shootaround')),
  status       text not null default 'upcoming'
               check (status in ('upcoming', 'active', 'completed', 'cancelled')),
  league_id    uuid references public.leagues (id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now()
);

create index games_court_idx on public.games (court_id);
create index games_start_time_idx on public.games (start_time) where status = 'upcoming';

-- Roster. Rows are written ONLY through join_game()/leave_game() RPCs
-- (no insert/update RLS policies on purpose — capacity needs a transaction).
create table public.game_players (
  game_id   uuid not null references public.games (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  status    text not null default 'joined'
            check (status in ('joined', 'waitlist', 'left', 'no_show')),
  team      text check (team in ('A', 'B')),
  joined_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create index game_players_user_idx on public.game_players (user_id);

-- ---------------------------------------------------------------------------
-- Ratings (anonymous, aggregate-only; see recompute trigger in 0002)
-- ---------------------------------------------------------------------------
create table public.ratings (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.games (id) on delete cascade,
  rater_id      uuid not null references public.profiles (id) on delete cascade,
  ratee_id      uuid not null references public.profiles (id) on delete cascade,
  skill         numeric(3, 1) not null check (skill between 1 and 10),
  sportsmanship int not null check (sportsmanship between 1 and 5),
  created_at    timestamptz not null default now(),
  unique (game_id, rater_id, ratee_id),
  check (rater_id <> ratee_id)
);

create index ratings_ratee_idx on public.ratings (ratee_id);

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('game', 'dm')),
  game_id    uuid unique references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((type = 'game') = (game_id is not null))
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.courts               enable row level security;
alter table public.leagues              enable row level security;
alter table public.league_teams         enable row level security;
alter table public.league_team_members  enable row level security;
alter table public.games                enable row level security;
alter table public.game_players         enable row level security;
alter table public.ratings              enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;

-- Membership check as SECURITY DEFINER to avoid recursive RLS on
-- conversation_members referencing itself.
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

-- profiles: everyone signed in can see profiles; you can edit only yours.
create policy "profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Derived fields (computed_skill, rating_count, games_played) are recomputed
-- server-side only. A BEFORE UPDATE trigger silently reverts client attempts
-- to write them; server functions opt out via a transaction-local flag.
create or replace function public.protect_derived_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('weball.system_update', true), '') <> '1' then
    new.computed_skill := old.computed_skill;
    new.rating_count   := old.rating_count;
    new.games_played   := old.games_played;
  end if;
  return new;
end;
$$;

create trigger protect_profile_derived
  before update on public.profiles
  for each row execute function public.protect_derived_profile_fields();

-- courts: public to signed-in users; anyone can submit (unverified).
create policy "courts are viewable" on public.courts for select to authenticated using (true);
create policy "users can submit courts"
  on public.courts for insert to authenticated
  with check (created_by = auth.uid() and verified = false);

-- leagues: viewable; organizer manages.
create policy "leagues are viewable" on public.leagues for select to authenticated using (true);
create policy "organizer creates leagues" on public.leagues for insert to authenticated
  with check (organizer_id = auth.uid());
create policy "organizer updates leagues" on public.leagues for update to authenticated
  using (organizer_id = auth.uid());
create policy "league teams are viewable" on public.league_teams for select to authenticated using (true);
create policy "league team members are viewable" on public.league_team_members for select to authenticated using (true);

-- games: viewable; creator writes.
create policy "games are viewable" on public.games for select to authenticated using (true);
create policy "users create games" on public.games for insert to authenticated
  with check (creator_id = auth.uid() and status = 'upcoming');
create policy "creator updates own game" on public.games for update to authenticated
  using (creator_id = auth.uid());

-- game_players: rosters are public to signed-in users. No insert/update/delete
-- policies — all writes flow through the join_game/leave_game RPCs.
create policy "rosters are viewable" on public.game_players for select to authenticated using (true);

-- ratings: write-only-ish. You may rate players you actually played with,
-- once the game is completed. You can read only ratings YOU submitted —
-- everyone else sees only the aggregate on profiles.
create policy "read own submitted ratings"
  on public.ratings for select to authenticated using (rater_id = auth.uid());
create policy "rate players from your completed games"
  on public.ratings for insert to authenticated
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.status = 'completed'
    )
    and exists (
      select 1 from public.game_players gp
      where gp.game_id = ratings.game_id and gp.user_id = auth.uid() and gp.status = 'joined'
    )
    and exists (
      select 1 from public.game_players gp
      where gp.game_id = ratings.game_id and gp.user_id = ratings.ratee_id and gp.status = 'joined'
    )
  );

-- messaging: members only.
create policy "members see their conversations"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id));
create policy "members see membership"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "members update own read cursor"
  on public.conversation_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members read messages"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "members send messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.game_players;
alter publication supabase_realtime add table public.games;
