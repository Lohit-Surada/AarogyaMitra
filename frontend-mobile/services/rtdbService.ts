/**
 * AarogyaMitra — Firebase Realtime Database Service
 *
 * RTDB URL: https://aarogyamitra-76326-default-rtdb.firebaseio.com/
 *
 * Schema:
 *   /users/{email}/profile        — user profile + last active
 *   /users/{email}/session        — current session info
 *   /orders/{email}/{orderId}     — live order state
 *   /notifications/{email}/{id}   — push-style notifications
 *   /chatbot/{email}/{sessionId}  — chatbot conversation logs
 *   /analytics/events/{date}/{id} — event log
 *   /analytics/counters           — aggregate counters
 *   /product_views/{productId}    — product view counts
 *   /app_config                   — live app configuration
 */

import { realtimeDb } from '@/lib/firebase';
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  serverTimestamp,
  increment,
  query,
  orderByChild,
  limitToLast,
  DataSnapshot,
  onDisconnect,
} from 'firebase/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize email for use as RTDB path key */
export function sanitizeEmail(email: string): string {
  return email.replace(/\./g, '_').replace(/@/g, '_at_');
}

/** Today's date string YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── 1. USER SESSION & ACTIVITY ───────────────────────────────────────────────

/**
 * Called when user logs in or app foregrounds.
 * Writes profile + marks session as active.
 */
export async function initUserSession(
  email: string,
  displayName?: string | null
): Promise<void> {
  if (!email) return;
  const key = sanitizeEmail(email);
  const now = new Date().toISOString();

  try {
    const profileRef = ref(realtimeDb, `users/${key}/profile`);
    await update(profileRef, {
      email,
      displayName: displayName ?? email.split('@')[0],
      lastActive: now,
      updatedAt: now,
    });

    const sessionRef = ref(realtimeDb, `users/${key}/session`);
    await set(sessionRef, {
      isActive: true,
      sessionStartedAt: now,
      lastSeen: now,
    });

    // Auto-clean session state on backend if the user kills the app/loses connection
    onDisconnect(sessionRef).update({
      isActive: false,
      lastSeen: new Date().toISOString(),
    });

    // Increment daily active user counter
    await update(ref(realtimeDb, 'analytics/counters'), {
      [`daily_active_${today()}`]: increment(1),
      total_sessions: increment(1),
    });

    console.log(`[RTDB] ✅ Session initialized for ${email}`);
  } catch (err) {
    console.error('[RTDB] initUserSession error:', err);
  }
}

/**
 * Ping last-seen timestamp — call periodically or on navigation events.
 */
export async function updateLastSeen(email: string): Promise<void> {
  if (!email) return;
  const key = sanitizeEmail(email);
  try {
    await update(ref(realtimeDb, `users/${key}/session`), {
      lastSeen: new Date().toISOString(),
      isActive: true,
    });
  } catch (err) {
    // Suppress console.error here too
  }
}

/**
 * Mark user session as inactive on logout/background.
 */
export async function endUserSession(email: string): Promise<void> {
  if (!email) return;
  const key = sanitizeEmail(email);
  try {
    await update(ref(realtimeDb, `users/${key}/session`), {
      isActive: false,
      lastSeen: new Date().toISOString(),
    });
    console.log(`[RTDB] 📴 Session ended for ${email}`);
  } catch (err) {
    // Suppressed: This is triggered on logout because Firebase Auth revokes the token BEFORE this can fire.
    console.log(`[RTDB] 📴 Session ended locally for ${email}`);
  }
}

// ─── 2. ORDERS — Live sync ────────────────────────────────────────────────────

/**
 * Write/update an order to RTDB for live status tracking.
 */
export async function syncOrderToRTDB(email: string, order: any): Promise<void> {
  if (!email || !order) return;
  const key = sanitizeEmail(email);
  const orderId = String(order.id ?? `order_${Date.now()}`);

  const payload = {
    ...order, // preserve any extra fields passed in
    id: orderId, // ensures the 'id' field is present for FlatList keyExtractor
    orderId,
    userEmail: email,
    orderStatus: order.orderStatus ?? 'PLACED',
    paymentStatus: order.paymentStatus ?? 'PENDING',
    paymentMethod: order.paymentMethod ?? 'COD',
    total: order.total ?? 0,
    shippingAddress: order.shippingAddress ?? '',
    createdAt: order.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itemCount: (order.orderItems ?? []).length,
    orderItems: order.orderItems ?? [], // save actual items for display
  };

    try {
      await set(ref(realtimeDb, `orders/${key}/${orderId}`), payload);

      // Save a dedicated payment log if it's a paid order
      if (order.paymentStatus === 'PAID') {
        await set(ref(realtimeDb, `payments/${orderId}`), {
          orderId,
          paymentId: order.razorpayPaymentId ?? '',
          userId: email,
          products: order.orderItems ?? [],
          amount: order.total ?? 0,
          paymentMethod: order.paymentMethod ?? 'RAZORPAY',
          status: order.orderStatus ?? 'PLACED',
          timestamp: new Date().toISOString()
        });
      }

      // Update global order counter
      await update(ref(realtimeDb, 'analytics/counters'), {
        total_orders: increment(1),
        [`orders_${today()}`]: increment(1),
      });

      console.log(`[RTDB] ✅ Order #${orderId} synced`);
    } catch (err) {
    console.error('[RTDB] syncOrderToRTDB error:', err);
  }
}

/**
 * Subscribe to live order updates for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(
  email: string,
  callback: (orders: any[]) => void
): () => void {
  if (!email) return () => {};
  const key = sanitizeEmail(email);
  const ordersRef = ref(realtimeDb, `orders/${key}`);

  const listener = onValue(ordersRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const list = Object.values(data) as any[];
    list.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(list);
  });

  return () => off(ordersRef, 'value', listener);
}

/**
 * Update order status in RTDB (e.g., from backend webhook or admin).
 */
export async function updateOrderStatus(
  email: string,
  orderId: string,
  status: string
): Promise<void> {
  const key = sanitizeEmail(email);
  try {
    await update(ref(realtimeDb, `orders/${key}/${orderId}`), {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[RTDB] updateOrderStatus error:', err);
  }
}

// ─── 3. NOTIFICATIONS ─────────────────────────────────────────────────────────

export type RTDBNotification = {
  id?: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'chatbot' | 'health';
  read: boolean;
  createdAt: string;
  actionRoute?: string;
  data?: Record<string, any>;
};

/**
 * Push a notification to a user's notification list.
 */
export async function sendNotification(
  email: string,
  notification: Omit<RTDBNotification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
  if (!email) return;
  const key = sanitizeEmail(email);
  const notifRef = ref(realtimeDb, `notifications/${key}`);

  try {
    const newRef = push(notifRef);
    await set(newRef, {
      ...notification,
      id: newRef.key,
      read: false,
      createdAt: new Date().toISOString(),
    });
    console.log(`[RTDB] 🔔 Notification sent to ${email}: ${notification.title}`);
  } catch (err) {
    console.error('[RTDB] sendNotification error:', err);
  }
}

/**
 * Subscribe to real-time notifications for a user.
 * Returns unsubscribe function.
 */
export function subscribeToNotifications(
  email: string,
  callback: (notifications: RTDBNotification[]) => void
): () => void {
  if (!email) return () => {};
  const key = sanitizeEmail(email);
  const notifRef = query(
    ref(realtimeDb, `notifications/${key}`),
    orderByChild('createdAt'),
    limitToLast(30)
  );

  const listener = onValue(notifRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const list = Object.entries(data).map(([id, val]) => ({
      ...(val as RTDBNotification),
      id,
    }));
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(list);
  });

  return () => off(notifRef as any, 'value', listener);
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  email: string,
  notificationId: string
): Promise<void> {
  const key = sanitizeEmail(email);
  try {
    await update(ref(realtimeDb, `notifications/${key}/${notificationId}`), {
      read: true,
    });
  } catch (err) {
    console.error('[RTDB] markNotificationRead error:', err);
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(email: string): Promise<void> {
  const key = sanitizeEmail(email);
  try {
    const snap = await get(ref(realtimeDb, `notifications/${key}`));
    if (!snap.exists()) return;
    const updates: Record<string, boolean> = {};
    snap.forEach(child => {
      if (!child.val()?.read) {
        updates[`notifications/${key}/${child.key}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(realtimeDb, '/'), updates);
    }
  } catch (err) {
    console.error('[RTDB] markAllNotificationsRead error:', err);
  }
}

// ─── 4. CHATBOT SESSION LOGGING ───────────────────────────────────────────────

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

/**
 * Log a chatbot session to RTDB for history and analytics.
 */
export async function logChatSession(
  email: string,
  messages: ChatMessage[]
): Promise<string | null> {
  if (!email || messages.length === 0) return null;
  const key = sanitizeEmail(email);

  try {
    const sessionRef = push(ref(realtimeDb, `chatbot/${key}`));
    await set(sessionRef, {
      sessionId: sessionRef.key,
      startedAt: messages[0]?.timestamp ?? new Date().toISOString(),
      endedAt: messages[messages.length - 1]?.timestamp ?? new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.slice(-50), // keep last 50 messages per session
    });

    // Analytics counter
    await update(ref(realtimeDb, 'analytics/counters'), {
      total_chatbot_sessions: increment(1),
    });

    return sessionRef.key;
  } catch (err) {
    console.error('[RTDB] logChatSession error:', err);
    return null;
  }
}

/**
 * Get recent chatbot sessions for a user.
 */
export async function getChatHistory(
  email: string,
  limit = 10
): Promise<any[]> {
  const key = sanitizeEmail(email);
  try {
    const snap = await get(
      query(
        ref(realtimeDb, `chatbot/${key}`),
        orderByChild('startedAt'),
        limitToLast(limit)
      )
    );
    if (!snap.exists()) return [];
    return Object.values(snap.val() as Record<string, any>).reverse();
  } catch (err) {
    console.error('[RTDB] getChatHistory error:', err);
    return [];
  }
}

// ─── 5. PRODUCT CATALOG VIEWS ─────────────────────────────────────────────────

/**
 * Increment view counter for a product.
 */
export async function trackProductView(productId: number | string): Promise<void> {
  try {
    await update(ref(realtimeDb, `product_views/${productId}`), {
      viewCount: increment(1),
      lastViewed: new Date().toISOString(),
    });
  } catch (err) {
    // Non-critical, silently fail
  }
}

/**
 * Get top viewed products (returns map of productId → viewCount).
 */
export async function getTopViewedProducts(
  limit = 10
): Promise<Record<string, number>> {
  try {
    const snap = await get(
      query(
        ref(realtimeDb, 'product_views'),
        orderByChild('viewCount'),
        limitToLast(limit)
      )
    );
    if (!snap.exists()) return {};
    const result: Record<string, number> = {};
    snap.forEach(child => {
      result[child.key!] = child.val()?.viewCount ?? 0;
    });
    return result;
  } catch (err) {
    return {};
  }
}

// ─── 6. ANALYTICS EVENTS ─────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'order_placed'
  | 'login'
  | 'logout'
  | 'search'
  | 'chatbot_open'
  | 'disease_prediction'
  | 'maps_open';

/**
 * Log a structured analytics event.
 */
export async function logEvent(
  event: AnalyticsEvent,
  email?: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const eventsRef = ref(realtimeDb, `analytics/events/${today()}`);
    const newRef = push(eventsRef);
    await set(newRef, {
      event,
      email: email ? sanitizeEmail(email) : 'anonymous',
      data: data ?? {},
      timestamp: new Date().toISOString(),
    });

    // Page view counter
    if (event === 'page_view') {
      await update(ref(realtimeDb, 'analytics/counters'), {
        total_page_views: increment(1),
        [`page_views_${today()}`]: increment(1),
      });
    }
  } catch (err) {
    // Analytics is non-critical
  }
}

// ─── 7. APP CONFIG (live remote config) ───────────────────────────────────────

export type AppConfig = {
  maintenanceMode: boolean;
  announcement: string;
  minAppVersion: string;
  supportEmail: string;
  pharmacyEnabled: boolean;
  chatbotEnabled: boolean;
};

const DEFAULT_APP_CONFIG: AppConfig = {
  maintenanceMode: false,
  announcement: '',
  minAppVersion: '1.0.0',
  supportEmail: 'support@aarogyamitra.com',
  pharmacyEnabled: true,
  chatbotEnabled: true,
};

/**
 * Subscribe to live app configuration changes.
 * Returns unsubscribe function.
 */
export function subscribeToAppConfig(
  callback: (config: AppConfig) => void
): () => void {
  const configRef = ref(realtimeDb, 'app_config');

  const listener = onValue(configRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    callback({ ...DEFAULT_APP_CONFIG, ...(data ?? {}) });
  });

  // Seed defaults if not present
  get(configRef).then(snap => {
    if (!snap.exists()) {
      set(configRef, DEFAULT_APP_CONFIG).catch(() => {});
    }
  });

  return () => off(configRef, 'value', listener);
}

/**
 * One-time fetch of app config.
 */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    const snap = await get(ref(realtimeDb, 'app_config'));
    return { ...DEFAULT_APP_CONFIG, ...(snap.val() ?? {}) };
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}
