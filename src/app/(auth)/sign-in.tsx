import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { notify } from '@/lib/notify';
import { Button, Field } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) notify('Sign in failed', error.message);
    // On success the AuthProvider session change redirects to the tabs.
  };

  return (
    <View style={styles.container}>
      <Field
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Password"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign in" loading={busy} disabled={!email || !password} onPress={signIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1, gap: Spacing.md, padding: Spacing.lg },
});
