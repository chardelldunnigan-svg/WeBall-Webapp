import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏀 WeBall</Text>
        <Text style={styles.tagline}>
          Find a run. Call next.{'\n'}Pickup basketball around Cleveland, organized.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button title="Create account" onPress={() => router.push('/(auth)/sign-up')} />
        <Button
          title="I already have an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.sm, padding: Spacing.lg },
  container: { backgroundColor: Colors.background, flex: 1 },
  hero: { alignItems: 'center', flex: 1, gap: Spacing.md, justifyContent: 'center' },
  logo: { color: Colors.ink, fontSize: 44, fontWeight: '800' },
  tagline: { color: Colors.inkSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
