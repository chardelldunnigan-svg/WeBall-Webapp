import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmAction, notify } from '@/lib/notify';
import { formatStart } from '@/components/cards';
import { Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { cancelGame, fetchGameConversationId, fetchRoster, joinGame, leaveGame } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { GameStatus, GameType, RosterEntry } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

interface GameDetail {
  id: string;
  start_time: string;
  duration_min: number;
  max_players: number;
  game_type: GameType;
  status: GameStatus;
  notes: string | null;
  creator_id: string;
  court: { id: string; name: string; address: string | null };
  creator: { id: string; name: string };
}

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // games links to profiles twice (creator_id, and the roster via game_players),
    // so the creator embed must name its foreign key or the query is ambiguous.
    const { data, error } = await supabase
      .from('games')
      .select(
        'id, start_time, duration_min, max_players, game_type, status, notes, creator_id, court:courts(id, name, address), creator:profiles!games_creator_id_fkey(id, name)',
      )
      .eq('id', id)
      .single();
    if (error) {
      console.warn('game load failed', error);
      setLoadError(error.message);
      return;
    }
    setLoadError(null);
    setGame(data as unknown as GameDetail);
    setRoster(await fetchRoster(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loadError) {
    return (
      <View style={[styles.container, { padding: Spacing.lg, gap: Spacing.sm }]}>
        <Text style={styles.title}>Couldn't load this game</Text>
        <Text style={styles.line}>{loadError}</Text>
      </View>
    );
  }

  if (!game) return null;

  const joined = roster.filter((r) => r.status === 'joined');
  const waitlist = roster.filter((r) => r.status === 'waitlist');
  const mine = roster.find((r) => r.user_id === session?.user.id);
  const isOpen = game.status === 'upcoming';
  const isHost = session?.user.id === game.creator_id;

  const onJoin = async () => {
    setBusy(true);
    try {
      const result = await joinGame(game.id);
      if (result === 'waitlist') {
        notify('On the waitlist', 'The run is full — you are next in line if someone drops.');
      }
      await load();
    } catch (e: any) {
      notify('Could not join', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const onLeave = async () => {
    setBusy(true);
    try {
      await leaveGame(game.id);
      await load();
    } catch (e: any) {
      notify('Could not leave', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    const ok = await confirmAction(
      'Cancel this run?',
      'It will be removed from the Games list for everyone.',
      'Cancel run',
    );
    if (!ok) return;
    setBusy(true);
    try {
      await cancelGame(game.id);
      await load();
    } catch (e: any) {
      notify('Could not cancel', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    const convId = await fetchGameConversationId(game.id);
    if (convId) {
      router.push(`/chat/${convId}`);
    } else {
      notify('Join first', 'Only players in the run can see the chat.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: Spacing.lg, padding: Spacing.lg }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>{game.game_type} at {game.court.name}</Text>
        <Text style={styles.line}>
          <Ionicons name="time-outline" size={14} color={Colors.inkSecondary} />{' '}
          {formatStart(game.start_time)} · {game.duration_min} min
        </Text>
        <Text style={styles.line} onPress={() => router.push(`/court/${game.court.id}`)}>
          <Ionicons name="location-outline" size={14} color={Colors.inkSecondary} />{' '}
          {game.court.address ?? game.court.name} →
        </Text>
        <Text style={styles.line}>hosted by {game.creator.name}</Text>
        {game.notes ? <Text style={styles.notes}>“{game.notes}”</Text> : null}
        {game.status !== 'upcoming' ? (
          <Text style={[styles.line, { color: Colors.danger, fontWeight: '700' }]}>
            {game.status.toUpperCase()}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: Spacing.sm }}>
        {mine && mine.status !== 'left' ? (
          <>
            <Button title="Open game chat" onPress={openChat} />
            {isHost && isOpen ? (
              <Button title="Cancel this run" variant="danger" loading={busy} onPress={onCancel} />
            ) : (
              <Button
                title={mine.status === 'waitlist' ? 'Leave waitlist' : 'Leave this run'}
                variant="danger"
                loading={busy}
                onPress={onLeave}
              />
            )}
          </>
        ) : isOpen ? (
          <Button
            title={joined.length >= game.max_players ? 'Join waitlist' : "I'm in"}
            loading={busy}
            onPress={onJoin}
          />
        ) : null}
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.sectionTitle}>
          Roster · {joined.length}/{game.max_players}
        </Text>
        {joined.map((r) => (
          <View key={r.user_id} style={styles.playerRow}>
            <Text style={styles.playerName}>
              {r.profile.name}
              {r.user_id === game.creator_id ? '  👑' : ''}
            </Text>
            <Text style={styles.playerMeta}>
              {r.profile.position} · skill {r.profile.computed_skill ?? r.profile.self_skill ?? '—'}
            </Text>
          </View>
        ))}
        {waitlist.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Waitlist</Text>
            {waitlist.map((r) => (
              <View key={r.user_id} style={[styles.playerRow, { opacity: 0.6 }]}>
                <Text style={styles.playerName}>{r.profile.name}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  line: { color: Colors.inkSecondary, fontSize: 14 },
  notes: { color: Colors.ink, fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  playerMeta: { color: Colors.inkSecondary, fontSize: 13 },
  playerName: { color: Colors.ink, fontSize: 15, fontWeight: '600' },
  playerRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  title: { color: Colors.ink, fontSize: 22, fontWeight: '800' },
});
