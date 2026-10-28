import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary' ? Colors.primary : variant === 'danger' ? Colors.danger : Colors.surface;
  const fg = variant === 'secondary' ? Colors.ink : Colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? Colors.primary : Colors.surface },
      ]}>
      <Text style={{ color: selected ? Colors.white : Colors.ink, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: Spacing.xs }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.inkSecondary}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chip: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  empty: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptySubtitle: { color: Colors.inkSecondary, fontSize: 14, textAlign: 'center' },
  emptyTitle: { color: Colors.ink, fontSize: 17, fontWeight: '700' },
  fieldLabel: { color: Colors.inkSecondary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    color: Colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
});
