import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { CourtCard } from '@/components/cards';
import { PinMap } from '@/components/pin-map';
import { Chip, EmptyState } from '@/components/ui';
import { Colors, Radius } from '@/constants/theme';
import { fetchNearbyCourts } from '@/lib/api';
import type { NearbyCourt } from '@/lib/types';
import { useLocation } from '@/lib/use-location';

export default function CourtsScreen() {
  const router = useRouter();
  const coords = useLocation();
  const [courts, setCourts] = useState<NearbyCourt[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setCourts(await fetchNearbyCourts(coords.latitude, coords.longitude, 40000));
    } catch (e) {
      console.warn('nearby_courts failed', e);
    } finally {
      setLoaded(true);
    }
  }, [coords.latitude, coords.longitude]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courts;
    return courts.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.address ?? '').toLowerCase().includes(q),
    );
  }, [courts, query]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          placeholder="Search courts…"
          placeholderTextColor={Colors.inkSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <Chip label="List" selected={view === 'list'} onPress={() => setView('list')} />
        <Chip
          label="Map"
          selected={view === 'map'}
          onPress={() => setView('map')}
        />
      </View>

      {view === 'map' ? (
        <PinMap
          style={{ flex: 1 }}
          center={coords}
          showsUserLocation={coords.precise}
          pins={filtered.map((c) => ({
            id: c.id,
            lat: c.lat,
            lng: c.lng,
            title: c.name,
            description: c.indoor ? 'Indoor' : 'Outdoor',
            color: c.indoor ? 'tomato' : Colors.primary,
            onPress: () => router.push(`/court/${c.id}`),
          }))}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CourtCard court={item} />}
          ListEmptyComponent={
            loaded ? (
              <EmptyState
                title="No courts found"
                subtitle="Run supabase/seed.sql to load the Cleveland starter courts."
              />
            ) : null
          }
          contentContainerStyle={
            filtered.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingVertical: 8 }
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  search: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    color: Colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
