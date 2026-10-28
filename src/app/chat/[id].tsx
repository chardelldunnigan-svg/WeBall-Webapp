import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { fetchMessages, sendMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await fetchMessages(id));
    } catch (e) {
      console.warn('messages load failed', e);
    }
  }, [id]);

  useEffect(() => {
    load();

    // Live updates: append messages inserted into this conversation.
    const channel = supabase
      .channel(`conversation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await sendMessage(id, body);
    } catch (e) {
      console.warn('send failed', e);
      setDraft(body); // give the text back on failure
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={{ gap: 6, padding: Spacing.md }}
        renderItem={({ item }) => {
          const mine = item.sender_id === session?.user.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              {!mine && item.sender?.name ? (
                <Text style={styles.sender}>{item.sender.name}</Text>
              ) : null}
              <Text style={{ color: mine ? Colors.white : Colors.ink, fontSize: 15 }}>
                {item.body}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Message the run…"
          placeholderTextColor={Colors.inkSecondary}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable onPress={send} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: Radius.md,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
  composer: {
    alignItems: 'flex-end',
    borderColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  container: { backgroundColor: Colors.background, flex: 1 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    color: Colors.ink,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sender: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
