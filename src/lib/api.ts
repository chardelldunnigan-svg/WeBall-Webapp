import { supabase } from './supabase';
import type { GameType, Message, NearbyCourt, NearbyGame, RosterEntry } from './types';

export async function fetchNearbyCourts(
  lat: number,
  lng: number,
  radiusM = 25000,
): Promise<NearbyCourt[]> {
  const { data, error } = await supabase.rpc('nearby_courts', {
    p_lat: lat,
    p_lng: lng,
    p_radius_m: radiusM,
  });
  if (error) throw error;
  return (data ?? []) as NearbyCourt[];
}

export async function fetchNearbyGames(
  lat: number,
  lng: number,
  radiusM = 25000,
  hoursAhead = 96,
): Promise<NearbyGame[]> {
  const { data, error } = await supabase.rpc('nearby_games', {
    p_lat: lat,
    p_lng: lng,
    p_radius_m: radiusM,
    p_hours_ahead: hoursAhead,
  });
  if (error) throw error;
  return (data ?? []) as NearbyGame[];
}

/** Returns 'joined' | 'waitlist' | 'already'. */
export async function joinGame(gameId: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_game', { p_game_id: gameId });
  if (error) throw error;
  return data as string;
}

export async function leaveGame(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_game', { p_game_id: gameId });
  if (error) throw error;
}

/** Host only: mark the run cancelled (hides it from the Games list). */
export async function cancelGame(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_game', { p_game_id: gameId });
  if (error) throw error;
}

export interface CreateGameInput {
  court_id: string;
  start_time: string; // ISO
  duration_min: number;
  max_players: number;
  game_type: GameType;
  notes?: string;
}

export async function createGame(input: CreateGameInput): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('games')
    .insert({ ...input, creator_id: auth.user.id })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchRoster(gameId: string): Promise<RosterEntry[]> {
  const { data, error } = await supabase
    .from('game_players')
    .select(
      'user_id, status, joined_at, profile:profiles(id, name, avatar_url, position, computed_skill, self_skill)',
    )
    .eq('game_id', gameId)
    .in('status', ['joined', 'waitlist'])
    .order('joined_at');
  if (error) throw error;
  return (data ?? []) as unknown as RosterEntry[];
}

export async function fetchGameConversationId(gameId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('game_id', gameId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchMessages(conversationId: string, limit = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, sender:profiles(id, name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as Message[]).reverse();
}

export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: auth.user.id, body });
  if (error) throw error;
}
