import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { Colors } from '@/constants/theme';

export default function LeaguesScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Leagues are coming"
        subtitle={
          'Phase 6 of the build plan: recurring seasons, teams, and standings.\n' +
          'The schema (leagues, league_teams) is already in place.'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
