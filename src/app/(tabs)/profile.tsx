import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const skill =
    profile.rating_count >= 5 && profile.computed_skill != null
      ? `${profile.computed_skill}`
      : profile.self_skill != null
        ? `${profile.self_skill} (self-rated)`
        : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.position}>{profile.position === 'ANY' ? 'Plays anywhere' : profile.position}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <Stat label="Skill" value={skill} />
        <Stat label="Games" value={String(profile.games_played)} />
        <Stat label="Ratings" value={String(profile.rating_count)} />
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Button title="Edit player card" variant="secondary" onPress={() => router.push('/profile-setup')} />
        <Button title="Sign out" variant="danger" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarText: { color: Colors.white, fontSize: 36, fontWeight: '800' },
  bio: { color: Colors.inkSecondary, fontSize: 14, textAlign: 'center' },
  container: { backgroundColor: Colors.background, flex: 1 },
  header: { alignItems: 'center', gap: Spacing.sm },
  name: { color: Colors.ink, fontSize: 24, fontWeight: '800' },
  position: { color: Colors.inkSecondary, fontSize: 15 },
  stat: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flex: 1,
    gap: 2,
    paddingVertical: Spacing.md,
  },
  statLabel: { color: Colors.inkSecondary, fontSize: 13 },
  statValue: { color: Colors.ink, fontSize: 18, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: Spacing.sm },
});
