import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatStart } from '@/components/cards';
import { PinMap } from '@/components/pin-map';
import { Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { GameType } from '@/lib/types';

interface CourtDetail {
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
}

interface UpcomingGame {
  id: string;
  start_time: string;
  game_type: GameType;
  max_players: number;
}

export default function CourtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [games, setGames] = useState<UpcomingGame[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_court', { p_court_id: id });
    if (error) {
      console.warn('court load failed', error);
      return;
    }
    setCourt(((data ?? []) as CourtDetail[])[0] ?? null);

    const { data: upcoming } = await supabase
      .from('games')
      .select('id, start_time, game_type, max_players')
      .eq('court_id', id)
      .eq('status', 'upcoming')
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(10);
    setGames((upcoming ?? []) as UpcomingGame[]);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!court) return null;

  const amenities = Object.entries(court.amenities)
    .filter(([, v]) => v)
    .map(([k]) => k.replaceAll('_', ' '));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: Spacing.lg, padding: Spacing.lg }}>
      <View style={{ gap: 6 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
          <Text style={styles.title}>{court.name}</Text>
          {court.verified ? <Ionicons name="checkmark-circle" size={20} color={Colors.success} /> : null}
        </View>
        <Text style={styles.line}>
          <Ionicons name="location-outline" size={14} color={Colors.inkSecondary} />{' '}
          {court.address ?? court.city}
        </Text>
        <Text style={styles.line}>
          {court.indoor ? 'Indoor' : 'Outdoor'} · {court.surface} ·{' '}
          {court.hoops_count} hoop{court.hoops_count === 1 ? '' : 's'}
          {court.lighting ? ' · lights' : ''}
        </Text>
        {amenities.length > 0 ? <Text style={styles.line}>Has: {amenities.join(', ')}</Text> : null}
      </View>

      <PinMap
        style={styles.map}
        center={{ latitude: court.lat, longitude: court.lng }}
        delta={0.02}
        interactive={false}
        pins={[{ id: court.id, lat: court.lat, lng: court.lng, title: court.name }]}
      />

      <Button
        title="Create a run here"
        onPress={() => router.push({ pathname: '/create-game', params: { courtId: court.id } })}
      />

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.sectionTitle}>Upcoming runs</Text>
        {games.length === 0 ? (
          <Text style={styles.line}>Nothing scheduled here yet.</Text>
        ) : (
          games.map((g) => (
            <Text
              key={g.id}
              style={styles.gameRow}
              onPress={() => router.push(`/game/${g.id}`)}>
              {g.game_type} · {formatStart(g.start_time)} →
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  gameRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  line: { color: Colors.inkSecondary, fontSize: 14 },
  map: { borderRadius: Radius.md, height: 180 },
  sectionTitle: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  title: { color: Colors.ink, fontSize: 22, fontWeight: '800' },
});
