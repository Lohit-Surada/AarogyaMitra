/**
 * AarogyaMitra — Chatbot Service
 * Handles AI responses and logs sessions to Firebase RTDB.
 */

import { getBackendUrl } from '@/utils/api';
import { logChatSession, sendNotification, logEvent, ChatMessage } from './rtdbService';

export type ChatRole = 'user' | 'assistant';

export interface Message {
  role: ChatRole;
  content: string;
  timestamp: string;
}

/**
 * Send a message to the AarogyaMitra chatbot backend.
 * Returns the assistant reply.
 */
export async function sendChatMessage(
  userMessage: string,
  history: Message[]
): Promise<string> {
  try {
    const res = await fetch(getBackendUrl('/api/chatbot/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: history.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) throw new Error(`Chatbot error: ${res.status}`);
    const data = await res.json();
    return data.reply ?? data.message ?? 'I\'m having trouble understanding that. Could you rephrase?';
  } catch (error) {
    console.error('[Chatbot] API error:', error);
    return 'Sorry, I\'m currently unavailable. Please try again in a moment.';
  }
}

/**
 * Persist the completed chatbot session to Firebase RTDB and
 * optionally notify the user of any follow-up actions.
 */
export async function saveChatSession(
  email: string,
  messages: Message[]
): Promise<void> {
  if (!email || messages.length < 2) return;

  const rtdbMessages: ChatMessage[] = messages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));

  try {
    const sessionId = await logChatSession(email, rtdbMessages);
    console.log(`[Chatbot] ✅ Session logged to RTDB: ${sessionId}`);

    // Log analytics event
    await logEvent('chatbot_open', email, {
      messageCount: messages.length,
      sessionId,
    });

    // If the conversation seems health-related, nudge the user
    const hasHealthQuery = messages.some(m =>
      m.role === 'user' &&
      /symptom|fever|pain|medicine|doctor|disease|health/i.test(m.content)
    );

    if (hasHealthQuery) {
      await sendNotification(email, {
        title: '💊 Health Reminder',
        message: 'Based on your recent chat, consider checking our pharmacy for medicines or booking a consultation.',
        type: 'health',
        actionRoute: '/pharmacy',
      });
    }
  } catch (error) {
    console.error('[Chatbot] Failed to save session:', error);
  }
}
