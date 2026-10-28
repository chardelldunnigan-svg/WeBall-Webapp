import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { notify } from '@/lib/notify';
import { Button, Chip, Field } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { Position } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C', 'ANY'];
const SKILLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ProfileSetup() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [position, setPosition] = useState<Position>(profile?.position ?? 'ANY');
  const [skill, setSkill] = useState<number | null>(
    profile?.self_skill != null ? Number(profile.self_skill) : null,
  );
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!profile || skill == null) return;
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name, position, self_skill: skill, bio: bio || null })
      .eq('id', profile.id);
    setBusy(false);
    if (error) {
      notify('Could not save', error.message);
      return;
    }
    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: Spacing.lg, padding: Spacing.lg }}>
      <Field label="Name" value={name} onChangeText={setName} />

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>Position</Text>
        <View style={styles.chipRow}>
          {POSITIONS.map((p) => (
            <Chip key={p} label={p} selected={position === p} onPress={() => setPosition(p)} />
          ))}
        </View>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <Text style={styles.label}>How good are you, honestly? (1 = first timer, 10 = D1)</Text>
        <View style={styles.chipRow}>
          {SKILLS.map((s) => (
            <Chip key={s} label={String(s)} selected={skill === s} onPress={() => setSkill(s)} />
          ))}
        </View>
        <Text style={styles.hint}>
          This seeds your rating. After ~5 peer ratings it converges to what people you play with say.
        </Text>
      </View>

      <Field label="Bio (optional)" value={bio} onChangeText={setBio} multiline placeholder="Lefty. Catch-and-shoot. Will run it back." />

      <Button title="Save" loading={busy} disabled={!name || skill == null} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  container: { backgroundColor: Colors.background, flex: 1 },
  hint: { color: Colors.inkSecondary, fontSize: 12 },
  label: { color: Colors.inkSecondary, fontSize: 13, fontWeight: '600' },
});
