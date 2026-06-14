import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Message type for chat
const USER = 'user';
const BOT = 'bot';

function getChatbotApiUrl() {
  return 'https://aarogyamitra-14.onrender.com/api/chat';
}


type ChatMessage = {
  sender: typeof USER | typeof BOT;
  text: string;
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: BOT, text: 'Hello! I am Dr. Aarogya, your AI health assistant. Tell me your symptoms, age, duration, allergies, and current medicines, and I will give careful guidance, warning signs, and next steps.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const copyMessage = async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(current => current === index ? null : current), 1500);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { sender: USER, text: input.trim() };
    const conversationHistory = messages.slice(-12);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for Render cold start

    try {
      // Call Spring Boot backend endpoint for chatbot
      const response = await fetch(getChatbotApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          history: conversationHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: BOT, text: data.reply || 'Sorry, I could not process your request.' }]);
    } catch (e: any) {
      const reply = e.name === 'AbortError'
        ? '⏳ The chatbot is waking up (Render free tier sleeps when idle). Please wait 30–60 seconds and try again — it will be fast after the first request!'
        : `Sorry, there was a problem connecting to the server. Please try again in a moment.`;
      setMessages(prev => [...prev, { sender: BOT, text: reply }]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={msg.sender === USER ? styles.userMsgWrap : styles.botMsgWrap}
            >
              <View style={msg.sender === USER ? styles.userMsg : styles.botMsg}>
                <Text style={msg.sender === USER ? styles.userText : styles.botText}>{msg.text}</Text>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => copyMessage(msg.text, idx)}
                  accessibilityRole="button"
                  accessibilityLabel={copiedIndex === idx ? 'Copied message' : 'Copy message'}
                >
                  <Ionicons
                    name={copiedIndex === idx ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={msg.sender === USER ? '#ffffff' : '#374151'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            editable={!loading}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendBtnText}>{loading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  messages: { flex: 1 },
  userMsgWrap: { alignItems: 'flex-end', marginBottom: 10 },
  botMsgWrap: { alignItems: 'flex-start', marginBottom: 10 },
  userMsg: { backgroundColor: '#22c55e', borderRadius: 16, padding: 12, maxWidth: '80%', minWidth: 64 },
  botMsg: { backgroundColor: '#e5e7eb', borderRadius: 16, padding: 12, maxWidth: '80%', minWidth: 64 },
  userText: { color: '#fff', fontSize: 16 },
  botText: { color: '#111827', fontSize: 16 },
  copyBtn: { alignSelf: 'flex-end', marginTop: 8, minWidth: 28, minHeight: 24, justifyContent: 'center', alignItems: 'center' },
  inputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
  sendBtn: { marginLeft: 8, backgroundColor: '#22c55e', borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
