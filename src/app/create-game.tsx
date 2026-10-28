import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { notify } from '@/lib/notify';
import { StartTimePicker } from '@/components/start-time-picker';
import { Button, Chip, Field } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { createGame, fetchNearbyCourts } from '@/lib/api';
import type { GameType, NearbyCourt } from '@/lib/types';
import { useLocation } from '@/lib/use-location';

const GAME_TYPES: GameType[] = ['5v5', '4v4', '3v3', '21', 'shootaround'];
const SIZES = [4, 6, 8, 10, 12, 15, 20];

function defaultStart(): Date {
  const d = new Date(Date.now() + 2 * 3600_000);
  d.setMinutes(0, 0, 0);
  return d;
}

export default function CreateGame() {
  const router = useRouter();
  const coords = useLocation();
  const params = useLocalSearchParams<{ courtId?: string }>();

  const [courts, setCourts] = useState<NearbyCourt[]>([]);
  const [courtId, setCourtId] = useState<string | null>(params.courtId ?? null);
  const [start, setStart] = useState<Date>(defaultStart());
  const [gameType, setGameType] = useState<GameType>('5v5');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchNearbyCourts(coords.latitude, coords.longitude, 40000)
      .then(setCourts)
      .catch((e) => console.warn('courts load failed', e));
  }, [coords.latitude, coords.longitude]);

  const submit = async () => {
    if (!courtId) return;
    if (start.getTime() < Date.now()) {
      notify('Time travel not supported', 'Pick a start time in the future.');
      return;
    }
    setBusy(true);
    try {
      const id = await createGame({
        court_id: courtId,
        start_time: start.toISOString(),
        duration_min: 90,
        max_players: maxPlayers,
        game_type: gameType,
        notes: notes || undefined,
      });
      router.replace(`/game/${id}`);
    } catch (e: any) {
      notify('Could not create game', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: Spacing.lg, padding: Spacing.lg }}>
      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>Court</Text>
        {courts.length === 0 ? (
          <Text style={styles.hint}>Loading nearby courts…</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {courts.slice(0, 12).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCourtId(c.id)}
                style={[styles.courtRow, courtId === c.id && styles.courtRowSelected]}>
                <Text
                  style={{
                    color: courtId === c.id ? Colors.white : Colors.ink,
                    fontWeight: '600',
                  }}>
                  {c.name}
                </Text>
                <Text style={{ color: courtId === c.id ? Colors.white : Colors.inkSecondary, fontSize: 12 }}>
                  {c.indoor ? 'Indoor' : 'Outdoor'} · {(c.distance_m / 1609.34).toFixed(1)} mi
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>When</Text>
        <StartTimePicker value={start} onChange={setStart} />
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>Run type</Text>
        <View style={styles.chipRow}>
          {GAME_TYPES.map((t) => (
            <Chip key={t} label={t} selected={gameType === t} onPress={() => setGameType(t)} />
          ))}
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>Max players</Text>
        <View style={styles.chipRow}>
          {SIZES.map((n) => (
            <Chip key={n} label={String(n)} selected={maxPlayers === n} onPress={() => setMaxPlayers(n)} />
          ))}
        </View>
      </View>

      <Field
        label="Notes (optional)"
        placeholder="Winners stay. Bring a dark and a light shirt."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button title="Post the run" loading={busy} disabled={!courtId} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  container: { backgroundColor: Colors.background, flex: 1 },
  courtRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    gap: 2,
    padding: 12,
  },
  courtRowSelected: { backgroundColor: Colors.primary },
  hint: { color: Colors.inkSecondary, fontSize: 13 },
  label: { color: Colors.inkSecondary, fontSize: 13, fontWeight: '600' },
});
