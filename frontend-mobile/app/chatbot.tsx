import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette, Spacing, Radius, HEADER_PADDING_TOP } from '@/constants/theme';

const USER = 'user' as const;
const BOT = 'bot' as const;

function getChatbotApiUrl() {
  return 'https://aarogyamitra-14.onrender.com/api/chat';
}

type ChatMessage = {
  id: string;
  sender: typeof USER | typeof BOT;
  text: string;
};

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    Animated.parallel([anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)]).start();
  }, []);

  return (
    <View style={dotStyles.row}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[dotStyles.dot, { transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.textMuted },
});

function MessageBubble({
  msg,
  onCopy,
  copied,
}: {
  msg: ChatMessage;
  onCopy: () => void;
  copied: boolean;
}) {
  const isUser = msg.sender === USER;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.rowUser : styles.rowBot,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="medical" size={14} color="#fff" />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
          {msg.text}
        </Text>
        <TouchableOpacity onPress={onCopy} style={styles.copyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={copied ? 'checkmark-done' : 'copy-outline'}
            size={12}
            color={isUser ? 'rgba(255,255,255,0.6)' : Palette.textMuted}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function ChatbotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      sender: BOT,
      text: 'Hello! I am Dr. Aarogya, your AI health assistant 🩺\n\nTell me your symptoms, age, duration, allergies, and current medicines — and I will provide careful guidance and next steps.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const copyMessage = async (id: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: USER, text: trimmed };
    const history = messages.slice(-12);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(getChatbotApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: BOT, text: data.reply || 'Sorry, I could not process that.' },
      ]);
    } catch (e: any) {
      clearTimeout(timeoutId);
      const reply =
        e.name === 'AbortError'
          ? '⏳ The service is waking up. Please wait 30–60 seconds and try again.'
          : 'Sorry, there was a connection issue. Please try again.';
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: BOT, text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = ['I have a fever', 'Head pain', 'Stomach ache', 'Cold symptoms'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Palette.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="medical" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerName}>Dr. Aarogya</Text>
            <Text style={styles.headerSub}>AI Health Assistant</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              onCopy={() => copyMessage(item.id, item.text)}
              copied={copiedId === item.id}
            />
          )}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={[styles.messageRow, styles.rowBot]}>
                <View style={styles.botAvatar}>
                  <Ionicons name="medical" size={14} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.bubbleBot]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickPromptsRow}>
            {QUICK_PROMPTS.map(p => (
              <TouchableOpacity
                key={p}
                style={styles.quickPrompt}
                onPress={() => { setInput(p); }}
              >
                <Text style={styles.quickPromptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Describe your symptoms..."
            placeholderTextColor={Palette.textMuted}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  headerSub: { fontSize: 11, color: '#10B981' },

  chatContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },

  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Palette.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },

  msgText: { fontSize: 15, lineHeight: 21 },
  msgTextUser: { color: '#fff' },
  msgTextBot: { color: Palette.text },

  copyBtn: { alignSelf: 'flex-end', marginTop: 4 },

  quickPromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  quickPrompt: {
    backgroundColor: '#E0F2FE',
    borderRadius: Radius.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickPromptText: { fontSize: 13, color: Palette.primary, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: Palette.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
