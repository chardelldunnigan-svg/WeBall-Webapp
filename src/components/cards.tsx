import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { NearbyCourt, NearbyGame } from '@/lib/types';

export function formatDistance(m: number) {
  const miles = m / 1609.34;
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

export function formatStart(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today.getTime() + 86400000);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}

export function GameCard({ game }: { game: NearbyGame }) {
  const router = useRouter();
  const spotsLeft = game.max_players - game.joined_count;
  const full = spotsLeft <= 0;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/game/${game.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{game.game_type} at {game.court_name}</Text>
        {game.my_status === 'joined' ? (
          <View style={[styles.badge, { backgroundColor: Colors.success }]}>
            <Text style={styles.badgeText}>In</Text>
          </View>
        ) : game.my_status === 'waitlist' ? (
          <View style={[styles.badge, { backgroundColor: Colors.waitlist }]}>
            <Text style={styles.badgeText}>Waitlist</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardLine}>
        <Ionicons name="time-outline" size={13} color={Colors.inkSecondary} />{' '}
        {formatStart(game.start_time)} · {formatDistance(game.distance_m)}
      </Text>
      <Text style={[styles.cardLine, full && { color: Colors.danger }]}>
        <Ionicons name="people-outline" size={13} color={full ? Colors.danger : Colors.inkSecondary} />{' '}
        {game.joined_count}/{game.max_players} players
        {full ? ' · full (waitlist open)' : ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
      </Text>
      <Text style={styles.cardMeta}>hosted by {game.creator_name}</Text>
    </Pressable>
  );
}

export function CourtCard({ court }: { court: NearbyCourt }) {
  const router = useRouter();
  const tags = [
    court.indoor ? 'Indoor' : 'Outdoor',
    court.surface,
    court.lighting ? 'Lights' : null,
    `${court.hoops_count} hoop${court.hoops_count === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/court/${court.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{court.name}</Text>
        {court.verified ? (
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
        ) : null}
      </View>
      <Text style={styles.cardLine}>
        <Ionicons name="location-outline" size={13} color={Colors.inkSecondary} />{' '}
        {court.address ?? court.city} · {formatDistance(court.distance_m)}
      </Text>
      <Text style={styles.cardMeta}>{tags.join(' · ')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
    marginHorizontal: Spacing.md,
    marginVertical: 6,
    padding: Spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  cardLine: { color: Colors.inkSecondary, fontSize: 14 },
  cardMeta: { color: Colors.inkSecondary, fontSize: 13, fontStyle: 'italic' },
  cardTitle: { color: Colors.ink, flex: 1, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
