export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'ANY';
export type GameType = '5v5' | '4v4' | '3v3' | '21' | 'shootaround';
export type GameStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type RosterStatus = 'joined' | 'waitlist' | 'left' | 'no_show';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  position: Position;
  height_cm: number | null;
  bio: string | null;
  self_skill: number | null;
  computed_skill: number | null;
  rating_count: number;
  games_played: number;
  created_at: string;
}

/** Row returned by the nearby_courts RPC. */
export interface NearbyCourt {
  id: string;
  name: string;
  address: string | null;
  city: string;
  surface: string;
  indoor: boolean;
  lighting: boolean;
  hoops_count: number;
  amenities: Record<string, boolean>;
  verified: boolean;
  lat: number;
  lng: number;
  distance_m: number;
}

/** Row returned by the nearby_games RPC. */
export interface NearbyGame {
  id: string;
  court_id: string;
  court_name: string;
  creator_id: string;
  creator_name: string;
  start_time: string;
  duration_min: number;
  max_players: number;
  min_skill: number | null;
  max_skill: number | null;
  game_type: GameType;
  status: GameStatus;
  notes: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  joined_count: number;
  my_status: RosterStatus | null;
}

export interface RosterEntry {
  user_id: string;
  status: RosterStatus;
  joined_at: string;
  profile: Pick<Profile, 'id' | 'name' | 'avatar_url' | 'position' | 'computed_skill' | 'self_skill'>;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: Pick<Profile, 'id' | 'name'>;
}
