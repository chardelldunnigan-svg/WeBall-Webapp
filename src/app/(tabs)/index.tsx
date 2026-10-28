import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GameCard, formatStart } from '@/components/cards';
import { PinMap } from '@/components/pin-map';
import { Chip, EmptyState } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { fetchNearbyGames } from '@/lib/api';
import type { NearbyGame } from '@/lib/types';
import { useLocation } from '@/lib/use-location';

export default function GamesScreen() {
  const router = useRouter();
  const coords = useLocation();
  const [games, setGames] = useState<NearbyGame[]>([]);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setGames(await fetchNearbyGames(coords.latitude, coords.longitude));
    } catch (e) {
      console.warn('nearby_games failed', e);
    } finally {
      setLoaded(true);
    }
  }, [coords.latitude, coords.longitude]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Chip label="List" selected={view === 'list'} onPress={() => setView('list')} />
        <Chip
          label="Map"
          selected={view === 'map'}
          onPress={() => setView('map')}
        />
      </View>

      {view === 'map' ? (
        <PinMap
          style={styles.map}
          center={coords}
          showsUserLocation={coords.precise}
          pins={games.map((g) => ({
            id: g.id,
            lat: g.lat,
            lng: g.lng,
            title: `${g.game_type} · ${g.court_name}`,
            description: `${formatStart(g.start_time)} · ${g.joined_count}/${g.max_players} in`,
            onPress: () => router.push(`/game/${g.id}`),
          }))}
        />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => <GameCard game={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            loaded ? (
              <EmptyState
                title="No games on the books"
                subtitle="Nothing within 15 miles in the next few days. Start one and they will come."
              />
            ) : null
          }
          contentContainerStyle={games.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingVertical: 8 }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/create-game')}>
        <Ionicons name="add" size={30} color={Colors.white} />
        <Text style={styles.fabText}>New run</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    bottom: 24,
    elevation: 4,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  map: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
