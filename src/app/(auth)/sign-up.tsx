import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { notify } from '@/lib/notify';
import { Button, Field } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }, // picked up by the handle_new_user trigger
    });
    setBusy(false);
    if (error) {
      notify('Sign up failed', error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is enabled on the Supabase project.
      notify('Check your email', 'Confirm your address, then sign in.');
    }
    // With confirmation disabled, the session change redirects automatically.
  };

  return (
    <View style={styles.container}>
      <Field label="Name" placeholder="What do they call you on the court?" value={name} onChangeText={setName} />
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
        placeholder="8+ characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title="Create account"
        loading={busy}
        disabled={!name || !email || password.length < 8}
        onPress={signUp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1, gap: Spacing.md, padding: Spacing.lg },
});
