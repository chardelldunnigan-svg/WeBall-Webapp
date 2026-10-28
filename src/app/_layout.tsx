import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      {/* On a wide browser window, keep the app in a centered column instead of stretching edge to edge. */}
      <View style={styles.outer}>
        <View style={styles.inner}>
          <Stack
            screenOptions={{
              headerTintColor: Colors.primary,
              headerTitleStyle: { color: Colors.ink },
            }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="create-game"
              options={{ presentation: 'modal', title: 'Create a run' }}
            />
            <Stack.Screen name="profile-setup" options={{ title: 'Your player card' }} />
            <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
            <Stack.Screen name="court/[id]" options={{ title: 'Court' }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Game chat' }} />
          </Stack>
        </View>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: Platform.OS === 'web' ? Colors.surface : Colors.background,
    flex: 1,
  },
  inner: {
    alignSelf: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 960 : undefined,
    width: '100%',
  },
});
