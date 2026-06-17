import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  RTDBNotification,
} from '@/services/rtdbService';

type UseNotificationsResult = {
  notifications: RTDBNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loading: boolean;
};

/**
 * React hook for real-time notifications from Firebase RTDB.
 * Automatically subscribes/unsubscribes based on auth state.
 *
 * Usage:
 *   const { notifications, unreadCount, markRead } = useNotifications();
 */
export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RTDBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(email, (list) => {
      setNotifications(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.email]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user?.email) return;
      await markNotificationRead(user.email, id);
    },
    [user?.email]
  );

  const markAllRead = useCallback(async () => {
    if (!user?.email) return;
    await markAllNotificationsRead(user.email);
  }, [user?.email]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, loading };
}
